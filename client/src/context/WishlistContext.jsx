import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);

  const fetchWishlist = async () => {
    if (!token) {
      setWishlistItems([]);
      setWishlistIds([]);
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data);
        setWishlistIds(data.map(item => item.id));
      }
    } catch (err) {
      console.error('Fetch Wishlist Error:', err);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [token, user]);

  const toggleWishlist = async (productId) => {
    if (!token) {
      alert('Please sign in to save items to your wishlist.');
      return false;
    }
    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (res.ok) {
        fetchWishlist();
        return data.inWishlist;
      }
    } catch (err) {
      console.error('Toggle Wishlist Error:', err);
    }
    return false;
  };

  const isInWishlist = (productId) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistItems, wishlistIds, toggleWishlist, isInWishlist, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
