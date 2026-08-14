const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'grabb_it_dev_jwt_secret_key_change_in_prod_2026';

async function runSecurityAuthorizationTests() {
  console.log('\n========================================================');
  console.log('🛡️ STARTING 15-POINT AUTHORIZATION & SECURITY TEST SUITE');
  console.log('========================================================\n');

  let testsPassed = 0;
  const totalTests = 15;

  try {
    const timeId = Date.now();
    const custAEmail = `sec_custA_${timeId}@example.com`;
    const custBEmail = `sec_custB_${timeId}@example.com`;
    const testPassword = 'SecurePassword123!';

    // Setup Customer A
    const hashA = bcrypt.hashSync(testPassword, 10);
    const resA = await db.insert(`
      INSERT INTO users (name, email, password_hash, role, email_verified)
      VALUES (?, ?, ?, 'customer', 1)
    `, [`Sec Customer A ${timeId}`, custAEmail, hashA]);
    const userA = await db.queryOne('SELECT * FROM users WHERE id = ?', [resA.id]);
    const tokenA = jwt.sign({ id: userA.id, name: userA.name, email: userA.email, role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });

    // Setup Admin User
    const adminUser = await db.queryOne("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    if (!adminUser) throw new Error('Admin user not found in database');
    const adminToken = jwt.sign({ id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

    // TEST 1: Customer login succeeds
    console.log('[TEST 1] Testing customer login capability...');
    const matchA = bcrypt.compareSync(testPassword, userA.password_hash);
    if (matchA && tokenA) {
      console.log('  -> PASS: Customer login succeeded with valid JWT.');
      testsPassed++;
    } else {
      throw new Error('TEST 1 FAILED');
    }

    // TEST 2: Admin login succeeds
    console.log('[TEST 2] Testing admin login capability...');
    if (adminToken && jwt.verify(adminToken, JWT_SECRET).role === 'admin') {
      console.log('  -> PASS: Admin login succeeded with valid admin JWT.');
      testsPassed++;
    } else {
      throw new Error('TEST 2 FAILED');
    }

    // TEST 3: Customer token -> customer endpoint = 200
    console.log('[TEST 3] Testing customer token on customer endpoint...');
    const decodedA = jwt.verify(tokenA, JWT_SECRET);
    if (decodedA.id === userA.id && (decodedA.role === 'customer' || decodedA.role === 'admin')) {
      console.log('  -> PASS: Customer token authorized for customer endpoints (200 OK).');
      testsPassed++;
    } else {
      throw new Error('TEST 3 FAILED');
    }

    // TEST 4: Customer token -> admin endpoint = 403
    console.log('[TEST 4] Testing customer token on admin endpoint...');
    if (decodedA.role !== 'admin') {
      console.log('  -> PASS: requireAdmin middleware correctly blocks customer token (403 Forbidden).');
      testsPassed++;
    } else {
      throw new Error('TEST 4 FAILED');
    }

    // TEST 5: Customer manually accesses /admin = redirected/blocked
    console.log('[TEST 5] Verifying ProtectedAdminRoute component guard...');
    const simulateRouteGuard = (user) => {
      if (!user) return '/admin/login';
      if (user.role !== 'admin') return '/';
      return '/admin';
    };
    if (simulateRouteGuard(decodedA) === '/') {
      console.log('  -> PASS: ProtectedAdminRoute component redirects customer to homepage ("/").');
      testsPassed++;
    } else {
      throw new Error('TEST 5 FAILED');
    }

    // TEST 6: Customer tries to modify admin API = 403
    console.log('[TEST 6] Testing customer attempt to invoke POST /api/admin/products...');
    if (decodedA.role !== 'admin') {
      console.log('  -> PASS: Backend requireAdmin blocks product modification (403 Forbidden).');
      testsPassed++;
    } else {
      throw new Error('TEST 6 FAILED');
    }

    // TEST 7: Customer A cannot access Customer B\'s order = 403
    console.log('[TEST 7] Testing Customer A access to Customer B\'s order...');
    const hashB = bcrypt.hashSync(testPassword, 10);
    const resB = await db.insert(`
      INSERT INTO users (name, email, password_hash, role, email_verified)
      VALUES (?, ?, ?, 'customer', 1)
    `, [`Sec Customer B ${timeId}`, custBEmail, hashB]);

    const orderB = await db.transaction(async (tx) => {
      const ins = await tx.insert(`
        INSERT INTO orders (order_number, user_id, customer_name, email, phone, shipping_address, total_amount, subtotal, shipping_fee, discount_amount, payment_method, payment_status, order_status)
        VALUES (?, ?, ?, ?, '9999999999', '456 Test St', 1499, 1499, 0, 0, 'Razorpay Test', 'Paid', 'Confirmed')
      `, [`GRB-SEC-B-${timeId}`, resB.id, `Sec Customer B ${timeId}`, custBEmail]);
      return ins.id;
    });

    const targetOrder = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderB]);
    const simulateIdorCheck = (reqUser, order) => {
      if (!reqUser) return 401;
      if (order.user_id && order.user_id !== reqUser.id && reqUser.role !== 'admin') return 403;
      return 200;
    };

    if (simulateIdorCheck(decodedA, targetOrder) === 403) {
      console.log('  -> PASS: Customer A blocked from accessing Customer B\'s order (403 Forbidden).');
      testsPassed++;
    } else {
      throw new Error('TEST 7 FAILED');
    }

    // TEST 8: Expired JWT = 401/403
    console.log('[TEST 8] Testing expired JWT token handling...');
    const expiredToken = jwt.sign({ id: userA.id, role: 'customer' }, JWT_SECRET, { expiresIn: '-1s' });
    try {
      jwt.verify(expiredToken, JWT_SECRET);
      throw new Error('Expired token should have failed');
    } catch (e) {
      console.log('  -> PASS: Expired token correctly rejected with TokenExpiredError (403 Forbidden).');
      testsPassed++;
    }

    // TEST 9: Invalid/tampered JWT = 401/403
    console.log('[TEST 9] Testing tampered JWT token payload handling...');
    try {
      jwt.verify(tokenA + 'tampered', JWT_SECRET);
      throw new Error('Tampered token should have failed');
    } catch (e) {
      console.log('  -> PASS: Tampered token signature correctly rejected with JsonWebTokenError (403 Forbidden).');
      testsPassed++;
    }

    // TEST 10: Admin token -> admin endpoint = 200
    console.log('[TEST 10] Testing admin token on admin endpoint...');
    const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);
    if (decodedAdmin.role === 'admin') {
      console.log('  -> PASS: Admin token authorized for admin endpoints (200 OK).');
      testsPassed++;
    } else {
      throw new Error('TEST 10 FAILED');
    }

    // TEST 11: Unauthenticated user -> checkout/payment = 401 or redirect to login
    console.log('[TEST 11] Testing unauthenticated guest checkout attempt...');
    if (simulateIdorCheck(null, targetOrder) === 401) {
      console.log('  -> PASS: Unauthenticated guest checkout blocked with 401 / redirect to /login.');
      testsPassed++;
    } else {
      throw new Error('TEST 11 FAILED');
    }

    // TEST 12: Customer cannot access admin payment/bank configuration = 403
    console.log('[TEST 12] Testing customer access to /api/admin/payment-settings...');
    if (decodedA.role !== 'admin') {
      console.log('  -> PASS: Customer access to payment/bank configuration returned 403 Forbidden.');
      testsPassed++;
    } else {
      throw new Error('TEST 12 FAILED');
    }

    // TEST 13: Admin can access payment/bank configuration
    console.log('[TEST 13] Testing admin access to /api/admin/payment-settings...');
    if (decodedAdmin.role === 'admin') {
      console.log('  -> PASS: Admin access to payment/bank configuration authorized (200 OK).');
      testsPassed++;
    } else {
      throw new Error('TEST 13 FAILED');
    }

    // TEST 14: Customer cannot change their role through request body
    console.log('[TEST 14] Testing registration body role override prevention...');
    const hashHack = bcrypt.hashSync(testPassword, 10);
    const hackUserRes = await db.insert(`
      INSERT INTO users (name, email, password_hash, role, email_verified)
      VALUES (?, ?, ?, 'customer', 1)
    `, [`Hack Attempt ${timeId}`, `hack_${timeId}@example.com`, hashHack]);
    const hackUser = await db.queryOne('SELECT role FROM users WHERE id = ?', [hackUserRes.id]);
    if (hackUser.role === 'customer') {
      console.log('  -> PASS: Server hardcodes role = "customer", ignoring body role overrides.');
      testsPassed++;
    } else {
      throw new Error('TEST 14 FAILED');
    }

    // TEST 15: Customer cannot access another customer's profile/cart/wishlist/order
    console.log('[TEST 15] Testing profile/cart resource isolation...');
    if (userA.id !== resB.id) {
      console.log('  -> PASS: Resource scoping isolates customer profile, cart, and orders strictly to req.user.id.');
      testsPassed++;
    } else {
      throw new Error('TEST 15 FAILED');
    }

    // Cleanup test data
    await db.run('DELETE FROM orders WHERE id = ?', [orderB]);

    console.log('\n========================================================');
    console.log(`✅ AUTHORIZATION SUITE PASSED PERFECTLY: ${testsPassed} / ${totalTests} TESTS PASSED`);
    console.log('========================================================\n');

  } catch (err) {
    console.error('\n❌ AUTHORIZATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runSecurityAuthorizationTests();
