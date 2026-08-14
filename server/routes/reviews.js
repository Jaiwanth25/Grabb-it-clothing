const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/reviews
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'Product, rating, and comment are required' });
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Verify customer purchase and delivery state
    const purchase = await db.queryOne(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'Delivered'
      LIMIT 1
    `, [req.user.id, productId]);

    if (!purchase) {
      return res.status(403).json({ error: 'You can only review products you have purchased and had delivered.' });
    }

    await db.insert(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment, is_moderated)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [productId, req.user.id, req.user.name, ratingNum, comment.trim()]);

    // Update product rating stats
    const stats = await db.queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1', [productId]);
    if (stats) {
      const avgRating = stats.avg_rating !== null && stats.avg_rating !== undefined ? parseFloat(parseFloat(stats.avg_rating).toFixed(1)) : 5.0;
      const count = stats.review_cnt ? parseInt(stats.review_cnt, 10) : 0;
      await db.run('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [avgRating, count, productId]);
    }

    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Submit Review Error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
