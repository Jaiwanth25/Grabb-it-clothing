const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to attach product details
function attachProductDetails(product) {
  if (!product) return null;
  const images = db.prepare('SELECT id, image_url, is_primary, display_order FROM product_images WHERE product_id = ? ORDER BY display_order ASC').all(product.id);
  const variants = db.prepare('SELECT id, size, color, color_hex, stock FROM product_variants WHERE product_id = ?').all(product.id);
  const category = db.prepare('SELECT id, name, slug, gender FROM categories WHERE id = ?').get(product.category_id);
  const reviews = db.prepare('SELECT id, user_name, rating, comment, created_at FROM reviews WHERE product_id = ? AND is_moderated = 1 ORDER BY created_at DESC').all(product.id);

  return {
    ...product,
    category,
    images: images.length ? images : [{ image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', is_primary: 1 }],
    primary_image: images.find(img => img.is_primary)?.image_url || images[0]?.image_url,
    secondary_image: images[1]?.image_url || images[0]?.image_url,
    variants,
    reviews
  };
}

// GET /api/collections
router.get('/', (req, res) => {
  try {
    const { gender } = req.query;
    let query = 'SELECT * FROM collections WHERE is_active = 1';
    const params = [];
    if (gender) {
      query += " AND (gender = ? OR gender = 'unisex')";
      params.push(gender);
    }
    query += ' ORDER BY id DESC';
    const collections = db.prepare(query).all(...params);
    res.json(collections);
  } catch (err) {
    console.error('Fetch Collections Error:', err);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// GET /api/collections/:slug
router.get('/:slug', (req, res) => {
  try {
    const collection = db.prepare('SELECT * FROM collections WHERE slug = ? AND is_active = 1').get(req.params.slug);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const products = db.prepare(`
      SELECT p.* FROM products p
      JOIN collection_products cp ON p.id = cp.product_id
      WHERE cp.collection_id = ? AND p.is_active = 1
    `).all(collection.id);

    const fullProducts = products.map(attachProductDetails);

    res.json({
      ...collection,
      products: fullProducts
    });
  } catch (err) {
    console.error('Fetch Collection Detail Error:', err);
    res.status(500).json({ error: 'Failed to fetch collection details' });
  }
});

module.exports = router;
