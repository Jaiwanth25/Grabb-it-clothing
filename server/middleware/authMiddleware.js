const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
  ? (() => { throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production!'); })() 
  : 'grabb_it_dev_jwt_secret_key_change_in_prod_2026');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      const key = parts[0];
      const val = parts.slice(1).join('=');
      acc[key] = val;
      return acc;
    }, {});
    token = cookies.grabb_it_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  });
}

function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const parts = cookie.trim().split('=');
      const key = parts[0];
      const val = parts.slice(1).join('=');
      acc[key] = val;
      return acc;
    }, {});
    token = cookies.grabb_it_token;
  }

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

function requireCustomer(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Customer account required.' });
    }
  });
}

const requireAuth = authenticateToken;

module.exports = {
  authenticateToken,
  requireAuth,
  requireCustomer,
  requireAdmin,
  optionalToken,
  JWT_SECRET
};
