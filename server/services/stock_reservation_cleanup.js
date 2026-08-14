const db = require('../database/db');

/**
 * Idempotent Stock Reservation Cleanup Task
 * Finds expired stock reservations and restores product variant inventory exactly once.
 */
async function cleanupExpiredReservations() {
  try {
    await db.transaction(async (tx) => {
      // Find active reservations that have expired
      const timeComparison = db.isPg ? 'CURRENT_TIMESTAMP' : "datetime('now')";
      const expiredReservations = await tx.query(`
        SELECT sr.id, sr.order_id, sr.variant_id, sr.quantity, sr.status
        FROM stock_reservations sr
        WHERE sr.status = 'ACTIVE' AND datetime(sr.expires_at) < ${timeComparison}
      `);

      for (const res of expiredReservations) {
        // Verify associated order status
        const order = await tx.queryOne('SELECT id, payment_status, order_status FROM orders WHERE id = ?', [res.order_id]);
        
        if (order && (order.payment_status === 'PAYMENT_PENDING' || order.payment_status === 'MANUAL_PAYMENT_PENDING')) {
          // Restore stock
          await tx.run('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [res.quantity, res.variant_id]);
          
          // Cancel order
          await tx.run(`
            UPDATE orders SET 
              order_status = 'Cancelled', 
              payment_status = 'PAYMENT_FAILED', 
              updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `, [res.order_id]);

          await tx.run(`
            INSERT INTO order_status_history (order_id, status, notes)
            VALUES (?, 'Cancelled', 'Order cancelled automatically due to expired checkout reservation.')
          `, [res.order_id]);
        }

        // Mark reservation as EXPIRED idempotently
        await tx.run("UPDATE stock_reservations SET status = 'EXPIRED' WHERE id = ? AND status = 'ACTIVE'", [res.id]);
      }
    });
  } catch (err) {
    console.error('Stock Reservation Cleanup Error:', err.message);
  }
}

/**
 * Starts background scheduler interval
 */
function startReservationCleanupScheduler(intervalMs = 60000) {
  // Run once on startup
  cleanupExpiredReservations();
  // Interval background check
  return setInterval(cleanupExpiredReservations, intervalMs);
}

module.exports = {
  cleanupExpiredReservations,
  startReservationCleanupScheduler
};
