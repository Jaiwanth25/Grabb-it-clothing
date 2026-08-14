const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const db = require('./database/db');
const { startReservationCleanupScheduler } = require('./services/stock_reservation_cleanup');

dotenv.config();

// Startup validation for production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is missing in production mode!');
    process.exit(1);
  }
}

const app = express();
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
    max: 500,
    message: { error: 'Too many requests from this IP, please try again later.' }
  });
  app.use('/api/', apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many authentication attempts, please try again in 15 minutes.' }
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);
} catch (e) {
  console.warn('Rate limiting warning:', e.message);
}

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder for development
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await db.queryOne('SELECT 1');
  } catch (e) {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    service: 'grabb-it-api',
    database: dbStatus,
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
      storeEmail: 'support@grabb-it.com',
      phone: '+91 98765 43210',
      whatsappNumber: '+91 99999 88888',
      freeShippingThreshold: '999',
      freeShippingMessage: 'FESTIVE CARNIVAL DROP: FREE EXPRESS SHIPPING ABOVE ₹999 • USE CODE: GRABB10 FOR 10% OFF',
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
      whatsappNumber: '+91 99999 88888',
      freeShippingThreshold: '999',
      freeShippingMessage: 'FESTIVE CARNIVAL DROP: FREE EXPRESS SHIPPING ABOVE ₹999 • USE CODE: GRABB10 FOR 10% OFF'
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

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
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

const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`GRABB-IT Backend Server Active`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database Mode: ${db.isPg ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`API Root: http://localhost:${PORT}/api`);
  console.log(`=================================`);
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
