import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User, MapPin, Key, LogOut, Heart, ShieldCheck, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const AccountPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Email verification state
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [verifyErr, setVerifyErr] = useState('');
  const [isVerified, setIsVerified] = useState(user?.email_verified || false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  // Address form
  const [newAddr, setNewAddr] = useState({ full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch My Orders
    fetch('/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data || []);
        setLoadingOrders(false);
      })
      .catch(err => setLoadingOrders(false));

    // Fetch Addresses
    fetch('/api/auth/addresses', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAddresses(data || []));
  }, [token]);

  const handleSendVerification = async () => {
    setVerifyErr('');
    setVerifyMsg('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVerifyMsg(data.message);
      setVerifyingEmail(true);
    } catch (err) {
      setVerifyErr(err.message);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setVerifyErr('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: verifyOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsVerified(true);
      setVerifyingEmail(false);
      setVerifyMsg('Email address verified successfully!');
    } catch (err) {
      setVerifyErr(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      setPassMsg(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPassErr(err.message);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddr)
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses([...addresses, data]);
        setNewAddr({ full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await fetch(`/api/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(addresses.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      
      {/* Unverified Email Warning Banner */}
      {!isVerified && (
        <div style={{ backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--color-turmeric)', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--color-maroon)' }}>
            <AlertCircle size={20} color="var(--color-saffron)" />
            <div>
              <strong>Your email address ({user.email}) is not verified.</strong> Verify your account to receive real-time order tracking updates.
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleSendVerification}
            className="btn-saffron"
            style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}
          >
            VERIFY EMAIL
          </button>
        </div>
      )}

      {/* OTP Input Modal overlay */}
      {verifyingEmail && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--color-maroon)' }}>
              ENTER 6-DIGIT VERIFICATION CODE
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {verifyMsg || `A 6-digit OTP code was sent to ${user.email}`}
            </p>
            <form onSubmit={handleVerifyEmailOtp}>
              <input 
                type="text" 
                placeholder="e.g. 123456" 
                value={verifyOtp} 
                onChange={e => setVerifyOtp(e.target.value)} 
                maxLength={6} 
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }} 
                required 
              />
              {verifyErr && <div style={{ color: 'var(--color-magenta)', fontSize: '0.82rem', marginBottom: '0.75rem', fontWeight: 700 }}>{verifyErr}</div>}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.75rem' }}>VERIFY</button>
                <button type="button" className="btn-secondary" style={{ padding: '0.75rem' }} onClick={() => setVerifyingEmail(false)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '2px solid var(--color-maroon)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-maroon)', margin: 0 }}>
            MY ACCOUNT
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Welcome back, <strong style={{ color: 'var(--color-maroon)' }}>{user.name}</strong> ({user.email})
          </p>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}>
          <LogOut size={16} /> LOGOUT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '3rem' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button 
            className={`btn-secondary ${activeTab === 'orders' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1.25rem' }}
          >
            <Package size={18} /> MY ORDERS ({orders.length})
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'addresses' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('addresses')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1.25rem' }}
          >
            <MapPin size={18} /> SAVED ADDRESSES ({addresses.length})
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'security' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('security')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1.25rem' }}
          >
            <Key size={18} /> ACCOUNT SECURITY
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
                ORDER HISTORY &amp; TRACKING
              </h2>

              {loadingOrders ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading order history...</div>
              ) : orders.length === 0 ? (
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '3.5rem', textAlign: 'center', boxShadow: 'var(--shadow-subtle)' }}>
                  <Package size={52} color="var(--color-maroon)" style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', color: 'var(--color-maroon)' }}>NO ORDERS PLACED YET</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.75rem 0' }}>Explore our latest collections and place your first order.</p>
                  <Link to="/men" className="btn-primary">EXPLORE THE COLLECTION</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--shadow-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--color-maroon)' }}>Order #{order.order_number}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '0.35rem 0.85rem', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            borderRadius: '20px',
                            backgroundColor: order.order_status === 'Delivered' ? 'var(--bg-subtle)' : order.order_status === 'Cancelled' ? 'var(--accent-badge-bg)' : '#FEF3C7',
                            color: order.order_status === 'Delivered' ? 'var(--color-emerald)' : order.order_status === 'Cancelled' ? 'var(--color-magenta)' : '#92400E'
                          }}>
                            {order.order_status}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <img src={item.image_url} alt="" style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                            <div style={{ flex: 1, fontSize: '0.88rem' }}>
                              <div style={{ fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-maroon)' }}>{item.product_name}</div>
                              <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>Size: {item.size} | Color: {item.color.toUpperCase()} | Qty: {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-maroon)' }}>{formatINR(item.price * item.quantity)}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: '0.92rem' }}>
                        <div>Total Amount: <strong style={{ color: 'var(--color-maroon)' }}>{formatINR(order.total_amount)}</strong> ({order.payment_method})</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
                SAVED DELIVERY ADDRESSES
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {addresses.map(addr => (
                  <div key={addr.id} style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.5rem', position: 'relative', boxShadow: 'var(--shadow-subtle)' }}>
                    {addr.is_default === 1 && (
                      <span className="badge-carnival" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                        DEFAULT
                      </span>
                    )}
                    <strong style={{ display: 'block', fontSize: '0.98rem', marginBottom: '0.25rem', color: 'var(--color-maroon)' }}>{addr.full_name}</strong>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {addr.address_line}<br />
                      {addr.city}, {addr.state} - {addr.pincode}<br />
                      Phone: {addr.phone}
                    </div>
                    <button 
                      onClick={() => handleDeleteAddress(addr.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--color-magenta)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', marginTop: '1rem', padding: 0 }}
                    >
                      REMOVE ADDRESS
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Address Form */}
              <form onSubmit={handleAddAddress} style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--shadow-subtle)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem', color: 'var(--color-maroon)' }}>
                  + ADD NEW ADDRESS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input type="text" placeholder="Full Name" className="form-input" value={newAddr.full_name} onChange={e => setNewAddr({ ...newAddr, full_name: e.target.value })} required />
                  <input type="tel" placeholder="Phone Number" className="form-input" value={newAddr.phone} onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })} required />
                </div>
                <input type="text" placeholder="Street Address / Flat No" className="form-input" style={{ width: '100%', marginBottom: '1rem' }} value={newAddr.address_line} onChange={e => setNewAddr({ ...newAddr, address_line: e.target.value })} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <input type="text" placeholder="City" className="form-input" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} required />
                  <input type="text" placeholder="State" className="form-input" value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} required />
                  <input type="text" placeholder="Pincode" className="form-input" value={newAddr.pincode} onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary">SAVE ADDRESS</button>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px', color: 'var(--color-maroon)' }}>
                CHANGE PASSWORD
              </h2>

              <form onSubmit={handleChangePassword} style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '2rem', maxWidth: '440px', boxShadow: 'var(--shadow-subtle)' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">CURRENT PASSWORD</label>
                  <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">NEW PASSWORD (MIN 6 CHARACTERS)</label>
                  <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>

                {passMsg && <div style={{ color: 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>{passMsg}</div>}
                {passErr && <div style={{ color: 'var(--color-magenta)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>{passErr}</div>}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>UPDATE PASSWORD</button>
              </form>
            </div>
          )}

        </div>

      </div>
    </main>
  );
};

export default AccountPage;
