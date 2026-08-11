import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useGender } from '../context/GenderContext';

const ProductListing = () => {
  const { gender: globalGender, setGender } = useGender();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Determine active gender from path or context
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
  const [selectedSize, setSelectedSize] = useState(queryParams.get('size') || '');
  const [selectedColor, setSelectedColor] = useState(queryParams.get('color') || '');
  const [maxPrice, setMaxPrice] = useState(queryParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(queryParams.get('sort') || 'recommended');
  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');

  // Fetch Categories for active gender
  useEffect(() => {
    fetch(`/api/categories?gender=${pathGender}`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Fetch categories error:', err));
  }, [pathGender]);

  // Sync state from query params on navigate
  useEffect(() => {
    setSelectedCategory(queryParams.get('category') || '');
    setSearchTerm(queryParams.get('search') || '');
  }, [location.search]);

  // Fetch Products based on filters
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('gender', pathGender);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSize) params.set('size', selectedSize);
    if (selectedColor) params.set('color', selectedColor);
    if (maxPrice) params.set('maxPrice', maxPrice);
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
  }, [pathGender, selectedCategory, selectedSize, selectedColor, maxPrice, sortBy, searchTerm, location.search]);

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setMaxPrice('');
    setSortBy('recommended');
    setSearchTerm('');
  };

  const activeCategoryObj = categories.find(c => c.slug === selectedCategory);

  return (
    <main className="section-space container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/">HOME</Link> / 
        <Link to={`/${pathGender}`}>{pathGender.toUpperCase()}</Link>
        {activeCategoryObj && <span>/ {activeCategoryObj.name.toUpperCase()}</span>}
        {searchTerm && <span>/ SEARCH: "{searchTerm}"</span>}
      </div>

      {/* Title & Product Count Bar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #111', paddingBottom: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>
            {activeCategoryObj ? `${pathGender.toUpperCase()} ${activeCategoryObj.name}` : `${pathGender.toUpperCase()}'S APPAREL`}
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        {/* Desktop Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Sort By:</label>
            <select
              className="form-select"
              style={{ width: '180px', padding: '0.5rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popularity">Popularity</option>
            </select>
          </div>

          <button
            className="btn-outline-gray mobile-only"
            onClick={() => setMobileFilterOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Sidebar + Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem' }} className="listing-main-layout">
        {/* Sidebar Filters (Desktop) */}
        <aside className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase' }}>FILTERS</h3>
            {(selectedCategory || selectedSize || selectedColor || maxPrice) && (
              <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', color: '#e53935', fontWeight: 700 }}>
                CLEAR ALL
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="form-label" style={{ marginBottom: '0.5rem' }}>Categories ({pathGender})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                style={{ textAlign: 'left', fontSize: '0.85rem', fontWeight: selectedCategory === '' ? 800 : 500 }}
                onClick={() => setSelectedCategory('')}
              >
                All {pathGender.toUpperCase()} Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  style={{ textAlign: 'left', fontSize: '0.85rem', color: selectedCategory === cat.slug ? '#111' : '#666', fontWeight: selectedCategory === cat.slug ? 800 : 500 }}
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  {cat.name} ({cat.product_count || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div>
            <h4 className="form-label" style={{ marginBottom: '0.5rem' }}>Size</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                <button
                  key={sz}
                  className="btn-outline-gray"
                  style={{
                    backgroundColor: selectedSize === sz ? '#111' : '#fff',
                    color: selectedSize === sz ? '#fff' : '#111',
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.75rem'
                  }}
                  onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Filter */}
          <div>
            <h4 className="form-label" style={{ marginBottom: '0.5rem' }}>Max Price: ${maxPrice || '150'}</h4>
            <input
              type="range"
              min="20"
              max="150"
              step="10"
              value={maxPrice || '150'}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </aside>

        {/* Product Grid Container */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#888' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: '#f9f9f9', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>No products match your criteria</h3>
              <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try clearing filters or searching for another apparel item.</p>
              <button className="btn-primary" onClick={clearAllFilters}>CLEAR FILTERS</button>
            </div>
          ) : (
            <div className="product-grid">
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
