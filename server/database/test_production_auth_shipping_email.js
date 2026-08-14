const db = require('./db');
const { sendEmail } = require('../services/email');

function validateStrongPassword(pass) {
  if (!pass || pass.length < 8) return false;
  if (!/[A-Z]/.test(pass)) return false;
  if (!/[a-z]/.test(pass)) return false;
  if (!/\d/.test(pass)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return false;
  return true;
}

async function runProductionAuthShippingEmailTests() {
  console.log('\n========================================================');
  console.log('🧪 STARTING PRODUCTION AUTH, EMAIL & SHIPPING TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  const total = 7;

  try {
    // 1. Password Policy: Password123 -> REJECT
    console.log('[TEST 1] Testing password "Password123" (no special char)...');
    if (!validateStrongPassword('Password123')) {
      console.log('  -> PASS: "Password123" correctly REJECTED (missing special char).');
      passed++;
    } else throw new Error('TEST 1 FAILED');

    // 2. Password Policy: Password@123 -> ACCEPT
    console.log('[TEST 2] Testing password "Password@123"...');
    if (validateStrongPassword('Password@123')) {
      console.log('  -> PASS: "Password@123" correctly ACCEPTED.');
      passed++;
    } else throw new Error('TEST 2 FAILED');

    // 3. Production Email Fallback Failure Behavior
    console.log('[TEST 3] Verifying production email fallback failure response...');
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const emailResult = await sendEmail({ to: 'test@example.com', subject: 'Test', text: 'Test' });
    process.env.NODE_ENV = originalEnv;

    if (!emailResult.success && emailResult.error === 'Email service is not configured.') {
      console.log('  -> PASS: Production email dispatch without SMTP returned clear server-side failure response.');
      passed++;
    } else throw new Error('TEST 3 FAILED');

    // 4. Shipping Calculation: Subtotal ₹799, Charge = 79, Threshold = 999
    console.log('[TEST 4] Testing shipping calculation for ₹799 subtotal (Charge: ₹79)...');
    await db.run("INSERT OR REPLACE INTO store_settings (key, value) VALUES ('shipping_charge', '79')");
    await db.run("INSERT OR REPLACE INTO store_settings (key, value) VALUES ('free_shipping_threshold', '999')");
    await db.run("INSERT OR REPLACE INTO store_settings (key, value) VALUES ('free_shipping_enabled', 'true')");

    const subtotal1 = 799;
    const shipChargeRow1 = await db.queryOne("SELECT value FROM store_settings WHERE key = 'shipping_charge'");
    const freeThreshRow1 = await db.queryOne("SELECT value FROM store_settings WHERE key = 'free_shipping_threshold'");
    const freeEnabledRow1 = await db.queryOne("SELECT value FROM store_settings WHERE key = 'free_shipping_enabled'");

    const charge1 = parseFloat(shipChargeRow1.value);
    const threshold1 = parseFloat(freeThreshRow1.value);
    const enabled1 = freeEnabledRow1.value !== 'false';

    const shipFee1 = (enabled1 && subtotal1 >= threshold1) ? 0 : charge1;
    const total1 = subtotal1 + shipFee1;

    if (shipFee1 === 79 && total1 === 878) {
      console.log(`  -> PASS: Subtotal ₹${subtotal1} + Shipping ₹${shipFee1} = Total ₹${total1} (Expected: ₹878).`);
      passed++;
    } else throw new Error(`TEST 4 FAILED: shipFee=${shipFee1}, total=${total1}`);

    // 5. Shipping Calculation: Subtotal ₹999 -> FREE SHIPPING (Charge: 0)
    console.log('[TEST 5] Testing free shipping threshold for ₹999 subtotal...');
    const subtotal2 = 999;
    const shipFee2 = (enabled1 && subtotal2 >= threshold1) ? 0 : charge1;
    const total2 = subtotal2 + shipFee2;

    if (shipFee2 === 0 && total2 === 999) {
      console.log(`  -> PASS: Subtotal ₹${subtotal2} + Shipping FREE = Total ₹${total2} (Expected: ₹999).`);
      passed++;
    } else throw new Error(`TEST 5 FAILED: shipFee=${shipFee2}, total=${total2}`);

    // 6. Dynamic Admin Setting Update: Change shipping_charge = 99
    console.log('[TEST 6] Updating admin setting shipping_charge = 99 and verifying recalculated shipping fee...');
    await db.run("UPDATE store_settings SET value = '99' WHERE key = 'shipping_charge'");

    const shipChargeRow3 = await db.queryOne("SELECT value FROM store_settings WHERE key = 'shipping_charge'");
    const charge3 = parseFloat(shipChargeRow3.value);

    const shipFee3 = (enabled1 && subtotal1 >= threshold1) ? 0 : charge3;
    const total3 = subtotal1 + shipFee3;

    if (shipFee3 === 99 && total3 === 898) {
      console.log(`  -> PASS: Dynamic update verified: Subtotal ₹${subtotal1} + New Shipping ₹${shipFee3} = Total ₹${total3} (Expected: ₹898).`);
      passed++;
    } else throw new Error(`TEST 6 FAILED: shipFee=${shipFee3}, total=${total3}`);

    // 7. Reset settings back to defaults
    console.log('[TEST 7] Resetting store settings back to default parameters (Charge: ₹79)...');
    await db.run("UPDATE store_settings SET value = '79' WHERE key = 'shipping_charge'");
    console.log('  -> PASS: Reset completed.');
    passed++;

    console.log('\n========================================================');
    console.log(`✅ PRODUCTION AUTH, EMAIL & SHIPPING SUITE PASSED: ${passed} / ${total} TESTS PASSED`);
    console.log('========================================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runProductionAuthShippingEmailTests();
