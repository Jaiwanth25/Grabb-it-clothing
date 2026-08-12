const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'grabb_it_jwt_secret_key_2026_fashion_super_secure';

// Temporary tickets map: ticket -> { userId, expiresAt }
const sseTickets = new Map();

// POST /api/sse/ticket — Generates a 30-second single-use ticket for SSE connection
router.post('/ticket', authenticateToken, async (req, res) => {
  const ticket = crypto.randomBytes(24).toString('hex');
  sseTickets.set(ticket, {
    userId: req.user.id,
    expiresAt: Date.now() + 30000
  });

  res.json({ ticket });
});

// Store connected SSE response streams: userId -> Set of res objects
const sseClients = new Map();

/**
 * Global helper to send real-time SSE notifications to a specific user
 */
function sendRealtimeNotification(userId, data) {
  const userClients = sseClients.get(userId);
  if (userClients && userClients.size > 0) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    userClients.forEach(clientRes => clientRes.write(payload));
  }
}

// GET /api/sse/events?ticket=... — SSE Stream
router.get('/events', async (req, res) => {
  const { ticket } = req.query;
  if (!ticket || !sseTickets.has(ticket)) {
    return res.status(401).send('Unauthorized or invalid ticket');
  }

  const ticketData = sseTickets.get(ticket);
  sseTickets.delete(ticket); // Single use

  if (Date.now() > ticketData.expiresAt) {
    return res.status(401).send('Expired ticket');
  }

  const userId = ticketData.userId;

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Connection Established' })}\n\n`);

  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(res);

  // Heartbeat ping every 25 seconds
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const userClients = sseClients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) sseClients.delete(userId);
    }
  });
});

module.exports = router;
module.exports.sendRealtimeNotification = sendRealtimeNotification;
