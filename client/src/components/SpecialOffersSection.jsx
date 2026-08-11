import React from 'react';
import { Link } from 'react-router-dom';

const SpecialOffersSection = () => {
  return (
    <section className="section-space container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Deal 1 */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '3rem', border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#e53935', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            LIMITED TIME OFFER
          </span>
          <h3 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>
            FLAT 20% OFF ON ORDERS OVER $60
          </h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Use promo code <strong style={{ color: '#111' }}>WELCOME20</strong> at checkout to unlock instant discounts across all jackets, denims, and knitwear.
          </p>
          <div>
            <Link to="/offers" className="btn-primary">
              SHOP SPECIAL OFFERS
            </Link>
          </div>
        </div>

        {/* Deal 2 */}
        <div style={{ backgroundColor: '#111111', color: '#ffffff', padding: '3rem', border: '1px solid #111', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#f5a623', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            FREE SHIPPING WORLDWIDE
          </span>
          <h3 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>
            EXPRESS 2-DAY DELIVERY
          </h3>
          <p style={{ color: '#bbb', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Order today and receive priority doorstep delivery with hassle-free 30-day money-back returns.
          </p>
          <div>
            <Link to="/men" className="btn-secondary" style={{ backgroundColor: '#ffffff', color: '#111111' }}>
              EXPLORE CATALOG
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffersSection;
