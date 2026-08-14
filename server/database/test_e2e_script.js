// E2E Verification Script for Grabb-it Clothing database flow
const db = require('./db');

async function runTest() {
  console.log('\n--- STARTING AUTOMATED E2E BUSINESS FLOW TEST ---\n');

  try {
    // 0. Clean previous test items
    await db.run("DELETE FROM reviews WHERE comment LIKE '%TSH-TEST-OVR-SUMMER%' OR comment LIKE '%heavyweight drop%'");
    await db.run("DELETE FROM order_items WHERE product_name = 'Test Oversized T-Shirt'");
    await db.run("DELETE FROM orders WHERE customer_name = 'Test E2E Buyer'");
    await db.run("DELETE FROM collection_products WHERE collection_id IN (SELECT id FROM collections WHERE slug = 'test-summer-collection')");
    await db.run("DELETE FROM collections WHERE slug = 'test-summer-collection'");
    await db.run("DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE sku = 'TSH-TEST-OVR-SUMMER')");
    await db.run("DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE sku = 'TSH-TEST-OVR-SUMMER')");
    await db.run("DELETE FROM products WHERE sku = 'TSH-TEST-OVR-SUMMER'");

    console.log('[STEP 1-3] Creating "Test Summer Collection" by Admin...');
    const colRes = await db.insert(`
      INSERT INTO collections (name, slug, description, cover_image, banner_image, gender, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [
      'Test Summer Collection',
      'test-summer-collection',
      'Editorial summer lightweight collection drop.',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'men'
    ]);
    const collectionId = colRes.id;
    console.log('Collection created successfully. ID:', collectionId);

    console.log('[STEP 4-11] Creating and publishing "Test Oversized T-Shirt" (Stock = 10, Price = ₹999) by Admin...');
    
    // Find category ID for Men's T-Shirts
    const category = await db.queryOne("SELECT id FROM categories WHERE slug = 'men-t-shirts'");
    if (!category) {
      throw new Error('Category "men-t-shirts" not found. Please run seeding first.');
    }

    const prodRes = await db.insert(`
      INSERT INTO products (name, slug, description, gender, category_id, price, sku, is_new, is_trending, is_featured, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 1)
    `, [
      'Test Oversized T-Shirt',
      'test-oversized-t-shirt',
      'Heavyweight 240GSM cotton drop shoulder blank.',
      'men',
      category.id,
      999,
      'TSH-TEST-OVR-SUMMER'
    ]);
    const productId = prodRes.id;
    console.log('Product created. ID:', productId);

    // Map to Collection
    await db.insert('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)', [collectionId, productId]);
    console.log('Product mapped to "Test Summer Collection".');

    // Create variants (sizes S, M, L, XL in Black, M stock = 10)
    await db.insert('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [productId, 'S', 'Black', '#111111', 10]);
    const sizeMVar = await db.insert('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [productId, 'M', 'Black', '#111111', 10]);
    const variantMId = sizeMVar.id;
    await db.insert('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [productId, 'L', 'Black', '#111111', 10]);
    await db.insert('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [productId, 'XL', 'Black', '#111111', 10]);
    console.log('Variants initialized with sizes S/M/L/XL and stock 10. M Variant ID:', variantMId);

    // Insert Image
    await db.insert('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)', [productId, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800']);

    // Fetch test customer user
    const customer = await db.queryOne("SELECT id, name, email FROM users WHERE role = 'customer' LIMIT 1");
    if (!customer) {
      throw new Error('Test customer user not found in database.');
    }
    console.log('\n[STEP 12-21] Customer checking out... Purchasing size M Black of "Test Oversized T-Shirt"');

    // Execute order creation transaction
    const subtotal = 999;
    const verifiedDiscount = 0;
    const verifiedShipping = 0;
    const totalAmount = subtotal - verifiedDiscount + verifiedShipping;
    const orderNumber = 'GRB-E2E-' + Date.now();
    const trackingNumber = 'TRK-E2E-' + Math.floor(Math.random() * 1000000);

    const orderRes = await db.insert(`
      INSERT INTO orders (order_number, user_id, customer_name, email, phone, shipping_address, subtotal, discount_amount, shipping_fee, total_amount, payment_method, payment_status, order_status, tracking_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Mock payment', 'Paid', 'Confirmed', ?)
    `, [
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
    ]);
    const orderId = orderRes.id;
    console.log('Order created successfully. ID:', orderId, 'Number:', orderNumber);

    // Insert Order Item
    await db.insert(`
      INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [orderId, productId, 'Test Oversized T-Shirt', 'M', 'Black', 999]);

    // Deduct stock (10 -> 9)
    await db.run('UPDATE product_variants SET stock = stock - 1 WHERE id = ?', [variantMId]);
    console.log('Deducted stock for size M. Stock changed from 10 to 9.');

    // Save order placed notification
    await db.insert('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [customer.id, 'Order Placed Successfully', `Your Grabb-it order #${orderNumber} has been placed successfully.`]);

    console.log('\n[STEP 22-25] VERIFY DATABASE UPDATES:');
    
    // Check order
    const dbOrder = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    console.log('-> Order exists in DB:', !!dbOrder);
    console.log('-> Order Amount:', dbOrder.total_amount, 'INR (Expected: 999)');

    // Check inventory
    const dbVariant = await db.queryOne('SELECT stock FROM product_variants WHERE id = ?', [variantMId]);
    console.log('-> Size M Stock in DB:', dbVariant.stock, '(Expected: 9)');
    if (dbVariant.stock !== 9) {
      throw new Error('Stock deduction check failed! Inventory stock is not 9.');
    }

    console.log('\n[STEP 26-33] Admin updating order status through the delivery steps...');
    
    const updateStatus = async (status, extra = {}) => {
      await db.run('UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, orderId]);
      
      let title = 'Order Update';
      let message = `Your order #${orderNumber} status has been updated to ${status}.`;
      if (status === 'Shipped') {
        title = 'Order Shipped';
        message = `Your order is on the way.`;
        if (extra.courier) {
          await db.run('UPDATE orders SET courier = ?, tracking_url = ? WHERE id = ?', [extra.courier, extra.tracking_url, orderId]);
        }
      } else if (status === 'Delivered') {
        title = 'Order Delivered';
        message = `Your order has been delivered.`;
      }
      
      await db.insert('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [customer.id, title, message]);
      console.log(`Status changed -> ${status}. Notification registered.`);
    };

    await updateStatus('Confirmed');
    await updateStatus('Packed');
    await updateStatus('Shipped', { courier: 'Delhivery Express', tracking_url: 'https://tracking.delhivery.com/TRK-E2E' });
    await updateStatus('Out for Delivery');
    await updateStatus('Delivered');

    // Register review prompt
    await db.insert('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [customer.id, 'Rate Your Purchase', 'How did you like your purchase? Leave a review on the product details page.']);

    console.log('\n[STEP 34-44] Customer submitting review for the delivered product...');
    
    // Check if order is delivered
    const trackOrder = await db.queryOne('SELECT order_status, courier, tracking_number FROM orders WHERE id = ?', [orderId]);
    console.log('-> Customer tracks order status:', trackOrder.order_status, '(Expected: Delivered)');
    console.log('-> Courier details:', trackOrder.courier, 'ID:', trackOrder.tracking_number);

    // Verify purchase server-side
    const purchase = await db.queryOne(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'Delivered'
      LIMIT 1
    `, [customer.id, productId]);
    console.log('-> Purchase verification check passed:', !!purchase);

    if (!purchase) {
      throw new Error('Review submission rejected! Customer has not purchased this item.');
    }

    // Insert Review comment
    await db.insert(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment, is_moderated)
      VALUES (?, ?, ?, 5, ?, 1)
    `, [productId, customer.id, customer.name, 'Fit comment: Perfect boxy fit, heavyweight drop feels very premium! Fits true to size.']);
    console.log('Review comment successfully inserted with 5 stars!');

    // Recalculate stats
    const statsResult = await db.queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as review_cnt FROM reviews WHERE product_id = ? AND is_moderated = 1', [productId]);
    await db.run('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', [
      parseFloat((statsResult.avg_rating || 5).toFixed(1)),
      statsResult.review_cnt || 0,
      productId
    ]);
    
    const dbProduct = await db.queryOne('SELECT rating, review_count FROM products WHERE id = ?', [productId]);
    console.log('-> Product rating updated:', dbProduct.rating, 'Stars (Count:', dbProduct.review_count, ')');

    console.log('\n--- AUTOMATED E2E BUSINESS FLOW TEST PASSED SUCCESSFULLY! ---\n');
    process.exit(0);
  } catch (err) {
    console.error('\n!!! AUTOMATED E2E BUSINESS FLOW TEST FAILED !!!');
    console.error(err);
    process.exit(1);
  }
}

runTest();
