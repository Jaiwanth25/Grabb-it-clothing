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
      .then(data => setProducts(data.slice(0, 4)))
      .catch(err => console.error('Fetch New Arrivals Error:', err));
  }, [gender]);

  return (
    <section className="section-space container">
      <div className="section-header">
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#666', textTransform: 'uppercase' }}>
            FRESH DROP 2026
          </span>
          <h2 className="section-title">NEW ARRIVALS</h2>
        </div>

        <Link to={`/${gender}?isNew=true`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          VIEW ALL <ArrowRight size={16} />
        </Link>
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

export default NewArrivalsSection;
