/**
 * Concurrency Test Script for Grabb-it Clothing Checkout
 * Tests simultaneous purchases against limited stock under database transactions & row locking.
 */
const db = require('./db');

async function testConcurrency() {
  console.log('\n--- STARTING CHECKOUT CONCURRENCY & STOCK LOCKING TEST ---\n');

  try {
    // 1. Setup a test variant with stock = 1
    const testSku = 'SKU-CONCURRENCY-TEST-' + Date.now();
    const category = await db.queryOne("SELECT id FROM categories LIMIT 1");
    if (!category) {
      throw new Error('No category found in database for concurrency test.');
    }

    const prodRes = await db.insert(`
      INSERT INTO products (name, slug, description, gender, category_id, price, sku, is_active)
      VALUES ('Concurrency Test Shirt', ?, 'Concurrency testing item', 'men', ?, 500, ?, 1)
    `, ['concurrency-test-' + Date.now(), category.id, testSku]);

    const productId = prodRes.id;
    const variantRes = await db.insert(`
      INSERT INTO product_variants (product_id, size, color, color_hex, stock)
      VALUES (?, 'M', 'Black', '#000000', 1)
    `, [productId]);

    const variantId = variantRes.id;
    console.log(`Initialized test product variant ID ${variantId} with stock = 1.`);

    // 2. Simulate 10 simultaneous customer checkout attempts for the same single-stock variant
    const totalConcurrentRequests = 10;
    console.log(`Launching ${totalConcurrentRequests} simultaneous concurrent checkout requests...`);

    const checkoutPromises = [];
    for (let i = 0; i < totalConcurrentRequests; i++) {
      const customerEmail = `buyer_${i}@test.com`;
      const promise = (async () => {
        return await db.transaction(async (tx) => {
          let variantQuery = `
            SELECT pv.id, pv.product_id, pv.size, pv.color, pv.stock, p.name, p.price, p.sale_price 
            FROM product_variants pv 
            JOIN products p ON pv.product_id = p.id 
            WHERE pv.id = ? AND p.is_active = 1
          `;
          if (db.isPg) {
            variantQuery += ' FOR UPDATE';
          }

          const variant = await tx.queryOne(variantQuery, [variantId]);
          if (!variant || variant.stock < 1) {
            throw new Error('INSUFFICIENT_STOCK');
          }

          // Deduct stock
          await tx.run('UPDATE product_variants SET stock = stock - 1 WHERE id = ?', [variantId]);

          // Create order
          const orderRes = await tx.insert(`
            INSERT INTO orders (order_number, customer_name, email, phone, shipping_address, subtotal, total_amount, payment_method, payment_status, order_status)
            VALUES (?, ?, ?, '9999999999', 'Test Address', 500, 500, 'Razorpay Test', 'Paid', 'Confirmed')
          `, ['GRB-CNC-' + Date.now() + '-' + i, `Buyer ${i}`, customerEmail]);

          return orderRes.id;
        });
      })();

      checkoutPromises.push(promise);
    }

    const results = await Promise.allSettled(checkoutPromises);

    let successCount = 0;
    let failureCount = 0;

    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
      }
    });

    console.log(`\nResults: ${successCount} succeeded, ${failureCount} failed.`);

    // 3. Verify final stock state
    const finalVariant = await db.queryOne('SELECT stock FROM product_variants WHERE id = ?', [variantId]);
    console.log(`Final stock in DB: ${finalVariant.stock}`);

    // Assertions
    if (finalVariant.stock < 0) {
      throw new Error(`CRITICAL FAILURE: Negative stock detected! Stock = ${finalVariant.stock}`);
    }

    if (successCount > 1) {
      throw new Error(`CRITICAL FAILURE: Overselling detected! ${successCount} orders succeeded for stock = 1.`);
    }

    if (successCount === 1 && finalVariant.stock === 0) {
      console.log('\n--- CHECKOUT CONCURRENCY & STOCK LOCKING TEST PASSED PERFECTLY! ---\n');
    } else {
      throw new Error(`Unexpected test outcome: successCount=${successCount}, finalStock=${finalVariant.stock}`);
    }

    // Cleanup test data
    await db.run("DELETE FROM orders WHERE customer_name LIKE 'Buyer %'");
    await db.run('DELETE FROM product_variants WHERE id = ?', [variantId]);
    await db.run('DELETE FROM products WHERE id = ?', [productId]);
    process.exit(0);
  } catch (err) {
    console.error('\n!!! CONCURRENCY TEST FAILED !!!');
    console.error(err.message);
    process.exit(1);
  }
}

testConcurrency();
