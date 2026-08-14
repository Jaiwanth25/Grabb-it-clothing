import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';
import { useGender } from '../context/GenderContext';

const TrendingSection = () => {
  const { gender } = useGender();
  const [products, setProducts] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products?gender=${gender}&isTrending=true`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(err => console.error('Fetch Trending Error:', err));
  }, [gender]);

  return (
    <section className="section-space container">
      <div className="section-header">
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
            MOST WANTED
          </span>
          <h2 className="section-title">TRENDING OUTFITS ({gender.toUpperCase()})</h2>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '16px' }}>
          No trending items currently listed for {gender}.
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </section>
  );
};

export default TrendingSection;
