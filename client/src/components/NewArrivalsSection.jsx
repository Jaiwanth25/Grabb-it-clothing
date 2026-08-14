import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import QuickViewModal from './QuickViewModal';
import { useGender } from '../context/GenderContext';
import { ArrowRight } from 'lucide-react';

const NewArrivalsSection = () => {
  const { gender } = useGender();
  const [products, setProducts] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products?gender=${gender}&isNew=true&limit=4`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(err => console.error('Fetch New Arrivals Error:', err));
  }, [gender]);

  return (
    <section className="section-space container">
      <div className="section-header">
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
            FRESH DROP 2026
          </span>
          <h2 className="section-title">NEW ARRIVALS</h2>
        </div>

        <Link to={`/${gender}?isNew=true`} className="btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.82rem' }}>
          VIEW ALL <ArrowRight size={16} />
        </Link>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '16px' }}>
          No new arrivals available yet. Check back soon for fresh drops!
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

export default NewArrivalsSection;
