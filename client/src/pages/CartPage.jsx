import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

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
      <main className="section-space container" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingBag size={64} color="var(--text-light)" style={{ marginBottom: '1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '0.5rem' }}>YOUR BAG IS EMPTY</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px', fontSize: '0.95rem' }}>Discover the latest high-frequency drop cuts and premium menswear essentials.</p>
        <Link to="/men" className="btn-primary" style={{ padding: '1rem 2rem' }}>
          EXPLORE MEN'S DROPS
        </Link>
      </main>
    );
  }

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '1rem' }}>
        SHOPPING BAG ({count} DROPS)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3.5rem' }} className="cart-layout">
        
        {/* Left: Cart Items List */}
        <div className="table-responsive">
          {/* Free Shipping Progress Indicator */}
          <div className="shipping-progress-container" style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {subtotal >= freeShippingThreshold 
                ? "✓ YOU'VE UNLOCKED FREE EXPRESS SHIPPING!" 
                : `ADD ₹${Math.round(freeShippingThreshold - subtotal)} MORE FOR FREE EXPRESS SHIPPING`}
            </span>
            <div className="shipping-progress-bar-bg" style={{ marginTop: '0.75rem' }}>
              <div 
                className="shipping-progress-bar-fill" 
                style={{ width: `${progressPercent}%`, backgroundColor: 'var(--text-main)' }}
              />
            </div>
          </div>

          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dark)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                <th style={{ textAlign: 'left', paddingBottom: '1rem' }}>Fit item</th>
                <th style={{ textAlign: 'center', paddingBottom: '1rem' }}>Price</th>
                <th style={{ textAlign: 'center', paddingBottom: '1rem' }}>Qty</th>
                <th style={{ textAlign: 'center', paddingBottom: '1rem' }}>Subtotal</th>
                <th style={{ textAlign: 'right', paddingBottom: '1rem' }}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => {
                const itemFavorite = isInWishlist(item.product_id);
                return (
                  <tr key={item.cart_item_id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1.5rem 0' }}>
                      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <img src={item.image_url} alt={item.product_name} style={{ width: '75px', height: '95px', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                        <div>
                          <Link to={`/product/${item.slug}`} style={{ fontWeight: 800, fontSize: '0.95rem', fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>
                            {item.product_name}
                          </Link>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
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
                            style={{ fontSize: '0.75rem', color: 'var(--text-light)', textDecoration: 'underline', marginTop: '0.5rem', fontWeight: 600, display: 'block' }}
                          >
                            MOVE TO WISHLIST
                          </button>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>₹{Math.round(item.unit_price)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-dark)', padding: '0.15rem' }}>
                        <button
                          style={{ padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center' }}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ padding: '0 0.75rem', fontWeight: 800, fontSize: '0.85rem' }}>{item.quantity}</span>
                        <button
                          style={{ padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center' }}
                          onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '0.95rem', fontFamily: 'var(--font-title)' }}>₹{Math.round(item.total_price)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => removeItem(item.cart_item_id)} style={{ color: 'var(--text-light)' }} title="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem' }}>
            <Link to="/men" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.75rem 1.5rem' }}>
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', border: '1px solid var(--border-dark)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', letterSpacing: '1px' }}>
            ORDER SUMMARY
          </h3>

          {/* Coupon Code Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PROMO / COUPON CODE
            </label>
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', marginTop: '0.5rem', borderLeft: '3px solid var(--accent-olive)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-olive)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tag size={13} /> {appliedCoupon.code} applied (-₹{Math.round(discountAmount)})
                </span>
                <button onClick={removeCoupon} style={{ color: 'var(--accent-badge)', fontWeight: 800, fontSize: '0.75rem', textDecoration: 'underline' }}>
                  REMOVE
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. WELCOME500"
                  className="form-select"
                  style={{ textTransform: 'uppercase', borderRadius: '0px', border: '1px solid var(--border-dark)', fontSize: '0.85rem', flex: 1, padding: '0.5rem' }}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1.25rem', fontSize: '0.8rem' }}>
                  APPLY
                </button>
              </form>
            )}
            {couponMsg && <div style={{ color: 'var(--accent-olive)', fontSize: '0.75rem', fontWeight: 800, marginTop: '0.4rem' }}>{couponMsg}</div>}
            {couponErr && <div style={{ color: 'var(--accent-badge)', fontSize: '0.75rem', fontWeight: 800, marginTop: '0.4rem' }}>{couponErr}</div>}
          </div>

          {/* Pricing calculations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bag Subtotal</span>
              <span style={{ fontWeight: 700 }}>₹{Math.round(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-badge)' }}>
                <span>Coupon Discount</span>
                <span style={{ fontWeight: 800 }}>-₹{Math.round(discountAmount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shipping Charges</span>
              <span style={{ fontWeight: 700 }}>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--text-main)', paddingTop: '1.25rem', fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-title)' }}>
              <span>Order Total</span>
              <span>₹{Math.round(finalTotal)}</span>
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
