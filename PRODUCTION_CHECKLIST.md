# GRABB-IT Clothing - Production Deployment Checklist

This document details the configuration tasks and setup items required before launching the Grabb-it Clothing application to a live production environment.

---

## 1. Secrets Management (Critical)
- [ ] Set `NODE_ENV=production` inside server environments.
- [ ] Generate a secure, 32-character string for the server `JWT_SECRET`.
- [ ] Ensure `.env` files are added to the `.gitignore` ruleset to prevent accidental version tracking.

---

## 2. Production Database Upgrades
- [ ] SQLite is used for development. For highly scaled high-concurrency production deployments, migrate to a persistent engine like **PostgreSQL** or **MySQL**.
- [ ] Configure automatic daily database backups using cron tasks.

---

## 3. Real Payment Gateway Setup
- [ ] Sign up with a payment provider (e.g. Razorpay, Stripe, PayU).
- [ ] Configure the secret keys in backend environment variables.
- [ ] Set up server-side verification endpoints (`/api/payments/verify`) and register webhook URLs on the provider dashboard to confirm transactions.
- [ ] Transition the mock checkout interface to the provider's checkout SDK (e.g., Razorpay standard checkout popup).

---

## 4. Production Image Storage
- [ ] Set up object storage (e.g., AWS S3, Cloudinary).
- [ ] Modify `server/middleware/uploadMiddleware.js` to upload images directly to object storage instead of saving files inside local disk directories.
- [ ] Return the cloud URL to the database records.

---

## 5. Server Security & Infrastructure
- [ ] Configure SSL/TLS certificates (HTTPS) for the domain.
- [ ] Set SameSite cookie flags to `'strict'` or `'lax'` and enforce the `Secure` flag.
- [ ] Restrict CORS domains on the Express server to the customer frontend URL.
- [ ] Enable rate-limiting middleware (`express-rate-limit`) to prevent brute-force attacks on login.
