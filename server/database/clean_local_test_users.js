const db = require('./db');

async function cleanLocalTestUsers() {
  console.log('\n========================================================');
  console.log('🧹 STARTING SAFE LOCAL TEST USER CLEANUP');
  console.log('========================================================\n');

  try {
    // 1. Identify test customer accounts to remove (never admin)
    const testUsers = await db.query(`
      SELECT id, name, email, role FROM users 
      WHERE role = 'customer' 
        AND (
          email = 'mv240306@gmail.com' 
          OR email LIKE 'testcust%' 
          OR email LIKE 'sec_cust%' 
          OR email LIKE 'audit_cust%'
          OR email LIKE 'hack_%'
          OR email LIKE 'test_%'
        )
    `, []);

    console.log(`Found ${testUsers.length} test customer account(s) to safely clean.`);

    for (const u of testUsers) {
      console.log(` -> Cleaning test customer: ID=${u.id}, Email=${u.email}`);
      // Safely delete associated user data
      await db.run('DELETE FROM reviews WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM wishlists WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [u.id]);
      await db.run('DELETE FROM carts WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM addresses WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)', [u.id]);
      await db.run('DELETE FROM orders WHERE user_id = ?', [u.id]);
      await db.run('DELETE FROM users WHERE id = ?', [u.id]);
    }

    // Verify remaining users (Admin must be intact!)
    const remainingAdmins = await db.query("SELECT id, email, role FROM users WHERE role = 'admin'", []);
    console.log(`\nRemaining Admin Users (${remainingAdmins.length}):`);
    remainingAdmins.forEach(a => console.log(`  -> ID=${a.id}, Email=${a.email}`));

    if (remainingAdmins.length === 0) {
      throw new Error('FATAL SAFETY ERROR: Admin account was deleted!');
    }

    const remainingCustomers = await db.query("SELECT id, email, role FROM users WHERE role = 'customer'", []);
    console.log(`\nRemaining Customer Users in Local DB: ${remainingCustomers.length}.`);

    console.log('\n========================================================');
    console.log('✅ LOCAL TEST USER CLEANUP PASSED SUCCESSFULLY');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Cleanup Error:', err.message);
    process.exit(1);
  }
}

cleanLocalTestUsers();
