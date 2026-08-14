# GRABB-IT Clothing — Final Production Audit Report (Phase 0)

This report documents the exhaustive line-by-line codebase audit performed across the **GRABB-IT CLOTHING** repository to identify architectural flaws, security risks, broken database operations, and concurrency vulnerabilities before hardening.

---

## 1. Summary of Discovered Code Flaws & Fixed Risks

### A. Database Architecture & Synchronous SQLite Dependencies
- **Issue**: Routes across `admin.js`, `auth.js`, `cart.js`, `wishlist.js`, `categories.js`, `collections.js`, `looks.js`, `reviews.js`, and `orders.js` relied on synchronous SQLite calls (`db.prepare(...)`, `.all()`, `.get()`, `.run()`).
- **Impact**: When PostgreSQL was configured (`DATABASE_URL`), `db.run()` returned `lastInsertRowid: null`, causing catastrophic runtime failures on every insert operation.
- **Resolution**: Refactored `server/database/db.js` into an asynchronous dual-database abstraction supporting `db.query`, `db.queryOne`, `db.run`, `db.insert` (with `RETURNING id` for PG), and single-client `db.transaction`. Replaced all `db.prepare()` calls in routes with async methods.

### B. Security, Credentials & Fallback Secrets
- **Issue**: `authMiddleware.js` and `sse.js` contained hardcoded fallback JWT secret strings (`process.env.JWT_SECRET || 'grabb_it_jwt_secret_key...'`).
- **Impact**: In production, if `JWT_SECRET` was unconfigured, the application silently fell back to a hardcoded string, rendering JWT tokens vulnerable to forge attacks.
- **Resolution**: Removed all hardcoded fallback secrets. Added a startup guard in `server.js` and `authMiddleware.js` that throws a fatal error and fails fast if `JWT_SECRET` is missing in production.

### C. IDOR Vulnerability in Order Lookup
- **Issue**: `GET /api/orders/:orderNumber` did not enforce strict authentication checks for non-admin users viewing registered orders.
- **Impact**: An unauthenticated or unauthorized user guessing an order number could view another customer's full address, phone number, and order items.
- **Resolution**: Added strict server-side authorization: registered orders require either admin role or matching authenticated user ID.

### D. Inventory Concurrency & Overselling
- **Issue**: Checkout in `orders.js` lacked row locking during stock checking and deduction.
- **Impact**: Simultaneous purchases for limited-stock items caused race conditions resulting in negative inventory stock (`stock < 0`).
- **Resolution**: Added `SELECT ... FOR UPDATE` row locking during order checkout in Postgres transactions, serialized async SQLite transactions via queueing, and implemented an idempotent stock reservation cleanup task ([`stock_reservation_cleanup.js`](file:///C:/Users/mv240/.gemini/antigravity-ide/scratch/Grabb-it-clothing/server/services/stock_reservation_cleanup.js)).

### E. Payment & Refund Vulnerabilities
- **Issue**: Manual payment reference/UTR submission in `payments.js` lacked duplicate checks across orders. Refund API lacked refund cap checks or duplicate refund prevention.
- **Impact**: Customers could reuse the same UTR across multiple orders; admins could accidentally issue refunds exceeding total order amount.
- **Resolution**: Added duplicate UTR validation on submission and enforced refund boundaries (cannot exceed original total amount; cannot refund an already-refunded order).

### F. Real-time SSE Stream Security
- **Issue**: `sse.js` allowed connection stream requests without tickets and contained `Access-Control-Allow-Origin: *`.
- **Impact**: Any origin could connect to user notification streams.
- **Resolution**: Implemented single-use 15-second expiring cryptographically generated tickets (`POST /api/notifications/ticket`) required to initiate SSE connection streams.

---

## 2. Forbidden Pattern Search Verification Results

| Search Term | Found Instances | Action Taken | Status |
| :--- | :--- | :--- | :--- |
| `db.prepare` | 4 internal inside `db.js` | Refactored out of all routes | **PASS** |
| `lastInsertRowid` | 4 internal inside `db.js` | Encapsulated in `db.insert` | **PASS** |
| `JWT_SECRET \|\|` | 0 in server routes | Enforced fail-fast startup guard | **PASS** |
| `console.log` of OTP/Secrets | 0 in production path | Stripped OTP logging in prod | **PASS** |
| `Access-Control-Allow-Origin: *` | 0 in SSE stream | Removed wildcard header | **PASS** |

---

## 3. Conclusion

All discovered vulnerabilities and code defects have been resolved and validated through automated testing suites.
