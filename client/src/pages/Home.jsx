import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import NewArrivalsSection from '../components/NewArrivalsSection';
import CategorySection from '../components/CategorySection';
import TrendingSection from '../components/TrendingSection';
import SpecialOffersSection from '../components/SpecialOffersSection';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useGender } from '../context/GenderContext';

const Home = () => {
  const { gender } = useGender();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [looks, setLooks] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    // Fetch Featured Products
    fetch(`/api/products?gender=${gender}&isFeatured=true`)
      .then(res => res.json())
      .then(data => setFeaturedProducts(data.slice(0, 4)))
      .catch(err => console.error('Fetch Featured Products Error:', err));

    // Fetch Collections
    fetch(`/api/collections?gender=${gender}`)
      .then(res => res.json())
      .then(data => setCollections(data.slice(0, 3)))
      .catch(err => console.error('Fetch Collections Error:', err));

    // Fetch Looks
    fetch(`/api/looks?gender=${gender}`)
      .then(res => res.json())
      .then(data => setLooks(data.slice(0, 2)))
      .catch(err => console.error('Fetch Looks Error:', err));
  }, [gender]);

  // Styles definitions for visual styles (men vs women)
  const stylesList = gender === 'men' 
    ? [
        { name: 'Streetwear', search: 'oversized', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80' },
        { name: 'Minimalist', search: 'essential', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
        { name: 'Smart Casual', search: 'shirt', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80' },
        { name: 'Relaxed Fit', search: 'linen', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80' }
      ]
    : [
        { name: 'Chic Outfits', search: 'poplin', img: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80' },
        { name: 'Minimalist', search: 'knit', img: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&auto=format&fit=crop&q=80' },
        { name: 'Weekend Vibe', search: 'shorts', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80' },
        { name: 'Street Casual', search: 'denim', img: 'https://images.unsplash.com/photo-1582418702059-97ebdfb35d09?w=800&auto=format&fit=crop&q=80' }
      ];

  return (
    <main style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Hero Carousel Banner */}
      <BannerCarousel />

      {/* 2. Brand Positioning Statement */}
      <section style={{ textAlign: 'center', padding: '5rem 1rem 4rem 1rem' }} className="container">
        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-light)', textTransform: 'uppercase' }}>
          GRABB-IT CLOTHING
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', fontWeight: 400, marginTop: '0.75rem', letterSpacing: '-0.5px' }}>
          Your everyday style. <span style={{ fontStyle: 'italic' }}>Your next grab.</span>
        </h1>
        <p style={{ maxWidth: '600px', margin: '1rem auto 0 auto', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Meticulously tailored streetwear and premium essentials engineered for modern confidence. Clean silhouettes, heavy drops, and timeless neutral cuts.
        </p>
      </section>

      {/* 3. Shop by Style (Horizontal Grid) */}
      <section className="container section-space" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-light)', textTransform: 'uppercase' }}>
              CHOOSE YOUR VIBE
            </span>
            <h2 className="section-title">SHOP BY STYLE</h2>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {stylesList.map((style, i) => (
            <Link 
              key={i} 
              to={`/${gender}?search=${encodeURIComponent(style.search)}`} 
              className="look-card"
              style={{ display: 'block', height: '320px' }}
            >
              <img src={style.img} alt={style.name} className="look-img" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(to top, rgba(18,18,18,0.85), transparent)', color: '#ffffff' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                  {style.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. New Arrivals */}
      <NewArrivalsSection />

      {/* 5. Collections (Curated Drops) */}
      {collections.length > 0 && (
        <section id="collections" className="section-space container">
          <div className="section-header">
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-light)', textTransform: 'uppercase' }}>
                CURATED CAMPAIGNS
              </span>
              <h2 className="section-title">EXCLUSIVE COLLECTIONS</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {collections.map(col => (
              <Link key={col.id} to={`/${gender}?collection=${col.slug}`} className="look-card" style={{ display: 'block' }}>
                <img src={col.cover_image} alt={col.name} className="look-img" style={{ height: '400px' }} />
                <div style={{ padding: '1.25rem 0' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                    {col.name}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    {col.description}
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.8rem', marginTop: '0.75rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '2px' }}>
                    DISCOVER DROP
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 6. Shop The Look Outfit Combinations */}
      {looks.length > 0 && (
        <section className="shop-the-look-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-light)', textTransform: 'uppercase' }}>
                  STYLE INSPO
                </span>
                <h2 className="section-title">SHOP THE LOOK</h2>
              </div>
            </div>

            {looks.map((look) => (
              <div key={look.id} className="look-grid" style={{ marginBottom: '4rem' }}>
                {/* Look Canvas */}
                <div className="look-card">
                  <img src={look.image_url} alt={look.name} className="look-img" />
                  <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', color: '#ffffff', zIndex: 10 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
                      {look.name}
                    </h3>
                    <p style={{ fontSize: '0.95rem', fontWeight: 300, opacity: 0.9, marginTop: '0.25rem' }}>
                      {look.description}
                    </p>
                  </div>
                </div>

                {/* Outfit Products list */}
                <div className="look-products">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    PRODUCTS IN OUTFIT
                  </h4>
                  {look.products && look.products.map(prod => (
                    <div key={prod.id} className="look-prod-item">
                      <img src={prod.primary_image} alt={prod.name} className="look-prod-img" />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-light)' }}>
                          {prod.category?.name || 'Apparel'}
                        </span>
                        <h5 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.15rem 0' }}>
                          {prod.name}
                        </h5>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                          <span style={{ fontWeight: 800 }}>
                            ₹{prod.sale_price || prod.price}
                          </span>
                          {prod.sale_price && (
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                              ₹{prod.price}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to={`/product/${prod.slug}`} className="btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.75rem' }}>
                        VIEW PRODUCT
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Trending Now */}
      <TrendingSection />

      {/* 8. Special Promo Offers */}
      <SpecialOffersSection />

      {/* 9. Curated Products Catalog */}
      <section className="section-space container">
        <div className="section-header">
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-light)', textTransform: 'uppercase' }}>
              HOT DROPS
            </span>
            <h2 className="section-title">CURATED BASICS ({gender.toUpperCase()})</h2>
          </div>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </main>
  );
};

export default Home;
