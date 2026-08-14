import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR } from '../utils/currency';

const QuickViewModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState(product.variants?.[0]?.size || 'M');
  const [selectedColor, setSelectedColor] = useState(product.variants?.[0]?.color || '');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!product) return null;

  const uniqueSizes = Array.from(new Set(product.variants?.map(v => v.size) || []));
  const uniqueColors = Array.from(new Set(product.variants?.map(v => v.color) || []));

  // Active Variant Check
  const activeVariant = product.variants?.find(
    v => (v.size === selectedSize || !selectedSize) && (v.color === selectedColor || !selectedColor)
  ) || product.variants?.[0];

  const inStock = activeVariant ? activeVariant.stock > 0 : false;
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = async () => {
    setMessage('');
    setErrorMsg('');

    if (!activeVariant) {
      setErrorMsg('Selected variant is unavailable.');
      return;
    }

    if (quantity > activeVariant.stock) {
      setErrorMsg(`Only ${activeVariant.stock} left in stock for this variant.`);
      return;
    }

    const res = await addToCart(product.id, activeVariant.id, quantity);
    if (res.success) {
      setMessage('Added to cart!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Failed to add item to cart');
    }
  };

  const primaryImage = product.primary_image || product.images?.[0]?.image_url;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={22} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
          {/* Left: Product Image */}
          <div style={{ backgroundColor: 'var(--bg-subtle)', position: 'relative', height: '380px', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={primaryImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Right: Product Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span className="product-category-name">{product.category?.name || product.gender}</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-main)' }}>{product.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', fontSize: '0.85rem' }}>
                <Star size={14} fill="var(--color-turmeric)" color="var(--color-turmeric)" />
                <span style={{ fontWeight: 700 }}>{product.rating || '4.8'}</span>
                <span style={{ color: 'var(--text-light)' }}>({product.review_count || 12} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-maroon)' }}>
                {formatINR(product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.price)}
              </span>
              {product.sale_price !== null && product.sale_price < product.price && (
                <span style={{ fontSize: '1rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                  {formatINR(product.price)}
                </span>
              )}
            </div>

            {/* Stock status */}
            <div>
              {inStock ? (
                <span style={{ color: 'var(--color-emerald)', fontWeight: 700, fontSize: '0.85rem' }}>
                  ✓ In Stock ({activeVariant?.stock} available)
                </span>
              ) : (
                <span style={{ color: 'var(--color-magenta)', fontWeight: 700, fontSize: '0.85rem' }}>
                  ✕ Out of Stock
                </span>
              )}
            </div>

            {/* Size Selector */}
            {uniqueSizes.length > 0 && (
              <div>
                <label className="form-label">Size: {selectedSize}</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {uniqueSizes.map((sz) => (
                    <button
                      key={sz}
                      className={`btn-outline-gray ${selectedSize === sz ? 'active' : ''}`}
                      style={{
                        backgroundColor: selectedSize === sz ? 'var(--color-maroon)' : '#fff',
                        color: selectedSize === sz ? '#fff' : 'var(--text-main)',
                        borderColor: selectedSize === sz ? 'var(--color-maroon)' : 'var(--border-light)',
                        minWidth: '42px',
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

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div>
                <label className="form-label">Color: {selectedColor || uniqueColors[0]}</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  {uniqueColors.map((col) => (
                    <button
                      key={col}
                      className="btn-outline-gray"
                      style={{
                        backgroundColor: selectedColor === col ? 'var(--color-maroon)' : '#fff',
                        color: selectedColor === col ? '#fff' : 'var(--text-main)',
                        borderColor: selectedColor === col ? 'var(--color-maroon)' : 'var(--border-light)',
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

            {/* Quantity and Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="form-select"
                style={{ width: '80px', padding: '0.6rem' }}
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>

              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingBag size={18} /> {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button
                className="btn-secondary"
                style={{ padding: '0.75rem' }}
                onClick={() => toggleWishlist(product.id)}
              >
                <Heart size={18} fill={isFavorite ? 'var(--color-magenta)' : 'none'} color={isFavorite ? 'var(--color-magenta)' : 'var(--color-maroon)'} />
              </button>
            </div>

            {/* Messages */}
            {message && <div style={{ color: 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 700 }}>{message}</div>}
            {errorMsg && <div style={{ color: 'var(--color-magenta)', fontSize: '0.85rem', fontWeight: 700 }}>{errorMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
