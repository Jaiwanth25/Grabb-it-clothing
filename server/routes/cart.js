const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { optionalToken, authenticateToken } = require('../middleware/authMiddleware');

function getOrCreateCart(userId, sessionId) {
  let cart = null;
  if (userId) {
    cart = await db.queryOne('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (!cart) {
      const res = await db.queryOne('INSERT INTO carts (user_id) VALUES (?)').run(userId);
      cart = await db.query('SELECT * FROM carts WHERE id = ?', [res.lastInsertRowid]);
    }
  } else if (sessionId) {
    cart = await db.queryOne('SELECT * FROM carts WHERE session_id = ?', [sessionId]);
    if (!cart) {
      const res = await db.queryOne('INSERT INTO carts (session_id) VALUES (?)').run(sessionId);
      cart = await db.run('SELECT * FROM carts WHERE id = ?', [res.lastInsertRowid]);
    }
  }
  return cart;
}

function getCartItemsDetailed(cartId) {
  if (!cartId) return [];
  const items = await db.queryOne(`
    SELECT ci.id as cart_item_id, ci.quantity, ci.variant_id, p.id as product_id, p.name as product_name, p.slug, p.gender, p.price, p.sale_price, p.sku,
           pv.size, pv.color, pv.color_hex, pv.stock,
           (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.cart_id = ?
  `, [cartId]);

  return items.map(item => ({
    ...item,
    image_url: item.primary_image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    unit_price: item.sale_price !== null ? item.sale_price : item.price,
    total_price: (item.sale_price !== null ? item.sale_price : item.price) * item.quantity
  }));
}

// GET /api/cart
router.get('/', optionalToken, async (req, res) => {
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
router.post('/add', optionalToken, async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;

    if (!productId || !variantId) {
      return res.status(400).json({ error: 'ProductId and VariantId are required' });
    }

    // Verify variant and stock
    const variant = await db.query('SELECT stock FROM product_variants WHERE id = ? AND product_id = ?', [variantId, productId]);
    if (!variant) {
      return res.status(404).json({ error: 'Product variant not found' });
    }

    const cart = getOrCreateCart(userId, sessionId);
    const existingItem = await db.queryOne('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?', [cart.id, variantId]);

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const newQty = currentQtyInCart + quantity;

    if (newQty > variant.stock) {
      return res.status(400).json({ error: `Only ${variant.stock} units available in stock.` });
    }

    if (existingItem) {
      await db.queryOne('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existingItem.id]);
    } else {
      await db.run('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)', [cart.id, productId, variantId, quantity]);
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
router.put('/update', optionalToken, async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    if (!cartItemId || quantity === undefined) {
      return res.status(400).json({ error: 'CartItemId and quantity are required' });
    }

    if (quantity <= 0) {
      await db.run('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    } else {
      // Stock check
      const cartItem = await db.run('SELECT variant_id FROM cart_items WHERE id = ?', [cartItemId]);
      if (cartItem) {
        const variant = await db.queryOne('SELECT stock FROM product_variants WHERE id = ?', [cartItem.variant_id]);
        if (variant && quantity > variant.stock) {
          return res.status(400).json({ error: `Only ${variant.stock} units available in stock.` });
        }
      }
      await db.queryOne('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItemId]);
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
router.delete('/item/:id', optionalToken, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;

    const item = await db.run(`
      SELECT ci.id, c.user_id, c.session_id 
      FROM cart_items ci 
      JOIN carts c ON ci.cart_id = c.id 
      WHERE ci.id = ?
    `, [req.params.id]);

    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (userId && item.user_id && item.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.queryOne('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete cart item' });
  }
});

// POST /api/cart/merge (Guest login cart merge)
router.post('/merge', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ message: 'No session cart to merge' });

    const guestCart = await db.run('SELECT id FROM carts WHERE session_id = ?', [sessionId]);
    if (!guestCart) return res.json({ message: 'No session cart found' });

    const userCart = getOrCreateCart(req.user.id, null);
    const guestItems = await db.queryOne('SELECT product_id, variant_id, quantity FROM cart_items WHERE cart_id = ?', [guestCart.id]);

    guestItems.forEach((gItem) => {
      const existingUserItem = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?', [userCart.id, gItem.variant_id]);
      if (existingUserItem) {
        db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [gItem.quantity, existingUserItem.id]);
      } else {
        await db.run('INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)', [userCart.id, gItem.product_id, gItem.variant_id, gItem.quantity]);
      }
    });

    // Clean up guest cart
    await db.run('DELETE FROM cart_items WHERE cart_id = ?', [guestCart.id]);
    await db.run('DELETE FROM carts WHERE id = ?', [guestCart.id]);

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
