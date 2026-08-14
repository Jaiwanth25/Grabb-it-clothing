import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBanners(data);
        }
      })
      .catch(err => console.error('Fetch Banners Error:', err));
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      handleNext();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      handlePrev();
    }
  };

  if (!banners.length) return null;

  return (
    <div
      className="banner-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`banner-slide ${index === currentIndex ? 'active' : ''}`}
        >
          <img src={banner.image_url} alt={banner.title} className="banner-img" />
          <div className="container" style={{ position: 'relative', zIndex: 5 }}>
            <div className="banner-content">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Sparkles size={14} color="var(--color-saffron)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--color-saffron)', textTransform: 'uppercase' }}>
                  LIMITED DROP
                </span>
              </div>
              <h2 className="banner-title">{banner.title}</h2>
              {banner.subtitle && <p className="banner-subtitle">{banner.subtitle}</p>}
              <Link to={banner.button_link || '/men'} className="btn-primary">
                {banner.button_text || 'SHOP NOW'} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Desktop Arrow Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              top: '50%',
              left: '24px',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(250, 246, 240, 0.9)',
              border: '1px solid var(--border-light)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-maroon)',
              boxShadow: 'var(--shadow-card)',
              cursor: 'pointer'
            }}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              top: '50%',
              right: '24px',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: 'rgba(250, 246, 240, 0.9)',
              border: '1px solid var(--border-light)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-maroon)',
              boxShadow: 'var(--shadow-card)',
              cursor: 'pointer'
            }}
            aria-label="Next Slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots Pagination */}
          <div className="banner-controls">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`banner-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BannerCarousel;
