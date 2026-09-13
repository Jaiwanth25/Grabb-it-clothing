const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Ensure styles table exists
async function ensureStylesTable() {
  try {
    if (db.isPg) {
      await db.run(`
        CREATE TABLE IF NOT EXISTS styles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          search_query VARCHAR(255) NOT NULL,
          image_url TEXT NOT NULL,
          gender VARCHAR(20) DEFAULT 'men',
          display_order INT DEFAULT 0,
          is_active INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      await db.run(`
        CREATE TABLE IF NOT EXISTS styles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          search_query TEXT NOT NULL,
          image_url TEXT NOT NULL,
          gender TEXT DEFAULT 'men',
          display_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Safe migration: Ensure any row with null ID in SQLite receives its rowid
    try {
      if (!db.isPg) {
        await db.run('UPDATE styles SET id = rowid WHERE id IS NULL');
      }
    } catch (e) {}

    const countRow = await db.queryOne('SELECT COUNT(*) as count FROM styles');
    if (countRow && parseInt(countRow.count) === 0) {
      const defaultStyles = [
        { name: 'Oversized Streetwear', search_query: 'oversized', image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80', gender: 'men', display_order: 1 },
        { name: 'Minimalist Solids', search_query: 'essential', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', gender: 'men', display_order: 2 },
        { name: 'Smart Resort Shirts', search_query: 'shirt', image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', gender: 'men', display_order: 3 },
        { name: 'Breezy Linen Cuts', search_query: 'linen', image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', gender: 'men', display_order: 4 }
      ];

      for (const st of defaultStyles) {
        await db.run(`
          INSERT INTO styles (name, search_query, image_url, gender, display_order, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `, [st.name, st.search_query, st.image_url, st.gender, st.display_order]);
      }
      try {
        if (!db.isPg) {
          await db.run('UPDATE styles SET id = rowid WHERE id IS NULL');
        }
      } catch (e) {}
    }
  } catch (err) {
    console.error('Ensure Styles Table Error:', err);
  }
}

// Initialize on require
ensureStylesTable();

// GET /api/styles?gender=men|women
router.get('/', async (req, res) => {
  try {
    await ensureStylesTable();
    const { gender } = req.query;
    let query = 'SELECT * FROM styles WHERE is_active = 1 ';
    const params = [];

    if (gender) {
      query += ' AND LOWER(gender) = ? ';
      params.push(gender.toLowerCase());
    }

    query += ' ORDER BY display_order ASC, id ASC';

    const styles = await db.query(query, params);
    res.json(styles || []);
  } catch (err) {
    console.error('Fetch Styles Error:', err);
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
});

module.exports = router;
