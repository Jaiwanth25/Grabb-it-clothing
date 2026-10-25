/**
 * GRABB-IT — SQLite to PostgreSQL Migration Tool for Neon
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Pool } = require('pg');

// Ensure env is loaded
const dotenv = require('dotenv');
const envLocalPath = path.resolve(__dirname, '../../.env.local');
const serverEnvPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envLocalPath)) dotenv.config({ path: envLocalPath });
if (fs.existsSync(serverEnvPath)) dotenv.config({ path: serverEnvPath });

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  const sqliteDbPath = path.join(__dirname, 'grabb_it.db');
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`ERROR: SQLite database file not found at ${sqliteDbPath}`);
    process.exit(1);
  }

  console.log('----------------------------------------------------');
  console.log('GRABB-IT Database Migration: SQLite -> Neon PostgreSQL');
  console.log('----------------------------------------------------');

  const sqlite = new Database(sqliteDbPath);
  const pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
  });

  const client = await pgPool.connect();

  try {
    console.log('Connected to Neon PostgreSQL database successfully.');

    // 1. Run schema_pg.sql
    const pgSchemaPath = path.join(__dirname, 'schema_pg.sql');
    const pgSchemaSql = fs.readFileSync(pgSchemaPath, 'utf8');
    console.log('Initializing PostgreSQL schema...');
    await client.query(pgSchemaSql);
    console.log('Schema initialized successfully.');

    // 2. Migrate Tables in Order of Foreign Key Dependencies
    const tables = [
      'users',
      'addresses',
      'categories',
      'products',
      'product_variants',
      'product_images',
      'banners',
      'carts',
      'cart_items',
      'wishlists',
      'coupons',
      'orders',
      'order_items',
      'order_status_history',
      'reviews',
      'collections',
      'collection_products',
      'looks',
      'look_products',
      'notifications',
      'payment_settings',
      'styles',
      'store_settings',
      'stock_reservations',
      'audit_logs'
    ];

    await client.query('BEGIN');

    for (const table of tables) {
      // Check if table exists in SQLite
      const tableExists = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
      if (!tableExists) continue;

      const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`Skipping empty table: ${table}`);
        continue;
      }

      console.log(`Migrating table "${table}" (${rows.length} rows)...`);

      // Clear existing records in PG to avoid conflict
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);

      const keys = Object.keys(rows[0]);
      const colsStr = keys.map(k => `"${k}"`).join(', ');

      for (const row of rows) {
        const values = keys.map(k => row[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${table} (${colsStr}) VALUES (${placeholders})`;
        await client.query(query, values);
      }

      // Reset auto-increment sequence in PostgreSQL safely
      if (keys.includes('id')) {
        try {
          await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`);
        } catch (seqErr) {}
      }

      // Verify row count match
      const pgCountRes = await client.query(`SELECT COUNT(*) FROM ${table}`);
      const pgCount = parseInt(pgCountRes.rows[0].count, 10);
      if (pgCount !== rows.length) {
        throw new Error(`Row count mismatch for ${table}: SQLite has ${rows.length}, PG has ${pgCount}`);
      }
    }

    await client.query('COMMIT');
    console.log('----------------------------------------------------');
    console.log('SUCCESS: All data migrated from SQLite to Neon PostgreSQL!');
    console.log('----------------------------------------------------');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('FATAL Migration Error:', err);
    throw err;
  } finally {
    client.release();
    await pgPool.end();
    sqlite.close();
  }
}

if (require.main === module) {
  migrate().catch(() => process.exit(1));
} else {
  module.exports = migrate;
}
