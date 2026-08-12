const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/notifications
// Retrieves authenticated user's notifications
router.get('/', authenticateToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error('Fetch Notifications Error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// PUT /api/notifications/:id/read
// Marks a single notification as read
router.put('/:id/read', authenticateToken, (req, res) => {
  try {
    const result = db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

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
router.post('/mark-all-read', authenticateToken, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ?
    `).run(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark All Read Error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// DELETE /api/notifications
// Clears read notifications
router.delete('/', authenticateToken, (req, res) => {
  try {
    db.prepare(`
      DELETE FROM notifications 
      WHERE user_id = ? AND is_read = 1
    `).run(req.user.id);
    res.json({ success: true, message: 'Read notifications cleared.' });
  } catch (err) {
    console.error('Delete Notifications Error:', err);
    res.status(500).json({ error: 'Failed to clear read notifications.' });
  }
});

module.exports = router;
