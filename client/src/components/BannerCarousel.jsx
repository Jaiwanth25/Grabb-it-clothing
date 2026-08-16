import React from 'react';
import { Link } from 'react-router-dom';

const BannerCarousel = () => {
  return (
    <section className="monochrome-hero">
      {/* Background High-Fashion Photography */}
      <img
        src="https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1800&auto=format&fit=crop&q=80&sat=-100"
        alt="Grabb-it Male Streetwear Fashion Campaign"
        className="monochrome-hero-img"
      />
      
      {/* Dark Readability Overlay */}
      <div className="monochrome-hero-overlay" />

      {/* Hero Content Box */}
      <div className="monochrome-hero-content container">
        <h1 className="monochrome-hero-title">WEAR YOUR ATTITUDE.</h1>
        <p className="monochrome-hero-subtitle">
          Modern fits. Everyday essentials. Built for your style.
        </p>
        <Link to="/men" className="monochrome-hero-btn">
          SHOP COLLECTION
        </Link>
      </div>
    </section>
  );
};

export default BannerCarousel;
