const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/banners
router.get('/', async (req, res) => {
  try {
    const banners = await db.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC, id DESC', []);
    res.json(banners);
  } catch (err) {
    console.error('Fetch Banners Error:', err);
    res.status(500).json({ error: 'Failed to fetch active banners' });
  }
});

module.exports = router;
