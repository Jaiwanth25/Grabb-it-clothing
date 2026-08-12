const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'grabb_it.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Initialize Database Schema if tables don't exist
function initDb() {
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schemaSql);
    
    // Inline schema migrations
    try {
      db.exec("ALTER TABLE orders ADD COLUMN courier TEXT");
    } catch (err) {}
    try {
      db.exec("ALTER TABLE orders ADD COLUMN tracking_url TEXT");
    } catch (err) {}
  }
}

initDb();

module.exports = db;
