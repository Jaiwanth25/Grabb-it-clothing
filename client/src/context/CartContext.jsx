import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Generate or retrieve session ID for guests
  const [sessionId] = useState(() => {
    let sId = localStorage.getItem('grabb_it_session_id');
    if (!sId) {
      sId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('grabb_it_session_id', sId);
    }
    return sId;
  });

  const fetchCart = async () => {
    try {
      const headers = { 'x-session-id': sessionId };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/cart', { headers });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.items || []);
        setSubtotal(data.subtotal || 0);
        setCount(data.count || 0);
      }
    } catch (err) {
      console.error('Fetch Cart Error:', err);
    }
  };

  // Merge guest cart on login
  useEffect(() => {
    if (user && token) {
      fetch('/api/cart/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      })
        .then(() => fetchCart())
        .catch(err => console.error('Cart Merge Error:', err));
    } else {
      fetchCart();
    }
  }, [user, token]);

  const addToCart = async (productId, variantId, quantity = 1) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, variantId, quantity, sessionId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add item');
      }

      setCartItems(data.items || []);
      setSubtotal(data.subtotal || 0);
      setCount(data.count || 0);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/cart/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ cartItemId, quantity, sessionId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCartItems(data.items || []);
      setSubtotal(data.subtotal || 0);
      setCount(data.count || 0);
    } catch (err) {
      alert(err.message || 'Could not update quantity');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      await fetch(`/api/cart/item/${cartItemId}`, { method: 'DELETE' });
      fetchCart();
    } catch (err) {
      console.error('Remove Item Error:', err);
    }
  };

  const applyCoupon = async (code) => {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAppliedCoupon(data);
      setDiscountAmount(data.discountAmount);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const clearCart = () => {
    setCartItems([]);
    setSubtotal(0);
    setCount(0);
    removeCoupon();
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        subtotal,
        count,
        sessionId,
        appliedCoupon,
        discountAmount,
        addToCart,
        updateQuantity,
        removeItem,
        applyCoupon,
        removeCoupon,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
