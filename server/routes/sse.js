const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');

// Temporary tickets map: ticket -> { userId, expiresAt }
const sseTickets = new Map();

// POST /api/sse/ticket — Generates a 15-second single-use ticket for SSE connection
router.post('/ticket', authenticateToken, async (req, res) => {
  const ticket = crypto.randomBytes(24).toString('hex');
  sseTickets.set(ticket, {
    userId: req.user.id,
    expiresAt: Date.now() + 15000 // 15 seconds expiry
  });

  res.json({ ticket });
});

// Store connected SSE response streams: userId -> Set of res objects
const sseClients = new Map();

/**
 * Global helper to send real-time SSE notifications to a specific user
 */
function sendRealtimeNotification(userId, data) {
  if (!userId) return;
  const userClients = sseClients.get(userId);
  if (userClients && userClients.size > 0) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    userClients.forEach(clientRes => {
      try {
        clientRes.write(payload);
      } catch (err) {
        // Stream writing error handle
      }
    });
  }
}

// GET /api/sse/stream (or /events) — Authenticated SSE Stream using ticket
const streamHandler = async (req, res) => {
  const { ticket } = req.query;
  if (!ticket || !sseTickets.has(ticket)) {
    return res.status(401).json({ error: 'Unauthorized or invalid SSE ticket' });
  }

  const ticketData = sseTickets.get(ticket);
  sseTickets.delete(ticket); // Single-use consumption immediately

  if (Date.now() > ticketData.expiresAt) {
    return res.status(401).json({ error: 'Expired SSE ticket' });
  }

  const userId = ticketData.userId;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Connection Established' })}\n\n`);

  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(res);

  // Heartbeat ping every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const userClients = sseClients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) sseClients.delete(userId);
    }
  });
};

router.get('/stream', streamHandler);
router.get('/events', streamHandler);

module.exports = router;
module.exports.sendRealtimeNotification = sendRealtimeNotification;
