# GRABB-IT Clothing — Production PostgreSQL & Database Setup Guide

This document details the PostgreSQL database architecture, setup instructions, table schemas, and data migration procedures from SQLite to production-grade PostgreSQL.

---

## 1. Architectural Overview

* **Development Engine**: SQLite (`better-sqlite3`) — stored at `server/database/grabb_it.db`. Zero configuration needed for local development.
* **Production Engine**: PostgreSQL — connected via environment variable `DATABASE_URL`. Compatible with managed PostgreSQL services on **Render**, **Neon**, **Supabase**, or **AWS RDS**.

---

## 2. Table Schemas & Relationships

The production database schema is defined in `server/database/schema_pg.sql`:

1. `users`: Customer & Admin accounts with bcrypt password hashes, OTP reset tokens, and email verification status.
2. `sessions`: Refresh tokens, expiry timestamps, and revocation state.
3. `addresses`: User shipping destinations linked to `users(id)`.
4. `categories`: Product categories scoped strictly to `gender` ('men' vs 'women').
5. `products`: Main apparel products with price, sale_price, SKU, ratings, and flags.
6. `product_variants`: Size ('S', 'M', 'L', 'XL', 'XXL'), color, hex code, and inventory stock count.
7. `product_images`: Product photo URLs with primary flag and display ordering.
8. `banners`: Homepage slider hero banners with target links and scheduling.
9. `carts` & `cart_items`: User and guest session cart persistence.
10. `wishlists`: Customer saved item favorites.
11. `coupons`: Percentage and fixed discount codes with minimum order limits and usage tracking.
12. `orders` & `order_items`: Full purchase details, line item snapshots, shipping tracking numbers, and payment status tracking.
13. `order_status_history`: Historical timeline log of status transitions ('Placed' -> 'Confirmed' -> 'Packed' -> 'Shipped' -> 'Out for Delivery' -> 'Delivered').
14. `reviews`: Customer ratings (1-5 stars) and written reviews.
15. `collections` & `collection_products`: Curated fashion edits (e.g. "The Everyday Edit").
16. `looks` & `look_products`: "Shop the Look" outfit combinations.
17. `notifications`: In-app customer update alerts.
18. `audit_logs`: Admin financial, inventory, and status change activity log.
19. `payment_settings`: Dynamic store owner settings (UPI ID, QR URL, Bank Account details).
20. `stock_reservations`: Atomic inventory stock reservation during checkout.

---

## 3. Production PostgreSQL Setup Instructions

### Step 1: Provision Managed PostgreSQL Instance
1. Go to your cloud host (e.g., [Render PostgreSQL](https://render.com) or Neon / Supabase).
2. Create a new PostgreSQL Database:
   - Name: `grabb_it_production`
   - User: `grabb_it_admin`
3. Copy your External Database Connection String (e.g., `postgresql://grabb_it_admin:Password123@ep-sample.render.com/grabb_it_production?sslmode=require`).

### Step 2: Initialize Database Schema
Run the schema initialization script against your PostgreSQL instance:

```bash
psql "YOUR_POSTGRESQL_DATABASE_URL" -f server/database/schema_pg.sql
```

---

## 4. SQLite to PostgreSQL Data Migration

To transfer all existing products, categories, seed data, users, and orders from your local SQLite database to production PostgreSQL:

1. Ensure your local `server/database/grabb_it.db` is initialized and seeded.
2. Set the `DATABASE_URL` environment variable and run the migration script:

```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname" node server/database/migrate_sqlite_to_pg.js
```

The migration tool will:
- Establish a transactional connection to PostgreSQL
- Create missing tables using `schema_pg.sql`
- Truncate and migrate all rows preserving IDs and foreign key integrity
- Reset sequence counters for all auto-increment primary keys
