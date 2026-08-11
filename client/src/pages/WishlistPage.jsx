import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <main className="section-space container" style={{ textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Heart size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>YOUR WISHLIST IS EMPTY</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Save your favorite items by clicking the heart icon on any product.</p>
        <Link to="/men" className="btn-primary">
          BROWSE COLLECTIONS
        </Link>
      </main>
    );
  }

  return (
    <main className="section-space container">
      <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '2px solid #111', paddingBottom: '0.75rem' }}>
        MY WISHLIST ({wishlistItems.length} ITEMS)
      </h1>

      <div className="product-grid">
        {wishlistItems.map(product => (
          <ProductCard key={product.id} product={product} onQuickView={() => {}} />
        ))}
      </div>
    </main>
  );
};

export default WishlistPage;
