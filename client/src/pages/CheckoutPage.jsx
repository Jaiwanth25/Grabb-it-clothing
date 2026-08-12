import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, ShieldCheck, Truck, ArrowLeft, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CheckoutPage = () => {
  const { cartItems, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  const [formData, setFormData] = useState({
    customer_name: user ? user.name : '',
    email: user ? user.email : '',
    phone: user ? user.phone || '' : '',
    address_line: 'Flat 405, Prestige Heights',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    payment_method: 'Credit Card / Debit Card (Test Mode)',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '123'
  });

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  const shippingFee = subtotal >= 999 || cartItems.length === 0 ? 0 : 99;
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

    if (!/^\d{6}$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit Pincode.');
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
      setStep(3); // Show confirmation
    } catch (err) {
      setError(err.message || 'Order placement failed');
    } finally {
      setPlacing(false);
    }
  };

  if (step === 3 && completedOrder) {
    return (
      <main className="section-space container" style={{ maxWidth: '720px', textAlign: 'center', backgroundColor: 'var(--bg-main)' }}>
        <CheckCircle2 size={72} color="var(--accent-olive)" style={{ marginBottom: '1.5rem', display: 'inline-block' }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          ORDER PLACED SUCCESSFULLY
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Order Reference Number: <strong style={{ color: 'var(--text-main)' }}>{completedOrder.order_number}</strong>
        </p>

        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', border: '1px solid var(--border-dark)', textAlign: 'left', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', letterSpacing: '1px' }}>
            ORDER DETAILS
          </h3>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>Recipient:</strong> {completedOrder.customer_name} ({completedOrder.email})</div>
            <div><strong>Contact phone:</strong> {completedOrder.phone}</div>
            <div><strong>Shipping Address:</strong> {completedOrder.shipping_address}</div>
            <div><strong>Delivery tracking code:</strong> {completedOrder.tracking_number}</div>
            <div><strong>Payment status:</strong> <span style={{ color: 'var(--accent-olive)', fontWeight: 800 }}>PAID (MOCK MODE)</span></div>
          </div>

          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem', letterSpacing: '0.5px' }}>
            ORDERED ITEMS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {completedOrder.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ textTransform: 'uppercase' }}>{item.product_name}</strong> ({item.size} / {item.color.toUpperCase()}) x {item.quantity}
                </div>
                <div style={{ fontWeight: 700 }}>₹{Math.round(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.25rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--text-main)', fontFamily: 'var(--font-title)' }}>
            <span>TOTAL PAID</span>
            <span>₹{Math.round(completedOrder.total_amount)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/account" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
            TRACK ORDER
          </Link>
          <Link to="/" className="btn-secondary" style={{ padding: '0.85rem 1.75rem' }}>
            CONTINUE SHOPPING
          </Link>
        </div>
      </main>
    );
  }

  if (cartItems.length === 0 && step !== 3) {
    return (
      <main className="section-space container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>YOUR BAG IS EMPTY</h2>
        <Link to="/men" className="btn-primary" style={{ marginTop: '1.5rem' }}>RETURN TO STORE</Link>
      </main>
    );
  }

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-light)' }}>
        <Link to="/">HOME</Link> / <Link to="/cart">BAG</Link> / <span>CHECKOUT</span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '2.5rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '1rem' }}>
        SECURE CHECKOUT
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3.5rem' }} className="checkout-layout">
        
        {/* Left: Step Address & Payment Wizard */}
        <div>
          {/* Step Indicators */}
          <div className="checkout-steps-nav">
            <div 
              className={`checkout-step-indicator ${step === 1 ? 'active' : ''}`}
              onClick={() => setStep(1)}
            >
              1. SHIPPING DESTINATION
            </div>
            <div 
              className={`checkout-step-indicator ${step === 2 ? 'active' : ''}`}
              onClick={() => formData.customer_name && formData.phone && formData.pincode && setStep(2)}
            >
              2. PAYMENT GATEWAY
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>RECIPIENT FULL NAME</label>
                  <input type="text" name="customer_name" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.customer_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>EMAIL ADDRESS</label>
                  <input type="email" name="email" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>PHONE NUMBER (FOR SHIELD CHECK DELIVERY)</label>
                <input type="tel" name="phone" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>HOUSE / STREET ADDRESS</label>
                <input type="text" name="address_line" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.address_line} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>CITY</label>
                  <input type="text" name="city" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>STATE</label>
                  <input type="text" name="state" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.state} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>PINCODE</label>
                  <input type="text" name="pincode" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.pincode} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2.5rem', padding: '1rem' }}>
                CONTINUE TO PAYMENT INFORMATION
              </button>
            </form>
          )}

          {step === 2 && (
            <div>
              <div style={{ backgroundColor: 'var(--bg-subtle)', borderLeft: '3px solid var(--accent-gold)', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)' }}>
                  <Lock size={15} /> SECURE MOCK GATEWAY SIMULATOR ACTIVE
                </strong>
                No real payment gateway is configured. You can complete the checkout process safely for validation.
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>Select Payment Method</label>
                <select name="payment_method" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff', outline: 'none' }} value={formData.payment_method} onChange={handleChange}>
                  <option value="Credit Card / Debit Card (Test Mode)">Credit Card / Debit Card (Mock Mode)</option>
                  <option value="UPI Pay / QR code (Test Mode)">UPI Pay / QR instant (Mock Mode)</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                </select>
              </div>

              {formData.payment_method.includes('Card') && (
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', border: '1px solid var(--border-light)', margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800 }}>CARD NUMBER (SIMULATED)</label>
                    <input type="text" name="cardNumber" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.cardNumber} onChange={handleChange} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800 }}>EXPIRATION DATE</label>
                      <input type="text" name="cardExp" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} placeholder="MM/YY" value={formData.cardExp} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800 }}>SECURITY CODE (CVV)</label>
                      <input type="password" name="cardCvc" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.cardCvc} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              )}

              {error && <div style={{ color: 'var(--accent-badge)', fontSize: '0.85rem', fontWeight: 800, margin: '1rem 0' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button type="button" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }} onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> BACK
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'PROCESSING TRANSACTION...' : `AUTHORIZE & PLACE ORDER (₹${Math.round(finalTotal)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary Order items details */}
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', border: '1px solid var(--border-dark)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', letterSpacing: '0.5px' }}>
            Fit Bag ({cartItems.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            {cartItems.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <img src={item.image_url} alt="" style={{ width: '50px', height: '65px', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                <div style={{ flex: 1, fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.product_name}</div>
                  <div style={{ color: 'var(--text-light)', marginTop: '0.15rem' }}>{item.size} / {item.color.toUpperCase()} x {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'var(--font-title)' }}>₹{Math.round(item.total_price)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bag Subtotal</span>
              <span style={{ fontWeight: 700 }}>₹{Math.round(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-badge)' }}>
                <span>Discount</span>
                <span>-₹{Math.round(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Shipping Charges</span>
              <span style={{ fontWeight: 700 }}>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.2rem', borderTop: '1px solid var(--text-main)', paddingTop: '1rem', fontFamily: 'var(--font-title)' }}>
              <span>Total Paid</span>
              <span>₹{Math.round(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
