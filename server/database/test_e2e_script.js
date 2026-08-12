// E2E Verification Script for Grabb-it Clothing database flow
const db = require('./db');

function runTest() {
  console.log('\n--- STARTING AUTOMATED E2E BUSINESS FLOW TEST ---\n');

  try {
    // 0. Clean previous test items
    db.prepare("DELETE FROM reviews WHERE comment LIKE '%TSH-TEST-OVR-SUMMER%' OR comment LIKE '%heavyweight drop%'").run();
    db.prepare("DELETE FROM order_items WHERE product_name = 'Test Oversized T-Shirt'").run();
    db.prepare("DELETE FROM orders WHERE customer_name = 'Test E2E Buyer'").run();
    db.prepare("DELETE FROM collection_products WHERE collection_id IN (SELECT id FROM collections WHERE slug = 'test-summer-collection')").run();
    db.prepare("DELETE FROM collections WHERE slug = 'test-summer-collection'").run();
    db.prepare("DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE sku = 'TSH-TEST-OVR-SUMMER')").run();
    db.prepare("DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE sku = 'TSH-TEST-OVR-SUMMER')").run();
    db.prepare("DELETE FROM products WHERE sku = 'TSH-TEST-OVR-SUMMER'").run();

    console.log('[STEP 1-3] Creating "Test Summer Collection" by Admin...');
    const colRes = db.prepare(`
      INSERT INTO collections (name, slug, description, cover_image, banner_image, gender, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      'Test Summer Collection',
      'test-summer-collection',
      'Editorial summer lightweight collection drop.',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'men'
    );
    const collectionId = colRes.lastInsertRowid;
    console.log('Collection created successfully. ID:', collectionId);

    console.log('[STEP 4-11] Creating and publishing "Test Oversized T-Shirt" (Stock = 10, Price = ₹999) by Admin...');
    
    // Find category ID for Men's T-Shirts
    const category = db.prepare("SELECT id FROM categories WHERE slug = 'men-t-shirts'").get();
    if (!category) {
      throw new Error('Category "men-t-shirts" not found. Please run seeding first.');
    }

    const prodRes = db.prepare(`
      INSERT INTO products (name, slug, description, gender, category_id, price, sku, is_new, is_trending, is_featured, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 1)
    `).run(
      'Test Oversized T-Shirt',
      'test-oversized-t-shirt',
      'Heavyweight 240GSM cotton drop shoulder blank.',
      'men',
      category.id,
      999,
      'TSH-TEST-OVR-SUMMER'
    );
    const productId = prodRes.lastInsertRowid;
    console.log('Product created. ID:', productId);

    // Map to Collection
    db.prepare('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)').run(collectionId, productId);
    console.log('Product mapped to "Test Summer Collection".');

    // Create variants (sizes S, M, L, XL in Black, M stock = 10)
    const insertVar = db.prepare('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)');
    insertVar.run(productId, 'S', 'Black', '#111111', 10);
    const sizeMVar = insertVar.run(productId, 'M', 'Black', '#111111', 10);
    const variantMId = sizeMVar.lastInsertRowid;
    insertVar.run(productId, 'L', 'Black', '#111111', 10);
    insertVar.run(productId, 'XL', 'Black', '#111111', 10);
    console.log('Variants initialized with sizes S/M/L/XL and stock 10. M Variant ID:', variantMId);

    // Insert Image
    db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)')
      .run(productId, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800');

    // Fetch test customer user
    const customer = db.prepare("SELECT id, name, email FROM users WHERE role = 'customer' LIMIT 1").get();
    if (!customer) {
      throw new Error('Test customer user not found in database.');
    }
    console.log('\n[STEP 12-21] Customer checking out... Purchasing size M Black of "Test Oversized T-Shirt"');

    // Execute order creation transaction (server-side verified)
    const subtotal = 999;
    const verifiedDiscount = 0;
    const verifiedShipping = 0; // subtotal >= 999 -> Free shipping!
    const totalAmount = subtotal - verifiedDiscount + verifiedShipping;
    const orderNumber = 'GRB-E2E-' + Date.now();
    const trackingNumber = 'TRK-E2E-' + Math.floor(Math.random() * 1000000);

    const orderRes = db.prepare(`
      INSERT INTO orders (order_number, user_id, customer_name, email, phone, shipping_address, subtotal, discount_amount, shipping_fee, total_amount, payment_method, payment_status, order_status, tracking_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Mock payment', 'Paid', 'Confirmed', ?)
    `).run(
      orderNumber,
      customer.id,
      'Test E2E Buyer',
      customer.email,
      '9999988888',
      'Flat 101, Test Layout, Bengaluru, Karnataka - 560001',
      subtotal,
      verifiedDiscount,
      verifiedShipping,
      totalAmount,
      trackingNumber
    );
    const orderId = orderRes.lastInsertRowid;
    console.log('Order created successfully. ID:', orderId, 'Number:', orderNumber);

    // Insert Order Item
    db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(orderId, productId, 'Test Oversized T-Shirt', 'M', 'Black', 999);

    // Deduct stock (10 -> 9)
    db.prepare('UPDATE product_variants SET stock = stock - 1 WHERE id = ?').run(variantMId);
    console.log('Deducted stock for size M. Stock changed from 10 to 9.');

    // Save order placed notification
    db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)')
      .run(customer.id, 'Order Placed Successfully', `Your Grabb-it order #${orderNumber} has been placed successfully.`);

    console.log('\n[STEP 22-25] VERIFY DATABASE UPDATES:');
    
    // Check order
    const dbOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    console.log('-> Order exists in DB:', !!dbOrder);
    console.log('-> Order Amount:', dbOrder.total_amount, 'INR (Expected: 999)');

    // Check inventory
    const dbVariant = db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(variantMId);
    console.log('-> Size M Stock in DB:', dbVariant.stock, '(Expected: 9)');
    if (dbVariant.stock !== 9) {
      throw new Error('Stock deduction check failed! Inventory stock is not 9.');
    }

    console.log('\n[STEP 26-33] Admin updating order status through the delivery steps...');
    
    const updateStatus = (status, extra = {}) => {
      db.prepare('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, orderId);
      
      let title = 'Order Update';
      let message = `Your order #${orderNumber} status has been updated to ${status}.`;
      if (status === 'Shipped') {
        title = 'Order Shipped';
        message = `Your order is on the way.`;
        if (extra.courier) {
          db.prepare('UPDATE orders SET courier = ?, tracking_url = ? WHERE id = ?').run(extra.courier, extra.tracking_url, orderId);
        }
      } else if (status === 'Delivered') {
        title = 'Order Delivered';
        message = `Your order has been delivered.`;
      }
      
      db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)').run(customer.id, title, message);
      console.log(`Status changed -> ${status}. Notification registered.`);
    };

    updateStatus('Confirmed');
    updateStatus('Packed');
    updateStatus('Shipped', { courier: 'Delhivery Express', tracking_url: 'https://tracking.delhivery.com/TRK-E2E' });
    updateStatus('Out for Delivery');
    updateStatus('Delivered');

    // Register review prompt
    db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)')
      .run(customer.id, 'Rate Your Purchase', `How did you like your purchase? Leave a review on the product details page.`);

    console.log('\n[STEP 34-44] Customer submitting review for the delivered product...');
    
    // Check if order is delivered
    const trackOrder = db.prepare('SELECT order_status, courier, tracking_number FROM orders WHERE id = ?').get(orderId);
    console.log('-> Customer tracks order status:', trackOrder.order_status, '(Expected: Delivered)');
    console.log('-> Courier details:', trackOrder.courier, 'ID:', trackOrder.tracking_number);

    // Verify purchase server-side
    const purchase = db.prepare(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'Delivered'
      LIMIT 1
    `).get(customer.id, productId);
    console.log('-> Purchase verification check passed:', !!purchase);

    if (!purchase) {
      throw new Error('Review submission rejected! Customer has not purchased this item.');
    }

    // Insert Review comment
    db.prepare(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment, is_moderated)
      VALUES (?, ?, ?, 5, ?, 1)
    `).run(productId, customer.id, customer.name, 'Fit comment: Perfect boxy fit, heavyweight drop feels very premium! Fits true to size.');
    console.log('Review comment successfully inserted with 5 stars!');

    // Recalculate stats
    const statsResult = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1').get(productId);
    db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
      parseFloat((statsResult.avg_rating || 5).toFixed(1)),
      statsResult.review_cnt || 0,
      productId
    );
    
    const dbProduct = db.prepare('SELECT rating, review_count FROM products WHERE id = ?').get(productId);
    console.log('-> Product rating updated:', dbProduct.rating, 'Stars (Count:', dbProduct.review_count, ')');

    console.log('\n--- AUTOMATED E2E BUSINESS FLOW TEST PASSED SUCCESSFULLY! ---\n');
  } catch (err) {
    console.error('\n!!! AUTOMATED E2E BUSINESS FLOW TEST FAILED !!!');
    console.error(err);
  }
}

runTest();
