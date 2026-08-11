import React, { useState, useEffect } from 'react';
import BannerCarousel from '../components/BannerCarousel';
import NewArrivalsSection from '../components/NewArrivalsSection';
import GenderSelector from '../components/GenderSelector';
import CategorySection from '../components/CategorySection';
import TrendingSection from '../components/TrendingSection';
import SpecialOffersSection from '../components/SpecialOffersSection';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useGender } from '../context/GenderContext';

const Home = () => {
  const { gender } = useGender();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    fetch(`/api/products?gender=${gender}&isFeatured=true`)
      .then(res => res.json())
      .then(data => setFeaturedProducts(data.slice(0, 4)))
      .catch(err => console.error('Fetch Featured Products Error:', err));
  }, [gender]);

  return (
    <main>
      {/* 2. Hero/banner carousel */}
      <BannerCarousel />

      {/* 3. New Arrivals */}
      <NewArrivalsSection />

      {/* 4. Men's / Women's shopping selector */}
      <GenderSelector />

      {/* 5. Category section */}
      <CategorySection />

      {/* 6. Trending Outfits */}
      <TrendingSection />

      {/* 7. Special Offers */}
      <SpecialOffersSection />

      {/* 8. Featured Products */}
      <section className="section-space container">
        <div className="section-header">
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#666', textTransform: 'uppercase' }}>
              CURATED STYLES
            </span>
            <h2 className="section-title">FEATURED PRODUCTS ({gender.toUpperCase()})</h2>
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
