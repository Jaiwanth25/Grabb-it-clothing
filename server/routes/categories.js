const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET /api/categories?gender=men|women
router.get('/', async (req, res) => {
  try {
    const { gender } = req.query;
    let query = 'SELECT * FROM categories WHERE is_active = 1 ';
    const params = [];

    if (gender && (gender.toLowerCase() === 'men' || gender.toLowerCase() === 'women')) {
      query += ' AND LOWER(gender) = ? ';
      params.push(gender.toLowerCase());
    }

    query += ' ORDER BY display_order ASC, name ASC';

    const categories = await db.query(query, params);

    // Attach product count per category
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const countRow = await db.queryOne('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1', [cat.id]);
      return {
        ...cat,
        product_count: countRow ? parseInt(countRow.count) : 0
      };
    }));

    res.json(categoriesWithCount);
  } catch (err) {
    console.error('Fetch Categories Error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
