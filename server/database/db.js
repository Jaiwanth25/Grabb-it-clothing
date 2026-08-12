const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const databaseUrl = process.env.DATABASE_URL;

class DBAbstraction {
  constructor() {
    this.isPg = !!databaseUrl;
    if (this.isPg) {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      const dbPath = path.join(__dirname, 'grabb_it.db');
      this.sqliteDb = new Database(dbPath);
      this.sqliteDb.pragma('foreign_keys = ON');
      this.initSqliteDb();
    }
  }

  initSqliteDb() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      this.sqliteDb.exec(schemaSql);
      // Inline schema migrations
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN courier TEXT"); } catch (err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN tracking_url TEXT"); } catch (err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN email_verify_token TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN email_verify_expires DATETIME"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN reset_token_hash TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN otp_hash TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN otp_expires DATETIME"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN payment_reference TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN payment_proof_url TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN razorpay_signature TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN refund_reference TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN refund_amount REAL"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN refund_reason TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE orders ADD COLUMN refund_at DATETIME"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE reviews ADD COLUMN image_url TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE order_status_history ADD COLUMN changed_by INTEGER"); } catch(err) {}
    }
  }

  // Convert ? to $1, $2 for Postgres
  formatPgSql(sql) {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
  }

  async query(sql, params = []) {
    if (this.isPg) {
      const res = await this.pool.query(this.formatPgSql(sql), params);
      return res.rows;
    } else {
      return this.sqliteDb.prepare(sql).all(...params);
    }
  }

  async queryOne(sql, params = []) {
    if (this.isPg) {
      const res = await this.pool.query(this.formatPgSql(sql), params);
      return res.rows[0];
    } else {
      return this.sqliteDb.prepare(sql).get(...params);
    }
  }

  async run(sql, params = []) {
    if (this.isPg) {
      // For PG we might not get lastInsertRowid exactly as SQLite does unless RETURNING is used, 
      // but we will try to return rowCount at least.
      const res = await this.pool.query(this.formatPgSql(sql), params);
      return { changes: res.rowCount, lastInsertRowid: null }; 
      // Warning: lastInsertRowid won't work in PG without RETURNING, but this is a best-effort wrapper.
    } else {
      const info = this.sqliteDb.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  }

  async transaction(callback) {
    if (this.isPg) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      const tx = this.sqliteDb.transaction(callback);
      return tx();
    }
  }
}

const db = new DBAbstraction();
module.exports = db;
