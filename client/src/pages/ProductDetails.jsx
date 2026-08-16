import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Check, ShieldCheck, Truck, RotateCcw, Send, MapPin, X, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { formatINR } from '../utils/currency';

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, token } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  
  // Pincode state
  const [pincode, setPincode] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeError, setPincodeError] = useState('');

  // Size Guide Modal state
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPincodeResult(null);
    setPincodeError('');
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        if (data.images && data.images.length) {
          setSelectedImage(data.images[0].image_url);
        }
        if (data.variants && data.variants.length) {
          // Initialize with first available variant color/size
          setSelectedColor(data.variants[0].color);
          setSelectedSize(data.variants[0].size);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch Product Detail Error:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container section-space" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: 'var(--text-light)' }}>
        <div style={{ width: '42px', height: '42px', border: '3px solid var(--border-light)', borderTopColor: 'var(--color-saffron)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', marginTop: '1rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--color-maroon)' }}>LOADING SPEC SHEET...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container section-space" style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)' }}>FIT NOT FOUND</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1.5rem' }}>RETURN HOME</Link>
      </div>
    );
  }

  // Extract unique colors (name & hex)
  const colorMap = {};
  product.variants?.forEach(v => {
    if (v.color) {
      colorMap[v.color.toLowerCase()] = { name: v.color, hex: v.color_hex };
    }
  });
  const uniqueColors = Object.values(colorMap);

  // Extract unique sizes
  const uniqueSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].filter(sz => 
    product.variants?.some(v => v.size === sz)
  );

  // Active Variant based on color and size selection
  const activeVariant = product.variants?.find(
    v => v.size === selectedSize && v.color.toLowerCase() === selectedColor.toLowerCase()
  );

  // Check if size is in stock for currently selected color
  const checkSizeStock = (sz) => {
    const variant = product.variants?.find(
      v => v.size === sz && v.color.toLowerCase() === selectedColor.toLowerCase()
    );
    return variant ? variant.stock > 0 : false;
  };

  const inStock = activeVariant ? activeVariant.stock > 0 : false;
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = async () => {
    setMsg('');
    setError('');
    if (!selectedColor) return setError('Please select a color variant');
    if (!selectedSize) return setError('Please select a size variant');
    if (!activeVariant) return setError('Selected variant combinations are currently unavailable');

    const res = await addToCart(product.id, activeVariant.id, quantity);
    if (res.success) {
      setMsg('FIT ADDED TO YOUR BAG!');
    } else {
      setError(res.error || 'Failed to add to bag');
    }
  };

  const handleBuyNow = async () => {
    if (!selectedColor || !selectedSize || !activeVariant) return;
    const res = await addToCart(product.id, activeVariant.id, quantity);
    if (res.success) {
      navigate('/checkout');
    }
  };

  const checkPincodeDelivery = async (e) => {
    e.preventDefault();
    setPincodeError('');
    setPincodeResult(null);

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit Indian Pincode (e.g. 560001).');
      return;
    }

    setCheckingPincode(true);
    try {
      const res = await fetch(`/api/products/shipping/check?pincode=${pincode}`);
      const data = await res.json();
      if (res.ok) {
        setPincodeResult(data);
      } else {
        setPincodeError(data.error || 'Pincode delivery verification failed.');
      }
    } catch (err) {
      setPincodeError('Network error checking delivery timeline.');
    } finally {
      setCheckingPincode(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to submit customer feedback.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          rating: newRating,
          comment: newComment
        })
      });
      if (res.ok) {
        setNewComment('');
        alert('Thank you! Your feedback has been verified and registered.');
        fetch(`/api/products/${slug}`).then(r => r.json()).then(d => setProduct(d));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Review Rating Breakdown calculation
  const totalReviews = product.reviews?.length || 0;
  const ratingDistribution = [0, 0, 0, 0, 0];
  if (totalReviews > 0) {
    product.reviews.forEach(r => {
      const index = Math.min(5, Math.max(1, r.rating)) - 1;
      ratingDistribution[index]++;
    });
  }

  const currentPrice = product.sale_price !== null && product.sale_price < product.price ? product.sale_price : product.price;

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / 
        <Link to={`/${product.gender}`}>{product.gender.toUpperCase()}</Link> / 
        <span>{product.name.toUpperCase()}</span>
      </div>

      {/* Main PDP View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', marginBottom: '5rem' }} className="product-detail-grid">
        
        {/* LEFT SECTION: Main picture + Thumbnails */}
        <div>
          {/* Main Visual Display */}
          <div style={{ backgroundColor: '#ffffff', position: 'relative', width: '100%', height: '620px', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
            <img
              src={selectedImage || product.primary_image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {product.sale_price !== null && product.sale_price < product.price && (
              <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
                <span className="badge-discount">
                  -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Gallery Carousel List */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    width: '90px',
                    height: '110px',
                    border: selectedImage === img.image_url ? '2px solid var(--color-saffron)' : '1px solid var(--border-light)',
                    padding: '2px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Info Specs & Cart Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Sparkles size={14} color="var(--color-saffron)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--color-saffron)', textTransform: 'uppercase' }}>
                GRABB-IT • {product.category?.name || 'MEN'}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginTop: '0.2rem', textTransform: 'uppercase', lineHeight: 1.15 }}>
              {product.name}
            </h1>
            
            {/* Star ratings summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--color-turmeric)' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={16} fill={star <= Math.round(product.rating || 5) ? 'var(--color-turmeric)' : 'none'} color="var(--color-turmeric)" />
                ))}
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-maroon)' }}>{product.rating || '4.8'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                • {totalReviews} CUSTOMER REVIEWS
              </span>
            </div>
          </div>

          {/* Price breakdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '1.25rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>
              {formatINR(currentPrice)}
            </span>
            {product.sale_price !== null && product.sale_price < product.price && (
              <>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                  {formatINR(product.price)}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', backgroundColor: 'var(--color-magenta)', padding: '0.4rem 0.75rem', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SAVE {formatINR(product.price - product.sale_price)}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: '1.65' }}>
            {product.description}
          </p>

          {/* COLOR SELECTOR */}
          {uniqueColors.length > 0 && (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
                COLOR: <strong style={{ color: 'var(--color-saffron)' }}>{selectedColor.toUpperCase()}</strong>
              </label>
              <div className="color-swatches-grid" style={{ marginTop: '0.6rem' }}>
                {uniqueColors.map(col => (
                  <div 
                    key={col.name}
                    className={`color-swatch-circle ${selectedColor.toLowerCase() === col.name.toLowerCase() ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedColor(col.name);
                      setSelectedSize('');
                    }}
                  >
                    <div className="color-swatch-inner" style={{ backgroundColor: col.hex }} title={col.name} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIZE SELECTOR */}
          {uniqueSizes.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
                  SELECT SIZE: {selectedSize && <strong style={{ color: 'var(--color-saffron)' }}>{selectedSize}</strong>}
                </label>
                <button 
                  onClick={() => setShowSizeGuide(true)} 
                  style={{ fontSize: '0.78rem', textDecoration: 'underline', fontWeight: 800, color: 'var(--color-maroon)' }}
                >
                  SIZE GUIDE
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                {uniqueSizes.map(sz => {
                  const sizeAvailable = checkSizeStock(sz);
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      disabled={!selectedColor}
                      className="btn-outline-gray"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-maroon)' : '#ffffff',
                        color: isSelected ? '#ffffff' : sizeAvailable ? 'var(--text-main)' : 'var(--text-light)',
                        borderColor: isSelected ? 'var(--color-maroon)' : sizeAvailable ? 'var(--border-medium)' : 'var(--border-light)',
                        minWidth: '52px',
                        height: '46px',
                        fontWeight: 800,
                        borderRadius: '8px',
                        textDecoration: sizeAvailable ? 'none' : 'line-through',
                        opacity: sizeAvailable ? 1 : 0.4,
                        cursor: sizeAvailable ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => sizeAvailable && setSelectedSize(sz)}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock availability banner */}
          <div style={{ margin: '0.4rem 0' }}>
            {selectedColor && selectedSize ? (
              inStock ? (
                <span style={{ color: 'var(--color-emerald)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                  ✓ {activeVariant?.stock} UNITS IN READY STOCK AT WAREHOUSE
                </span>
              ) : (
                <span style={{ color: 'var(--color-magenta)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                  ✕ OUT OF STOCK FOR THIS COMBINATION
                </span>
              )
            ) : (
              <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.82rem' }}>
                Please select both Color &amp; Size to verify stock.
              </span>
            )}
          </div>

          {/* Quantity selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-maroon)' }}>QTY:</span>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="form-select"
              style={{ width: '85px', height: '45px', padding: '0.5rem', outline: 'none' }}
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="btn-primary"
              style={{ flex: 2, height: '52px' }}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingBag size={18} /> ADD TO BAG
            </button>

            <button
              className="btn-saffron"
              style={{ flex: 1, height: '52px' }}
              onClick={handleBuyNow}
              disabled={!inStock}
            >
              BUY NOW
            </button>

            <button
              className="btn-secondary"
              style={{ width: '52px', height: '52px', padding: 0 }}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={20} fill={isFavorite ? 'var(--color-magenta)' : 'none'} color={isFavorite ? 'var(--color-magenta)' : 'var(--color-maroon)'} />
            </button>
          </div>

          {msg && <div style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-emerald)', padding: '0.85rem', fontWeight: 800, fontSize: '0.85rem', borderLeft: '4px solid var(--color-emerald)', borderRadius: '8px' }}>{msg}</div>}
          {error && <div style={{ backgroundColor: 'var(--accent-badge-bg)', color: 'var(--color-magenta)', padding: '0.85rem', fontWeight: 800, fontSize: '0.85rem', borderLeft: '4px solid var(--color-magenta)', borderRadius: '8px' }}>{error}</div>}

          {/* PINCODE LOGISTICS CHECKER */}
          <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-subtle)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-maroon)' }}>
              <MapPin size={16} color="var(--color-saffron)" /> Check Pincode Express Delivery
            </span>
            <form onSubmit={checkPincodeDelivery} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input 
                type="text" 
                placeholder="Enter 6-digit Pincode"
                className="form-input"
                style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: '0.88rem' }}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}
                disabled={checkingPincode}
              >
                {checkingPincode ? 'Checking...' : 'CHECK'}
              </button>
            </form>
            {pincodeError && <p style={{ color: 'var(--color-magenta)', fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: 700 }}>{pincodeError}</p>}
            {pincodeResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', borderLeft: '4px solid var(--color-saffron)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-maroon)' }}>Estimated Delivery:</span>
                  <span>Within {pincodeResult.estimatedDays} Business Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-maroon)' }}>Cash on Delivery:</span>
                  <span style={{ color: pincodeResult.codAvailable ? 'var(--color-emerald)' : 'var(--color-magenta)', fontWeight: 800 }}>
                    {pincodeResult.codAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-maroon)' }}>Shipping Charges:</span>
                  <span style={{ fontWeight: 700 }}>{currentPrice >= 999 ? 'FREE Express Shipping' : formatINR(pincodeResult.shippingCharge)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Area: Details & Reviews */}
      <div style={{ borderTop: '2px solid var(--color-maroon)', paddingTop: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '3rem', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 800, fontSize: '0.95rem', borderBottom: activeTab === 'details' ? '3px solid var(--color-saffron)' : 'none', color: activeTab === 'details' ? 'var(--color-maroon)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}
            onClick={() => setActiveTab('details')}
          >
            PRODUCT DETAILS
          </button>
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 800, fontSize: '0.95rem', borderBottom: activeTab === 'reviews' ? '3px solid var(--color-saffron)' : 'none', color: activeTab === 'reviews' ? 'var(--color-maroon)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}
            onClick={() => setActiveTab('reviews')}
          >
            CUSTOMER REVIEWS ({totalReviews})
          </button>
        </div>

        {activeTab === 'details' && (
          <div style={{ maxWidth: '820px', lineHeight: '1.7', color: 'var(--text-muted)', fontSize: '0.98rem' }}>
            <p>{product.description}</p>
            <ul style={{ marginTop: '1.25rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <li>Crafted from 100% premium long-staple Indian cotton.</li>
              <li>Bio-washed fabric treatment for soft hand-feel and shrinkage prevention.</li>
              <li>Heavyweight 240+ GSM weave engineered for structured boxy draping.</li>
              <li>Care: Cold gentle machine wash inside out, line dry in shade.</li>
            </ul>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '4rem' }} className="listing-main-layout">
            {/* Reviews summary */}
            <div>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', color: 'var(--color-maroon)' }}>REVIEW METRICS</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>{product.rating || '4.8'}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>/ 5</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--color-turmeric)', margin: '0.5rem 0' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={16} fill={star <= Math.round(product.rating || 5) ? 'var(--color-turmeric)' : 'none'} color="var(--color-turmeric)" />
                ))}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontWeight: 700 }}>{totalReviews} VERIFIED PURCHASES</p>
            </div>

            {/* Reviews display list & form */}
            <div>
              <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '3rem', boxShadow: 'var(--shadow-subtle)' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem', color: 'var(--color-maroon)' }}>WRITE A REVIEW</h4>
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-maroon)' }}>RATING:</span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setNewRating(s)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Star size={22} fill={s <= newRating ? 'var(--color-turmeric)' : 'none'} color="var(--color-turmeric)" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="form-label">YOUR REVIEW</label>
                    <textarea
                      rows="3"
                      placeholder="Share your thoughts on fit, fabric weight, and design..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      required
                      className="form-textarea"
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.85rem 2rem' }} disabled={submittingReview}>
                    <Send size={16} /> {submittingReview ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                  </button>
                </form>
              </div>

              {/* Reviews list */}
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '0.5rem', color: 'var(--color-maroon)' }}>CUSTOMER REVIEWS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map(rev => (
                    <div key={rev.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-maroon)' }}>{rev.user_name}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-emerald)', backgroundColor: 'var(--bg-subtle)', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>✓ VERIFIED PURCHASE</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '3px', color: 'var(--color-turmeric)', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={14} fill={s <= rev.rating ? 'var(--color-turmeric)' : 'none'} color="var(--color-turmeric)" />
                        ))}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-light)', padding: '2rem 0', fontStyle: 'italic' }}>No customer feedback posted for this fit drop yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div className="modal-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <button 
              onClick={() => setShowSizeGuide(false)} 
              className="modal-close-btn"
            >
              <X size={22} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.25rem' }}>SIZE CHART GUIDE</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              GRABB-IT MEN'S FIT SPECIFICATIONS (INCHES)
            </p>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>CHEST</th>
                  <th>WAIST</th>
                  <th>HIPS</th>
                  <th>LENGTH</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>XS</td><td>34"</td><td>28"</td><td>34"</td><td>27"</td></tr>
                <tr><td>S</td><td>36"</td><td>30"</td><td>36"</td><td>28"</td></tr>
                <tr><td>M</td><td>38"</td><td>32"</td><td>38"</td><td>29"</td></tr>
                <tr><td>L</td><td>40"</td><td>34"</td><td>40"</td><td>29.5"</td></tr>
                <tr><td>XL</td><td>42"</td><td>36"</td><td>42"</td><td>30"</td></tr>
                <tr><td>XXL</td><td>44"</td><td>38"</td><td>44"</td><td>30.5"</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related Products */}
      {product.related && product.related.length > 0 && (
        <div style={{ marginTop: '6rem' }}>
          <div className="section-header">
            <h2 className="section-title">YOU MAY ALSO LIKE</h2>
          </div>
          <div className="product-grid">
            {product.related.map(p => (
              <ProductCard key={p.id} product={p} onQuickView={() => {}} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductDetails;
