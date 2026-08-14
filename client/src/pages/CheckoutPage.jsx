import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, ShieldCheck, Truck, ArrowLeft, QrCode, Building2, AlertCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const CheckoutPage = () => {
  const { cartItems, subtotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  const [formData, setFormData] = useState({
    customer_name: user ? user.name : '',
    email: user ? user.email : '',
    phone: user ? user.phone || '' : '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    payment_method: 'Razorpay Online Payment',
    utr_reference: '',
    payment_proof_url: ''
  });

  const [paymentSettings, setPaymentSettings] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Fetch Payment Gateway & Bank settings from backend
  useEffect(() => {
    fetch('/api/payments/settings')
      .then(res => res.json())
      .then(data => setPaymentSettings(data))
      .catch(err => console.warn('Could not load payment settings:', err));
  }, []);

  // Mandatory Customer Purchase Authentication Check
  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=/checkout');
    }
  }, [token, navigate]);

  // Pre-fill user saved address if available
  useEffect(() => {
    if (token) {
      fetch('/api/auth/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(addrs => {
          if (addrs && addrs.length > 0) {
            const def = addrs.find(a => a.is_default) || addrs[0];
            setFormData(prev => ({
              ...prev,
              customer_name: prev.customer_name || def.full_name,
              phone: prev.phone || def.phone,
              address_line: def.address_line,
              city: def.city,
              state: def.state,
              pincode: def.pincode
            }));
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const shippingFee = subtotal >= 999 || cartItems.length === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Launch Razorpay Payment Modal
  const handleRazorpayPayment = async (orderData) => {
    try {
      const res = await fetch('/api/payments/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.id })
      });
      const rzpData = await res.json();

      if (rzpData.testMode || !window.Razorpay) {
        const verifyRes = await fetch('/api/payments/verify-razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number: orderData.order_number,
            razorpay_order_id: rzpData.orderId,
            razorpay_payment_id: `pay_test_${Date.now()}`
          })
        });
        const verifyJson = await verifyRes.json();
        if (verifyRes.ok) {
          setCompletedOrder({ ...orderData, payment_status: 'PAYMENT_VERIFIED', order_status: 'Confirmed' });
          clearCart();
          setStep(3);
        } else {
          throw new Error(verifyJson.error || 'Payment verification failed');
        }
      } else {
        const options = {
          key: rzpData.key,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'GRABB-IT CLOTHING',
          description: `Order #${orderData.order_number}`,
          order_id: rzpData.orderId,
          prefill: {
            name: orderData.customer_name,
            email: orderData.email,
            contact: orderData.phone
          },
          theme: { color: '#4A0E17' },
          handler: async function (response) {
            const verifyRes = await fetch('/api/payments/verify-razorpay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_number: orderData.order_number,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            if (verifyRes.ok) {
              setCompletedOrder({ ...orderData, payment_status: 'PAYMENT_VERIFIED', order_status: 'Confirmed' });
              clearCart();
              setStep(3);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err.message || 'Razorpay initialization failed.');
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customer_name || !formData.email || !formData.phone || !formData.address_line || !formData.city || !formData.state || !formData.pincode) {
      setError('Please complete all shipping address fields.');
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      setError('Please enter a valid 6-digit Pincode.');
      return;
    }

    if (formData.payment_method.includes('UPI') || formData.payment_method.includes('Bank')) {
      if (!formData.utr_reference || formData.utr_reference.trim().length < 6) {
        setError('Please enter your 12-digit UTR / Transaction Reference Number for payment verification.');
        return;
      }
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
      payment_method: formData.payment_method,
      payment_reference: formData.utr_reference || null,
      payment_proof_url: formData.payment_proof_url || null
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

      const createdOrder = data.order;

      if (formData.payment_method.includes('Razorpay')) {
        await handleRazorpayPayment(createdOrder);
      } else {
        setCompletedOrder(createdOrder);
        clearCart();
        setStep(3);
        setPlacing(false);
      }
    } catch (err) {
      setError(err.message || 'Order placement failed. Please try again.');
      setPlacing(false);
    }
  };

  // STEP 3: Order Confirmation View
  if (step === 3 && completedOrder) {
    const isManualPending = completedOrder.payment_status === 'MANUAL_PAYMENT_PENDING';

    return (
      <main className="section-space container" style={{ maxWidth: '740px', textAlign: 'center', backgroundColor: 'var(--bg-main)' }}>
        <CheckCircle2 size={76} color={isManualPending ? 'var(--color-turmeric)' : 'var(--color-emerald)'} style={{ marginBottom: '1.5rem', display: 'inline-block' }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '0.5rem' }}>
          {isManualPending ? 'ORDER PLACED — PENDING VERIFICATION' : 'ORDER CONFIRMED! THANK YOU'}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Order Reference Number: <strong style={{ color: 'var(--color-saffron)' }}>{completedOrder.order_number}</strong>
        </p>

        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-light)', textAlign: 'left', marginBottom: '2.5rem', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '0.75rem', letterSpacing: '1px', color: 'var(--color-maroon)' }}>
            ORDER SUMMARY &amp; DETAILS
          </h3>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.8', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>Recipient:</strong> {completedOrder.customer_name} ({completedOrder.email})</div>
            <div><strong>Contact phone:</strong> {completedOrder.phone}</div>
            <div><strong>Shipping Address:</strong> {completedOrder.shipping_address}</div>
            <div><strong>Tracking Number:</strong> {completedOrder.tracking_number}</div>
            <div><strong>Payment Method:</strong> {completedOrder.payment_method}</div>
            <div>
              <strong>Payment Status:</strong>{' '}
              <span style={{ color: isManualPending ? 'var(--color-turmeric)' : 'var(--color-emerald)', fontWeight: 800 }}>
                {isManualPending ? 'MANUAL VERIFICATION PENDING' : 'PAYMENT VERIFIED'}
              </span>
            </div>
            {completedOrder.payment_reference && (
              <div><strong>Transaction Reference (UTR):</strong> {completedOrder.payment_reference}</div>
            )}
          </div>

          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem', color: 'var(--color-maroon)' }}>
            ORDERED ITEMS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {completedOrder.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <div>
                  <strong style={{ textTransform: 'uppercase', color: 'var(--color-maroon)' }}>{item.product_name}</strong> ({item.size} / {item.color.toUpperCase()}) x {item.quantity}
                </div>
                <div style={{ fontWeight: 800, color: 'var(--color-maroon)' }}>{formatINR(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.3rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid var(--color-maroon)', fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>
            <span>TOTAL PAID</span>
            <span>{formatINR(completedOrder.total_amount)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/account" className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
            MY ORDERS &amp; TRACKING
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
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--color-maroon)' }}>YOUR SHOPPING BAG IS EMPTY</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Add items to your bag to proceed to checkout.</p>
        <Link to="/men" className="btn-primary" style={{ marginTop: '1.5rem' }}>EXPLORE COLLECTION</Link>
      </main>
    );
  }

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / <Link to="/cart">BAG</Link> / <span>CHECKOUT</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Sparkles size={16} color="var(--color-saffron)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--color-saffron)', textTransform: 'uppercase' }}>
          FINAL STEP
        </span>
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', marginBottom: '2rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '1rem' }}>
        SECURE CHECKOUT
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3.5rem' }} className="checkout-layout">
        
        {/* Left: Wizard Form */}
        <div>
          <div className="checkout-steps-nav" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
            <div 
              className={`checkout-step-indicator ${step === 1 ? 'active' : ''}`}
              onClick={() => setStep(1)}
            >
              1. SHIPPING ADDRESS
            </div>
            <div 
              className={`checkout-step-indicator ${step === 2 ? 'active' : ''}`}
              onClick={() => formData.customer_name && formData.phone && formData.pincode && setStep(2)}
            >
              2. PAYMENT METHOD
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">RECIPIENT FULL NAME *</label>
                  <input type="text" name="customer_name" className="form-input" value={formData.customer_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">EMAIL ADDRESS *</label>
                  <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">MOBILE PHONE NUMBER *</label>
                <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">HOUSE / STREET ADDRESS *</label>
                <input type="text" name="address_line" className="form-input" value={formData.address_line} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">CITY *</label>
                  <input type="text" name="city" className="form-input" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">STATE *</label>
                  <input type="text" name="state" className="form-input" value={formData.state} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">PINCODE *</label>
                  <input type="text" name="pincode" className="form-input" value={formData.pincode} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}>
                CONTINUE TO PAYMENT METHOD
              </button>
            </form>
          )}

          {step === 2 && (
            <div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">SELECT PAYMENT METHOD</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                  
                  {/* Option 1: Razorpay */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.1rem', border: formData.payment_method.includes('Razorpay') ? '2px solid var(--color-saffron)' : '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="Razorpay Online Payment" 
                      checked={formData.payment_method.includes('Razorpay')} 
                      onChange={handleChange} 
                    />
                    <CreditCard size={22} color="var(--color-maroon)" />
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-maroon)' }}>Razorpay Secure Checkout (Cards / Netbanking / UPI)</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Instant automated payment verification</div>
                    </div>
                  </label>

                  {/* Option 2: UPI / QR Code */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.1rem', border: formData.payment_method.includes('UPI') ? '2px solid var(--color-saffron)' : '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="UPI / GPay Direct Transfer" 
                      checked={formData.payment_method.includes('UPI')} 
                      onChange={handleChange} 
                    />
                    <QrCode size={22} color="var(--color-maroon)" />
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-maroon)' }}>UPI / Google Pay / PhonePe (Direct Transfer)</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Scan QR code or use UPI ID + enter UTR reference number</div>
                    </div>
                  </label>

                  {/* Option 3: Bank Transfer */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1.1rem', border: formData.payment_method.includes('Bank') ? '2px solid var(--color-saffron)' : '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="Bank Wire Transfer (NEFT/IMPS)" 
                      checked={formData.payment_method.includes('Bank')} 
                      onChange={handleChange} 
                    />
                    <Building2 size={22} color="var(--color-maroon)" />
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-maroon)' }}>Bank Transfer (NEFT / IMPS / RTGS)</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Direct deposit to company bank account + submit UTR number</div>
                    </div>
                  </label>

                </div>
              </div>

              {/* UPI Form details */}
              {formData.payment_method.includes('UPI') && (
                <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--color-maroon)' }}>
                    UPI PAYMENT INSTRUCTIONS
                  </h4>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {paymentSettings?.upi?.qrCodeUrl && (
                      <img src={paymentSettings.upi.qrCodeUrl} alt="UPI QR Code" style={{ width: '130px', height: '130px', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                    )}
                    <div style={{ fontSize: '0.88rem', lineHeight: '1.6' }}>
                      <div>UPI ID: <strong style={{ color: 'var(--color-saffron)', fontSize: '0.95rem' }}>{paymentSettings?.upi?.upiId || 'grabb-it@upi'}</strong></div>
                      <div>Payee Name: <strong>{paymentSettings?.upi?.displayName || 'GRABB-IT CLOTHING'}</strong></div>
                      <div>Amount: <strong>{formatINR(finalTotal)}</strong></div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">TRANSACTION REFERENCE / UTR NUMBER *</label>
                    <input 
                      type="text" 
                      name="utr_reference" 
                      placeholder="e.g. 423910849201" 
                      className="form-input" 
                      value={formData.utr_reference} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer details */}
              {formData.payment_method.includes('Bank') && (
                <div style={{ backgroundColor: '#ffffff', padding: '1.75rem', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--color-maroon)' }}>
                    BANK ACCOUNT DETAILS FOR DEPOSIT
                  </h4>
                  <div style={{ fontSize: '0.88rem', lineHeight: '1.8', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    <div>Bank Name: <strong>{paymentSettings?.bankTransfer?.bankName || 'HDFC Bank Ltd'}</strong></div>
                    <div>Account Holder: <strong>{paymentSettings?.bankTransfer?.accountHolder || 'GRABB-IT CLOTHING PVT LTD'}</strong></div>
                    <div>Account Number: <strong>{paymentSettings?.bankTransfer?.accountNumberMasked || '•••• •••• 5821'}</strong></div>
                    <div>IFSC Code: <strong>{paymentSettings?.bankTransfer?.ifscCode || 'HDFC0001234'}</strong></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">BANK TRANSACTION / UTR NUMBER *</label>
                    <input 
                      type="text" 
                      name="utr_reference" 
                      placeholder="Enter 12-digit UTR number" 
                      className="form-input" 
                      value={formData.utr_reference} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ color: 'var(--color-magenta)', fontSize: '0.85rem', fontWeight: 800, margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }} onClick={() => setStep(1)} disabled={placing}>
                  <ArrowLeft size={16} /> BACK
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'PROCESSING TRANSACTION...' : `PLACE ORDER (${formatINR(finalTotal)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-light)', height: 'fit-content', boxShadow: 'var(--shadow-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '0.5rem', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
            BAG SUMMARY ({cartItems.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            {cartItems.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                <img src={item.image_url} alt="" style={{ width: '55px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-maroon)' }}>{item.product_name}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.size} / {item.color.toUpperCase()} x {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>{formatINR(item.total_price)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Bag Subtotal</span>
              <span style={{ fontWeight: 700, color: 'var(--color-maroon)' }}>{formatINR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-magenta)' }}>
                <span>Discount</span>
                <span>-{formatINR(discountAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Express Shipping</span>
              <span style={{ fontWeight: 700, color: shippingFee === 0 ? 'var(--color-emerald)' : 'var(--color-maroon)' }}>
                {shippingFee === 0 ? 'FREE' : formatINR(shippingFee)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.25rem', borderTop: '2px solid var(--color-maroon)', paddingTop: '1rem', fontFamily: 'var(--font-title)', color: 'var(--color-maroon)' }}>
              <span>Total Payable</span>
              <span>{formatINR(finalTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default CheckoutPage;
