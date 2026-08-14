import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/currency';

const ProductCard = ({ product, onQuickView }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const primaryImage = product.primary_image || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
  const secondaryImage = product.secondary_image || product.images?.[1]?.image_url || primaryImage;

  const hasDiscount = product.sale_price !== null && product.sale_price < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const currentPrice = hasDiscount ? product.sale_price : product.price;

  const isFavorite = isInWishlist(product.id);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const firstVariant = product.variants && product.variants.length ? product.variants[0] : null;
    if (!firstVariant) {
      onQuickView(product);
      return;
    }

    setAdding(true);
    const result = await addToCart(product.id, firstVariant.id, 1);
    setAdding(false);

    if (!result.success) {
      onQuickView(product);
    }
  };

  return (
    <div className="product-card">
      <div className="product-card-img-wrapper">
        <Link to={`/product/${product.slug}`}>
          <img src={primaryImage} alt={product.name} className="product-card-img primary" />
          <img src={secondaryImage} alt={product.name} className="product-card-img secondary" />
        </Link>

        {/* Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 5 }}>
          {hasDiscount && <span className="badge-discount">-{discountPercent}%</span>}
          {product.is_new === 1 && <span className="badge-new">NEW</span>}
          {product.is_trending === 1 && <span className="badge-trending">HOT 🔥</span>}
        </div>

        {/* Wishlist Heart */}
        <button
          className={`wishlist-heart-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          title={isFavorite ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={18} fill={isFavorite ? "var(--color-pink)" : "none"} color={isFavorite ? "var(--color-pink)" : "var(--color-purple)"} />
        </button>

        {/* Quick Actions */}
        <div className="product-card-actions">
          <button
            className="btn-secondary"
            style={{ flex: 1, padding: '0.55rem', fontSize: '0.75rem' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
          >
            <Eye size={14} /> Quick View
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1, padding: '0.55rem', fontSize: '0.75rem' }}
            onClick={handleQuickAdd}
            disabled={adding}
          >
            <ShoppingBag size={14} /> {adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="product-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="product-category-name">{product.category?.name || product.gender}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Star size={13} fill="var(--color-yellow)" color="var(--color-yellow)" />
            <span style={{ fontWeight: 800 }}>{product.rating || '4.8'}</span>
            <span style={{ color: 'var(--text-light)' }}>({product.review_count || 12})</span>
          </div>
        </div>

        <Link to={`/product/${product.slug}`} className="product-title">
          {product.name}
        </Link>

        {/* Color Swatches */}
        {(() => {
          const uniqueColors = [];
          const seenColors = new Set();
          if (product.variants) {
            product.variants.forEach(v => {
              if (v.color && !seenColors.has(v.color.toLowerCase())) {
                seenColors.add(v.color.toLowerCase());
                uniqueColors.push(v);
              }
            });
          }
          if (uniqueColors.length > 0) {
            return (
              <div style={{ display: 'flex', gap: '5px', margin: '4px 0' }}>
                {uniqueColors.map((col, idx) => (
                  <span 
                    key={idx} 
                    title={col.color} 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: col.color_hex || 'var(--color-pink)',
                      border: '1.5px solid rgba(0,0,0,0.1)' 
                    }} 
                  />
                ))}
              </div>
            );
          }
          return null;
        })()}

        <div className="product-price-row">
          <span className="price-current">{formatINR(currentPrice)}</span>
          {hasDiscount && (
            <span className="price-original">
              {formatINR(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
