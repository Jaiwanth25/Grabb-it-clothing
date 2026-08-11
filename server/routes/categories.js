const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/categories?gender=men|women
router.get('/', (req, res) => {
  try {
    const { gender } = req.query;
    let query = 'SELECT * FROM categories WHERE is_active = 1 ';
    const params = [];

    if (gender && (gender.toLowerCase() === 'men' || gender.toLowerCase() === 'women')) {
      query += ' AND LOWER(gender) = ? ';
      params.push(gender.toLowerCase());
    }

    query += ' ORDER BY display_order ASC, name ASC';

    const categories = db.prepare(query).all(...params);

    // Attach product count per category
    const categoriesWithCount = categories.map((cat) => {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1').get(cat.id);
      return {
        ...cat,
        product_count: countRow ? countRow.count : 0
      };
    });

    res.json(categoriesWithCount);
  } catch (err) {
    console.error('Fetch Categories Error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
