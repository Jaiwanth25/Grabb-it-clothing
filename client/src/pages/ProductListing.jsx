import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SlidersHorizontal, X, Star, Sparkles, Filter } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useGender } from '../context/GenderContext';
import { formatINR } from '../utils/currency';

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
    { name: 'Maroon', hex: '#4a0e17' },
    { name: 'Magenta', hex: '#800020' },
    { name: 'Saffron', hex: '#e65100' },
    { name: 'Turmeric', hex: '#e5a93b' },
    { name: 'Navy', hex: '#0a1931' },
    { name: 'Emerald', hex: '#0d5c46' }
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
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Gender</h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn-secondary ${pathGender === 'men' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
            onClick={() => { navigate('/men'); setGender('men'); }}
          >
            MEN
          </button>
          <button 
            className={`btn-secondary ${pathGender === 'women' ? 'btn-primary' : ''}`}
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
            onClick={() => { navigate('/women'); setGender('women'); }}
          >
            WOMEN
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Category</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            style={{ textAlign: 'left', fontSize: '0.88rem', fontWeight: selectedCategory === '' ? 800 : 500, color: selectedCategory === '' ? 'var(--color-saffron)' : 'var(--text-muted)', borderBottom: selectedCategory === '' ? '2px solid var(--color-saffron)' : 'none', paddingBottom: '2px', width: 'fit-content' }}
            onClick={() => setSelectedCategory('')}
          >
            All Apparel
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{ textAlign: 'left', fontSize: '0.88rem', color: selectedCategory === cat.slug ? 'var(--color-maroon)' : 'var(--text-muted)', fontWeight: selectedCategory === cat.slug ? 800 : 500, paddingBottom: '2px', borderBottom: selectedCategory === cat.slug ? '2px solid var(--color-saffron)' : 'none', width: 'fit-content' }}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price brackets filter */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Price Range</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {priceBrackets.map((br, idx) => {
            const isActive = minPrice === br.min && maxPrice === br.max;
            return (
              <button
                key={idx}
                style={{ textAlign: 'left', fontSize: '0.88rem', color: isActive ? 'var(--color-saffron)' : 'var(--text-muted)', fontWeight: isActive ? 800 : 500 }}
                onClick={() => handlePriceBracketClick(br)}
              >
                {br.label}
              </button>
            );
          })}
        </div>

        {/* Custom Price Range input */}
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>CUSTOM PRICE (INR ₹)</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <input 
              type="number" 
              placeholder="Min" 
              className="form-input" 
              style={{ width: '45%', padding: '0.4rem', fontSize: '0.8rem' }}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span style={{ color: 'var(--text-light)' }}>-</span>
            <input 
              type="number" 
              placeholder="Max" 
              className="form-input" 
              style={{ width: '45%', padding: '0.4rem', fontSize: '0.8rem' }}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Size filter */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Size</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(sz => (
            <button
              key={sz}
              className="btn-outline-gray"
              style={{
                backgroundColor: selectedSize === sz ? 'var(--color-maroon)' : 'transparent',
                color: selectedSize === sz ? '#ffffff' : 'var(--text-main)',
                borderColor: selectedSize === sz ? 'var(--color-maroon)' : 'var(--border-light)',
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
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Color</h4>
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
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Discount Offer</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['10', '20', '30', '40', '50', '60'].map(disc => (
            <button
              key={disc}
              style={{ textAlign: 'left', fontSize: '0.88rem', color: selectedDiscount === disc ? 'var(--color-saffron)' : 'var(--text-muted)', fontWeight: selectedDiscount === disc ? 800 : 500 }}
              onClick={() => setSelectedDiscount(selectedDiscount === disc ? '' : disc)}
            >
              {disc}% and above
            </button>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Rating</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[4, 3].map(rate => (
            <button
              key={rate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.88rem', color: selectedRating === String(rate) ? 'var(--color-maroon)' : 'var(--text-muted)', fontWeight: selectedRating === String(rate) ? 800 : 500 }}
              onClick={() => setSelectedRating(selectedRating === String(rate) ? '' : String(rate))}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {rate} <Star size={13} fill="var(--color-turmeric)" color="var(--color-turmeric)" /> &amp; above
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
          <input 
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-saffron)' }}
          />
          Exclude Out of Stock
        </label>
      </div>
    </div>
  );

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / 
        <Link to={`/${pathGender}`}>{pathGender.toUpperCase()}</Link>
        {activeCategoryObj && <span> / {activeCategoryObj.name.toUpperCase()}</span>}
        {selectedCollection && <span> / {selectedCollection.replace('-', ' ').toUpperCase()}</span>}
        {searchTerm && <span> / SEARCH: "{searchTerm}"</span>}
      </div>

      {/* Page header and controls */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-maroon)' }}>
            {activeCategoryObj 
              ? `${pathGender.toUpperCase()} ${activeCategoryObj.name}` 
              : selectedCollection
              ? `${selectedCollection.replace('-', ' ').toUpperCase()}`
              : `${pathGender.toUpperCase()}'S APPAREL`}
          </h1>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.5px' }}>
            {products.length} {products.length === 1 ? 'PRODUCT' : 'PRODUCTS'} FOUND
          </span>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-maroon)' }}>Sort By:</label>
            <select
              className="form-select"
              style={{ width: '195px', padding: '0.5rem', fontSize: '0.82rem', outline: 'none' }}
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
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '3rem' }} className="listing-main-layout">
        {/* Sidebar Filters (Desktop) */}
        <aside className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRight: '1px solid var(--border-light)', paddingRight: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-maroon)' }}>FILTERS</h3>
            {(selectedCategory || selectedCollection || selectedSize || selectedColor || minPrice || maxPrice || selectedDiscount || selectedRating || inStockOnly) && (
              <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', fontWeight: 800, textDecoration: 'underline' }}>
                RESET ALL
              </button>
            )}
          </div>
          {renderFiltersContent()}
        </aside>

        {/* Product Grid */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: 'var(--text-light)' }}>
              <div style={{ width: '42px', height: '42px', border: '3px solid var(--border-light)', borderTopColor: 'var(--color-saffron)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.9rem', marginTop: '1rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--color-maroon)' }}>FETCHING FESTIVE DROPS...</span>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--color-maroon)' }}>No styles found. Try another collection.</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '2rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
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

      {/* Mobile filter sheet */}
      {mobileFilterOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(36, 12, 20, 0.6)', zIndex: 1100, backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileFilterOpen(false)}
          />
          <div 
            style={{ 
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '360px', 
              backgroundColor: 'var(--bg-main)', zIndex: 1200, padding: '1.5rem', overflowY: 'auto',
              boxShadow: '-6px 0 30px rgba(74, 14, 23, 0.2)', display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-maroon)' }}>FILTERS</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(selectedCategory || selectedCollection || selectedSize || selectedColor || minPrice || maxPrice || selectedDiscount || selectedRating || inStockOnly) && (
                  <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', fontWeight: 800 }}>RESET</button>
                )}
                <button onClick={() => setMobileFilterOpen(false)} className="icon-btn">
                  <X size={20} color="var(--color-maroon)" />
                </button>
              </div>
            </div>
            
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
