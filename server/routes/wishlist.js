const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/wishlist
router.get('/', authenticateToken, (req, res) => {
  try {
    const rawProducts = db.prepare(`
      SELECT p.*
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ? AND p.is_active = 1
      ORDER BY w.created_at DESC
    `).all(req.user.id);

    const fullProducts = rawProducts.map((p) => {
      const images = db.prepare('SELECT image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC').all(p.id);
      const variants = db.prepare('SELECT id, size, color, stock FROM product_variants WHERE product_id = ?').all(p.id);
      return {
        ...p,
        images,
        primary_image: images.find(img => img.is_primary)?.image_url || images[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        variants
      };
    });

    res.json(fullProducts);
  } catch (err) {
    console.error('Fetch Wishlist Error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/wishlist/toggle
router.post('/toggle', authenticateToken, (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'ProductId is required' });

    const existing = db.prepare('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);

    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE id = ?').run(existing.id);
      res.json({ inWishlist: false, message: 'Removed from wishlist' });
    } else {
      db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
      res.json({ inWishlist: true, message: 'Added to wishlist' });
    }
  } catch (err) {
    console.error('Toggle Wishlist Error:', err);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

// GET /api/wishlist/ids (Quick array check)
router.get('/ids', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT product_id FROM wishlists WHERE user_id = ?').all(req.user.id);
    const ids = rows.map(r => r.product_id);
    res.json(ids);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wishlist IDs' });
  }
});

module.exports = router;
