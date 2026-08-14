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
      this.sqliteTxQueue = Promise.resolve();
    }
  }

  initSqliteDb() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      this.sqliteDb.exec(schemaSql);
      // Inline schema migrations for SQLite development
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

  async query(sql, params = [], executor = null) {
    if (this.isPg) {
      const client = executor || this.pool;
      const res = await client.query(this.formatPgSql(sql), params);
      return res.rows;
    } else {
      return this.sqliteDb.prepare(sql).all(...params);
    }
  }

  async queryOne(sql, params = [], executor = null) {
    if (this.isPg) {
      const client = executor || this.pool;
      const res = await client.query(this.formatPgSql(sql), params);
      return res.rows[0] || null;
    } else {
      return this.sqliteDb.prepare(sql).get(...params) || null;
    }
  }

  async run(sql, params = [], executor = null) {
    if (this.isPg) {
      const client = executor || this.pool;
      const res = await client.query(this.formatPgSql(sql), params);
      return { changes: res.rowCount, lastInsertRowid: null };
    } else {
      const info = this.sqliteDb.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  }

  async insert(sql, params = [], executor = null) {
    if (this.isPg) {
      const client = executor || this.pool;
      let pgSql = sql.trim();
      if (!/RETURNING\s+/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const res = await client.query(this.formatPgSql(pgSql), params);
      const insertedRow = res.rows[0] || {};
      const insertedId = insertedRow.id !== undefined ? insertedRow.id : Object.values(insertedRow)[0];
      return { changes: res.rowCount, lastInsertRowid: insertedId, id: insertedId, row: insertedRow };
    } else {
      const info = this.sqliteDb.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid, id: info.lastInsertRowid };
    }
  }

  async transaction(callback) {
    if (this.isPg) {
      const client = await this.pool.connect();
      const txWrapper = {
        query: (sql, params = []) => this.query(sql, params, client),
        queryOne: (sql, params = []) => this.queryOne(sql, params, client),
        run: (sql, params = []) => this.run(sql, params, client),
        insert: (sql, params = []) => this.insert(sql, params, client),
        client
      };
      try {
        await client.query('BEGIN');
        const result = await callback(txWrapper);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      const txWrapper = {
        query: (sql, params = []) => this.query(sql, params),
        queryOne: (sql, params = []) => this.queryOne(sql, params),
        run: (sql, params = []) => this.run(sql, params),
        insert: (sql, params = []) => this.insert(sql, params),
        client: null
      };

      return new Promise((resolve, reject) => {
        this.sqliteTxQueue = this.sqliteTxQueue.then(async () => {
          try {
            this.sqliteDb.exec('BEGIN IMMEDIATE');
            const result = await callback(txWrapper);
            this.sqliteDb.exec('COMMIT');
            resolve(result);
          } catch (err) {
            try { this.sqliteDb.exec('ROLLBACK'); } catch (rbErr) {}
            reject(err);
          }
        }).catch(reject);
      });
    }
  }
}

const db = new DBAbstraction();
module.exports = db;
