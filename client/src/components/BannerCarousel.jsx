import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
        if (data && data.length) {
          setBanners(data);
        } else {
          // Fallback defaults
          setBanners([
            {
              id: 1,
              title: 'NEW ARRIVALS 2026',
              subtitle: 'Fresh minimal styles designed for everyday confidence.',
              button_text: 'SHOP NOW',
              button_link: '/men',
              image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80'
            },
            {
              id: 2,
              title: 'WOMEN\'S ESSENTIALS',
              subtitle: 'Clean silhouettes, premium fabrics, effortless elegance.',
              button_text: 'SHOP WOMEN',
              button_link: '/women',
              image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80'
            }
          ]);
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
              <h2 className="banner-title">{banner.title}</h2>
              {banner.subtitle && <p className="banner-subtitle">{banner.subtitle}</p>}
              <Link to={banner.button_link || '/men'} className="btn-primary">
                {banner.button_text || 'SHOP NOW'}
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
              left: '20px',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: '#ffffff',
              border: '1px solid #111',
              padding: '0.75rem',
              cursor: 'pointer'
            }}
            aria-label="Previous Slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              zIndex: 10,
              backgroundColor: '#ffffff',
              border: '1px solid #111',
              padding: '0.75rem',
              cursor: 'pointer'
            }}
            aria-label="Next Slide"
          >
            <ChevronRight size={20} />
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
