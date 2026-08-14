import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { wishlistItems } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <main className="section-space container" style={{ textAlign: 'center', minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Heart size={56} color="var(--color-magenta)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
          SAVE THE STYLES YOU LOVE.
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '440px', fontSize: '1rem' }}>
          Tap the heart icon on any product to save it for your next outfit drop.
        </p>
        <Link to="/men" className="btn-primary" style={{ padding: '1rem 2.25rem' }}>
          EXPLORE THE COLLECTIONS <ArrowRight size={18} />
        </Link>
      </main>
    );
  }

  return (
    <main className="section-space container" style={{ minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Sparkles size={16} color="var(--color-saffron)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--color-saffron)', textTransform: 'uppercase' }}>
          YOUR FAVORITES
        </span>
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '2rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '1rem' }}>
        MY WISHLIST ({wishlistItems.length} STYLES)
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
