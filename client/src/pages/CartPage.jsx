import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';

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

  const shippingFee = subtotal > 75 || count === 0 ? 0 : 9.99;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (cartItems.length === 0) {
    return (
      <main className="section-space container" style={{ textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingBag size={64} color="#ccc" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>YOUR SHOPPING CART IS EMPTY</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Discover the latest high-frequency apparel drops and essential wear.</p>
        <Link to="/men" className="btn-primary">
          START SHOPPING NOW
        </Link>
      </main>
    );
  }

  return (
    <main className="section-space container">
      <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '2px solid #111', paddingBottom: '0.75rem' }}>
        SHOPPING CART ({count} ITEMS)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem' }} className="cart-layout">
        {/* Left: Cart Items Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.cart_item_id}>
                  <td>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={item.image_url} alt={item.product_name} style={{ width: '70px', height: '85px', objectFit: 'cover', border: '1px solid #eee' }} />
                      <div>
                        <Link to={`/product/${item.slug}`} style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {item.product_name}
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                          Size: <strong>{item.size}</strong> | Color: <strong>{item.color}</strong>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>${item.unit_price.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #ccc' }}>
                      <button
                        style={{ padding: '0.4rem 0.6rem' }}
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ padding: '0 0.75rem', fontWeight: 800, fontSize: '0.85rem' }}>{item.quantity}</span>
                      <button
                        style={{ padding: '0.4rem 0.6rem' }}
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td style={{ fontWeight: 900 }}>${item.total_price.toFixed(2)}</td>
                  <td>
                    <button onClick={() => removeItem(item.cart_item_id)} style={{ color: '#888' }} title="Remove item">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <Link to="/men" className="btn-secondary" style={{ fontSize: '0.8rem' }}>
              CONTINUE SHOPPING
            </Link>
          </div>
        </div>

        {/* Right: Order Summary Card */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', border: '1px solid #e5e5e5', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.75rem' }}>
            ORDER SUMMARY
          </h3>

          {/* Coupon Code Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>PROMO / COUPON CODE</label>
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5e9', padding: '0.6rem 0.8rem', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2e7d32' }}>
                  <Tag size={14} inline /> {appliedCoupon.code} applied (-${discountAmount.toFixed(2)})
                </span>
                <button onClick={removeCoupon} style={{ color: '#d32f2f', fontWeight: 800, fontSize: '0.75rem' }}>
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="e.g. GRABB10"
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="submit" className="btn-secondary" style={{ padding: '0 1rem', fontSize: '0.8rem' }}>
                  APPLY
                </button>
              </form>
            )}
            {couponMsg && <div style={{ color: '#2e7d32', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.3rem' }}>{couponMsg}</div>}
            {couponErr && <div style={{ color: '#c62828', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.3rem' }}>{couponErr}</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53935' }}>
                <span>Discount</span>
                <span style={{ fontWeight: 800 }}>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#666' }}>Shipping</span>
              <span style={{ fontWeight: 700 }}>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #111', paddingTop: '1rem', fontSize: '1.15rem', fontWeight: 900 }}>
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '1rem' }}
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
