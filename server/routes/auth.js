const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');
const { sendOtpEmail } = require('../services/email');

// Helper to generate 6-digit numeric OTP
function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await db.queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase(]).trim());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.queryOne(`
      INSERT INTO users (name, email, password_hash, role, phone, email_verified)
      VALUES (?, ?, ?, 'customer', ?, 0)
    `).run(name.trim(), email.toLowerCase().trim(), passwordHash, phone || '');

    const userId = result.lastInsertRowid;
    const user = { id: userId, name: name.trim(), email: email.toLowerCase().trim(), role: 'customer', phone, email_verified: false };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('grabb_it_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ user, token, message: 'Account registered successfully' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRow = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase(]).trim());
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = bcrypt.compareSync(password, userRow.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      phone: userRow.phone,
      email_verified: !!userRow.email_verified
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('grabb_it_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user, token, message: 'Logged in successfully' });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  res.clearCookie('grabb_it_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRow = await db.queryOne('SELECT id, name, email, role, phone, email_verified, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const addresses = await db.queryOne('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.id]);

    res.json({ user: { ...userRow, email_verified: !!userRow.email_verified }, addresses });
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/auth/forgot-password (Generates and sends 6-digit OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = await db.query('SELECT id, email, name FROM users WHERE email = ?', [email.toLowerCase(]).trim());
    
    // Always respond with success to prevent user enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with this email, an OTP has been sent.' });
    }

    const otp = generate6DigitOtp();
    const otpHash = bcrypt.hashSync(otp, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

    await db.queryOne(`
      UPDATE users SET otp_hash = ?, otp_expires = ?, otp_attempts = 0 WHERE id = ?
    `).run(otpHash, expiresAt, user.id);

    await sendOtpEmail(user.email, otp, 'Password Reset');

    res.json({ success: true, message: 'OTP sent to your registered email address.' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
});

// POST /api/auth/verify-otp (Validates 6-digit OTP and returns reset token)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await db.run('SELECT id, otp_hash, otp_expires, otp_attempts FROM users WHERE email = ?', [email.toLowerCase(]).trim());
    if (!user || !user.otp_hash || !user.otp_expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    if (new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
    }

    if (user.otp_attempts >= 5) {
      return res.status(429).json({ error: 'Maximum OTP verification attempts exceeded. Request a new OTP.' });
    }

    const isValid = bcrypt.compareSync(otp.trim(), user.otp_hash);
    if (!isValid) {
      await db.queryOne('UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = ?', [user.id]);
      return res.status(400).json({ error: 'Incorrect OTP code.' });
    }

    // Create temporary 15-min password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = bcrypt.hashSync(resetToken, 8);
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.run(`
      UPDATE users SET otp_hash = NULL, otp_expires = NULL, reset_token_hash = ?, reset_token_expires = ? WHERE id = ?
    `, [resetTokenHash, resetExpires, user.id]);

    res.json({ success: true, resetToken, message: 'OTP verified. Proceed to reset password.' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/auth/reset-password (Updates password using reset token)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await db.run('SELECT id, reset_token_hash, reset_token_expires FROM users WHERE email = ?', [email.toLowerCase(]).trim());
    if (!user || !user.reset_token_hash || !user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired password reset session' });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset session expired. Please start over.' });
    }

    const isValid = bcrypt.compareSync(resetToken, user.reset_token_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid reset authorization token' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.queryOne(`
      UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?
    `, [newHash, user.id]);

    res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/send-verification (Email Verification OTP)
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const user = await db.run('SELECT id, email, email_verified FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.email_verified) {
      return res.json({ message: 'Email address is already verified.' });
    }

    const otp = generate6DigitOtp();
    const otpHash = bcrypt.hashSync(otp, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await db.queryOne(`
      UPDATE users SET otp_hash = ?, otp_expires = ?, otp_attempts = 0 WHERE id = ?
    `, [otpHash, expiresAt, user.id]);

    await sendOtpEmail(user.email, otp, 'Email Verification');

    res.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'Verification code is required' });

    const user = await db.run('SELECT id, otp_hash, otp_expires FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.otp_hash || !user.otp_expires) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const isValid = bcrypt.compareSync(otp.trim(), user.otp_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Incorrect verification code' });
    }

    await db.queryOne(`
      UPDATE users SET email_verified = 1, otp_hash = NULL, otp_expires = NULL WHERE id = ?
    `, [user.id]);

    res.json({ success: true, message: 'Email address verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const userRow = await db.run('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!userRow || !bcrypt.compareSync(currentPassword, userRow.password_hash)) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.queryOne('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change Password Error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/auth/addresses
router.get('/addresses', authenticateToken, async (req, res) => {
  const addresses = await db.run('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC', [req.user.id]);
  res.json(addresses);
});

// POST /api/auth/addresses
router.post('/addresses', authenticateToken, async (req, res) => {
  const { full_name, phone, address_line, city, state, pincode, is_default } = req.body;
  if (!full_name || !phone || !address_line || !city || !state || !pincode) {
    return res.status(400).json({ error: 'All address fields are required' });
  }

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  }

  const result = await db.run(`
    INSERT INTO addresses (user_id, full_name, phone, address_line, city, state, pincode, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.id, full_name, phone, address_line, city, state, pincode, is_default ? 1 : 0]);

  const newAddress = await db.run('SELECT * FROM addresses WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(newAddress);
});

// DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Address removed' });
});

module.exports = router;
