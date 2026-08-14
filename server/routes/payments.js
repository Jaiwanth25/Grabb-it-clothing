const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { optionalToken, requireAdmin } = require('../middleware/authMiddleware');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

let razorpay = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    const Razorpay = require('razorpay');
    razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
  } catch (e) {
    console.warn('Razorpay package initialization error:', e.message);
  }
}

// GET /api/payments/settings (Public payment configurations for checkout UI)
router.get('/settings', async (req, res) => {
  try {
    const getSetting = async (key, fallback) => {
      const row = await db.queryOne('SELECT setting_value FROM payment_settings WHERE setting_key = ?', [key]);
      return row ? row.setting_value : fallback;
    };

    res.json({
      razorpay: {
        enabled: true,
        testMode: !RAZORPAY_KEY_ID,
        keyId: RAZORPAY_KEY_ID || 'rzp_test_GrabbItClothing2026'
      },
      upi: {
        enabled: (await getSetting('upi_enabled', 'true')) === 'true',
        upiId: await getSetting('upi_id', 'grabb-it@upi'),
        displayName: await getSetting('upi_display_name', 'GRABB-IT CLOTHING PVT LTD'),
        qrCodeUrl: await getSetting('upi_qr_url', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=grabb-it@upi&pn=GrabbItClothing')
      },
      bankTransfer: {
        enabled: (await getSetting('bank_enabled', 'true')) === 'true',
        bankName: await getSetting('bank_name', 'HDFC Bank Ltd'),
        accountHolder: await getSetting('bank_account_holder', 'GRABB-IT CLOTHING PVT LTD'),
        accountNumberMasked: await getSetting('bank_account_number_masked', '•••• •••• 5821'),
        ifscCode: await getSetting('bank_ifsc', 'HDFC0001234'),
        branch: await getSetting('bank_branch', 'Indiranagar 100ft Road, Bengaluru')
      }
    });
  } catch (err) {
    console.error('Fetch Payment Settings Error:', err);
    res.status(500).json({ error: 'Failed to fetch payment settings' });
  }
});

// POST /api/payments/create-razorpay-order (Mandatory Customer Authentication + IDOR check)
router.post('/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'OrderId is required' });
    }

    const order = await db.queryOne('SELECT * FROM orders WHERE id = ? OR order_number = ?', [orderId, orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id && order.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You do not own this order' });
    }

    const amountInPaise = Math.round(order.total_amount * 100);

    if (razorpay) {
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.order_number,
        notes: {
          customer_email: order.email,
          customer_phone: order.phone
        }
      });

      await db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [rzpOrder.id, order.id]);

      return res.json({
        success: true,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: RAZORPAY_KEY_ID
      });
    } else {
      const testRzpOrderId = `order_test_${Date.now()}`;
      await db.run('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [testRzpOrderId, order.id]);

      return res.json({
        success: true,
        testMode: true,
        orderId: testRzpOrderId,
        amount: amountInPaise,
        currency: 'INR',
        key: 'rzp_test_GrabbItClothing2026'
      });
    }
  } catch (err) {
    console.error('Create Razorpay Order Error:', err);
    res.status(500).json({ error: 'Failed to generate payment order' });
  }
});

// POST /api/payments/verify-razorpay
router.post('/verify-razorpay', optionalToken, async (req, res) => {
  try {
    const { order_number, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!order_number || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Missing required payment verification details' });
    }

    const order = await db.queryOne('SELECT * FROM orders WHERE order_number = ?', [order_number]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (RAZORPAY_KEY_SECRET && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        await db.run("UPDATE orders SET payment_status = 'PAYMENT_FAILED' WHERE id = ?", [order.id]);
        return res.status(400).json({ error: 'Invalid Razorpay payment signature' });
      }
    }

    await db.run(`
      UPDATE orders SET 
        payment_status = 'PAYMENT_VERIFIED',
        order_status = 'Confirmed',
        razorpay_order_id = ?,
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [razorpay_order_id || null, razorpay_payment_id, razorpay_signature || null, order.id]);

    await db.run(`
      INSERT INTO order_status_history (order_id, status, notes)
      VALUES (?, 'Confirmed', 'Razorpay Payment Verified Successfully.')
    `, [order.id]);

    res.json({ success: true, message: 'Payment verified and order confirmed!' });
  } catch (err) {
    console.error('Verify Razorpay Error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// POST /api/payments/submit-manual (UPI or Bank Transfer proof submission)
router.post('/submit-manual', optionalToken, async (req, res) => {
  try {
    const { order_number, payment_method, reference_number, proof_url } = req.body;

    if (!order_number || !reference_number) {
      return res.status(400).json({ error: 'Order number and Transaction Reference/UTR are required' });
    }

    const cleanRef = reference_number.trim();

    const order = await db.queryOne('SELECT * FROM orders WHERE order_number = ?', [order_number]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check against duplicate UTR / Reference submission across other orders
    const duplicateRef = await db.queryOne('SELECT id FROM orders WHERE payment_reference = ? AND id != ?', [cleanRef, order.id]);
    if (duplicateRef) {
      return res.status(400).json({ error: 'This payment reference/UTR number has already been submitted for another order.' });
    }

    await db.run(`
      UPDATE orders SET
        payment_method = ?,
        payment_status = 'MANUAL_PAYMENT_PENDING',
        payment_reference = ?,
        payment_proof_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [payment_method || 'UPI / Manual Transfer', cleanRef, proof_url || null, order.id]);

    await db.run(`
      INSERT INTO order_status_history (order_id, status, notes)
      VALUES (?, 'Pending Verification', ?)
    `, [order.id, `Manual payment reference ${cleanRef} submitted by customer. Awaiting Admin verification.`]);

    res.json({
      success: true,
      message: 'Payment reference submitted successfully. Our team will verify your transaction shortly.'
    });
  } catch (err) {
    console.error('Submit Manual Payment Error:', err);
    res.status(500).json({ error: 'Failed to submit payment details' });
  }
});

// POST /api/payments/webhook (Razorpay Webhook listener with signature check & idempotency)
router.post('/webhook', async (req, res) => {
  try {
    const secret = RAZORPAY_WEBHOOK_SECRET;
    if (secret) {
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== req.headers['x-razorpay-signature']) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' && payload && payload.payment) {
      const paymentEntity = payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const order = await db.queryOne('SELECT * FROM orders WHERE razorpay_order_id = ?', [razorpayOrderId]);
      if (order && order.payment_status !== 'PAYMENT_VERIFIED') {
        await db.run(`
          UPDATE orders SET
            payment_status = 'PAYMENT_VERIFIED',
            order_status = 'Confirmed',
            razorpay_payment_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [razorpayPaymentId, order.id]);
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay Webhook Error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// ADMIN ROUTES: Verify / Reject / Refund Manual Payments
router.post('/verify-manual', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await db.run(`
      UPDATE orders SET payment_status = 'PAYMENT_VERIFIED', order_status = 'Confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [orderId]);

    await db.run(`
      INSERT INTO order_status_history (order_id, status, notes, changed_by)
      VALUES (?, 'Confirmed', 'Manual Payment Verified by Admin', ?)
    `, [orderId, req.user.id]);

    await db.run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'VERIFY_PAYMENT', 'ORDER', ?, ?)
    `, [req.user.id, orderId, `Verified payment for order #${order.order_number}`]);

    res.json({ success: true, message: 'Payment verified and order confirmed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

router.post('/reject-manual', requireAdmin, async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await db.run(`
      UPDATE orders SET payment_status = 'PAYMENT_FAILED', order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [orderId]);

    await db.run(`
      INSERT INTO order_status_history (order_id, status, notes, changed_by)
      VALUES (?, 'Cancelled', ?, ?)
    `, [orderId, `Payment rejected by admin: ${reason || 'Invalid reference'}`, req.user.id]);

    await db.run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'REJECT_PAYMENT', 'ORDER', ?, ?)
    `, [req.user.id, orderId, `Rejected payment for order #${order.order_number}. Reason: ${reason || 'N/A'}`]);

    res.json({ success: true, message: 'Payment rejected and order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

router.post('/refund', requireAdmin, async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.payment_status === 'PAYMENT_REFUNDED') {
      return res.status(400).json({ error: 'Order has already been refunded.' });
    }

    const refundAmount = amount ? parseFloat(amount) : parseFloat(order.total_amount);
    if (refundAmount > parseFloat(order.total_amount)) {
      return res.status(400).json({ error: 'Refund amount cannot exceed original total order amount.' });
    }

    const refundRef = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (order.razorpay_payment_id && razorpay) {
      try {
        await razorpay.payments.refund(order.razorpay_payment_id, {
          amount: Math.round(refundAmount * 100),
          notes: { reason: reason || 'Customer refund request' }
        });
      } catch (rzpErr) {
        console.warn('Razorpay refund API warning:', rzpErr.message);
      }
    }

    await db.run(`
      UPDATE orders SET
        payment_status = 'PAYMENT_REFUNDED',
        order_status = 'Refunded',
        refund_reference = ?,
        refund_amount = ?,
        refund_reason = ?,
        refund_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [refundRef, refundAmount, reason || 'Admin initiated refund', orderId]);

    await db.run(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, 'REFUND_ORDER', 'ORDER', ?, ?)
    `, [req.user.id, orderId, `Refunded ₹${refundAmount} for order #${order.order_number}. Ref: ${refundRef}`]);

    res.json({ success: true, refundReference: refundRef, message: 'Refund initiated successfully' });
  } catch (err) {
    console.error('Refund Error:', err);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router;
