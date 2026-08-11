const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes here require Admin role
router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const totalSalesRow = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'Paid'").get();
    const totalOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders").get();
    const totalCustomersRow = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get();
    const totalProductsRow = db.prepare("SELECT COUNT(*) as count FROM products").get();
    const lowStockRow = db.prepare("SELECT COUNT(*) as count FROM product_variants WHERE stock <= 5").get();
    const pendingOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Pending'").get();
    const activeBannersRow = db.prepare("SELECT COUNT(*) as count FROM banners WHERE is_active = 1").get();
    const trendingProductsRow = db.prepare("SELECT COUNT(*) as count FROM products WHERE is_trending = 1").get();

    const recentOrders = db.prepare("SELECT id, order_number, customer_name, total_amount, order_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5").all();

    res.json({
      totalSales: totalSalesRow.total || 0,
      totalOrders: totalOrdersRow.count || 0,
      totalCustomers: totalCustomersRow.count || 0,
      totalProducts: totalProductsRow.count || 0,
      lowStockCount: lowStockRow.count || 0,
      pendingOrders: pendingOrdersRow.count || 0,
      activeBanners: activeBannersRow.count || 0,
      trendingProducts: trendingProductsRow.count || 0,
      recentOrders
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// --- PRODUCT MANAGEMENT ---

// GET /api/admin/products
router.get('/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.gender as category_gender,
             (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as total_stock,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.display_order ASC, p.id DESC
    `).all();

    const fullProducts = products.map((p) => {
      const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id);
      const images = db.prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC').all(p.id);
      return { ...p, variants, images };
    });

    res.json(fullProducts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin products' });
  }
});

// POST /api/admin/products
router.post('/products', (req, res) => {
  try {
    const {
      name, description, gender, category_id, price, sale_price, sku,
      is_new = 0, is_trending = 0, is_featured = 0, is_active = 1,
      variants = [], images = []
    } = req.body;

    if (!name || !gender || !category_id || !price || !sku) {
      return res.status(400).json({ error: 'Name, gender, category, price, and SKU are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const tx = db.transaction(() => {
      const res = db.prepare(`
        INSERT INTO products (name, slug, description, gender, category_id, price, sale_price, sku, is_new, is_trending, is_featured, is_active, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99)
      `).run(name, slug, description || '', gender.toLowerCase(), category_id, price, sale_price || null, sku, is_new ? 1 : 0, is_trending ? 1 : 0, is_featured ? 1 : 0, is_active ? 1 : 0);

      const productId = res.lastInsertRowid;

      // Variants
      const insertVar = db.prepare('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)');
      if (variants && variants.length) {
        variants.forEach(v => insertVar.run(productId, v.size, v.color, v.color_hex || '#000000', v.stock || 10));
      } else {
        ['S', 'M', 'L', 'XL'].forEach(sz => insertVar.run(productId, sz, 'Standard', '#111111', 15));
      }

      // Images
      const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
      if (images && images.length) {
        images.forEach((img, idx) => insertImg.run(productId, typeof img === 'string' ? img : img.image_url, idx === 0 ? 1 : 0, idx + 1));
      } else {
        insertImg.run(productId, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', 1, 1);
      }

      return productId;
    });

    const newId = tx();
    res.status(201).json({ id: newId, message: 'Product created successfully' });
  } catch (err) {
    console.error('Create Admin Product Error:', err);
    res.status(400).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', (req, res) => {
  try {
    const {
      name, description, gender, category_id, price, sale_price, sku,
      is_new, is_trending, is_featured, is_active, display_order, variants, images
    } = req.body;

    const productId = req.params.id;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE products SET
          name = ?, description = ?, gender = ?, category_id = ?, price = ?, sale_price = ?,
          sku = ?, is_new = ?, is_trending = ?, is_featured = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, description, gender, category_id, price, sale_price || null, sku, is_new ? 1 : 0, is_trending ? 1 : 0, is_featured ? 1 : 0, is_active ? 1 : 0, display_order || 0, productId);

      if (variants) {
        db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(productId);
        const insertVar = db.prepare('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)');
        variants.forEach(v => insertVar.run(productId, v.size, v.color, v.color_hex || '#000000', v.stock || 0));
      }

      if (images) {
        db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
        const insertImg = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)');
        images.forEach((img, idx) => insertImg.run(productId, typeof img === 'string' ? img : img.image_url, idx === 0 ? 1 : 0, idx + 1));
      }
    });

    tx();
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Update Admin Product Error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- CATEGORY MANAGEMENT ---

// GET /api/admin/categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY gender ASC, display_order ASC').all();
  res.json(categories);
});

// POST /api/admin/categories
router.post('/categories', (req, res) => {
  try {
    const { name, gender, image_url, display_order = 0, is_active = 1 } = req.body;
    if (!name || !gender) {
      return res.status(400).json({ error: 'Name and gender (men/women) are required' });
    }
    const slug = gender.toLowerCase() + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    db.prepare(`
      INSERT INTO categories (name, slug, gender, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, slug, gender.toLowerCase(), image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', display_order, is_active ? 1 : 0);

    res.status(201).json({ message: 'Category created' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create category' });
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', (req, res) => {
  try {
    const { name, gender, image_url, display_order, is_active } = req.body;
    db.prepare(`
      UPDATE categories SET name = ?, gender = ?, image_url = ?, display_order = ?, is_active = ? WHERE id = ?
    `).run(name, gender.toLowerCase(), image_url, display_order, is_active ? 1 : 0, req.params.id);

    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Category deleted' });
});

// --- BANNER MANAGEMENT ---

// GET /api/admin/banners
router.get('/banners', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners ORDER BY display_order ASC, id DESC').all();
  res.json(banners);
});

// POST /api/admin/banners
router.post('/banners', (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, image_url, display_order = 0, is_active = 1 } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and image URL are required' });
    }
    db.prepare(`
      INSERT INTO banners (title, subtitle, button_text, button_link, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title, subtitle || '', button_text || 'SHOP NOW', button_link || '/men', image_url, display_order, is_active ? 1 : 0);

    res.status(201).json({ message: 'Banner created' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create banner' });
  }
});

// PUT /api/admin/banners/:id
router.put('/banners/:id', (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, image_url, display_order, is_active } = req.body;
    db.prepare(`
      UPDATE banners SET title = ?, subtitle = ?, button_text = ?, button_link = ?, image_url = ?, display_order = ?, is_active = ? WHERE id = ?
    `).run(title, subtitle, button_text, button_link, image_url, display_order, is_active ? 1 : 0, req.params.id);

    res.json({ message: 'Banner updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// DELETE /api/admin/banners/:id
router.delete('/banners/:id', (req, res) => {
  db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
  res.json({ message: 'Banner deleted' });
});

// --- REORDER ENDPOINT (Banners, Products, Categories) ---
router.post('/reorder', (req, res) => {
  try {
    const { entity, orders } = req.body; // orders: [{ id, display_order }]
    if (!entity || !orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Entity and orders array required' });
    }

    let tableName = '';
    if (entity === 'banners') tableName = 'banners';
    else if (entity === 'products') tableName = 'products';
    else if (entity === 'categories') tableName = 'categories';
    else return res.status(400).json({ error: 'Invalid entity type' });

    const stmt = db.prepare(`UPDATE ${tableName} SET display_order = ? WHERE id = ?`);
    const tx = db.transaction(() => {
      orders.forEach(item => stmt.run(item.display_order, item.id));
    });
    tx();

    res.json({ message: `${entity} reordered successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

// --- ORDER MANAGEMENT ---

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const ordersWithItems = orders.map(ord => ({
    ...ord,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id)
  }));
  res.json(ordersWithItems);
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req, res) => {
  try {
    const { order_status, payment_status } = req.body;
    if (order_status) {
      db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order_status, req.params.id);
    }
    if (payment_status) {
      db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(payment_status, req.params.id);
    }
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// --- INVENTORY MANAGEMENT ---

// GET /api/admin/inventory
router.get('/inventory', (req, res) => {
  const inventory = db.prepare(`
    SELECT pv.id as variant_id, pv.size, pv.color, pv.color_hex, pv.stock,
           p.id as product_id, p.name as product_name, p.sku, p.gender, c.name as category_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    ORDER BY pv.stock ASC, p.name ASC
  `).all();
  res.json(inventory);
});

// PUT /api/admin/inventory/:variantId
router.put('/inventory/:variantId', (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) return res.status(400).json({ error: 'Valid stock number required' });

    db.prepare('UPDATE product_variants SET stock = ? WHERE id = ?').run(parseInt(stock), req.params.variantId);
    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// --- CUSTOMER MANAGEMENT ---

// GET /api/admin/customers
router.get('/customers', (req, res) => {
  const customers = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_amount), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.role = 'customer'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(customers);
});

// --- COUPON MANAGEMENT ---

// GET /api/admin/coupons
router.get('/coupons', (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  res.json(coupons);
});

// POST /api/admin/coupons
router.post('/coupons', (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount = 0, expiry_date, usage_limit = 100, is_active = 1 } = req.body;
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, discount type, and value are required' });
    }

    db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(code.toUpperCase().trim(), discount_type, parseFloat(discount_value), parseFloat(min_order_amount), expiry_date || null, parseInt(usage_limit), is_active ? 1 : 0);

    res.status(201).json({ message: 'Coupon created' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create coupon (code may already exist)' });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  res.json({ message: 'Coupon deleted' });
});

// --- IMAGE UPLOAD API FOR ADMIN ---
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
