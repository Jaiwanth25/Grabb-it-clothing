import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, ShieldCheck, Truck, ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CheckoutPage = () => {
  const { cartItems, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Confirmation
  const [formData, setFormData] = useState({
    customer_name: user ? user.name : '',
    email: user ? user.email : '',
    phone: user ? user.phone || '' : '',
    address_line: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    pincode: '97477',
    payment_method: 'Credit Card (Test Mode)',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '123'
  });

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  const shippingFee = subtotal > 75 || cartItems.length === 0 ? 0 : 9.99;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customer_name || !formData.email || !formData.phone || !formData.address_line || !formData.city || !formData.state || !formData.pincode) {
      setError('Please fill in all shipping address fields.');
      return;
    }

    setPlacing(true);

    const fullShippingAddress = `${formData.address_line}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

    const orderPayload = {
      customer_name: formData.customer_name,
      email: formData.email,
      phone: formData.phone,
      shipping_address: fullShippingAddress,
      items: cartItems.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity
      })),
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      payment_method: formData.payment_method
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      setCompletedOrder(data.order);
      clearCart();
      setStep(3); // Order Success Confirmation
    } catch (err) {
      setError(err.message || 'Order placement failed');
    } finally {
      setPlacing(false);
    }
  };

  if (step === 3 && completedOrder) {
    return (
      <main className="section-space container" style={{ maxWidth: '720px', textAlign: 'center' }}>
        <CheckCircle2 size={72} color="#2e7d32" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          THANK YOU! YOUR ORDER IS CONFIRMED.
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '1.5rem' }}>
          Order Reference Number: <strong style={{ color: '#111' }}>{completedOrder.order_number}</strong>
        </p>

        <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', border: '1px solid #e5e5e5', textAlign: 'left', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
            ORDER DETAILS
          </h3>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#444' }}>
            <div><strong>Recipient:</strong> {completedOrder.customer_name} ({completedOrder.email})</div>
            <div><strong>Shipping Address:</strong> {completedOrder.shipping_address}</div>
            <div><strong>Tracking Number:</strong> {completedOrder.tracking_number}</div>
            <div><strong>Payment Status:</strong> <span style={{ color: '#2e7d32', fontWeight: 700 }}>PAID (TEST MODE)</span></div>
          </div>

          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '1.5rem', marginBottom: '0.75rem' }}>
            ORDERED ITEMS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {completedOrder.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <div>
                  <strong>{item.product_name}</strong> ({item.size} / {item.color}) x {item.quantity}
                </div>
                <div>${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '2px solid #111' }}>
            <span>TOTAL PAID</span>
            <span>${completedOrder.total_amount.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/account" className="btn-primary">
            VIEW IN MY ORDERS
          </Link>
          <Link to="/" className="btn-secondary">
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0 && step !== 3) {
    return (
      <main className="section-space container" style={{ textAlign: 'center' }}>
        <h2>Your Cart is Empty</h2>
        <Link to="/men" className="btn-primary" style={{ marginTop: '1rem' }}>RETURN TO SHOP</Link>
      </main>
    );
  }

  return (
    <main className="section-space container">
      <div className="breadcrumbs">
        <Link to="/">HOME</Link> / <Link to="/cart">CART</Link> / <span>CHECKOUT</span>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '2px solid #111', paddingBottom: '0.75rem' }}>
        CHECKOUT &amp; PAY
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3.5rem' }} className="checkout-layout">
        {/* Left: Wizard Form */}
        <div>
          {/* Step Indicators */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.75rem' }}>
            <div style={{ fontWeight: 800, color: step === 1 ? '#111' : '#888', borderBottom: step === 1 ? '2px solid #111' : 'none', paddingBottom: '0.5rem' }}>
              1. SHIPPING ADDRESS
            </div>
            <div style={{ fontWeight: 800, color: step === 2 ? '#111' : '#888', borderBottom: step === 2 ? '2px solid #111' : 'none', paddingBottom: '0.5rem' }}>
              2. PAYMENT METHOD
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" name="customer_name" className="form-input" value={formData.customer_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input type="text" name="address_line" className="form-input" value={formData.address_line} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" name="state" className="form-input" value={formData.state} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode / ZIP</label>
                  <input type="text" name="pincode" className="form-input" value={formData.pincode} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                CONTINUE TO PAYMENT
              </button>
            </form>
          )}

          {step === 2 && (
            <div>
              <div style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#b78103' }}>
                  <Lock size={16} /> SAFE DEVELOPMENT / TEST PAYMENT MODE ACTIVE
                </strong>
                This store is running in test mode. No real card will be charged. You can submit the test order safely.
              </div>

              <div className="form-group">
                <label className="form-label">Select Payment Method</label>
                <select name="payment_method" className="form-select" value={formData.payment_method} onChange={handleChange}>
                  <option value="Credit Card (Test Mode)">Credit Card / Debit Card (Test Mode)</option>
                  <option value="UPI / QR (Test Mode)">UPI / QR Instant Pay (Test Mode)</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                </select>
              </div>

              <div style={{ backgroundColor: '#f8f9fa', padding: '1.25rem', border: '1px solid #e5e5e5', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Card Number (Simulated)</label>
                  <input type="text" name="cardNumber" className="form-input" value={formData.cardNumber} onChange={handleChange} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input type="text" name="cardExp" className="form-input" value={formData.cardExp} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVC / CVV</label>
                    <input type="password" name="cardCvc" className="form-input" value={formData.cardCvc} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {error && <div style={{ color: '#c62828', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> BACK
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'PROCESSING...' : `PLACE ORDER ($${finalTotal.toFixed(2)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', border: '1px solid #e5e5e5', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
            ORDER ITEMS ({cartItems.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            {cartItems.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <img src={item.image_url} alt="" style={{ width: '50px', height: '60px', objectFit: 'cover' }} />
                <div style={{ flex: 1, fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                  <div style={{ color: '#666' }}>{item.size} / {item.color} x {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>${item.total_price.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e53935' }}>
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.1rem', borderTop: '2px solid #111', paddingTop: '0.75rem' }}>
              <span>Total</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
