import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, ShieldCheck, Truck, ArrowLeft, Lock, QrCode, Building2, AlertCircle } from 'lucide-react';
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
        // Test mode fallback when live credentials aren't present
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
        // Live Razorpay Checkout SDK Modal
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
          theme: { color: '#111111' },
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
        // Manual payment (UPI or Bank Transfer)
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
      <main className="section-space container" style={{ maxWidth: '720px', textAlign: 'center', backgroundColor: 'var(--bg-main)' }}>
        <CheckCircle2 size={72} color={isManualPending ? 'var(--accent-gold)' : 'var(--accent-olive)'} style={{ marginBottom: '1.5rem', display: 'inline-block' }} />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          {isManualPending ? 'ORDER PLACED — PENDING VERIFICATION' : 'ORDER CONFIRMED! THANK YOU'}
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Order Reference Number: <strong style={{ color: 'var(--text-main)' }}>{completedOrder.order_number}</strong>
        </p>

        <div style={{ backgroundColor: '#ffffff', padding: '2.5rem', border: '1px solid var(--border-dark)', textAlign: 'left', marginBottom: '2.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', letterSpacing: '1px' }}>
            ORDER SUMMARY & STATUS
          </h3>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><strong>Recipient:</strong> {completedOrder.customer_name} ({completedOrder.email})</div>
            <div><strong>Contact phone:</strong> {completedOrder.phone}</div>
            <div><strong>Shipping Address:</strong> {completedOrder.shipping_address}</div>
            <div><strong>Tracking Number:</strong> {completedOrder.tracking_number}</div>
            <div><strong>Payment Method:</strong> {completedOrder.payment_method}</div>
            <div>
              <strong>Payment Status:</strong>{' '}
              <span style={{ color: isManualPending ? '#D97706' : 'var(--accent-olive)', fontWeight: 800 }}>
                {isManualPending ? 'MANUAL VERIFICATION PENDING' : 'PAYMENT VERIFIED'}
              </span>
            </div>
            {completedOrder.payment_reference && (
              <div><strong>Transaction Reference (UTR):</strong> {completedOrder.payment_reference}</div>
            )}
          </div>

          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem', letterSpacing: '0.5px' }}>
            ORDERED APPAREL
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
            MY ORDERS & TRACKING
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
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>YOUR SHOPPING BAG IS EMPTY</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-light)' }}>Add items to your bag to proceed to checkout.</p>
        <Link to="/men" className="btn-primary" style={{ marginTop: '1.5rem' }}>EXPLORE COLLECTION</Link>
      </main>
    );
  }

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.75rem', letterSpacing: '1px', color: 'var(--text-light)' }}>
        <Link to="/">HOME</Link> / <Link to="/cart">BAG</Link> / <span>CHECKOUT</span>
      </div>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, textTransform: 'uppercase', marginBottom: '2rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '1rem' }}>
        SECURE CHECKOUT
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3.5rem' }} className="checkout-layout">
        
        {/* Left: Wizard Form */}
        <div>
          <div className="checkout-steps-nav" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
            <div 
              className={`checkout-step-indicator ${step === 1 ? 'active' : ''}`}
              onClick={() => setStep(1)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', borderBottom: step === 1 ? '2px solid #111' : 'none' }}
            >
              1. SHIPPING DESTINATION
            </div>
            <div 
              className={`checkout-step-indicator ${step === 2 ? 'active' : ''}`}
              onClick={() => formData.customer_name && formData.phone && formData.pincode && setStep(2)}
              style={{ padding: '0.75rem 1.5rem', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', borderBottom: step === 2 ? '2px solid #111' : 'none' }}
            >
              2. PAYMENT GATEWAY
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>RECIPIENT FULL NAME *</label>
                  <input type="text" name="customer_name" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.customer_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>EMAIL ADDRESS *</label>
                  <input type="email" name="email" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>MOBILE PHONE NUMBER *</label>
                <input type="tel" name="phone" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.phone} onChange={handleChange} required />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>HOUSE / STREET ADDRESS *</label>
                <input type="text" name="address_line" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.address_line} onChange={handleChange} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>CITY *</label>
                  <input type="text" name="city" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>STATE *</label>
                  <input type="text" name="state" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.state} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>PINCODE *</label>
                  <input type="text" name="pincode" className="form-select" style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={formData.pincode} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2.5rem', padding: '1rem' }}>
                CONTINUE TO PAYMENT METHOD
              </button>
            </form>
          )}

          {step === 2 && (
            <div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>SELECT PAYMENT METHOD</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  
                  {/* Option 1: Razorpay */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: formData.payment_method.includes('Razorpay') ? '2px solid #111' : '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="Razorpay Online Payment" 
                      checked={formData.payment_method.includes('Razorpay')} 
                      onChange={handleChange} 
                    />
                    <CreditCard size={20} />
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>Razorpay Secure Checkout (Cards / Netbanking / UPI)</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instant automated payment verification</div>
                    </div>
                  </label>

                  {/* Option 2: UPI / QR Code */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: formData.payment_method.includes('UPI') ? '2px solid #111' : '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="UPI / GPay Direct Transfer" 
                      checked={formData.payment_method.includes('UPI')} 
                      onChange={handleChange} 
                    />
                    <QrCode size={20} />
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>UPI / Google Pay / PhonePe (Direct Transfer)</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan QR code or use UPI ID + enter UTR reference number</div>
                    </div>
                  </label>

                  {/* Option 3: Bank Transfer */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: formData.payment_method.includes('Bank') ? '2px solid #111' : '1px solid var(--border-light)', cursor: 'pointer', backgroundColor: '#fff' }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="Bank Wire Transfer (NEFT/IMPS)" 
                      checked={formData.payment_method.includes('Bank')} 
                      onChange={handleChange} 
                    />
                    <Building2 size={20} />
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>Bank Transfer (NEFT / IMPS / RTGS)</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct deposit to company bank account + submit UTR number</div>
                    </div>
                  </label>

                </div>
              </div>

              {/* UPI Form details */}
              {formData.payment_method.includes('UPI') && (
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', border: '1px solid var(--border-dark)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>
                    UPI PAYMENT INSTRUCTIONS
                  </h4>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {paymentSettings?.upi?.qrCodeUrl && (
                      <img src={paymentSettings.upi.qrCodeUrl} alt="UPI QR Code" style={{ width: '130px', height: '130px', border: '1px solid var(--border-light)' }} />
                    )}
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                      <div>UPI ID: <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{paymentSettings?.upi?.upiId || 'grabb-it@upi'}</strong></div>
                      <div>Payee Name: <strong>{paymentSettings?.upi?.displayName || 'GRABB-IT CLOTHING'}</strong></div>
                      <div>Amount: <strong>₹{Math.round(finalTotal)}</strong></div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>TRANSACTION REFERENCE / UTR NUMBER *</label>
                    <input 
                      type="text" 
                      name="utr_reference" 
                      placeholder="e.g. 423910849201" 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} 
                      value={formData.utr_reference} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Bank Transfer details */}
              {formData.payment_method.includes('Bank') && (
                <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', border: '1px solid var(--border-dark)', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>
                    BANK ACCOUNT DETAILS FOR DEPOSIT
                  </h4>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    <div>Bank Name: <strong>{paymentSettings?.bankTransfer?.bankName || 'HDFC Bank Ltd'}</strong></div>
                    <div>Account Holder: <strong>{paymentSettings?.bankTransfer?.accountHolder || 'GRABB-IT CLOTHING PVT LTD'}</strong></div>
                    <div>Account Number: <strong>{paymentSettings?.bankTransfer?.accountNumberMasked || '•••• •••• 5821'}</strong></div>
                    <div>IFSC Code: <strong>{paymentSettings?.bankTransfer?.ifscCode || 'HDFC0001234'}</strong></div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>BANK TRANSACTION / UTR NUMBER *</label>
                    <input 
                      type="text" 
                      name="utr_reference" 
                      placeholder="Enter 12-digit UTR number" 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} 
                      value={formData.utr_reference} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              )}

              {error && (
                <div style={{ color: 'var(--accent-badge)', fontSize: '0.85rem', fontWeight: 800, margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" style={{ padding: '0.85rem 1.5rem' }} onClick={() => setStep(1)} disabled={placing}>
                  <ArrowLeft size={16} /> BACK
                </button>
                <button type="button" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'PROCESSING TRANSACTION...' : `PLACE ORDER (₹${Math.round(finalTotal)})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div style={{ backgroundColor: '#ffffff', padding: '2rem', border: '1px solid var(--border-dark)', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', letterSpacing: '0.5px' }}>
            FIT BAG ({cartItems.length})
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
              <span>Total Payable</span>
              <span>₹{Math.round(finalTotal)}</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default CheckoutPage;
