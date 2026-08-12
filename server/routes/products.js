const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Helper to fetch images and variants for products
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

// GET /api/products
// Query parameters: gender ('men'|'women'), category (slug), collection (slug), search, minPrice, maxPrice, size, color, isNew, isTrending, isFeatured, discount, rating, inStock, sort
router.get('/', (req, res) => {
  try {
    const { gender, category, collection, search, minPrice, maxPrice, size, color, isNew, isTrending, isFeatured, discount, rating, inStock, sort } = req.query;

    let query = `
      SELECT DISTINCT p.* 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.is_active = 1
    `;
    const params = [];

    // Gender Filter (STRICT isolation)
    if (gender && (gender.toLowerCase() === 'men' || gender.toLowerCase() === 'women')) {
      query += ` AND LOWER(p.gender) = ? `;
      params.push(gender.toLowerCase());
    }

    // Category Filter
    if (category) {
      query += ` AND c.slug = ? `;
      params.push(category);
    }

    // Collection Filter
    if (collection) {
      query += ` AND p.id IN (SELECT product_id FROM collection_products cp JOIN collections col ON cp.collection_id = col.id WHERE col.slug = ?) `;
      params.push(collection);
    }

    // Search Filter
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR c.name LIKE ?) `;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Price Filter
    if (minPrice) {
      query += ` AND COALESCE(p.sale_price, p.price) >= ? `;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND COALESCE(p.sale_price, p.price) <= ? `;
      params.push(parseFloat(maxPrice));
    }

    // Variant Filters (Size / Color)
    if (size) {
      query += ` AND pv.size = ? `;
      params.push(size);
    }
    if (color) {
      query += ` AND LOWER(pv.color) = ? `;
      params.push(color.toLowerCase());
    }

    // Discount Filter (e.g. 10 means 10% or more discount)
    if (discount) {
      const minDiscount = parseFloat(discount);
      query += ` AND p.sale_price IS NOT NULL AND ((p.price - p.sale_price) / p.price * 100) >= ? `;
      params.push(minDiscount);
    }

    // Rating Filter (e.g. 4 means 4★ and above)
    if (rating) {
      query += ` AND p.rating >= ? `;
      params.push(parseFloat(rating));
    }

    // Availability/Stock Filter
    if (inStock === '1' || inStock === 'true') {
      query += ` AND (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) > 0 `;
    }

    // Flags
    if (isNew === '1' || isNew === 'true') {
      query += ` AND p.is_new = 1 `;
    }
    if (isTrending === '1' || isTrending === 'true') {
      query += ` AND p.is_trending = 1 `;
    }
    if (isFeatured === '1' || isFeatured === 'true') {
      query += ` AND p.is_featured = 1 `;
    }

    // Sorting
    switch (sort) {
      case 'price-low':
        query += ` ORDER BY COALESCE(p.sale_price, p.price) ASC `;
        break;
      case 'price-high':
        query += ` ORDER BY COALESCE(p.sale_price, p.price) DESC `;
        break;
      case 'newest':
        query += ` ORDER BY p.created_at DESC `;
        break;
      case 'rating':
        query += ` ORDER BY p.rating DESC `;
        break;
      case 'popularity':
        query += ` ORDER BY p.review_count DESC `;
        break;
      case 'discount':
        query += ` ORDER BY CASE WHEN p.sale_price IS NOT NULL THEN ((p.price - p.sale_price) / p.price) ELSE 0 END DESC `;
        break;
      default:
        query += ` ORDER BY p.display_order ASC, p.id DESC `;
        break;
    }

    const rawProducts = db.prepare(query).all(...params);
    const fullProducts = rawProducts.map(attachProductDetails);

    res.json(fullProducts);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/shipping/check
router.get('/shipping/check', (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: 'Valid 6-digit pincode is required' });
    }

    const firstDigit = pincode[0];
    let estimatedDays = 3;
    let shippingCharge = 99;
    let codAvailable = true;

    if (firstDigit === '1' || firstDigit === '2') {
      estimatedDays = 2; // North India
    } else if (firstDigit === '3' || firstDigit === '4') {
      estimatedDays = 3; // West/Central India
    } else if (firstDigit === '5' || firstDigit === '6') {
      estimatedDays = 4; // South India
    } else {
      estimatedDays = 5; // East/Northeast India
    }

    codAvailable = firstDigit !== '9'; // Simulate COD availability

    res.json({
      pincode,
      estimatedDays,
      shippingCharge,
      codAvailable,
      carrier: 'Grabb-it Express Logistics'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check shipping availability' });
  }
});

// GET /api/products/:slug
router.get('/:slug', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE (slug = ? OR id = ?) AND is_active = 1').get(req.params.slug, req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const fullProduct = attachProductDetails(product);

    // Fetch related products in same category
    const relatedRaw = db.prepare('SELECT * FROM products WHERE category_id = ? AND id != ? AND is_active = 1 LIMIT 4').all(product.category_id, product.id);
    const related = relatedRaw.map(attachProductDetails);

    res.json({ ...fullProduct, related });
  } catch (err) {
    console.error('Fetch Product Detail Error:', err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

module.exports = router;
