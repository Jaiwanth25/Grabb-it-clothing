# GRABB-IT Clothing - Local Development Setup

Follow these steps to download, install, build, and run the Grabb-it Clothing e-commerce site locally.

---

## 1. Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher recommended)

---

## 2. Directory Structure

The project is structured as a monorepo containing:
- `client/`: Frontend React + Vite application (runs on port `3000`).
- `server/`: Backend Express + SQLite database server (runs on port `5000`).

---

## 3. Installation Steps

From the project root directory, run:

```bash
# 1. Clean build configurations and install package dependencies in root and child projects
npm run setup

# 2. Run standard npm install in the workspace root
npm install
```

---

## 4. Environment Variables Config

Create a `.env` file in the `server/` directory:

```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=grabb_it_super_secret_jwt_key_2026
```

---

## 5. Seed the Database

Populate categories, collections, default items, admin roles, and mock accounts:

```bash
npm run seed
```

This generates the SQLite database at `server/database/grabb_it.db`.

---

## 6. Run Servers Concurrently

Boot both front-end and back-end watch modes:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`
- **Admin Dashboard**: `http://localhost:3000/admin`

---

## 7. Run E2E Test Suite

Verify catalog listing, stock decrement, delivery updates, and reviews:

```bash
node server/database/test_e2e_script.js
```
