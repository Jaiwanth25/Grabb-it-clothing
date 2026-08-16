import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Flame, ShoppingBag } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import NewArrivalsSection from '../components/NewArrivalsSection';
import CategorySection from '../components/CategorySection';
import TrendingSection from '../components/TrendingSection';
import SpecialOffersSection from '../components/SpecialOffersSection';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useGender } from '../context/GenderContext';
import { formatINR } from '../utils/currency';

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

  // Style aesthetics definitions (Men's Fashion)
  const stylesList = [
    { name: 'Oversized Streetwear', search: 'oversized', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80' },
    { name: 'Minimalist Solids', search: 'essential', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
    { name: 'Smart Resort Shirts', search: 'shirt', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80' },
    { name: 'Breezy Linen Cuts', search: 'linen', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80' }
  ];

  return (
    <main style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* 1. Hero Carousel Banner */}
      <BannerCarousel />

      {/* 2. Brand Positioning Statement */}
      <section style={{ textAlign: 'center', padding: '5.5rem 1rem 4.5rem 1rem' }} className="container">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--text-dark)" />
          <span className="badge-carnival">
            PASTEL FASHION EDIT
          </span>
          <Sparkles size={16} color="var(--text-dark)" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '3.25rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-dark)', lineHeight: 1.15 }}>
          STYLE THAT <span style={{ color: 'var(--text-dark)', textDecoration: 'underline decoration-wavy var(--color-accent)' }}>CELEBRATES YOU.</span>
        </h1>
        <p style={{ maxWidth: '640px', margin: '1.25rem auto 2.25rem auto', color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, fontWeight: 600 }}>
          Contemporary fashion inspired by soft pastel tones, breezy silhouettes, and effortless cuts.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to={`/${gender}`} className="btn-primary">
            <ShoppingBag size={18} /> SHOP THE COLLECTION
          </Link>
          <Link to={`/${gender}?isNew=true`} className="btn-secondary">
            EXPLORE NEW DROPS <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* 3. SIGNATURE SECTION — THE GRABB-IT EDIT */}
      <section className="carnival-banner-section">
        <div className="container carnival-grid">
          <div className="carnival-content-box">
            <div className="carnival-tag">
              <Flame size={18} color="var(--text-dark)" /> THE GRABB-IT EDIT
            </div>
            <h2 className="carnival-heading">
              PASTEL. PLAYFUL.<br />CONFIDENCE.
            </h2>
            <p className="carnival-desc">
              Step into a celebration of soft pastel streetwear. High-density organic cottons, gentle peach tones, and relaxed silhouettes tailored for effortless style.
            </p>
            <Link to={`/${gender}?isTrending=true`} className="btn-saffron">
              SHOP THE GRABB-IT EDIT <ArrowRight size={18} />
            </Link>
          </div>
          <div className="carnival-img-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80" 
              alt="Grabb-it Edit Fashion" 
              className="carnival-img" 
            />
          </div>
        </div>
      </section>

      {/* 4. Shop by Category */}
      <CategorySection />

      {/* 5. Shop by Style / Vibe */}
      <section className="container section-space">
        <div className="section-header">
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
              CHOOSE YOUR VIBE
            </span>
            <h2 className="section-title">SHOP BY STYLE</h2>
          </div>
          <Link to={`/${gender}`} className="btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.82rem' }}>
            VIEW ALL STYLES
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.75rem' }}>
          {stylesList.map((style, i) => (
            <Link 
              key={i} 
              to={`/${gender}?search=${encodeURIComponent(style.search)}`} 
              className="category-card"
              style={{ display: 'block', height: '340px' }}
            >
              <img src={style.img} alt={style.name} className="category-card-img" />
              <div className="category-card-content">
                <span className="category-card-title">{style.name}</span>
                <ArrowRight size={18} color="var(--text-dark)" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. New Arrivals */}
      <NewArrivalsSection />

      {/* 7. Curated Collections (Exclusive Drops) */}
      {collections.length > 0 && (
        <section id="collections" className="section-space container">
          <div className="section-header">
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
                CURATED CAMPAIGNS
              </span>
              <h2 className="section-title">EXCLUSIVE DROPS &amp; EDITORIALS</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {collections.map(col => (
              <Link key={col.id} to={`/${gender}?collection=${col.slug}`} className="category-card" style={{ display: 'block', height: '420px', borderRadius: '16px' }}>
                <img src={col.cover_image} alt={col.name} className="category-card-img" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(43, 43, 43, 0.92) 0%, rgba(43, 43, 43, 0.25) 60%, transparent 100%)', zIndex: 1 }} />
                <div style={{ position: 'relative', zIndex: 2, padding: '1.75rem', color: '#ffffff' }}>
                  <span className="badge-carnival" style={{ marginBottom: '0.6rem', display: 'inline-block' }}>LIMITED DROP</span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-title)', color: '#ffffff' }}>
                    {col.name}
                  </h3>
                  <p style={{ color: '#fffdf9', fontSize: '0.95rem', marginTop: '0.4rem', lineHeight: 1.45, fontWeight: 500 }}>
                    {col.description}
                  </p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.88rem', marginTop: '1.1rem', color: 'var(--color-highlight)' }}>
                    DISCOVER COLLECTION <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 8. Shop The Look Outfit Combinations */}
      {looks.length > 0 && (
        <section id="looks" className="shop-the-look-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
                  STYLE INSPO
                </span>
                <h2 className="section-title">SHOP THE LOOK</h2>
              </div>
            </div>

            {looks.map((look) => (
              <div key={look.id} className="look-grid" style={{ marginBottom: '4rem' }}>
                {/* Look Canvas */}
                <div className="look-card" style={{ borderRadius: '16px', border: '2px solid var(--border-light)', overflow: 'hidden' }}>
                  <img src={look.image_url} alt={look.name} className="look-img" style={{ borderRadius: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }} />
                  <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', color: 'var(--text-dark)', zIndex: 10, background: 'rgba(255, 253, 249, 0.95)', backdropFilter: 'blur(10px)', padding: '1.35rem', borderRadius: '16px', border: '2px solid var(--color-primary)' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-title)', textTransform: 'uppercase', color: 'var(--text-dark)' }}>
                      {look.name}
                    </h3>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
                      {look.description}
                    </p>
                  </div>
                </div>

                {/* Outfit Products list */}
                <div className="look-products">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    PRODUCTS IN THIS OUTFIT
                  </h4>
                  {look.products && look.products.map(prod => (
                    <div key={prod.id} className="look-prod-item" style={{ borderRadius: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', border: '2px solid var(--border-light)' }}>
                      <img src={prod.primary_image} alt={prod.name} className="look-prod-img" style={{ borderRadius: '12px' }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {prod.category?.name || 'Apparel'}
                        </span>
                        <h5 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--text-dark)' }}>
                          {prod.name}
                        </h5>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.95rem' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-title)' }}>
                            {formatINR(prod.sale_price || prod.price)}
                          </span>
                          {prod.sale_price && (
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: 600 }}>
                              {formatINR(prod.price)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link to={`/product/${prod.slug}`} className="btn-primary" style={{ padding: '0.6rem 1.1rem', fontSize: '0.78rem' }}>
                        VIEW ITEM
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. Trending Outfits */}
      <TrendingSection />

      {/* 10. Special Promo Offers */}
      <SpecialOffersSection />

      {/* 11. Curated Products Catalog */}
      <section className="section-space container">
        <div className="section-header">
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
              MUST-HAVE DROPS
            </span>
            <h2 className="section-title">CURATED ESSENTIALS (MEN)</h2>
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
