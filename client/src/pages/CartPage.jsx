import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatINR } from '../utils/currency';

const CartPage = () => {
  const {
    cartItems,
    subtotal,
    count,
    appliedCoupon,
    discountAmount,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [couponErr, setCouponErr] = useState('');
  const navigate = useNavigate();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponMsg('');
    setCouponErr('');
    if (!couponCode.trim()) return;

    const res = await applyCoupon(couponCode.trim());
    if (res.success) {
      setCouponMsg(res.message);
      setCouponCode('');
    } else {
      setCouponErr(res.error || 'Failed to apply coupon');
    }
  };

  const freeShippingThreshold = 999;
  const shippingFee = subtotal >= freeShippingThreshold || count === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  if (cartItems.length === 0) {
    return (
      <main className="section-space container" style={{ textAlign: 'center', minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <ShoppingBag size={56} color="var(--color-maroon)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
          YOUR CART IS WAITING FOR SOMETHING ICONIC.
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '440px', fontSize: '1rem' }}>
          Explore modern Indian streetwear, boxy cotton tees, and festive drop essentials.
        </p>
        <Link to="/men" className="btn-primary" style={{ padding: '1rem 2.25rem' }}>
          EXPLORE THE COLLECTION
        </Link>
      </main>
    );
  }

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Sparkles size={16} color="var(--color-saffron)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--color-saffron)', textTransform: 'uppercase' }}>
          YOUR SHOPPING BAG
        </span>
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '2rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '1rem' }}>
        SHOPPING BAG ({count} ITEMS)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }} className="cart-layout">
        
        {/* Left: Cart Items List */}
        <div className="table-responsive">
          {/* Free Shipping Progress Indicator */}
          <div className="shipping-progress-container" style={{ marginBottom: '2rem', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
              {subtotal >= freeShippingThreshold 
                ? "✓ YOU'VE UNLOCKED FREE EXPRESS SHIPPING!" 
                : `ADD ${formatINR(freeShippingThreshold - subtotal)} MORE FOR FREE EXPRESS SHIPPING`}
            </span>
            <div className="shipping-progress-bar-bg" style={{ marginTop: '0.75rem', borderRadius: '4px' }}>
              <div 
                className="shipping-progress-bar-fill" 
                style={{ width: `${progressPercent}%`, backgroundColor: 'var(--color-saffron)' }}
              />
            </div>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Item Details</th>
                <th style={{ textAlign: 'center' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Quantity</th>
                <th style={{ textAlign: 'center' }}>Subtotal</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => {
                const itemFavorite = isInWishlist(item.product_id);
                return (
                  <tr key={item.cart_item_id}>
                    <td>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <img src={item.image_url} alt={item.product_name} style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                        <div>
                          <Link to={`/product/${item.slug}`} style={{ fontWeight: 800, fontSize: '0.98rem', fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>
                            {item.product_name}
                          </Link>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            SIZE: <strong>{item.size}</strong> | COLOR: <strong>{item.color.toUpperCase()}</strong>
                          </div>
                          
                          {/* Move to Wishlist shortcut link */}
                          <button 
                            onClick={async () => {
                              if (!itemFavorite) {
                                await toggleWishlist(item.product_id);
                              }
                              await removeItem(item.cart_item_id);
                            }}
                            style={{ fontSize: '0.75rem', color: 'var(--color-saffron)', textDecoration: 'underline', marginTop: '0.5rem', fontWeight: 700, display: 'block' }}
                          >
                            MOVE TO WISHLIST
                          </button>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-maroon)' }}>{formatINR(item.unit_price)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.2rem', backgroundColor: '#ffffff' }}>
                        <button
                          style={{ padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', color: 'var(--color-maroon)' }}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0 0.85rem', fontWeight: 800, fontSize: '0.9rem' }}>{item.quantity}</span>
                        <button
                          style={{ padding: '0.35rem 0.6rem', display: 'flex', alignItems: 'center', color: 'var(--color-maroon)' }}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '1rem', fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>{formatINR(item.total_price)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => removeItem(item.cart_item_id)} style={{ color: 'var(--color-magenta)' }} title="Remove item">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <Link to="/men" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-card)', height: 'fit-content', boxShadow: 'var(--shadow-subtle)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>
            ORDER SUMMARY
          </h3>

          {/* Coupon Code Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              PROMO / FESTIVE COUPON
            </label>
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', marginTop: '0.5rem', borderLeft: '4px solid var(--color-emerald)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={14} /> {appliedCoupon.code} applied (-{formatINR(discountAmount)})
                </span>
                <button onClick={removeCoupon} style={{ color: 'var(--color-magenta)', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'underline' }}>
                  REMOVE
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. GRABB10"
                  className="form-input"
                  style={{ textTransform: 'uppercase', fontSize: '0.85rem', flex: 1 }}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1.25rem', fontSize: '0.8rem' }}>
                  APPLY
                </button>
              </form>
            )}
            {couponMsg && <div style={{ color: 'var(--color-emerald)', fontSize: '0.8rem', fontWeight: 800, marginTop: '0.4rem' }}>{couponMsg}</div>}
            {couponErr && <div style={{ color: 'var(--color-magenta)', fontSize: '0.8rem', fontWeight: 800, marginTop: '0.4rem' }}>{couponErr}</div>}
          </div>

          {/* Pricing calculations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bag Subtotal</span>
              <span style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>{formatINR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-magenta)' }}>
                <span>Coupon Discount</span>
                <span style={{ fontWeight: 800 }}>-{formatINR(discountAmount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Express Shipping</span>
              <span style={{ fontWeight: 700, color: shippingFee === 0 ? 'var(--color-emerald)' : 'var(--color-maroon)' }}>
                {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--color-maroon)', paddingTop: '1.25rem', fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>
              <span>Order Total</span>
              <span>{formatINR(finalTotal)}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => navigate('/checkout')}
          >
            PROCEED TO CHECKOUT <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
