# GRABB-IT Clothing - Security Specifications & Auditing

This document reviews security controls, credential protection, encryption models, and access limits established for the Grabb-it platform.

---

## 1. Authentication Security

- **Hashed Passwords**: Plaintext passwords are never stored. The system hashes user and administrator passwords during sign-up and seeding using the **bcryptjs** algorithm with a work factor of `10`.
- **JWT Session Tokens**: JWTs contain unique user attributes (id, name, email, role, phone) signed via a cryptographically secure `JWT_SECRET` key.
- **HTTP-Only Cookies**: JWT tokens are issued and saved in the client's browser cookies using the secure `HttpOnly` flag. This prevents client-side Javascript scripts from accessing the session tokens, preventing cross-site scripting (XSS) token-extraction.

---

## 2. API Authorization & Gating

- **Backend Role Access Control**: Sensitive paths (e.g. `/api/admin/*`) are gated at the routing layer on the backend using `requireAdmin` middleware. If a user bypasses client navigation blocks to request details, the backend returns a `403 Access Denied` response.
- **User Data Isolation**: Customer endpoints check the validated token identity (`req.user.id`) to only return the authenticated customer's specific profile, addresses, and order histories, preventing ID-tampering URL attacks.
- **Review Verification**: Submission routes in `reviews.js` check the order registry. Only customers who have a delivered order containing that product can post reviews, preventing fake reviews.

---

## 3. SQL Injection Protection

- **Parameterized Prepared Statements**: Database commands in `better-sqlite3` are pre-compiled and run using parameter placeholders (`?`), escaping inputs to block SQL Injection payloads.

---

## 4. Parameter Price-Tamper Protection

- **Secure Calculations**: Order creation routes in `orders.js` recalculate subtotal values, coupon validity limits, and shipping thresholds server-side using the database entries. The server never trusts pricing, stock, or totals parameters sent from client forms.
