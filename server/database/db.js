const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let Database;
function getSqliteClass() {
  if (!Database) {
    try {
      Database = require('better-sqlite3');
    } catch (e) {
      return null;
    }
  }
  return Database;
}

// Ensure environment variables are loaded immediately
try {
  const dotenv = require('dotenv');
  const envLocalPath = path.resolve(__dirname, '../../.env.local');
  const serverEnvPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
  if (fs.existsSync(serverEnvPath)) {
    dotenv.config({ path: serverEnvPath });
  }
} catch (e) {
  // Ignore if dotenv is not available
}

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

class DBAbstraction {
  constructor() {
    this.isPg = !!databaseUrl;
    if (this.isPg) {
      try {
        this.pool = new Pool({
          connectionString: databaseUrl,
          connectionTimeoutMillis: 10000,
          ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false }
        });
        this.initPgDb();
        this.pool.on('error', (err) => {
          console.warn('PostgreSQL pool error:', err.message);
        });
      } catch (err) {
        console.warn('Failed to initialize PostgreSQL pool:', err.message);
      }
    } else {
      this.ensureSqlite();
    }
  }

  async initPgDb() {
    if (!this.isPg || !this.pool) return;
    try {
      const schemaPath = path.join(__dirname, 'schema_pg.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await this.pool.query(schemaSql);
        console.log('PostgreSQL production schema initialized successfully.');
      }
    } catch (err) {
      console.warn('PostgreSQL schema initialization notice:', err.message);
    }
  }

  ensureSqlite() {
    if (!this.sqliteDb) {
      const SqliteClass = getSqliteClass();
      if (!SqliteClass) {
        return;
      }
      const dbPath = path.join(__dirname, 'grabb_it.db');
      this.sqliteDb = new SqliteClass(dbPath);
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
      try { this.sqliteDb.exec("CREATE TABLE IF NOT EXISTS store_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE products ADD COLUMN is_hot INTEGER DEFAULT 0"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE products ADD COLUMN is_bestseller INTEGER DEFAULT 0"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE products ADD COLUMN is_sale INTEGER DEFAULT 0"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE products ADD COLUMN is_limited INTEGER DEFAULT 0"); } catch(err) {}
      try { this.sqliteDb.exec("ALTER TABLE products ADD COLUMN custom_badge_text TEXT"); } catch(err) {}
      try { this.sqliteDb.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin ON users(role) WHERE role = 'admin'"); } catch(err) {}
      try {
        this.sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS styles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            search_query TEXT NOT NULL,
            image_url TEXT NOT NULL,
            gender TEXT DEFAULT 'men',
            display_order INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (err) {}
      try {
        this.sqliteDb.exec(`
          CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS contact_inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            order_id TEXT,
            subject TEXT,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
      } catch (err) {}
    }
  }

  // Convert ? to $1, $2 for Postgres
  formatPgSql(sql) {
    let i = 1;
    return sql.replace(/\?/g, () => `$${i++}`);
  }

  async query(sql, params = [], executor = null) {
    if (this.isPg) {
      try {
        const client = executor || this.pool;
        const res = await client.query(this.formatPgSql(sql), params);
        return res.rows;
      } catch (err) {
        console.error('PostgreSQL query error:', err.message, 'SQL:', sql);
        throw err;
      }
    } else {
      this.ensureSqlite();
      return this.sqliteDb.prepare(sql).all(...params);
    }
  }

  async queryOne(sql, params = [], executor = null) {
    if (this.isPg) {
      try {
        const client = executor || this.pool;
        const res = await client.query(this.formatPgSql(sql), params);
        return res.rows[0] || null;
      } catch (err) {
        console.error('PostgreSQL queryOne error:', err.message, 'SQL:', sql);
        throw err;
      }
    } else {
      this.ensureSqlite();
      return this.sqliteDb.prepare(sql).get(...params) || null;
    }
  }

  async run(sql, params = [], executor = null) {
    if (this.isPg) {
      try {
        const client = executor || this.pool;
        const res = await client.query(this.formatPgSql(sql), params);
        return { changes: res.rowCount, lastInsertRowid: null };
      } catch (err) {
        console.error('PostgreSQL run error:', err.message, 'SQL:', sql);
        throw err;
      }
    } else {
      this.ensureSqlite();
      const info = this.sqliteDb.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  }

  async insert(sql, params = [], executor = null) {
    if (this.isPg) {
      try {
        const client = executor || this.pool;
        let pgSql = sql.trim();
        if (!/RETURNING\s+/i.test(pgSql)) {
          pgSql += ' RETURNING id';
        }
        const res = await client.query(this.formatPgSql(pgSql), params);
        const insertedRow = res.rows[0] || {};
        const insertedId = insertedRow.id !== undefined ? insertedRow.id : Object.values(insertedRow)[0];
        return { changes: res.rowCount, lastInsertRowid: insertedId, id: insertedId, row: insertedRow };
      } catch (err) {
        console.error('PostgreSQL insert error:', err.message, 'SQL:', sql);
        throw err;
      }
    } else {
      this.ensureSqlite();
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
    }

    this.ensureSqlite();
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

const db = new DBAbstraction();
module.exports = db;
