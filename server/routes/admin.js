const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes here require Admin role
router.use(requireAdmin);

// POST /api/admin/upload (Direct File Picker Image Upload)
router.post('/upload', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files were provided for upload.' });
    }
    const urls = req.files.map(file => {
      if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
        return file.path;
      }
      return `/uploads/${file.filename}`;
    });
    res.json({ urls, message: 'Images uploaded successfully' });
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalSalesRow = await db.queryOne("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'PAYMENT_VERIFIED' OR payment_status = 'Paid'", []);
    const totalOrdersRow = await db.queryOne("SELECT COUNT(*) as count FROM orders", []);
    const totalCustomersRow = await db.queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'customer'", []);
    const totalProductsRow = await db.queryOne("SELECT COUNT(*) as count FROM products", []);
    const lowStockRow = await db.queryOne("SELECT COUNT(*) as count FROM product_variants WHERE stock <= 5", []);
    const pendingOrdersRow = await db.queryOne("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Pending' OR order_status = 'Pending Verification'", []);
    const activeBannersRow = await db.queryOne("SELECT COUNT(*) as count FROM banners WHERE is_active = 1", []);
    const trendingProductsRow = await db.queryOne("SELECT COUNT(*) as count FROM products WHERE is_trending = 1", []);

    const recentOrders = await db.query("SELECT id, order_number, customer_name, total_amount, order_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5");

    res.json({
      totalSales: totalSalesRow?.total || 0,
      totalOrders: totalOrdersRow?.count || 0,
      totalCustomers: totalCustomersRow?.count || 0,
      totalProducts: totalProductsRow?.count || 0,
      lowStockCount: lowStockRow?.count || 0,
      pendingOrders: pendingOrdersRow?.count || 0,
      activeBanners: activeBannersRow?.count || 0,
      trendingProducts: trendingProductsRow?.count || 0,
      recentOrders
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// --- PRODUCT MANAGEMENT ---

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const products = await db.query(`
      SELECT p.*, c.name as category_name, c.gender as category_gender,
             (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as total_stock,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.display_order ASC, p.id DESC
    `, []);

    const fullProducts = await Promise.all(products.map(async (p) => {
      const variants = await db.query('SELECT * FROM product_variants WHERE product_id = ?', [p.id]);
      const images = await db.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC', [p.id]);
      return { ...p, variants, images };
    }));

    res.json(fullProducts);
  } catch (err) {
    console.error('Fetch Admin Products Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin products' });
  }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const {
      name, description, gender, category_id, price, sale_price, sku,
      is_new = 0, is_trending = 0, is_featured = 0, is_hot = 0, is_bestseller = 0,
      is_sale = 0, is_limited = 0, custom_badge_text = null, custom_badge_color = null,
      is_active = 1, variants = [], images = []
    } = req.body;

    if (!name || !gender || !category_id || !price || !sku) {
      return res.status(400).json({ error: 'Name, gender, category, price, and SKU are required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const productId = await db.transaction(async (tx) => {
      const prodRes = await tx.insert(`
        INSERT INTO products (
          name, slug, description, gender, category_id, price, sale_price, sku,
          is_new, is_trending, is_featured, is_hot, is_bestseller, is_sale, is_limited,
          custom_badge_text, custom_badge_color, is_active, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99)
      `, [
        name, slug, description || '', gender.toLowerCase(), category_id, price, sale_price || null, sku,
        is_new ? 1 : 0, is_trending ? 1 : 0, is_featured ? 1 : 0, is_hot ? 1 : 0, is_bestseller ? 1 : 0,
        is_sale ? 1 : 0, is_limited ? 1 : 0, custom_badge_text || null, custom_badge_color || null,
        is_active ? 1 : 0
      ]);

      const pId = prodRes.id;

      // Variants
      if (variants && variants.length) {
        for (const v of variants) {
          await tx.run('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [pId, v.size, v.color, v.color_hex || '#000000', v.stock || 10]);
        }
      } else {
        for (const sz of ['S', 'M', 'L', 'XL']) {
          await tx.run('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [pId, sz, 'Standard', '#111111', 15]);
        }
      }

      // Images
      if (images && images.length) {
        for (let idx = 0; idx < images.length; idx++) {
          const img = images[idx];
          const imgUrl = typeof img === 'string' ? img : img.image_url;
          await tx.run('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)', [pId, imgUrl, idx === 0 ? 1 : 0, idx + 1]);
        }
      } else {
        await tx.run('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, 1, 1)', [pId, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80']);
      }

      return pId;
    });

    res.status(201).json({ id: productId, message: 'Product created successfully' });
  } catch (err) {
    console.error('Create Admin Product Error:', err);
    res.status(400).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const {
      name, description, gender, category_id, price, sale_price, sku,
      is_new, is_trending, is_featured, is_hot, is_bestseller, is_sale, is_limited,
      custom_badge_text, custom_badge_color, is_active, display_order, variants, images
    } = req.body;

    const productId = req.params.id;

    await db.transaction(async (tx) => {
      await tx.run(`
        UPDATE products SET
          name = ?, description = ?, gender = ?, category_id = ?, price = ?, sale_price = ?, sku = ?,
          is_new = ?, is_trending = ?, is_featured = ?, is_hot = ?, is_bestseller = ?, is_sale = ?, is_limited = ?,
          custom_badge_text = ?, custom_badge_color = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        name, description, gender, category_id, price, sale_price || null, sku,
        is_new ? 1 : 0, is_trending ? 1 : 0, is_featured ? 1 : 0, is_hot ? 1 : 0, is_bestseller ? 1 : 0, is_sale ? 1 : 0, is_limited ? 1 : 0,
        custom_badge_text || null, custom_badge_color || null, is_active ? 1 : 0, display_order || 0, productId
      ]);

      if (variants && Array.isArray(variants)) {
        await tx.run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
        for (const v of variants) {
          await tx.run('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [productId, v.size, v.color, v.color_hex || '#000000', v.stock || 0]);
        }
      }

      if (images && Array.isArray(images)) {
        await tx.run('DELETE FROM product_images WHERE product_id = ?', [productId]);
        for (let idx = 0; idx < images.length; idx++) {
          const img = images[idx];
          const imgUrl = typeof img === 'string' ? img : img.image_url;
          await tx.run('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)', [productId, imgUrl, idx === 0 ? 1 : 0, idx + 1]);
        }
      }
    });

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error('Update Admin Product Error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id (Safe soft-deletion if historical order items exist)
router.delete('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const orderItemCount = await db.queryOne('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [productId]);

    if (orderItemCount && orderItemCount.count > 0) {
      // Soft delete to preserve historical order records
      await db.run('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [productId]);
      return res.json({ message: 'Product archived (soft-deleted) to preserve historical order records.' });
    }

    // Hard delete if no orders reference it
    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM product_images WHERE product_id = ?', [productId]);
      await tx.run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
      await tx.run('DELETE FROM collection_products WHERE product_id = ?', [productId]);
      await tx.run('DELETE FROM products WHERE id = ?', [productId]);
    });

    res.json({ message: 'Product permanently deleted.' });
  } catch (err) {
    console.error('Delete Admin Product Error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// --- CATEGORY MANAGEMENT ---

// GET /api/admin/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY gender ASC, display_order ASC', []);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin categories' });
  }
});

// POST /api/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, gender, image_url, display_order = 0, is_active = 1 } = req.body;
    if (!name || !gender) {
      return res.status(400).json({ error: 'Name and gender (men/women) are required' });
    }
    const slug = gender.toLowerCase() + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await db.insert(`
      INSERT INTO categories (name, slug, gender, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, slug, gender.toLowerCase(), image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', display_order, is_active ? 1 : 0]);

    res.status(201).json({ message: 'Category created' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create category' });
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, gender, image_url, display_order, is_active } = req.body;
    await db.run(`
      UPDATE categories SET name = ?, gender = ?, image_url = ?, display_order = ?, is_active = ? WHERE id = ?
    `, [name, gender.toLowerCase(), image_url, display_order, is_active ? 1 : 0, req.params.id]);

    res.json({ message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// --- BANNER MANAGEMENT ---

// GET /api/admin/banners
router.get('/banners', async (req, res) => {
  try {
    const banners = await db.query('SELECT * FROM banners ORDER BY display_order ASC, id DESC', []);
    res.json(banners);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin banners' });
  }
});

// POST /api/admin/banners
router.post('/banners', async (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order = 0, is_active = 1 } = req.body;
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and image URL are required' });
    }
    await db.insert(`
      INSERT INTO banners (title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, subtitle || '', button_text || 'SHOP NOW', button_link || '/men', image_url, mobile_image_url || null, gender || null, start_date || null, end_date || null, display_order, is_active ? 1 : 0]);

    res.status(201).json({ message: 'Banner created' });
  } catch (err) {
    console.error('Create Banner Error:', err);
    res.status(400).json({ error: 'Failed to create banner' });
  }
});

// PUT /api/admin/banners/:id
router.put('/banners/:id', async (req, res) => {
  try {
    const { title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order, is_active } = req.body;
    await db.run(`
      UPDATE banners SET 
        title = ?, subtitle = ?, button_text = ?, button_link = ?, image_url = ?, mobile_image_url = ?, 
        gender = ?, start_date = ?, end_date = ?, display_order = ?, is_active = ? 
      WHERE id = ?
    `, [title, subtitle, button_text, button_link, image_url, mobile_image_url, gender, start_date, end_date, display_order, is_active ? 1 : 0, req.params.id]);

    res.json({ message: 'Banner updated' });
  } catch (err) {
    console.error('Update Banner Error:', err);
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

// DELETE /api/admin/banners/:id
router.delete('/banners/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// --- REORDER ENDPOINT (Banners, Products, Categories) ---
router.post('/reorder', async (req, res) => {
  try {
    const { entity, orders } = req.body;
    if (!entity || !orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: 'Entity and orders array required' });
    }

    let tableName = '';
    if (entity === 'banners') tableName = 'banners';
    else if (entity === 'products') tableName = 'products';
    else if (entity === 'categories') tableName = 'categories';
    else return res.status(400).json({ error: 'Invalid entity type' });

    await db.transaction(async (tx) => {
      for (const item of orders) {
        await tx.run(`UPDATE ${tableName} SET display_order = ? WHERE id = ?`, [item.display_order, item.id]);
      }
    });

    res.json({ message: `${entity} reordered successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

// --- ORDER MANAGEMENT ---

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await db.query('SELECT * FROM orders ORDER BY created_at DESC', []);
    const ordersWithItems = await Promise.all(orders.map(async (ord) => {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);
      return { ...ord, items };
    }));
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Fetch Admin Orders Error:', err);
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { order_status, payment_status, tracking_number, courier, tracking_url } = req.body;
    if (order_status) {
      await db.run('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [order_status, req.params.id]);
      
      await db.run(`
        INSERT INTO order_status_history (order_id, status, notes, changed_by)
        VALUES (?, ?, ?, ?)
      `, [req.params.id, order_status, `Status updated to ${order_status}.`, req.user.id]);

      const order = await db.queryOne('SELECT user_id, order_number FROM orders WHERE id = ?', [req.params.id]);
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
        
        await db.run('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [order.user_id, title, message]);

        if (order_status === 'Delivered') {
          await db.run('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [
            order.user_id, 'Rate Your Purchase', 'How did you like your purchase? Leave a review on the product details page.'
          ]);
        }
      }
    }

    if (payment_status) {
      await db.run('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [payment_status, req.params.id]);
    }
    if (tracking_number !== undefined) {
      await db.run('UPDATE orders SET tracking_number = ? WHERE id = ?', [tracking_number, req.params.id]);
    }
    if (courier !== undefined) {
      await db.run('UPDATE orders SET courier = ? WHERE id = ?', [courier, req.params.id]);
    }
    if (tracking_url !== undefined) {
      await db.run('UPDATE orders SET tracking_url = ? WHERE id = ?', [tracking_url, req.params.id]);
    }

    res.json({ message: 'Order status updated' });
  } catch (err) {
    console.error('Update Admin Order Status Error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// --- INVENTORY MANAGEMENT ---

// GET /api/admin/inventory
router.get('/inventory', async (req, res) => {
  try {
    const inventory = await db.query(`
      SELECT pv.id as variant_id, pv.size, pv.color, pv.color_hex, pv.stock,
             p.id as product_id, p.name as product_name, p.sku, p.gender, c.name as category_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      ORDER BY pv.stock ASC, p.name ASC
    `, []);
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// PUT /api/admin/inventory/:variantId
router.put('/inventory/:variantId', async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) return res.status(400).json({ error: 'Valid stock number required' });

    await db.run('UPDATE product_variants SET stock = ? WHERE id = ?', [parseInt(stock), req.params.variantId]);
    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// --- CUSTOMER MANAGEMENT ---

// GET /api/admin/customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await db.query(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at,
             COUNT(o.id) as order_count,
             COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role = 'customer'
      GROUP BY u.id, u.name, u.email, u.phone, u.created_at
      ORDER BY u.created_at DESC
    `, []);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin customers' });
  }
});

// --- COUPON MANAGEMENT ---

// GET /api/admin/coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await db.query('SELECT * FROM coupons ORDER BY created_at DESC', []);
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin coupons' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount = 0, expiry_date, usage_limit = 100, is_active = 1 } = req.body;
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, discount type, and value are required' });
    }

    await db.insert(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [code.toUpperCase().trim(), discount_type, parseFloat(discount_value), parseFloat(min_order_amount), expiry_date || null, parseInt(usage_limit), is_active ? 1 : 0]);

    res.status(201).json({ message: 'Coupon created' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create coupon (code may already exist)' });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// --- COLLECTIONS MANAGEMENT ---

// GET /api/admin/collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await db.query('SELECT * FROM collections ORDER BY id DESC', []);
    const fullCollections = await Promise.all(collections.map(async (col) => {
      const products = await db.query(`
        SELECT p.id, p.name, p.sku 
        FROM products p
        JOIN collection_products cp ON p.id = cp.product_id
        WHERE cp.collection_id = ?
      `, [col.id]);
      return { ...col, products };
    }));
    res.json(fullCollections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// POST /api/admin/collections
router.post('/collections', async (req, res) => {
  try {
    const { name, description, cover_image, banner_image, gender, is_active = 1, products = [] } = req.body;
    if (!name || !gender) {
      return res.status(400).json({ error: 'Name and gender are required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const colId = await db.transaction(async (tx) => {
      const stmt = await tx.insert(`
        INSERT INTO collections (name, slug, description, cover_image, banner_image, gender, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [name, slug, description || '', cover_image || '', banner_image || '', gender.toLowerCase(), is_active ? 1 : 0]);

      const cId = stmt.id;
      for (const pId of products) {
        await tx.run('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)', [cId, pId]);
      }
      return cId;
    });

    res.status(201).json({ id: colId, message: 'Collection created successfully' });
  } catch (err) {
    console.error('Create Collection Error:', err);
    res.status(400).json({ error: err.message || 'Failed to create collection' });
  }
});

// PUT /api/admin/collections/:id
router.put('/collections/:id', async (req, res) => {
  try {
    const { name, description, cover_image, banner_image, gender, is_active, products = [] } = req.body;
    const colId = req.params.id;

    await db.transaction(async (tx) => {
      await tx.run(`
        UPDATE collections SET
          name = ?, description = ?, cover_image = ?, banner_image = ?, gender = ?, is_active = ?
        WHERE id = ?
      `, [name, description, cover_image, banner_image, gender.toLowerCase(), is_active ? 1 : 0, colId]);

      await tx.run('DELETE FROM collection_products WHERE collection_id = ?', [colId]);
      for (const pId of products) {
        await tx.run('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)', [colId, pId]);
      }
    });

    res.json({ message: 'Collection updated successfully' });
  } catch (err) {
    console.error('Update Collection Error:', err);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// DELETE /api/admin/collections/:id
router.delete('/collections/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM collections WHERE id = ?', [req.params.id]);
    res.json({ message: 'Collection deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// --- LOOKS (SHOP THE LOOK) MANAGEMENT ---

// GET /api/admin/looks
router.get('/looks', async (req, res) => {
  try {
    const looks = await db.query('SELECT * FROM looks ORDER BY id DESC', []);
    const fullLooks = await Promise.all(looks.map(async (look) => {
      const products = await db.query(`
        SELECT p.id, p.name, p.sku
        FROM products p
        JOIN look_products lp ON p.id = lp.product_id
        WHERE lp.look_id = ?
      `, [look.id]);
      return { ...look, products };
    }));
    res.json(fullLooks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch looks' });
  }
});

// POST /api/admin/looks
router.post('/looks', async (req, res) => {
  try {
    const { name, description, image_url, gender, is_active = 1, products = [] } = req.body;
    if (!name || !image_url || !gender) {
      return res.status(400).json({ error: 'Name, image URL, and gender are required' });
    }

    const lookId = await db.transaction(async (tx) => {
      const stmt = await tx.insert(`
        INSERT INTO looks (name, description, image_url, gender, is_active)
        VALUES (?, ?, ?, ?, ?)
      `, [name, description || '', image_url, gender.toLowerCase(), is_active ? 1 : 0]);

      const lId = stmt.id;
      for (const pId of products) {
        await tx.run('INSERT INTO look_products (look_id, product_id) VALUES (?, ?)', [lId, pId]);
      }
      return lId;
    });

    res.status(201).json({ id: lookId, message: 'Look created successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create look' });
  }
});

// PUT /api/admin/looks/:id
router.put('/looks/:id', async (req, res) => {
  try {
    const { name, description, image_url, gender, is_active, products = [] } = req.body;
    const lookId = req.params.id;

    await db.transaction(async (tx) => {
      await tx.run(`
        UPDATE looks SET
          name = ?, description = ?, image_url = ?, gender = ?, is_active = ?
        WHERE id = ?
      `, [name, description, image_url, gender.toLowerCase(), is_active ? 1 : 0, lookId]);

      await tx.run('DELETE FROM look_products WHERE look_id = ?', [lookId]);
      for (const pId of products) {
        await tx.run('INSERT INTO look_products (look_id, product_id) VALUES (?, ?)', [lookId, pId]);
      }
    });

    res.json({ message: 'Look updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update look' });
  }
});

// DELETE /api/admin/looks/:id
router.delete('/looks/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM looks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Look deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete look' });
  }
});

// --- REVIEWS MODERATION ---

// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await db.query(`
      SELECT r.*, p.name as product_name, p.sku as product_sku
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `, []);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// PUT /api/admin/reviews/:id/moderate
router.put('/reviews/:id/moderate', async (req, res) => {
  try {
    const { is_moderated } = req.body;
    const reviewId = req.params.id;

    await db.run('UPDATE reviews SET is_moderated = ? WHERE id = ?', [is_moderated ? 1 : 0, reviewId]);

    const review = await db.queryOne('SELECT product_id FROM reviews WHERE id = ?', [reviewId]);
    if (review) {
      const stats = await db.queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1', [review.product_id]);
      await db.run('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [
        parseFloat((stats?.avg_rating || 5).toFixed(1)),
        stats?.review_cnt || 0,
        review.product_id
      ]);
    }

    res.json({ message: 'Review moderation updated' });
  } catch (err) {
    console.error('Moderate Review Error:', err);
    res.status(500).json({ error: 'Failed to moderate review' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await db.queryOne('SELECT product_id FROM reviews WHERE id = ?', [reviewId]);

    await db.run('DELETE FROM reviews WHERE id = ?', [reviewId]);

    if (review) {
      const stats = await db.queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1', [review.product_id]);
      await db.run('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [
        parseFloat((stats?.avg_rating || 5).toFixed(1)),
        stats?.review_cnt || 0,
        review.product_id
      ]);
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// --- BULK PRODUCT IMPORT CSV DATA ---

// POST /api/admin/products/bulk-csv
router.post('/products/bulk-csv', async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No product records found' });
    }

    const result = await db.transaction(async (tx) => {
      let importedCount = 0;
      const errors = [];

      for (let index = 0; index < products.length; index++) {
        const prod = products[index];
        const { SKU, name, description, gender, category_id, price, sale_price, size = 'M', color = 'Standard', color_hex = '#111111', stock = 10, image_url } = prod;

        if (!SKU || !name || !gender || !category_id || !price) {
          errors.push(`Row ${index + 1}: Missing required fields (SKU, name, gender, category_id, price).`);
          continue;
        }

        const itemPrice = parseFloat(price);
        const itemSalePrice = sale_price ? parseFloat(sale_price) : null;
        if (itemSalePrice !== null && itemSalePrice > itemPrice) {
          errors.push(`Row ${index + 1}: Sale price (${itemSalePrice}) cannot be greater than MRP (${itemPrice}).`);
          continue;
        }

        const existingSku = await tx.queryOne('SELECT id FROM products WHERE sku = ?', [SKU]);
        if (existingSku) {
          errors.push(`Row ${index + 1}: Product with SKU ${SKU} already exists.`);
          continue;
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4) + '-' + index;

        const prodInsert = await tx.insert(`
          INSERT INTO products (name, slug, description, gender, category_id, price, sale_price, sku, is_new, is_trending, is_featured, is_active, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 1, 99)
        `, [name, slug, description || '', gender.toLowerCase(), parseInt(category_id), itemPrice, itemSalePrice, SKU]);

        const newProductId = prodInsert.id;

        await tx.run(`
          INSERT INTO product_variants (product_id, size, color, color_hex, stock)
          VALUES (?, ?, ?, ?, ?)
        `, [newProductId, size, color, color_hex, parseInt(stock)]);

        const fallbackImg = image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
        await tx.run(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES (?, ?, 1, 1)
        `, [newProductId, fallbackImg]);

        importedCount++;
      }

      return { importedCount, errors };
    });

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

// --- STORE SETTINGS MANAGEMENT ---
router.get('/settings', async (req, res) => {
  try {
    const rows = await db.query('SELECT key, value FROM store_settings', []);
    const settingsMap = {};
    if (rows && rows.length) {
      rows.forEach(r => { settingsMap[r.key] = r.value; });
    }
    res.json(settingsMap);
  } catch (err) {
    console.error('Fetch Admin Settings Error:', err);
    res.status(500).json({ error: 'Failed to fetch store settings' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settingsObj = req.body;
    await db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(settingsObj)) {
        if (value !== undefined) {
          const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
          const existing = await tx.queryOne('SELECT key FROM store_settings WHERE key = ?', [key]);
          if (existing) {
            await tx.run('UPDATE store_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [valStr, key]);
          } else {
            await tx.run('INSERT INTO store_settings (key, value) VALUES (?, ?)', [key, valStr]);
          }
        }
      }
    });
    res.json({ message: 'Store settings updated successfully' });
  } catch (err) {
    console.error('Update Admin Settings Error:', err);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
});

// --- LOOKS (SHOP THE LOOK) MANAGEMENT ---
router.get('/looks', async (req, res) => {
  try {
    const looks = await db.query('SELECT * FROM looks ORDER BY id DESC', []);
    const fullLooks = await Promise.all(looks.map(async (l) => {
      const products = await db.query('SELECT p.id, p.name, p.price, p.sku FROM products p JOIN look_products lp ON p.id = lp.product_id WHERE lp.look_id = ?', [l.id]);
      return { ...l, products };
    }));
    res.json(fullLooks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin looks' });
  }
});

router.post('/looks', async (req, res) => {
  try {
    const { name, description, image_url, gender = 'men', product_ids = [], is_active = 1 } = req.body;
    if (!name || !image_url) return res.status(400).json({ error: 'Name and image URL are required' });

    const lookId = await db.transaction(async (tx) => {
      const resIns = await tx.insert(`
        INSERT INTO looks (name, description, image_url, gender, is_active)
        VALUES (?, ?, ?, ?, ?)
      `, [name, description || '', image_url, gender.toLowerCase(), is_active ? 1 : 0]);

      const lId = resIns.id;
      if (product_ids && Array.isArray(product_ids)) {
        for (const pId of product_ids) {
          await tx.run('INSERT INTO look_products (look_id, product_id) VALUES (?, ?)', [lId, pId]);
        }
      }
      return lId;
    });

    res.status(201).json({ id: lookId, message: 'Look created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create look' });
  }
});

router.delete('/looks/:id', async (req, res) => {
  try {
    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM look_products WHERE look_id = ?', [req.params.id]);
      await tx.run('DELETE FROM looks WHERE id = ?', [req.params.id]);
    });
    res.json({ message: 'Look deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete look' });
  }
});

// --- IMAGE UPLOAD API FOR ADMIN ---
router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const imageUrl = req.file.path || `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;
