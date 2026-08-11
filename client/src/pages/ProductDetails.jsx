import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Check, ShieldCheck, Truck, RotateCcw, Send } from 'lucide-react';
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

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        if (data.images && data.images.length) {
          setSelectedImage(data.images[0].image_url);
        }
        if (data.variants && data.variants.length) {
          setSelectedSize(data.variants[0].size);
          setSelectedColor(data.variants[0].color);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch Product Detail Error:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="container section-space" style={{ textAlign: 'center' }}>Loading product details...</div>;
  }

  if (!product) {
    return (
      <div className="container section-space" style={{ textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>RETURN HOME</Link>
      </div>
    );
  }

  const uniqueSizes = Array.from(new Set(product.variants?.map(v => v.size) || []));
  const uniqueColors = Array.from(new Set(product.variants?.map(v => v.color) || []));

  const activeVariant = product.variants?.find(
    v => v.size === selectedSize && v.color === selectedColor
  ) || product.variants?.[0];

  const inStock = activeVariant ? activeVariant.stock > 0 : false;
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = async () => {
    setMsg('');
    setError('');
    if (!activeVariant) return setError('Selected variant unavailable');

    const res = await addToCart(product.id, activeVariant.id, quantity);
    if (res.success) {
      setMsg('Product added to your shopping cart!');
    } else {
      setError(res.error || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!activeVariant) return;
    const res = await addToCart(product.id, activeVariant.id, quantity);
    if (res.success) {
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to leave a review.');
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
        alert('Thank you! Your review has been submitted.');
        // Refresh product
        fetch(`/api/products/${slug}`).then(r => r.json()).then(d => setProduct(d));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <main className="section-space container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to="/">HOME</Link> / 
        <Link to={`/${product.gender}`}>{product.gender.toUpperCase()}</Link> / 
        <span>{product.name}</span>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', marginBottom: '4rem' }} className="product-detail-grid">
        {/* Left: Image Gallery */}
        <div>
          <div style={{ backgroundColor: '#f5f5f5', position: 'relative', width: '100%', height: '520px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
            <img
              src={selectedImage || product.primary_image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  style={{
                    width: '80px',
                    height: '90px',
                    border: selectedImage === img.image_url ? '2px solid #111' : '1px solid #e5e5e5',
                    overflow: 'hidden'
                  }}
                >
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', color: '#666', textTransform: 'uppercase' }}>
              {product.category?.name || product.gender} • SKU: {product.sku}
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '0.25rem', textTransform: 'uppercase', lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f5a623' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} size={16} fill={star <= Math.round(product.rating) ? '#f5a623' : 'none'} color="#f5a623" />
                ))}
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{product.rating}</span>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>({product.review_count} verified reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 900 }}>
              ${(product.sale_price !== null ? product.sale_price : product.price).toFixed(2)}
            </span>
            {product.sale_price !== null && (
              <>
                <span style={{ fontSize: '1.25rem', color: '#999', textDecoration: 'line-through' }}>
                  ${product.price.toFixed(2)}
                </span>
                <span className="badge-discount">
                  SAVE {Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {product.description}
          </p>

          {/* Color Selector */}
          {uniqueColors.length > 0 && (
            <div>
              <label className="form-label">Color: <strong style={{ color: '#111' }}>{selectedColor}</strong></label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                {uniqueColors.map(col => (
                  <button
                    key={col}
                    className="btn-outline-gray"
                    style={{
                      backgroundColor: selectedColor === col ? '#111' : '#fff',
                      color: selectedColor === col ? '#fff' : '#111',
                      fontWeight: 700
                    }}
                    onClick={() => setSelectedColor(col)}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {uniqueSizes.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Size: <strong style={{ color: '#111' }}>{selectedSize}</strong></label>
                <span style={{ fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', color: '#666' }}>Size Guide</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                {uniqueSizes.map(sz => (
                  <button
                    key={sz}
                    className="btn-outline-gray"
                    style={{
                      backgroundColor: selectedSize === sz ? '#111' : '#fff',
                      color: selectedSize === sz ? '#fff' : '#111',
                      minWidth: '48px',
                      height: '42px',
                      fontWeight: 700
                    }}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status Indicator */}
          <div>
            {inStock ? (
              <span style={{ color: '#2e7d32', fontWeight: 800, fontSize: '0.85rem' }}>
                ✓ IN STOCK ({activeVariant?.stock} units remaining)
              </span>
            ) : (
              <span style={{ color: '#d32f2f', fontWeight: 800, fontSize: '0.85rem' }}>
                ✕ OUT OF STOCK FOR THIS VARIANT
              </span>
            )}
          </div>

          {/* Actions & Quantity */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <select
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="form-select"
              style={{ width: '80px', height: '48px' }}
            >
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>

            <button
              className="btn-primary"
              style={{ flex: 1, height: '48px' }}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingBag size={18} /> ADD TO CART
            </button>

            <button
              className="btn-secondary"
              style={{ padding: '0 1.5rem', height: '48px' }}
              onClick={handleBuyNow}
              disabled={!inStock}
            >
              BUY NOW
            </button>

            <button
              className="btn-secondary"
              style={{ padding: '0 1rem', height: '48px' }}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={20} fill={isFavorite ? '#e53935' : 'none'} color={isFavorite ? '#e53935' : '#111'} />
            </button>
          </div>

          {msg && <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '0.75rem', fontWeight: 700, fontSize: '0.85rem' }}>{msg}</div>}
          {error && <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '0.75rem', fontWeight: 700, fontSize: '0.85rem' }}>{error}</div>}

          {/* Value Props */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', borderTop: '1px solid #e5e5e5', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#444' }}>
              <Truck size={18} /> <span>Express Delivery</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#444' }}>
              <RotateCcw size={18} /> <span>30-Day Returns</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#444' }}>
              <ShieldCheck size={18} /> <span>100% Authentic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Reviews */}
      <div style={{ borderTop: '2px solid #111', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #e5e5e5', marginBottom: '2rem' }}>
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 800, fontSize: '1rem', borderBottom: activeTab === 'details' ? '2px solid #111' : 'none', color: activeTab === 'details' ? '#111' : '#888' }}
            onClick={() => setActiveTab('details')}
          >
            PRODUCT INFORMATION
          </button>
          <button
            style={{ paddingBottom: '0.75rem', fontWeight: 800, fontSize: '1rem', borderBottom: activeTab === 'reviews' ? '2px solid #111' : 'none', color: activeTab === 'reviews' ? '#111' : '#888' }}
            onClick={() => setActiveTab('reviews')}
          >
            CUSTOMER REVIEWS ({product.reviews?.length || 0})
          </button>
        </div>

        {activeTab === 'details' && (
          <div style={{ maxWidth: '800px', lineHeight: '1.7', color: '#444' }}>
            <p>{product.description}</p>
            <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>100% High-grade combed organic cotton / linen blend</li>
              <li>Pre-shrunk fabric ensuring long-lasting fit retention</li>
              <li>Ethically manufactured under strict quality standards</li>
              <li>Machine wash cold with like colors, tumble dry low</li>
            </ul>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', marginBottom: '3rem' }}>
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map(rev => (
                  <div key={rev.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{rev.user_name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', color: '#f5a623', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} fill={s <= rev.rating ? '#f5a623' : 'none'} color="#f5a623" />
                      ))}
                    </div>
                    <p style={{ color: '#555', fontSize: '0.9rem' }}>{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888' }}>No reviews yet. Be the first to review this item!</div>
              )}
            </div>

            {/* Leave Review Form */}
            <div style={{ maxWidth: '600px', backgroundColor: '#f9f9f9', padding: '1.75rem', border: '1px solid #e5e5e5' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>WRITE A REVIEW</h4>
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select value={newRating} onChange={e => setNewRating(parseInt(e.target.value))} className="form-select">
                    <option value="5">5 Stars - Excellent</option>
                    <option value="4">4 Stars - Very Good</option>
                    <option value="3">3 Stars - Average</option>
                    <option value="2">2 Stars - Poor</option>
                    <option value="1">1 Star - Terrible</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Review</label>
                  <textarea
                    rows="3"
                    className="form-textarea"
                    placeholder="Share your experience regarding fit, fabric quality, and style..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={submittingReview}>
                  <Send size={16} /> {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {product.related && product.related.length > 0 && (
        <div style={{ marginTop: '5rem' }}>
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
