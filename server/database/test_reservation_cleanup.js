/**
 * Stock Reservation Cleanup Automated Test Script
 * Tests that expired stock reservations restore stock exactly once and cancel unpaid orders idempotently.
 */
const db = require('./db');
const { cleanupExpiredReservations } = require('../services/stock_reservation_cleanup');

async function testReservationCleanup() {
  console.log('\n--- STARTING STOCK RESERVATION CLEANUP TEST ---\n');

  try {
    // 1. Setup a test variant with initial stock = 5
    const category = await db.queryOne('SELECT id FROM categories LIMIT 1');
    const prodRes = await db.insert(`
      INSERT INTO products (name, slug, description, gender, category_id, price, sku, is_active)
      VALUES ('Cleanup Test Product', ?, 'Test Item', 'men', ?, 1000, ?, 1)
    `, ['cleanup-test-' + Date.now(), category.id, 'SKU-CLN-' + Date.now()]);

    const productId = prodRes.id;
    const variantRes = await db.insert(`
      INSERT INTO product_variants (product_id, size, color, color_hex, stock)
      VALUES (?, 'L', 'White', '#FFFFFF', 5)
    `, [productId]);

    const variantId = variantRes.id;
    console.log(`Initialized test variant ID ${variantId} with stock = 5.`);

    // 2. Create an unpaid order and reserve 2 units
    const orderRes = await db.insert(`
      INSERT INTO orders (order_number, customer_name, email, phone, shipping_address, subtotal, total_amount, payment_method, payment_status, order_status)
      VALUES (?, 'Cleanup Buyer', 'cln@test.com', '9999999999', 'Test Address', 2000, 2000, 'Razorpay Test', 'PAYMENT_PENDING', 'Pending')
    `, ['GRB-CLN-' + Date.now()]);

    const orderId = orderRes.id;

    // Deduct stock (5 -> 3)
    await db.run('UPDATE product_variants SET stock = stock - 2 WHERE id = ?', [variantId]);

    // Create an expired reservation
    const pastExpiry = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const resInsert = await db.insert(`
      INSERT INTO stock_reservations (order_id, variant_id, quantity, status, expires_at)
      VALUES (?, ?, 2, 'ACTIVE', ?)
    `, [orderId, variantId, pastExpiry]);

    console.log('Created expired reservation for 2 units.');

    const stockBefore = await db.queryOne('SELECT stock FROM product_variants WHERE id = ?', [variantId]);
    console.log(`Stock before cleanup: ${stockBefore.stock} (Expected: 3)`);

    // 3. Run cleanup service (First Execution)
    console.log('\nRunning cleanup service (Execution 1)...');
    await cleanupExpiredReservations();

    const stockAfterFirst = await db.queryOne('SELECT stock FROM product_variants WHERE id = ?', [variantId]);
    const orderAfterFirst = await db.queryOne('SELECT order_status, payment_status FROM orders WHERE id = ?', [orderId]);
    const resAfterFirst = await db.queryOne('SELECT status FROM stock_reservations WHERE id = ?', [resInsert.id]);

    console.log(`Stock after Execution 1: ${stockAfterFirst.stock} (Expected: 5)`);
    console.log(`Order status after Execution 1: ${orderAfterFirst.order_status} (Expected: Cancelled)`);
    console.log(`Reservation status after Execution 1: ${resAfterFirst.status} (Expected: EXPIRED)`);

    if (stockAfterFirst.stock !== 5 || orderAfterFirst.order_status !== 'Cancelled' || resAfterFirst.status !== 'EXPIRED') {
      throw new Error('FAILED Execution 1 assertions!');
    }

    // 4. Run cleanup service SECOND TIME (Idempotency Check)
    console.log('\nRunning cleanup service SECOND TIME (Execution 2 - Idempotency Check)...');
    await cleanupExpiredReservations();

    const stockAfterSecond = await db.queryOne('SELECT stock FROM product_variants WHERE id = ?', [variantId]);
    console.log(`Stock after Execution 2: ${stockAfterSecond.stock} (Expected: 5, MUST NOT DOUBLE RESTORE)`);

    if (stockAfterSecond.stock !== 5) {
      throw new Error(`CRITICAL FAILURE: Stock double-restored! Stock is ${stockAfterSecond.stock} instead of 5.`);
    }

    console.log('\n--- STOCK RESERVATION CLEANUP TEST PASSED PERFECTLY! ---\n');

    // Cleanup
    await db.run('DELETE FROM stock_reservations WHERE id = ?', [resInsert.id]);
    await db.run('DELETE FROM orders WHERE id = ?', [orderId]);
    await db.run('DELETE FROM product_variants WHERE id = ?', [variantId]);
    await db.run('DELETE FROM products WHERE id = ?', [productId]);
    process.exit(0);

  } catch (err) {
    console.error('\n!!! STOCK RESERVATION CLEANUP TEST FAILED !!!');
    console.error(err.message);
    process.exit(1);
  }
}

testReservationCleanup();
