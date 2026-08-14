const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { optionalToken, authenticateToken } = require('../middleware/authMiddleware');
const { sendOrderEmail } = require('../services/email');
const { sendRealtimeNotification } = require('./sse');

// POST /api/orders
router.post('/', optionalToken, async (req, res) => {
  try {
    const {
      customer_name,
      email,
      phone,
      shipping_address,
      items,
      coupon_code,
      payment_method = 'Razorpay Test Mode',
      payment_reference,
      payment_proof_url
    } = req.body;

    if (!customer_name || !email || !phone || !shipping_address || !items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Missing required customer or order items information' });
    }

    const userId = req.user ? req.user.id : null;

    // Transaction for stock deduction, reservation, and order creation
    const newOrder = await db.transaction(async (tx) => {
      let subtotal = 0;
      const verifiedItems = [];

      // Check stock and calculate subtotal using row locking FOR UPDATE in Postgres
      for (const item of items) {
        let variantQuery = `
          SELECT pv.id, pv.product_id, pv.size, pv.color, pv.stock, p.name, p.price, p.sale_price 
          FROM product_variants pv 
          JOIN products p ON pv.product_id = p.id 
          WHERE pv.id = ? AND p.is_active = 1
        `;
        if (db.isPg) {
          variantQuery += ' FOR UPDATE';
        }

        const variant = await tx.queryOne(variantQuery, [item.variant_id]);

        if (!variant) {
          throw new Error(`Product variant ID ${item.variant_id} not found or inactive.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for item "${variant.name}" (${variant.size} / ${variant.color}). Only ${variant.stock} units remaining.`);
        }

        const itemPrice = variant.sale_price !== null && variant.sale_price !== undefined ? parseFloat(variant.sale_price) : parseFloat(variant.price);
        subtotal += itemPrice * item.quantity;

        // Fetch primary image
        const imgRow = await tx.queryOne('SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1', [variant.product_id]);
        const imageUrl = imgRow ? imgRow.image_url : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';

        verifiedItems.push({
          product_id: variant.product_id,
          variant_id: variant.id,
          product_name: variant.name,
          size: variant.size,
          color: variant.color,
          price: itemPrice,
          quantity: item.quantity,
          image_url: imageUrl
        });
      }

      let verifiedDiscount = 0;
      if (coupon_code) {
        const coupon = await tx.queryOne('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1', [coupon_code.toUpperCase().trim()]);
        if (!coupon) {
          throw new Error('Invalid or expired coupon code.');
        }
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          throw new Error('This coupon code has expired.');
        }
        if (coupon.times_used >= coupon.usage_limit) {
          throw new Error('Coupon code usage limit exceeded.');
        }
        if (subtotal < coupon.min_order_amount) {
          throw new Error(`Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.`);
        }
        if (coupon.discount_type === 'percentage') {
          verifiedDiscount = (subtotal * coupon.discount_value) / 100;
        } else {
          verifiedDiscount = coupon.discount_value;
        }
        verifiedDiscount = Math.min(verifiedDiscount, subtotal);
      }

      const verifiedShipping = subtotal >= 999 ? 0 : 99;
      const totalAmount = Math.max(0, subtotal - verifiedDiscount + verifiedShipping);
      const orderNumber = 'GRB-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const trackingNumber = 'TRK' + Math.floor(100000000 + Math.random() * 900000000);

      let initialPaymentStatus = 'PAYMENT_PENDING';
      let initialOrderStatus = 'Pending';

      if (payment_method.includes('Manual') || payment_method.includes('UPI') || payment_method.includes('Bank')) {
        initialPaymentStatus = 'MANUAL_PAYMENT_PENDING';
        initialOrderStatus = 'Pending Verification';
      }

      // Insert Order and retrieve generated ID
      const orderInsertRes = await tx.insert(`
        INSERT INTO orders (
          order_number, user_id, customer_name, email, phone, shipping_address, 
          subtotal, discount_amount, shipping_fee, total_amount, payment_method, 
          payment_status, payment_reference, payment_proof_url, order_status, tracking_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber, userId, customer_name.trim(), email.toLowerCase().trim(), phone.trim(),
        shipping_address, subtotal, verifiedDiscount, verifiedShipping, totalAmount, payment_method,
        initialPaymentStatus, payment_reference || null, payment_proof_url || null, initialOrderStatus, trackingNumber
      ]);

      const orderId = orderInsertRes.id;
      const resExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      for (const vItem of verifiedItems) {
        await tx.run(`
          INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity, image_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [orderId, vItem.product_id, vItem.product_name, vItem.size, vItem.color, vItem.price, vItem.quantity, vItem.image_url]);
        
        await tx.run('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [vItem.quantity, vItem.variant_id]);
        
        try {
          await tx.run(`
            INSERT INTO stock_reservations (order_id, variant_id, quantity, status, expires_at)
            VALUES (?, ?, ?, 'ACTIVE', ?)
          `, [orderId, vItem.variant_id, vItem.quantity, resExpiresAt]);
        } catch(e) {}
      }

      if (coupon_code) {
        await tx.run('UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = ?', [coupon_code.toUpperCase().trim()]);
      }

      const sessionId = req.headers['x-session-id'] || req.body.sessionId;
      let cart = null;
      if (userId) {
        cart = await tx.queryOne('SELECT id FROM carts WHERE user_id = ?', [userId]);
      } else if (sessionId) {
        cart = await tx.queryOne('SELECT id FROM carts WHERE session_id = ?', [sessionId]);
      }

      if (cart) {
        await tx.run('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
      }

      if (userId) {
        await tx.run(`
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, 'Order Placed Successfully', ?)
        `, [userId, `Your Grabb-it order #${orderNumber} has been placed successfully.`]);
      }

      await tx.run(`
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES (?, ?, ?)
      `, [orderId, initialOrderStatus, `Order #${orderNumber} successfully created via ${payment_method}.`]);

      return {
        id: orderId,
        order_number: orderNumber,
        tracking_number: trackingNumber,
        customer_name,
        email,
        phone,
        shipping_address,
        subtotal,
        discount_amount: verifiedDiscount,
        shipping_fee: verifiedShipping,
        total_amount: totalAmount,
        order_status: initialOrderStatus,
        payment_status: initialPaymentStatus,
        payment_method,
        items: verifiedItems,
        created_at: new Date().toISOString()
      };
    });

    sendOrderEmail(newOrder.email, newOrder.customer_name, newOrder.order_number, newOrder.order_status, newOrder.total_amount)
      .catch(e => console.warn('Order email dispatch warning:', e.message));

    if (userId) {
      sendRealtimeNotification(userId, { type: 'ORDER_PLACED', order: newOrder });
    }

    res.status(201).json({ order: newOrder, message: 'Order placed successfully!' });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(400).json({ error: err.message || 'Failed to process order' });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const orders = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    const ordersWithItems = await Promise.all(orders.map(async (ord) => {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
      const history = await db.query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC', [ord.id]);
      return { ...ord, items, history };
    }));

    res.json(ordersWithItems);
  } catch (err) {
    console.error('Fetch My Orders Error:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// GET /api/orders/:orderNumber
router.get('/:orderNumber', optionalToken, async (req, res) => {
  try {
    const order = await db.queryOne('SELECT * FROM orders WHERE order_number = ? OR id = ?', [req.params.orderNumber, req.params.orderNumber]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // IDOR Protection:
    // If the order belongs to a registered user:
    if (order.user_id) {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required to access this order' });
      }
      if (req.user.role !== 'admin' && req.user.id !== order.user_id) {
        return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
      }
    }

    const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const history = await db.query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC', [order.id]);

    res.json({ ...order, items, history });
  } catch (err) {
    console.error('Fetch Order Error:', err);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

module.exports = router;
