const express = require('express');
const router = express.Router();
const db = require('../database/db');

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = await db.queryOne(
      'SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1',
      [code.toUpperCase().trim()]
    );

    if (!coupon) {
      return res.status(400).json({ error: 'Invalid or expired coupon code' });
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ error: 'This coupon code has expired' });
    }

    if (coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon code usage limit exceeded' });
    }

    if (subtotal && subtotal < coupon.min_order_amount) {
      return res.status(400).json({ error: `Minimum order amount of $${coupon.min_order_amount.toFixed(2)} required for this coupon.` });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      message: `Coupon '${coupon.code}' applied successfully!`
    });
  } catch (err) {
    console.error('Validate Coupon Error:', err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
