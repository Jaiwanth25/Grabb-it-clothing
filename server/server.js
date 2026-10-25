const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment from .env.local (Neon) and server/.env
const rootEnvPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const db = require('./database/db');
const { startReservationCleanupScheduler } = require('./services/stock_reservation_cleanup');

// Mandatory Startup Security Validation
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production. Halting process to prevent token forgery.');
    process.exit(1);
  } else {
    console.warn('DEVELOPMENT NOTICE: JWT_SECRET environment variable is unset. Using development key.');
  }
}

const app = express();
// Enable trust proxy so express-rate-limit and req.ip use the real client IP behind Render/Vercel reverse proxies
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Security Headers (Helmet)
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
} catch (e) {
  console.warn('Helmet warning:', e.message);
}

// Strict CORS
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [FRONTEND_URL, 'https://grabb-it-clothing.vercel.app'].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow configured origins
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

// Rate Limiting
try {
  const rateLimit = require('express-rate-limit');
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // 10,000 requests per 15 min so storefront browsing never throttles users
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' },
    skip: (req) => {
      // Never rate-limit preflight CORS OPTIONS, health checks, or auth requests under the general API limiter
      return req.method === 'OPTIONS' || req.path.includes('/health') || req.path.includes('/auth');
    }
  });
  app.use('/api/', apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // 100 attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again in 15 minutes.' }
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);

  // Dedicated limiters for public forms and sensitive operations
  const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 submissions per 15 min per IP to prevent spam bot flooding
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many submissions from this IP. Please try again later.' }
  });
  app.use('/api/newsletter', formLimiter);
  app.use('/api/contact', formLimiter);

  const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120, // 120 requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Order/payment processing limit reached. Please wait a moment before trying again.' }
  });
  app.use('/api/orders', checkoutLimiter);
  app.use('/api/payments', checkoutLimiter);

  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600, // 600 admin requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Administrative request limit reached. Please wait a moment.' }
  });
  app.use('/api/admin', adminLimiter);
} catch (e) {
  console.warn('Rate limiting warning:', e.message);
}

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads folder with explicit Cross-Origin headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  let dbError = null;
  try {
    await db.queryOne('SELECT 1');
  } catch (e) {
    dbStatus = 'disconnected';
    dbError = e.message;
  }

  let dbHost = 'none';
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://'));
      dbHost = parsed.hostname;
    } catch (_) {}
  }

  res.json({
    status: 'ok',
    service: 'grabb-it-api',
    database: dbStatus,
    databaseHost: dbHost,
    databaseError: dbError,
    databaseType: db.isPg ? 'PostgreSQL' : 'SQLite',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Public Store Settings Endpoint
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await db.query('SELECT key, value FROM store_settings');
    const settingsMap = {};
    if (rows && rows.length) {
      rows.forEach(r => { settingsMap[r.key] = r.value; });
    }
    
    const defaultSettings = {
      storeName: 'GRABB-IT CLOTHING',
      storeEmail: 'grabbitmensclothing@gmail.com',
      phone: '+91 78718 32815',
      whatsappNumber: '+91 78718 32815',
      freeShippingThreshold: '999',
      freeShippingMessage: 'FESTIVE DROP: FREE EXPRESS SHIPPING ABOVE ₹999 • USE CODE: GRABB10 FOR 10% OFF',
      instagramUrl: 'https://instagram.com/grabb_it_clothing',
      returnPolicy: 'Easy 7-day hassle-free returns and exchanges.',
      shippingPolicy: 'Express shipping across India in 3-5 business days.',
      privacyPolicy: 'Your personal data is encrypted and handled strictly according to Indian privacy laws.',
      termsConditions: 'All orders subject to stock availability and verification.'
    };

    res.json({ ...defaultSettings, ...settingsMap });
  } catch (err) {
    console.error('Fetch Public Settings Error:', err);
    res.json({
      storeName: 'GRABB-IT CLOTHING',
      storeEmail: 'grabbitmensclothing@gmail.com',
      phone: '+91 78718 32815',
      whatsappNumber: '+91 78718 32815',
      freeShippingThreshold: '999',
      freeShippingMessage: 'FESTIVE DROP: FREE EXPRESS SHIPPING ABOVE ₹999 • USE CODE: GRABB10 FOR 10% OFF'
    });
  }
});

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const bannerRoutes = require('./routes/banners');
const collectionsRoutes = require('./routes/collections');
const looksRoutes = require('./routes/looks');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const couponRoutes = require('./routes/coupons');
const orderRoutes = require('./routes/orders');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const sseRoutes = require('./routes/sse');
const stylesRoutes = require('./routes/styles');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/styles', stylesRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/looks', looksRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sse', sseRoutes);

// Newsletter Subscription API
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    try {
      if (db.isPg) {
        await db.query(
          'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
          [cleanEmail]
        );
      } else {
        await db.query(
          'INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)',
          [cleanEmail]
        );
      }
    } catch (insertErr) {
      console.warn('Newsletter insert warning:', insertErr.message);
    }

    return res.json({
      success: true,
      message: 'Welcome to the movement! Use code WELCOME15 for 15% off your first order.'
    });
  } catch (err) {
    console.error('Newsletter Subscription Error:', err);
    return res.status(500).json({ error: 'Failed to process subscription. Please try again.' });
  }
});

// Contact Support Inquiry API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, orderId, subject, message } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Please provide your full name.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please enter your message or inquiry.' });
    }

    try {
      if (db.isPg) {
        await db.query(
          'INSERT INTO contact_inquiries (name, email, phone, order_id, subject, message) VALUES ($1, $2, $3, $4, $5, $6)',
          [name.trim(), email.trim(), phone?.trim() || null, orderId?.trim() || null, subject?.trim() || 'General Inquiry', message.trim()]
        );
      } else {
        await db.query(
          'INSERT INTO contact_inquiries (name, email, phone, order_id, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
          [name.trim(), email.trim(), phone?.trim() || null, orderId?.trim() || null, subject?.trim() || 'General Inquiry', message.trim()]
        );
      }
    } catch (insertErr) {
      console.warn('Contact inquiry DB insert notice:', insertErr.message);
    }

    return res.json({
      success: true,
      message: 'Thank you for reaching out! Our customer care team will review your inquiry and respond within 24 business hours.'
    });
  } catch (err) {
    console.error('Contact Form Submission Error:', err);
    return res.status(500).json({ error: 'Failed to submit inquiry. Please try again later.' });
  }
});

// Serve client static build in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('GRABB-IT API Server Running.');
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('API Error:', isDev ? err.stack : err.message);
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Something went wrong. Please try again later.'
  });
});

// Start Stock Reservation Cleanup Scheduler
startReservationCleanupScheduler(60000);

// Auto-ensure default Admin account exists on backend startup
const bcrypt = require('bcryptjs');

async function ensureAdminUser() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'grabbitmensclothing@gmail.com').toLowerCase().trim();
    const adminPhone = process.env.ADMIN_PHONE || '7871832815';
    
    // Check if store owner admin account exists
    let admin = await db.queryOne("SELECT id, email, password_hash, role FROM users WHERE LOWER(email) = ?", [adminEmail]);

    // Check if legacy demo admin exists to migrate
    if (!admin) {
      const legacyAdmin = await db.queryOne("SELECT id, email, password_hash, role FROM users WHERE email = 'admin@grabb-it.com'");
      if (legacyAdmin) {
        const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123456';
        const adminPasswordHash = bcrypt.hashSync(initialPassword, 10);
        await db.run("UPDATE users SET email = ?, phone = ?, password_hash = ?, role = 'admin' WHERE id = ?", [adminEmail, adminPhone, adminPasswordHash, legacyAdmin.id]);
        admin = await db.queryOne("SELECT id, email, password_hash, role FROM users WHERE id = ?", [legacyAdmin.id]);
        console.log('Migrated legacy admin user to official store owner account.');
      }
    }

    if (!admin) {
      const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123456';
      const adminPasswordHash = bcrypt.hashSync(initialPassword, 10);
      await db.insert(`
        INSERT INTO users (name, email, password_hash, role, phone)
        VALUES ('GRABB-IT Admin', ?, ?, 'admin', ?)
      `, [adminEmail, adminPasswordHash, adminPhone]);
      console.log('Store owner admin account initialized.');
    } else {
      // Ensure user has admin role
      if (admin.role !== 'admin') {
        await db.run("UPDATE users SET role = 'admin' WHERE id = ?", [admin.id]);
      }
      console.log('Store owner admin account verified.');
    }
  } catch (err) {
    console.warn('Admin account verification notice:', err.message);
  }
}

async function ensureDefaultCategories() {
  try {
    const existing = await db.queryOne('SELECT COUNT(*) as count FROM categories');
    if (!existing || parseInt(existing.count) === 0) {
      console.log('Categories table empty. Initializing default Men and Women categories...');
      const defaultCats = [
        { name: 'T-Shirts', slug: 'men-t-shirts', gender: 'men', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', order: 1 },
        { name: 'Shirts', slug: 'men-shirts', gender: 'men', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80', order: 2 },
        { name: 'Jeans', slug: 'men-jeans', gender: 'men', img: 'https://images.unsplash.com/photo-1542272604-780c36856842?w=800&auto=format&fit=crop&q=80', order: 3 },
        { name: 'Pants', slug: 'men-pants', gender: 'men', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80', order: 4 },
        { name: 'Joggers', slug: 'men-joggers', gender: 'men', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80', order: 5 },
        { name: 'Linen', slug: 'men-linen', gender: 'men', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', order: 6 },
        { name: 'Outerwear', slug: 'men-outerwear', gender: 'men', img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80', order: 7 },
        { name: 'T-Shirts', slug: 'women-t-shirts', gender: 'women', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', order: 1 },
        { name: 'Shirts', slug: 'women-shirts', gender: 'women', img: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80', order: 2 },
        { name: 'Jeans', slug: 'women-jeans', gender: 'women', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80', order: 3 },
        { name: 'Pants', slug: 'women-pants', gender: 'women', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80', order: 4 },
        { name: 'Joggers', slug: 'women-joggers', gender: 'women', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80', order: 5 },
        { name: 'Tops', slug: 'women-tops', gender: 'women', img: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800&auto=format&fit=crop&q=80', order: 6 },
        { name: 'Shorts', slug: 'women-shorts', gender: 'women', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80', order: 7 },
        { name: 'Denims', slug: 'women-denims', gender: 'women', img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80', order: 8 }
      ];
      for (const cat of defaultCats) {
        await db.insert(
          'INSERT INTO categories (name, slug, gender, image_url, display_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
          [cat.name, cat.slug, cat.gender, cat.img, cat.order]
        );
      }
      console.log('Default categories initialized successfully.');
    }
  } catch (err) {
    console.warn('Auto-categories initialization notice:', err.message);
  }
}

const server = app.listen(PORT, async () => {
  console.log(`=================================`);
  console.log(`GRABB-IT Backend Server Active`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database Mode: ${db.isPg ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`API Root: http://localhost:${PORT}/api`);
  console.log(`=================================`);
  await ensureAdminUser();
  await ensureDefaultCategories();
});

// Graceful Shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} signal received. Closing HTTP server...`);
  server.close(async () => {
    if (db.isPg && db.pool) {
      await db.pool.end();
    }
    console.log('Server and database connections closed. Process exiting cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
