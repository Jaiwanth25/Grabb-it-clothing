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
      .then(data => setProducts(data.slice(0, 4)))
      .catch(err => console.error('Fetch Trending Error:', err));
  }, [gender]);

  return (
    <section className="section-space container">
      <div className="section-header">
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#666', textTransform: 'uppercase' }}>
            MOST WANTED
          </span>
          <h2 className="section-title">TRENDING OUTFITS ({gender.toUpperCase()})</h2>
        </div>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        ))}
      </div>

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
