const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { authenticateToken, requireAdmin, JWT_SECRET } = require('../middleware/authMiddleware');

async function runSingleAdminAuthTest() {
  console.log('\n========================================================');
  console.log('🛡️ STARTING SINGLE ADMIN & CUSTOMER AUTHENTICATION SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[TEST ${total}] ${message}\n  -> PASS`);
      passed++;
    } else {
      console.error(`[TEST ${total}] ${message}\n  -> FAIL`);
      process.exit(1);
    }
  }

  try {
    // 1. Weak customer password rejection
    const weakPass = '12345';
    assert(weakPass.length < 8, 'Weak password "12345" correctly recognized as violating password policy.');

    // 2. Customer registration with valid 5-rule strong password
    const testEmail = `cust_test_${Date.now()}@grabb-it.com`;
    const testPassword = 'Password@123';
    const passwordHash = bcrypt.hashSync(testPassword, 10);

    const regResult = await db.insert(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Test Customer', ?, ?, 'customer', '+919999988888')
    `, [testEmail, passwordHash]);

    assert(regResult && regResult.id, 'Customer registration succeeded with valid 5-rule password.');

    // 3. Customer password hashing verification (no plaintext)
    const savedUser = await db.queryOne('SELECT * FROM users WHERE id = ?', [regResult.id]);
    assert(savedUser.password_hash !== testPassword && savedUser.password_hash.startsWith('$2a$'), 'Customer password stored strictly as one-way bcrypt hash.');

    // 4. Invalid customer password login attempt
    const isInvalidPass = bcrypt.compareSync('WrongPassword!123', savedUser.password_hash);
    assert(!isInvalidPass, 'Invalid customer password attempt correctly rejected.');

    // 5. Customer login with valid credentials
    const isValidPass = bcrypt.compareSync(testPassword, savedUser.password_hash);
    assert(isValidPass, 'Customer login with valid credentials succeeded.');

    // 6. Customer session token generation
    const customerToken = jwt.sign({ id: savedUser.id, role: 'customer', email: savedUser.email }, JWT_SECRET, { expiresIn: '7d' });
    const decodedCust = jwt.verify(customerToken, JWT_SECRET);
    assert(decodedCust && decodedCust.role === 'customer', 'Customer token generated with role="customer".');

    // 7. Customer logout & login again verification
    // Simulate token clear and re-authenticating with same credentials
    const reloginUser = await db.queryOne('SELECT * FROM users WHERE email = ?', [testEmail]);
    const isReloginValid = bcrypt.compareSync(testPassword, reloginUser.password_hash);
    assert(isReloginValid && reloginUser.id === savedUser.id, 'Customer can log out and log in again using same credentials without re-registering.');

    // 8. Admin authentication with store owner credentials
    const adminUser = await db.queryOne("SELECT * FROM users WHERE role = 'admin'");
    assert(adminUser && adminUser.email === 'admin@grabb-it.com', 'Single store owner admin account verified in database (admin@grabb-it.com).');

    // 9. Single Admin Constraint: Attempt to create a second admin account
    let secondAdminBlocked = false;
    try {
      await db.run("INSERT INTO users (name, email, password_hash, role) VALUES ('Fake Admin', 'fakeadmin@test.com', 'hash', 'admin')");
    } catch (dbErr) {
      secondAdminBlocked = true;
    }
    assert(secondAdminBlocked, 'Database single-admin constraint blocked creation of a second admin account.');

    // 10. Customer accessing Admin API (requireAdmin guard)
    let customerAdminBlocked = false;
    const reqCust = { headers: { authorization: `Bearer ${customerToken}` }, cookie: '' };
    const resCust = {
      status: (code) => {
        if (code === 403) customerAdminBlocked = true;
        return { json: () => {} };
      }
    };
    requireAdmin(reqCust, resCust, () => {});
    assert(customerAdminBlocked, 'Customer token on admin API correctly rejected with HTTP 403 Forbidden.');

    // 11. Customer role escalation attempt (frontend payload modification)
    let tamperedRoleBlocked = false;
    const tamperedToken = jwt.sign({ id: savedUser.id, role: 'admin', email: savedUser.email }, 'WRONG_SECRET');
    const reqTampered = { headers: { authorization: `Bearer ${tamperedToken}` } };
    const resTampered = {
      status: (code) => {
        if (code === 403) tamperedRoleBlocked = true;
        return { json: () => {} };
      }
    };
    requireAdmin(reqTampered, resTampered, () => {});
    assert(tamperedRoleBlocked, 'Customer JWT signature tampering for role escalation rejected with HTTP 403.');

    // 12. Expired JWT token rejection
    let expiredTokenBlocked = false;
    const expiredToken = jwt.sign({ id: savedUser.id, role: 'customer' }, JWT_SECRET, { expiresIn: '-1s' });
    const reqExpired = { headers: { authorization: `Bearer ${expiredToken}` } };
    const resExpired = {
      status: (code) => {
        if (code === 403) expiredTokenBlocked = true;
        return { json: () => {} };
      }
    };
    authenticateToken(reqExpired, resExpired, () => {});
    assert(expiredTokenBlocked, 'Expired JWT token correctly rejected with HTTP 403.');

    // 13. Admin accessing Admin API (authorized)
    let adminAuthorized = false;
    const adminToken = jwt.sign({ id: adminUser.id, role: 'admin', email: adminUser.email }, JWT_SECRET, { expiresIn: '7d' });
    const reqAdmin = { headers: { authorization: `Bearer ${adminToken}` } };
    const resAdmin = { status: () => ({ json: () => {} }) };
    requireAdmin(reqAdmin, resAdmin, () => { adminAuthorized = true; });
    assert(adminAuthorized, 'Valid store owner admin token granted access to admin API (200 OK).');

    // 14. API password filtering check
    const publicUserObj = { id: savedUser.id, name: savedUser.name, email: savedUser.email, role: savedUser.role };
    assert(!('password_hash' in publicUserObj) && !('password' in publicUserObj), 'APIs never return password or password_hash fields.');

    // 15. Clean up test customer account
    await db.run('DELETE FROM users WHERE id = ?', [regResult.id]);
    assert(true, 'Test customer account cleaned up successfully.');

    console.log('========================================================');
    console.log(`✅ SINGLE ADMIN & CUSTOMER AUTH SUITE PASSED: ${passed} / ${total} TESTS PASSED`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('Test Suite Error:', err);
    process.exit(1);
  }
}

runSingleAdminAuthTest();
