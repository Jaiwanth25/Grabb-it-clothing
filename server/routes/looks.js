const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to attach product details
function attachProductDetails(product) {
  if (!product) return null;
  const images = await db.queryOne('SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC').all(product.id);
  const variants = await db.query('SELECT id, size, color, color_hex, stock FROM product_variants WHERE product_id = ?', [product.id]);
  const category = await db.query('SELECT id, name, slug, gender FROM categories WHERE id = ?', [product.category_id]);

  return {
    ...product,
    category,
    images: images.length ? images : [{ image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', is_primary: 1 }],
    primary_image: images.find(img => img.is_primary)?.image_url || images[0]?.image_url,
    secondary_image: images[1]?.image_url || images[0]?.image_url,
    variants
  };
}

// GET /api/looks
router.get('/', async (req, res) => {
  try {
    const { gender } = req.query;
    let query = 'SELECT * FROM looks WHERE is_active = 1';
    const params = [];
    if (gender) {
      query += ' AND gender = ?';
      params.push(gender);
    }
    query += ' ORDER BY id DESC';
    const looks = db.prepare(query, [...params]);

    const looksWithProducts = looks.map(look => {
      const products = await db.query(`
        SELECT p.* FROM products p
        JOIN look_products lp ON p.id = lp.product_id
        WHERE lp.look_id = ? AND p.is_active = 1
      `, [look.id]);
      return {
        ...look,
        products: products.map(attachProductDetails)
      };
    });

    res.json(looksWithProducts);
  } catch (err) {
    console.error('Fetch Looks Error:', err);
    res.status(500).json({ error: 'Failed to fetch looks' });
  }
});

module.exports = router;
