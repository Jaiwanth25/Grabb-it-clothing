# GRABB-IT — Full-Stack E-Commerce Clothing Platform

GRABB-IT is a production-ready, full-stack e-commerce clothing application built with a high-contrast modern minimal aesthetic (strict NO-GRADIENTS rule, solid colors, clean typography, pure white finish). 

The platform includes a customer-facing storefront with strict gender isolation (MEN vs WOMEN), database-backed cart & wishlist, 5-step checkout flow, user accounts, and a completely isolated Admin Dashboard (`/admin`) for product, category, banner, inventory, order, coupon, and review management.

---

## Brand & Aesthetic Rules

- **Brand Name**: `GRABB-IT`
- **Logo**: Official Grabb-it Rabbit Logo (`/assets/grabb-it-logo.png` & `/assets/grabb-it-logo.svg`).
- **NO GRADIENTS**: Zero CSS gradients, zero gradient text, zero gradient buttons or overlays. Uses clean white backgrounds (`#FFFFFF`), solid black typography (`#111111`), subtle borders (`#E5E5E5`), and solid accent badges (`#E53935` / `#F5A623`).
- **Strict Gender Scoping**: 
  - **MEN**: Displays strictly Men's categories (`T-Shirts`, `Shirts`, `Jeans`, `Pants`, `Joggers`, `Linen`, `Outerwear`) and apparel.
  - **WOMEN**: Displays strictly Women's categories (`T-Shirts`, `Shirts`, `Jeans`, `Pants`, `Joggers`, `Tops`, `Shorts`, `Denims`) and apparel.

---

## Tech Stack

- **Frontend**: React 18 (Vite SPA) + React Router DOM v6 + Lucide Icons + Pure Vanilla CSS.
- **Backend API**: Node.js + Express.js + CORS + JWT + Bcryptjs + Multer.
- **Database**: SQLite (`better-sqlite3`) for single-file, zero-config, ultra-fast relational data persistence.

---

## Quick Start (Local Setup Instructions)

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 2. Installation
Open your terminal in the `grabb-it` directory and install dependencies for both server and client:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Seed Database
Initialize the database schema and populate realistic sample clothing products, categories, active banners, coupons, and test accounts:

```bash
cd server
node database/seed.js
```

### 4. Run Application (Unified Concurrent Mode)
Start both backend API and frontend Vite dev servers concurrently using a single command from the project root directory:

```bash
# Run from root folder
npm run dev
```

This will automatically boot the Backend API server on port 5000 and the Frontend Client on port 3000. Open your browser and navigate to **`http://localhost:3000`**.

Alternatively, you can run them in separate terminals:

**Terminal 1 (Backend API Server - Port 5000):**
```bash
cd server
node server.js
```

**Terminal 2 (Frontend Client - Port 3000):**
```bash
cd client
npm run dev
```

---

## Default Credentials

### Admin Account
- **URL**: `http://localhost:3000/admin/login` or click **Admin Dashboard** in the navigation drawer
- **Email**: `admin@grabb-it.com`
- **Password**: `Admin@123456`

### Customer Account
- **URL**: `http://localhost:3000/login`
- **Email**: `customer@grabb-it.com`
- **Password**: `Customer@123`

---

## Key Feature Checklist

1. **Header & Navigation**: Sticky header with logo, search bar, cart count badge, gender switcher (MEN / WOMEN), and drawer menu.
2. **Homepage**:
   - Swipeable Banner Carousel (manageable from Admin)
   - New Arrivals Carousel
   - Gender Selector Cards
   - Gender-Scoped Category Grid
   - Trending Outfits
   - Special Offers
   - Featured Products
   - Footer & Newsletter
3. **Product Listing & Filtering**: Category filter, size filter, price range slider, sort options (Recommended, Newest, Price, Rating).
4. **Product Details**: Image gallery, variant selectors (size/color), real-time stock check, Add to Cart / Buy Now / Wishlist buttons, product info tabs, customer reviews submission & moderation.
5. **Shopping Cart & Wishlist**: Guest + Logged-in user cart synchronization, coupon code application, quantity updates.
6. **Checkout Flow**: 5-step wizard (Cart -> Address -> Delivery -> Test Mode Payment -> Order Confirmation with Order ID & tracking number).
7. **Customer Account**: View orders history, profile details, saved addresses, change password.
8. **Admin Panel (`/admin`)**:
   - Stats overview & recent orders
   - Product CRUD (with variants & image URLs)
   - Category CRUD (assigned to MEN or WOMEN)
   - Banner CRUD (title, subtitle, button link, active state)
   - Order Status Manager (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)
   - Inventory Stock Manager with low-stock warnings
   - Customer Manager
   - Coupon Manager

---

## Connecting External Services in Production

### 1. Cloud Image Storage
Currently, local file uploads use Multer stored in `server/uploads/`. To switch to AWS S3, Cloudinary, or Google Cloud Storage, replace `uploadMiddleware.js` with your cloud SDK upload stream.

### 2. Real Payment Gateway Integration
The payment architecture in `server/routes/orders.js` processes orders in test mode. To connect Stripe or Razorpay:
- Install `stripe` package in `server/`.
- Replace payment simulation in `server/routes/orders.js` with `stripe.paymentIntents.create()`.
- Update `CheckoutPage.jsx` with `@stripe/react-stripe-js` elements.

---

## License

Copyright &copy; 2026 GRABB-IT Inc. All Rights Reserved.
