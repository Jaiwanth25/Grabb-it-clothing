import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGender } from '../context/GenderContext';
import { ArrowRight } from 'lucide-react';

const GenderSelector = () => {
  const { setGender } = useGender();
  const navigate = useNavigate();

  const handleSelect = () => {
    setGender('men');
    navigate('/men');
  };

  return (
    <section className="section-space container">
      <div className="section-header">
        <h2 className="section-title">FEATURED STOREFRONT</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* MEN CARD */}
        <div
          onClick={handleSelect}
          style={{
            position: 'relative',
            height: '380px',
            backgroundColor: '#111',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '2.5rem',
            borderRadius: '16px'
          }}
          className="gender-select-card"
        >
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80"
            alt="Shop Men"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
          />
          <div style={{ position: 'relative', zIndex: 5, backgroundColor: '#ffffff', padding: '1.5rem 2rem', border: '1px solid #111', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#666', textTransform: 'uppercase' }}>
              DISCOVER APPAREL
            </span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', margin: '0.2rem 0 0.8rem 0' }}>
              MEN'S COLLECTION
            </h3>
            <button className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8rem' }}>
              EXPLORE CATALOG <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenderSelector;
