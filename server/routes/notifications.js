const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const sse = require('./sse');

// Ticket & Stream aliases under /api/notifications
router.post('/ticket', authenticateToken, (req, res, next) => {
  return router.handle(req, res, next);
});

// GET /api/notifications
// Retrieves authenticated user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await db.query(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [req.user.id]);
    res.json(notifications);
  } catch (err) {
    console.error('Fetch Notifications Error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PUT /api/notifications/:id/read
// Marks a single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const result = await db.run(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND user_id = ?
    `, [req.params.id, req.user.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notification not found or access denied.' });
    }
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Read Notification Error:', err);
    res.status(500).json({ error: 'Failed to update notification state.' });
  }
});

// POST /api/notifications/mark-all-read
// Marks all user's notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await db.run(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ?
    `, [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark All Read Error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// DELETE /api/notifications
// Clears read notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await db.run(`
      DELETE FROM notifications 
      WHERE user_id = ? AND is_read = 1
    `, [req.user.id]);
    res.json({ success: true, message: 'Read notifications cleared.' });
  } catch (err) {
    console.error('Delete Notifications Error:', err);
    res.status(500).json({ error: 'Failed to clear read notifications.' });
  }
});

module.exports = router;
