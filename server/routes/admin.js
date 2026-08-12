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
    const { title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order = 0, is_active = 1 } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and image URL are required' });
    }
    db.prepare(`
      INSERT INTO banners (title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, subtitle || '', button_text || 'SHOP NOW', button_link || '/men', image_url, mobile_image_url || null, gender || null, start_date || null, end_date || null, display_order, is_active ? 1 : 0);

    res.status(201).json({ message: 'Banner created' });
  } catch (err) {
    console.error('Create Banner Error:', err);
    res.status(400).json({ error: 'Failed to create banner' });
  }
});

// PUT /api/admin/banners/:id
router.put('/banners/:id', (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order, is_active } = req.body;
    db.prepare(`
      UPDATE banners SET 
        title = ?, subtitle = ?, button_text = ?, button_link = ?, image_url = ?, mobile_image_url = ?, 
        gender = ?, start_date = ?, end_date = ?, display_order = ?, is_active = ? 
      WHERE id = ?
    `).run(title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order, is_active ? 1 : 0, req.params.id);

    res.json({ message: 'Banner updated' });
  } catch (err) {
    console.error('Update Banner Error:', err);
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
    const { order_status, payment_status, tracking_number, courier, tracking_url } = req.body;
    if (order_status) {
      db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(order_status, req.params.id);
      
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES (?, ?, ?)
      `).run(req.params.id, order_status, `Status updated to ${order_status}.`);

      const order = db.prepare('SELECT user_id, order_number FROM orders WHERE id = ?').get(req.params.id);
      if (order && order.user_id) {
        let title = 'Order Update';
        let message = `Your order #${order.order_number} status has been updated to ${order_status}.`;
        
        if (order_status === 'Confirmed') {
          title = 'Order Confirmed';
          message = `Your order has been confirmed.`;
        } else if (order_status === 'Packed') {
          title = 'Order Packed';
          message = `Your order has been packed.`;
        } else if (order_status === 'Shipped') {
          title = 'Order Shipped';
          message = `Your order is on the way.`;
        } else if (order_status === 'Out for Delivery') {
          title = 'Out for Delivery';
          message = `Your order is out for delivery.`;
        } else if (order_status === 'Delivered') {
          title = 'Order Delivered';
          message = `Your order has been delivered.`;
        }
        
        db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)').run(order.user_id, title, message);

        if (order_status === 'Delivered') {
          db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)')
            .run(order.user_id, 'Rate Your Purchase', `How did you like your purchase? Tell us how your items fitted! Leave a review on the product details page.`);
        }
      }
    }
    if (payment_status) {
      db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(payment_status, req.params.id);
    }
    if (tracking_number !== undefined) {
      db.prepare('UPDATE orders SET tracking_number = ? WHERE id = ?').run(tracking_number, req.params.id);
    }
    if (courier !== undefined) {
      db.prepare('UPDATE orders SET courier = ? WHERE id = ?').run(courier, req.params.id);
    }
    if (tracking_url !== undefined) {
      db.prepare('UPDATE orders SET tracking_url = ? WHERE id = ?').run(tracking_url, req.params.id);
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

// --- COLLECTIONS MANAGEMENT ---

// GET /api/admin/collections
router.get('/collections', (req, res) => {
  try {
    const collections = db.prepare('SELECT * FROM collections ORDER BY id DESC').all();
    const fullCollections = collections.map(col => {
      const products = db.prepare(`
        SELECT p.id, p.name, p.sku 
        FROM products p
        JOIN collection_products cp ON p.id = cp.product_id
        WHERE cp.collection_id = ?
      `).all(col.id);
      return { ...col, products };
    });
    res.json(fullCollections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// POST /api/admin/collections
router.post('/collections', (req, res) => {
  try {
    const { name, description, cover_image, banner_image, gender, is_active = 1, products = [] } = req.body;
    if (!name || !gender) {
      return res.status(400).json({ error: 'Name and gender are required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO collections (name, slug, description, cover_image, banner_image, gender, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, slug, description || '', cover_image || '', banner_image || '', gender.toLowerCase(), is_active ? 1 : 0);

      const colId = stmt.lastInsertRowid;
      const insertProd = db.prepare('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)');
      products.forEach(pId => insertProd.run(colId, pId));
      return colId;
    });

    const newId = tx();
    res.status(201).json({ id: newId, message: 'Collection created successfully' });
  } catch (err) {
    console.error('Create Collection Error:', err);
    res.status(400).json({ error: err.message || 'Failed to create collection' });
  }
});

// PUT /api/admin/collections/:id
router.put('/collections/:id', (req, res) => {
  try {
    const { name, description, cover_image, banner_image, gender, is_active, products = [] } = req.body;
    const colId = req.params.id;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE collections SET
          name = ?, description = ?, cover_image = ?, banner_image = ?, gender = ?, is_active = ?
        WHERE id = ?
      `).run(name, description, cover_image, banner_image, gender.toLowerCase(), is_active ? 1 : 0, colId);

      db.prepare('DELETE FROM collection_products WHERE collection_id = ?').run(colId);
      const insertProd = db.prepare('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)');
      products.forEach(pId => insertProd.run(colId, pId));
    });

    tx();
    res.json({ message: 'Collection updated successfully' });
  } catch (err) {
    console.error('Update Collection Error:', err);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// DELETE /api/admin/collections/:id
router.delete('/collections/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// --- LOOKS (SHOP THE LOOK) MANAGEMENT ---

// GET /api/admin/looks
router.get('/looks', (req, res) => {
  try {
    const looks = db.prepare('SELECT * FROM looks ORDER BY id DESC').all();
    const fullLooks = looks.map(look => {
      const products = db.prepare(`
        SELECT p.id, p.name, p.sku
        FROM products p
        JOIN look_products lp ON p.id = lp.product_id
        WHERE lp.look_id = ?
      `).all(look.id);
      return { ...look, products };
    });
    res.json(fullLooks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch looks' });
  }
});

// POST /api/admin/looks
router.post('/looks', (req, res) => {
  try {
    const { name, description, image_url, gender, is_active = 1, products = [] } = req.body;
    if (!name || !image_url || !gender) {
      return res.status(400).json({ error: 'Name, image URL, and gender are required' });
    }

    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO looks (name, description, image_url, gender, is_active)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, description || '', image_url, gender.toLowerCase(), is_active ? 1 : 0);

      const lookId = stmt.lastInsertRowid;
      const insertProd = db.prepare('INSERT INTO look_products (look_id, product_id) VALUES (?, ?)');
      products.forEach(pId => insertProd.run(lookId, pId));
      return lookId;
    });

    const newId = tx();
    res.status(201).json({ id: newId, message: 'Look created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create look' });
  }
});

// PUT /api/admin/looks/:id
router.put('/looks/:id', (req, res) => {
  try {
    const { name, description, image_url, gender, is_active, products = [] } = req.body;
    const lookId = req.params.id;

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE looks SET
          name = ?, description = ?, image_url = ?, gender = ?, is_active = ?
        WHERE id = ?
      `).run(name, description, image_url, gender.toLowerCase(), is_active ? 1 : 0, lookId);

      db.prepare('DELETE FROM look_products WHERE look_id = ?').run(lookId);
      const insertProd = db.prepare('INSERT INTO look_products (look_id, product_id) VALUES (?, ?)');
      products.forEach(pId => insertProd.run(lookId, pId));
    });

    tx();
    res.json({ message: 'Look updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update look' });
  }
});

// DELETE /api/admin/looks/:id
router.delete('/looks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM looks WHERE id = ?').run(req.params.id);
    res.json({ message: 'Look deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete look' });
  }
});

// --- REVIEWS MODERATION ---

// GET /api/admin/reviews
router.get('/reviews', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, p.name as product_name, p.sku as product_sku
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// PUT /api/admin/reviews/:id/moderate
router.put('/reviews/:id/moderate', (req, res) => {
  try {
    const { is_moderated } = req.body;
    const reviewId = req.params.id;

    db.prepare('UPDATE reviews SET is_moderated = ? WHERE id = ?').run(is_moderated ? 1 : 0, reviewId);

    // Get the product_id for this review
    const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(reviewId);
    if (review) {
      // Re-calculate rating stats for the product
      const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1').get(review.product_id);
      db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
        parseFloat((stats.avg_rating || 5).toFixed(1)),
        stats.review_cnt || 0,
        review.product_id
      );
    }

    res.json({ message: 'Review moderation updated' });
  } catch (err) {
    console.error('Moderate Review Error:', err);
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = db.prepare('SELECT product_id FROM reviews WHERE id = ?').get(reviewId);

    db.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);

    if (review) {
      // Re-calculate rating stats for the product
      const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1').get(review.product_id);
      db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
        parseFloat((stats.avg_rating || 5).toFixed(1)),
        stats.review_cnt || 0,
        review.product_id
      );
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// --- BULK PRODUCT IMPORT CSV DATA ---

// POST /api/admin/products/bulk-csv
router.post('/products/bulk-csv', (req, res) => {
  try {
    const { products } = req.body; // Array of product JSON objects parsed from CSV
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No product records found' });
    }

    const tx = db.transaction(() => {
      let importedCount = 0;
      const errors = [];

      products.forEach((prod, index) => {
        const { SKU, name, description, gender, category_id, price, sale_price, size = 'M', color = 'Standard', color_hex = '#111111', stock = 10, image_url } = prod;

        if (!SKU || !name || !gender || !category_id || !price) {
          errors.push(`Row ${index + 1}: Missing required fields (SKU, name, gender, category_id, price).`);
          return;
        }

        // Validate price and sale price
        const itemPrice = parseFloat(price);
        const itemSalePrice = sale_price ? parseFloat(sale_price) : null;
        if (itemSalePrice !== null && itemSalePrice > itemPrice) {
          errors.push(`Row ${index + 1}: Sale price (${itemSalePrice}) cannot be greater than MRP (${itemPrice}).`);
          return;
        }

        // Validate SKU uniqueness
        const existingSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(SKU);
        if (existingSku) {
          errors.push(`Row ${index + 1}: Product with SKU ${SKU} already exists.`);
          return;
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4) + '-' + index;

        // Insert product
        const prodInsert = db.prepare(`
          INSERT INTO products (name, slug, description, gender, category_id, price, sale_price, sku, is_new, is_trending, is_featured, is_active, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 1, 99)
        `).run(name, slug, description || '', gender.toLowerCase(), parseInt(category_id), itemPrice, itemSalePrice, SKU);

        const newProductId = prodInsert.lastInsertRowid;

        // Insert variant
        db.prepare(`
          INSERT INTO product_variants (product_id, size, color, color_hex, stock)
          VALUES (?, ?, ?, ?, ?)
        `).run(newProductId, size, color, color_hex, parseInt(stock));

        // Insert image
        const fallbackImg = image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
        db.prepare(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES (?, ?, 1, 1)
        `).run(newProductId, fallbackImg);

        importedCount++;
      });

      return { importedCount, errors };
    });

    const result = tx();
    if (result.errors.length > 0 && result.importedCount === 0) {
      return res.status(400).json({ error: 'Import failed', details: result.errors });
    }

    res.json({
      message: `Successfully imported ${result.importedCount} products.`,
      warnings: result.errors
    });
  } catch (err) {
    console.error('CSV Bulk Import Error:', err);
    res.status(500).json({ error: 'Failed to import products' });
  }
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
