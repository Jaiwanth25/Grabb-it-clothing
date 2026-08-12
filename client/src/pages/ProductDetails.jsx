import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Check, ShieldCheck, Truck, RotateCcw, Send, MapPin, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

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
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--text-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.9rem', marginTop: '1rem', fontWeight: 600, letterSpacing: '1px' }}>LOADING SPEC SHEET...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container section-space" style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400 }}>FIT NOT FOUND</h2>
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
        // Refresh product details
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

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-light)' }}>
        <Link to="/">HOME</Link> / 
        <Link to={`/${product.gender}`}>{product.gender.toUpperCase()}</Link> / 
        <span>{product.name.toUpperCase()}</span>
      </div>

      {/* Main PDP View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', marginBottom: '5rem' }} className="product-detail-grid">
        
        {/* LEFT SECTION: Main picture + Thumbnails */}
        <div>
          {/* Main Visual Display */}
          <div style={{ backgroundColor: '#ffffff', position: 'relative', width: '100%', height: '620px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <img
              src={selectedImage || product.primary_image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {product.sale_price !== null && (
              <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
                <span className="badge-discount" style={{ width: '50px', height: '50px', fontSize: '0.85rem' }}>
                  -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Gallery Carousel List */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    width: '90px',
                    height: '110px',
                    border: selectedImage === img.image_url ? '2px solid var(--text-main)' : '1px solid var(--border-light)',
                    padding: '2px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Info Specs & Cart Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--text-light)', textTransform: 'uppercase' }}>
              GRABB-IT • {product.category?.name || product.gender}
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, marginTop: '0.25rem', textTransform: 'uppercase', lineHeight: 1.1 }}>
              {product.name}
            </h1>
            
            {/* Star ratings summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-main)' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={15} fill={star <= Math.round(product.rating) ? 'var(--text-main)' : 'none'} color="var(--text-main)" />
                ))}
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{product.rating}</span>
              <span style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontWeight: 600 }}>
                • {totalReviews} CUSTOMER FEEDBACKS
              </span>
            </div>
          </div>

          {/* Price breakdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 900, fontFamily: 'var(--font-title)' }}>
              ₹{Math.round(product.sale_price !== null ? product.sale_price : product.price)}
            </span>
            {product.sale_price !== null && (
              <>
                <span style={{ fontSize: '1.25rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                  ₹{Math.round(product.price)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-badge)', backgroundColor: 'var(--accent-badge-bg)', padding: '0.35rem 0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SAVE ₹{Math.round(product.price - product.sale_price)}
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {product.description}
          </p>

          {/* COLOR SELECTOR: SWATCHES */}
          {uniqueColors.length > 0 && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                COLOR: <strong style={{ color: 'var(--text-main)' }}>{selectedColor.toUpperCase()}</strong>
              </label>
              <div className="color-swatches-grid" style={{ marginTop: '0.5rem' }}>
                {uniqueColors.map(col => (
                  <div 
                    key={col.name}
                    className={`color-swatch-circle ${selectedColor.toLowerCase() === col.name.toLowerCase() ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedColor(col.name);
                      // Clear size selection if it is not in stock for new color
                      setSelectedSize('');
                    }}
                  >
                    <div className="color-swatch-inner" style={{ backgroundColor: col.hex }} title={col.name} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIZE SELECTOR: STOCK COMPLIANT */}
          {uniqueSizes.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  SELECT SIZE: {selectedSize && <strong style={{ color: 'var(--text-main)' }}>{selectedSize}</strong>}
                </label>
                <button 
                  onClick={() => setShowSizeGuide(true)} 
                  style={{ fontSize: '0.75rem', textDecoration: 'underline', fontWeight: 700, color: 'var(--text-muted)' }}
                >
                  SIZE GUIDE
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {uniqueSizes.map(sz => {
                  const sizeAvailable = checkSizeStock(sz);
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      disabled={!selectedColor}
                      className="btn-outline-gray"
                      style={{
                        backgroundColor: isSelected ? 'var(--text-main)' : '#ffffff',
                        color: isSelected ? '#ffffff' : sizeAvailable ? 'var(--text-main)' : 'var(--text-light)',
                        borderColor: isSelected ? 'var(--text-main)' : sizeAvailable ? 'var(--border-dark)' : 'var(--border-light)',
                        minWidth: '50px',
                        height: '45px',
                        fontWeight: 800,
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
          <div style={{ margin: '0.5rem 0' }}>
            {selectedColor && selectedSize ? (
              inStock ? (
                <span style={{ color: 'var(--accent-olive)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  ✓ {activeVariant?.stock} UNITS READY TO GRAB IN WAREHOUSE
                </span>
              ) : (
                <span style={{ color: 'var(--accent-badge)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  ✕ OUT OF STOCK FOR THIS COMBINATION
                </span>
              )
            ) : (
              <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.8rem' }}>
                Please select both Color & Size to check stock.
              </span>
            )}
          </div>

          {/* Quantity selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>QTY:</span>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="form-select"
              style={{ width: '80px', height: '45px', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', outline: 'none' }}
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Action trigger buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              className="btn-primary"
              style={{ flex: 2, height: '50px' }}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingBag size={18} /> ADD TO BAG
            </button>

            <button
              className="btn-secondary"
              style={{ flex: 1, height: '50px', backgroundColor: '#ffffff', color: '#121212', border: '1px solid #121212' }}
              onClick={handleBuyNow}
              disabled={!inStock}
            >
              BUY NOW
            </button>

            <button
              className="btn-secondary"
              style={{ width: '50px', height: '50px', padding: 0 }}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={20} fill={isFavorite ? 'var(--accent-badge)' : 'none'} color={isFavorite ? 'var(--accent-badge)' : 'var(--text-main)'} />
            </button>
          </div>

          {msg && <div style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--accent-olive)', padding: '0.85rem', fontWeight: 800, fontSize: '0.8rem', borderLeft: '3px solid var(--accent-olive)' }}>{msg}</div>}
          {error && <div style={{ backgroundColor: 'var(--accent-badge-bg)', color: 'var(--accent-badge)', padding: '0.85rem', fontWeight: 800, fontSize: '0.8rem', borderLeft: '3px solid var(--accent-badge)' }}>{error}</div>}

          {/* PINCODE LOGISTICS CHECKER */}
          <div className="delivery-checker-box">
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={15} /> Check delivery options
            </span>
            <form onSubmit={checkPincodeDelivery} className="delivery-input-wrapper">
              <input 
                type="text" 
                placeholder="Enter 6-digit Pincode"
                className="form-select"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '0px', border: '1px solid var(--border-dark)', fontSize: '0.85rem' }}
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
            {pincodeError && <p style={{ color: 'var(--accent-badge)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 700 }}>{pincodeError}</p>}
            {pincodeResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderLeft: '2px solid var(--text-main)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>Estimated Delivery:</span>
                  <span>Within {pincodeResult.estimatedDays} Business Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>Cash on Delivery:</span>
                  <span style={{ color: pincodeResult.codAvailable ? 'var(--accent-olive)' : 'var(--accent-badge)' }}>
                    {pincodeResult.codAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800 }}>Shipping Charges:</span>
                  <span>{product.sale_price >= 999 || product.price >= 999 ? 'FREE Shipping' : `₹${pincodeResult.shippingCharge}`}</span>
                </div>
                <p style={{ color: 'var(--text-light)', fontSize: '0.72rem', marginTop: '0.25rem' }}>
                  *Easy 7-day return eligibility applies. Carrier partner: {pincodeResult.carrier}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Area: Details & Reviews */}
      <div style={{ borderTop: '1px solid var(--border-dark)', paddingTop: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '3rem', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 800, fontSize: '0.9rem', borderBottom: activeTab === 'details' ? '2px solid var(--text-main)' : 'none', color: activeTab === 'details' ? 'var(--text-main)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}
            onClick={() => setActiveTab('details')}
          >
            FIT INFORMATION
          </button>
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 800, fontSize: '0.9rem', borderBottom: activeTab === 'reviews' ? '2px solid var(--text-main)' : 'none', color: activeTab === 'reviews' ? 'var(--text-main)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '1px' }}
            onClick={() => setActiveTab('reviews')}
          >
            CUSTOMER FEEDBACK ({totalReviews})
          </button>
        </div>

        {activeTab === 'details' && (
          <div style={{ maxWidth: '800px', lineHeight: '1.7', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            <p>{product.description}</p>
            <ul style={{ marginTop: '1.25rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Premium 100% long-staple organic cotton.</li>
              <li>Pre-washed to protect against shrinking and fading.</li>
              <li>High-durability side seams and reinforced ribbed cuffs.</li>
              <li>Machine wash cold with like colors, tumble dry low, warm iron if needed.</li>
            </ul>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '4rem' }} className="listing-main-layout">
            
            {/* Reviews summary analytics */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>FEEDBACK METRICS</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'var(--font-title)' }}>{product.rating}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-light)' }}>/ 5</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-main)', margin: '0.5rem 0' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={15} fill={star <= Math.round(product.rating) ? 'var(--text-main)' : 'none'} color="var(--text-main)" />
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>{totalReviews} VERIFIED PURCHASES</p>

              {/* Rating Bars distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = ratingDistribution[stars - 1];
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ width: '40px', fontWeight: 700 }}>{stars}★</span>
                      <div style={{ flex: 1, backgroundColor: 'var(--border-light)', height: '6px', position: 'relative' }}>
                        <div style={{ backgroundColor: 'var(--text-main)', width: `${pct}%`, height: '100%' }} />
                      </div>
                      <span style={{ width: '25px', textAlign: 'right', color: 'var(--text-light)' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews display list & form */}
            <div>
              {/* Form to submit review */}
              <div style={{ backgroundColor: '#ffffff', padding: '2rem', border: '1px solid var(--border-light)', marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.25rem' }}>LEAVE PRODUCT FEEDBACK</h4>
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>RATE FIT:</span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setNewRating(s)}
                          style={{ color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                          <Star size={20} fill={s <= newRating ? 'var(--text-main)' : 'none'} color="var(--text-main)" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>COMMENT</label>
                    <textarea
                      rows="3"
                      placeholder="Discuss size fit, material texture, and visual drape..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0px', border: '1px solid var(--border-dark)', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.75rem 2rem' }} disabled={submittingReview}>
                    <Send size={15} /> {submittingReview ? 'SUBMITTING...' : 'PUBLISH VERIFIED REVIEW'}
                  </button>
                </form>
              </div>

              {/* Reviews list */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>VERIFIED CUSTOMER NOTES</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map(rev => (
                    <div key={rev.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>{rev.user_name}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-olive)', backgroundColor: 'var(--bg-subtle)', padding: '0.15rem 0.4rem', letterSpacing: '0.5px' }}>✓ VERIFIED PURCHASE</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '2px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={13} fill={s <= rev.rating ? 'var(--text-main)' : 'none'} color="var(--text-main)" />
                        ))}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{rev.comment}</p>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,18,18,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '550px', padding: '2rem', border: '1px solid var(--text-main)', position: 'relative' }}>
            <button 
              onClick={() => setShowSizeGuide(false)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', cursor: 'pointer' }}
              className="icon-btn"
            >
              <X size={22} />
            </button>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '0.25rem' }}>SIZE CHART GUIDE</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              GRABB-IT {product.gender.toUpperCase()} FIT SPECIFICATIONS (INCHES)
            </p>

            <table className="size-guide-table">
              <thead>
                <tr>
                  <th>SIZE</th>
                  <th>{product.gender === 'men' ? 'CHEST' : 'BUST'}</th>
                  <th>WAIST</th>
                  <th>HIPS</th>
                  <th>LENGTH</th>
                </tr>
              </thead>
              <tbody>
                {product.gender === 'men' ? (
                  <>
                    <tr><td>XS</td><td>34"</td><td>28"</td><td>34"</td><td>27"</td></tr>
                    <tr><td>S</td><td>36"</td><td>30"</td><td>36"</td><td>28"</td></tr>
                    <tr><td>M</td><td>38"</td><td>32"</td><td>38"</td><td>29"</td></tr>
                    <tr><td>L</td><td>40"</td><td>34"</td><td>40"</td><td>29.5"</td></tr>
                    <tr><td>XL</td><td>42"</td><td>36"</td><td>42"</td><td>30"</td></tr>
                    <tr><td>XXL</td><td>44"</td><td>38"</td><td>44"</td><td>30.5"</td></tr>
                  </>
                ) : (
                  <>
                    <tr><td>XS</td><td>32"</td><td>26"</td><td>34"</td><td>24"</td></tr>
                    <tr><td>S</td><td>34"</td><td>28"</td><td>36"</td><td>25"</td></tr>
                    <tr><td>M</td><td>36"</td><td>30"</td><td>38"</td><td>26"</td></tr>
                    <tr><td>L</td><td>38"</td><td>32"</td><td>40"</td><td>26.5"</td></tr>
                    <tr><td>XL</td><td>40"</td><td>34"</td><td>42"</td><td>27"</td></tr>
                    <tr><td>XXL</td><td>42"</td><td>36"</td><td>44"</td><td>27.5"</td></tr>
                  </>
                )}
              </tbody>
            </table>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1.5rem', lineHeight: '1.4' }}>
              *For relaxed oversized apparel drops, choose one size down for a standard true-to-body contour, or your regular size for the intended boxy style.
            </p>
          </div>
        </div>
      )}

      {/* Related Products */}
      {product.related && product.related.length > 0 && (
        <div style={{ marginTop: '6rem' }}>
          <div className="section-header">
            <h2 className="section-title">YOU MAY ALSO LIKE</h2>
          </div>
          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
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
