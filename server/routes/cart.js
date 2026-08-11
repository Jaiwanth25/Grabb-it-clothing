const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { optionalToken, authenticateToken } = require('../middleware/authMiddleware');

function getOrCreateCart(userId, sessionId) {
  let cart = null;
  if (userId) {
    cart = db.prepare('SELECT * FROM carts WHERE user_id = ?').get(userId);
    if (!cart) {
      const res = db.prepare('INSERT INTO carts (user_id) VALUES (?)').run(userId);
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(res.lastInsertRowid);
    }
  } else if (sessionId) {
    cart = db.prepare('SELECT * FROM carts WHERE session_id = ?').get(sessionId);
    if (!cart) {
      const res = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(sessionId);
      cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(res.lastInsertRowid);
    }
  }
  return cart;
}

function getCartItemsDetailed(cartId) {
  if (!cartId) return [];
  const items = db.prepare(`
    SELECT ci.id as cart_item_id, ci.quantity, ci.variant_id, p.id as product_id, p.name as product_name, p.slug, p.gender, p.price, p.sale_price, p.sku,
           pv.size, pv.color, pv.color_hex, pv.stock,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
  `).all(cartId);

  return items.map(item => ({
    ...item,
    image_url: item.primary_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    unit_price: item.sale_price !== null ? item.sale_price : item.price,
    total_price: (item.sale_price !== null ? item.sale_price : item.price) * item.quantity
  }));
}

// GET /api/cart
router.get('/', optionalToken, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    if (!userId && !sessionId) {
      return res.json({ items: [], subtotal: 0, count: 0 });
    }

    const cart = getOrCreateCart(userId, sessionId);
    const items = getCartItemsDetailed(cart.id);

    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ cartId: cart.id, items, subtotal: parseFloat(subtotal.toFixed(2)), count });
  } catch (err) {
    console.error('Fetch Cart Error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart/add
router.post('/add', optionalToken, (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;

    if (!productId || !variantId) {
      return res.status(400).json({ error: 'ProductId and VariantId are required' });
    }

    // Verify variant and stock
    const variant = db.prepare('SELECT stock FROM product_variants WHERE id = ? AND product_id = ?').get(variantId, productId);
    if (!variant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    const cart = getOrCreateCart(userId, sessionId);
    const existingItem = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?').get(cart.id, variantId);

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newQty = currentQtyInCart + quantity;

    if (newQty > variant.stock) {
      return res.status(400).json({ error: `Only ${variant.stock} units available in stock.` });
    }

    if (existingItem) {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existingItem.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)').run(cart.id, productId, variantId, quantity);
    }

    const items = getCartItemsDetailed(cart.id);
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ cartId: cart.id, items, subtotal: parseFloat(subtotal.toFixed(2)), count, message: 'Item added to cart' });
  } catch (err) {
    console.error('Add Cart Error:', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/update
router.put('/update', optionalToken, (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    if (!cartItemId || quantity === undefined) {
      return res.status(400).json({ error: 'CartItemId and quantity are required' });
    }

    if (quantity <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartItemId);
    } else {
      // Stock check
      const cartItem = db.prepare('SELECT variant_id FROM cart_items WHERE id = ?').get(cartItemId);
      if (cartItem) {
        const variant = db.prepare('SELECT stock FROM product_variants WHERE id = ?').get(cartItem.variant_id);
        if (variant && quantity > variant.stock) {
          return res.status(400).json({ error: `Only ${variant.stock} units available in stock.` });
        }
      }
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, cartItemId);
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const cart = getOrCreateCart(userId, sessionId);
    const items = getCartItemsDetailed(cart.id);

    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ items, subtotal: parseFloat(subtotal.toFixed(2)), count, message: 'Cart updated' });
  } catch (err) {
    console.error('Update Cart Error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/item/:id
router.delete('/item/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

// POST /api/cart/merge (Guest login cart merge)
router.post('/merge', authenticateToken, (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ message: 'No session cart to merge' });

    const guestCart = db.prepare('SELECT id FROM carts WHERE session_id = ?').get(sessionId);
    if (!guestCart) return res.json({ message: 'No session cart found' });

    const userCart = getOrCreateCart(req.user.id, null);
    const guestItems = db.prepare('SELECT product_id, variant_id, quantity FROM cart_items WHERE cart_id = ?').all(guestCart.id);

    guestItems.forEach((gItem) => {
      const existingUserItem = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?').get(userCart.id, gItem.variant_id);
      if (existingUserItem) {
        db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(gItem.quantity, existingUserItem.id);
      } else {
        db.prepare('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)').run(userCart.id, gItem.product_id, gItem.variant_id, gItem.quantity);
      }
    });

    // Clean up guest cart
    db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(guestCart.id);
    db.prepare('DELETE FROM carts WHERE id = ?').run(guestCart.id);

    const items = getCartItemsDetailed(userCart.id);
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const count = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({ items, subtotal: parseFloat(subtotal.toFixed(2)), count, message: 'Cart merged successfully' });
  } catch (err) {
    console.error('Merge Cart Error:', err);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
});

module.exports = router;
