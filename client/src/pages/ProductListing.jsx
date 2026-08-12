import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, X, Star } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useGender } from '../context/GenderContext';

const ProductListing = () => {
  const { gender: globalGender, setGender } = useGender();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // Determine active gender from path or query params or context
  const pathGender = location.pathname.includes('/women') ? 'women' : location.pathname.includes('/men') ? 'men' : globalGender;

  useEffect(() => {
    if (pathGender !== globalGender) {
      setGender(pathGender);
    }
  }, [location.pathname]);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(queryParams.get('category') || '');
  const [selectedCollection, setSelectedCollection] = useState(queryParams.get('collection') || '');
  const [selectedSize, setSelectedSize] = useState(queryParams.get('size') || '');
  const [selectedColor, setSelectedColor] = useState(queryParams.get('color') || '');
  const [minPrice, setMinPrice] = useState(queryParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(queryParams.get('maxPrice') || '');
  const [selectedDiscount, setSelectedDiscount] = useState(queryParams.get('discount') || '');
  const [selectedRating, setSelectedRating] = useState(queryParams.get('rating') || '');
  const [inStockOnly, setInStockOnly] = useState(queryParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState(queryParams.get('sort') || 'recommended');
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');

  // Predefined price ranges in INR
  const priceBrackets = [
    { label: 'Under ₹499', min: '', max: '499' },
    { label: '₹500 – ₹999', min: '500', max: '999' },
    { label: '₹1,000 – ₹1,499', min: '1000', max: '1499' },
    { label: '₹1,500 – ₹2,499', min: '1500', max: '2499' },
    { label: '₹2,500+', min: '2500', max: '' }
  ];

  // Visual color swatches
  const colorSwatches = [
    { name: 'Black', hex: '#111111' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Gray', hex: '#8e8d89' },
    { name: 'Beige', hex: '#f5f2eb' },
    { name: 'Olive', hex: '#4b5320' },
    { name: 'Navy', hex: '#0a1931' },
    { name: 'Indigo', hex: '#1c2833' },
    { name: 'Blue', hex: '#3498db' },
    { name: 'Terracotta', hex: '#c05c46' },
    { name: 'Camel', hex: '#c19a6b' }
  ];

  // Fetch Categories for active gender
  useEffect(() => {
    fetch(`/api/categories?gender=${pathGender}`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Fetch categories error:', err));
  }, [pathGender]);

  // Sync state from query params on navigate (e.g. search click)
  useEffect(() => {
    setSelectedCategory(queryParams.get('category') || '');
    setSelectedCollection(queryParams.get('collection') || '');
    setSearchTerm(queryParams.get('search') || '');
  }, [location.search]);

  // Fetch Products based on filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('gender', pathGender);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCollection) params.set('collection', selectedCollection);
    if (selectedSize) params.set('size', selectedSize);
    if (selectedColor) params.set('color', selectedColor);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (selectedDiscount) params.set('discount', selectedDiscount);
    if (selectedRating) params.set('rating', selectedRating);
    if (inStockOnly) params.set('inStock', 'true');
    if (sortBy) params.set('sort', sortBy);
    if (searchTerm) params.set('search', searchTerm);

    if (queryParams.get('isNew')) params.set('isNew', 'true');
    if (queryParams.get('isTrending')) params.set('isTrending', 'true');

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch products error:', err);
        setLoading(false);
      });
  }, [pathGender, selectedCategory, selectedCollection, selectedSize, selectedColor, minPrice, maxPrice, selectedDiscount, selectedRating, inStockOnly, sortBy, searchTerm, location.search]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedCollection('');
    setSelectedSize('');
    setSelectedColor('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedDiscount('');
    setSelectedRating('');
    setInStockOnly(false);
    setSortBy('recommended');
    setSearchTerm('');
    navigate(`/${pathGender}`);
  };

  const handlePriceBracketClick = (bracket) => {
    if (minPrice === bracket.min && maxPrice === bracket.max) {
      // Toggle off
      setMinPrice('');
      setMaxPrice('');
    } else {
      setMinPrice(bracket.min);
      setMaxPrice(bracket.max);
    }
  };

  const activeCategoryObj = categories.find(c => c.slug === selectedCategory);

  const renderFiltersContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Gender selection */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Gender</h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn-secondary ${pathGender === 'men' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', border: '1px solid #121212', backgroundColor: pathGender === 'men' ? '#121212' : '#ffffff', color: pathGender === 'men' ? '#ffffff' : '#121212' }}
            onClick={() => { navigate('/men'); setGender('men'); }}
          >
            MEN
          </button>
          <button 
            className={`btn-secondary ${pathGender === 'women' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', border: '1px solid #121212', backgroundColor: pathGender === 'women' ? '#121212' : '#ffffff', color: pathGender === 'women' ? '#ffffff' : '#121212' }}
            onClick={() => { navigate('/women'); setGender('women'); }}
          >
            WOMEN
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Category</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: selectedCategory === '' ? 800 : 500, borderBottom: selectedCategory === '' ? '1px solid #111' : 'none', paddingBottom: '2px', width: 'fit-content' }}
            onClick={() => setSelectedCategory('')}
          >
            All Apparel
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{ textAlign: 'left', fontSize: '0.85rem', color: selectedCategory === cat.slug ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: selectedCategory === cat.slug ? 800 : 500, paddingBottom: '2px', borderBottom: selectedCategory === cat.slug ? '1px solid #111' : 'none', width: 'fit-content' }}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price brackets filter */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Price range</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {priceBrackets.map((br, idx) => {
            const isActive = minPrice === br.min && maxPrice === br.max;
            return (
              <button
                key={idx}
                style={{ textAlign: 'left', fontSize: '0.85rem', color: isActive ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isActive ? 800 : 500 }}
                onClick={() => handlePriceBracketClick(br)}
              >
                {br.label}
              </button>
            );
          })}
        </div>

        {/* Custom Price Range sliders */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>CUSTOM PRICE (INR)</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <input 
              type="number" 
              placeholder="Min" 
              className="form-select" 
              style={{ width: '45%', padding: '0.35rem', fontSize: '0.8rem' }}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span style={{ color: 'var(--text-light)' }}>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className="form-select" 
              style={{ width: '45%', padding: '0.35rem', fontSize: '0.8rem' }}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Size filter */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Size</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => (
            <button
              key={sz}
              className="btn-outline-gray"
              style={{
                backgroundColor: selectedSize === sz ? 'var(--text-main)' : 'transparent',
                color: selectedSize === sz ? '#ffffff' : 'var(--text-main)',
                border: '1px solid var(--text-main)',
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
              onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Color visual swatches */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Color</h4>
        <div className="color-swatches-grid">
          {colorSwatches.map(col => (
            <div 
              key={col.name}
              className={`color-swatch-circle ${selectedColor.toLowerCase() === col.name.toLowerCase() ? 'selected' : ''}`}
              onClick={() => setSelectedColor(selectedColor.toLowerCase() === col.name.toLowerCase() ? '' : col.name)}
            >
              <div className="color-swatch-inner" style={{ backgroundColor: col.hex }} title={col.name} />
            </div>
          ))}
        </div>
      </div>

      {/* Discount offers */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Discount Offer</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['10', '20', '30', '40', '50', '60'].map(disc => (
            <button
              key={disc}
              style={{ textAlign: 'left', fontSize: '0.85rem', color: selectedDiscount === disc ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: selectedDiscount === disc ? 800 : 500 }}
              onClick={() => setSelectedDiscount(selectedDiscount === disc ? '' : disc)}
            >
              {disc}% and above
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Rating</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[4, 3].map(rate => (
            <button
              key={rate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: selectedRating === String(rate) ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: selectedRating === String(rate) ? 800 : 500 }}
              onClick={() => setSelectedRating(selectedRating === String(rate) ? '' : String(rate))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {rate} <Star size={12} fill="var(--text-main)" color="var(--text-main)" /> & above
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          <input 
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--text-main)' }}
          />
          Exclude Out of Stock
        </label>
      </div>
    </div>
  );

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-light)' }}>
        <Link to="/">HOME</Link> / 
        <Link to={`/${pathGender}`}>{pathGender.toUpperCase()}</Link>
        {activeCategoryObj && <span> / {activeCategoryObj.name.toUpperCase()}</span>}
        {selectedCollection && <span> / {selectedCollection.replace('-', ' ').toUpperCase()}</span>}
        {searchTerm && <span> / SEARCH: "{searchTerm}"</span>}
      </div>

      {/* Page header and controls */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
            {activeCategoryObj 
              ? `${pathGender.toUpperCase()} ${activeCategoryObj.name}` 
              : selectedCollection
              ? `${selectedCollection.replace('-', ' ').toUpperCase()}`
              : `${pathGender.toUpperCase()}'S APPAREL`}
          </h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.5px' }}>
            {products.length} {products.length === 1 ? 'PRODUCT' : 'PRODUCTS'} FOUND
          </span>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Sort By:</label>
            <select
              className="form-select"
              style={{ width: '190px', padding: '0.45rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', borderRadius: '0px', outline: 'none' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="newest">What's New</option>
              <option value="popularity">Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>

          <button
            className="btn-primary mobile-only"
            onClick={() => setMobileFilterOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          >
            <SlidersHorizontal size={14} /> FILTERS
          </button>
        </div>
      </div>

      {/* Main PLP layout: Desktop Sidebar + Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '3rem' }} className="listing-main-layout">
        {/* Sidebar Filters (Desktop) */}
        <aside className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRight: '1px solid var(--border-light)', paddingRight: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px' }}>FILTERS</h3>
            {(selectedCategory || selectedCollection || selectedSize || selectedColor || minPrice || maxPrice || selectedDiscount || selectedRating || inStockOnly) && (
              <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', color: 'var(--accent-badge)', fontWeight: 800, textDecoration: 'underline' }}>
                RESET
              </button>
            )}
          </div>
          {renderFiltersContent()}
        </aside>

        {/* Product Grid */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: 'var(--text-light)' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--text-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.9rem', marginTop: '1rem', fontWeight: 600, letterSpacing: '1px' }}>FETCHING DROPS...</span>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: '#ffffff', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>No fits match your filters</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Try relaxing your search keywords, clearing selected color swatches, or resetting filters to start over.
              </p>
              <button className="btn-primary" onClick={clearAllFilters}>RESET ALL FILTERS</button>
            </div>
          ) : (
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer drawer backdrop & sliding sheet */}
      {mobileFilterOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}
            onClick={() => setMobileFilterOpen(false)}
          />
          <div 
            style={{ 
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '360px', 
              backgroundColor: '#faf9f6', zIndex: 1200, padding: '1.5rem', overflowY: 'auto',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #111', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>FILTERS</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(selectedCategory || selectedCollection || selectedSize || selectedColor || minPrice || maxPrice || selectedDiscount || selectedRating || inStockOnly) && (
                  <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', color: 'var(--accent-badge)', fontWeight: 800 }}>RESET</button>
                )}
                <button onClick={() => setMobileFilterOpen(false)} style={{ display: 'flex', alignItems: 'center' }} className="icon-btn">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Filters components */}
            {renderFiltersContent()}

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
              onClick={() => setMobileFilterOpen(false)}
            >
              APPLY FILTERS
            </button>
          </div>
        </>
      )}

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

export default ProductListing;
