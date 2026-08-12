const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { optionalToken, authenticateToken } = require('../middleware/authMiddleware');

// POST /api/orders
router.post('/', optionalToken, (req, res) => {
  try {
    const {
      customer_name,
      email,
      phone,
      shipping_address,
      items,
      coupon_code,
      discount_amount = 0,
      shipping_fee = 0,
      payment_method = 'Credit Card / UPI (Test Mode)'
    } = req.body;

    if (!customer_name || !email || !phone || !shipping_address || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required customer or order items information' });
    }

    const userId = req.user ? req.user.id : null;

    // Transaction for stock deduction and order creation
    const createOrderTx = db.transaction(() => {
      let subtotal = 0;
      const verifiedItems = [];

      // Check stock and calculate subtotal
      for (const item of items) {
        const variant = db.prepare('SELECT pv.id, pv.product_id, pv.size, pv.color, pv.stock, p.name, p.price, p.sale_price FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE pv.id = ?').get(item.variant_id);

        if (!variant) {
          throw new Error(`Product variant ID ${item.variant_id} not found.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for item "${variant.name}" (${variant.size} / ${variant.color}). Only ${variant.stock} left.`);
        }

        const itemPrice = variant.sale_price !== null ? variant.sale_price : variant.price;
        subtotal += itemPrice * item.quantity;

        // Fetch primary image
        const imgRow = db.prepare('SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1').get(variant.product_id);
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
        const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1').get(coupon_code.toUpperCase().trim());
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

      // Insert Order
      const orderRes = db.prepare(`
        INSERT INTO orders (order_number, user_id, customer_name, email, phone, shipping_address, subtotal, discount_amount, shipping_fee, total_amount, payment_method, payment_status, order_status, tracking_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', 'Confirmed', ?)
      `).run(
        orderNumber,
        userId,
        customer_name,
        email.toLowerCase().trim(),
        phone,
        shipping_address,
        subtotal,
        verifiedDiscount,
        verifiedShipping,
        totalAmount,
        payment_method,
        trackingNumber
      );

      const orderId = orderRes.lastInsertRowid;

      // Insert Order Items & Deduct Stock
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateStock = db.prepare('UPDATE product_variants SET stock = stock - ? WHERE id = ?');

      for (const vItem of verifiedItems) {
        insertOrderItem.run(orderId, vItem.product_id, vItem.product_name, vItem.size, vItem.color, vItem.price, vItem.quantity, vItem.image_url);
        updateStock.run(vItem.quantity, vItem.variant_id);
      }

      // Update coupon times_used if applied
      if (coupon_code) {
        db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = ?').run(coupon_code.toUpperCase().trim());
      }

      // Clear Cart
      const sessionId = req.headers['x-session-id'] || req.body.sessionId;
      let cart = null;
      if (userId) {
        cart = db.prepare('SELECT id FROM carts WHERE user_id = ?').get(userId);
      } else if (sessionId) {
        cart = db.prepare('SELECT id FROM carts WHERE session_id = ?').get(sessionId);
      }

      if (cart) {
        db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
      }

      // Create Order Placed Notification
      if (userId) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, 'Order Placed Successfully', ?)
        `).run(userId, `Your Grabb-it order #${orderNumber} has been placed successfully.`);
      }

      // Create Order Status History Log
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES (?, 'Placed', ?)
      `).run(orderId, 'Your order was successfully placed and verified.');

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
        order_status: 'Confirmed',
        payment_status: 'Paid',
        items: verifiedItems,
        created_at: new Date().toISOString()
      };
    });

    const newOrder = createOrderTx();
    res.status(201).json({ order: newOrder, message: 'Order placed successfully!' });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(400).json({ error: err.message || 'Failed to process order' });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    const ordersWithItems = orders.map((ord) => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
      const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(ord.id);
      return { ...ord, items, history };
    });

    res.json(ordersWithItems);
  } catch (err) {
    console.error('Fetch My Orders Error:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// GET /api/orders/:orderNumber
router.get('/:orderNumber', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ? OR id = ?').get(req.params.orderNumber, req.params.orderNumber);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
    res.json({ ...order, items, history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

module.exports = router;
