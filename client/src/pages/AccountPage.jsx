import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User, MapPin, Key, LogOut, Heart, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#92400E' }}>
            <AlertCircle size={20} />
            <div>
              <strong>Your email address ({user.email}) is not verified.</strong> Verify your account to receive real-time order tracking updates.
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleSendVerification}
            style={{ backgroundColor: '#D97706', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
          >
            VERIFY EMAIL
          </button>
        </div>
      )}

      {/* OTP Input Modal overlay */}
      {verifyingEmail && (
        <div style={{ backgroundColor: '#ffffff', border: '2px solid #111', padding: '1.5rem', marginBottom: '2rem', maxWidth: '400px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            ENTER 6-DIGIT VERIFICATION CODE
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
            {verifyMsg || `A 6-digit OTP code was sent to ${user.email}`}
          </p>
          <form onSubmit={handleVerifyEmailOtp}>
            <input 
              type="text" 
              placeholder="e.g. 123456" 
              value={verifyOtp} 
              onChange={e => setVerifyOtp(e.target.value)} 
              maxLength={6} 
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #111', marginBottom: '1rem', letterSpacing: '4px', textAlign: 'center', fontWeight: 800 }} 
              required 
            />
            {verifyErr && <div style={{ color: 'red', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{verifyErr}</div>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>VERIFY</button>
              <button type="button" className="btn-secondary" style={{ padding: '0.6rem' }} onClick={() => setVerifyingEmail(false)}>CANCEL</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 400, textTransform: 'uppercase', margin: 0 }}>
            MY ACCOUNT
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome back, <strong>{user.name}</strong> ({user.email})
          </p>
        </div>
        <button onClick={logout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
          <LogOut size={16} /> LOGOUT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '3rem' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className={`btn-secondary ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1.25rem', backgroundColor: activeTab === 'orders' ? 'var(--text-main)' : 'transparent', color: activeTab === 'orders' ? '#fff' : 'var(--text-main)' }}
          >
            <Package size={18} /> MY ORDERS ({orders.length})
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1.25rem', backgroundColor: activeTab === 'addresses' ? 'var(--text-main)' : 'transparent', color: activeTab === 'addresses' ? '#fff' : 'var(--text-main)' }}
          >
            <MapPin size={18} /> SAVED ADDRESSES ({addresses.length})
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1.25rem', backgroundColor: activeTab === 'security' ? 'var(--text-main)' : 'transparent', color: activeTab === 'security' ? '#fff' : 'var(--text-main)' }}
          >
            <Key size={18} /> ACCOUNT SECURITY
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
                ORDER HISTORY & TRACKING
              </h2>

              {loadingOrders ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading order history...</div>
              ) : orders.length === 0 ? (
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '3rem', textAlign: 'center' }}>
                  <Package size={48} color="var(--text-light)" style={{ marginBottom: '1rem' }} />
                  <h3>NO ORDERS PLACED YET</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem 0' }}>Explore our latest collections and place your first order.</p>
                  <Link to="/men" className="btn-primary">SHOP NOW</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ backgroundColor: '#fff', border: '1px solid var(--border-dark)', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>Order #{order.order_number}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '0.25rem 0.75rem', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            textTransform: 'uppercase',
                            backgroundColor: order.order_status === 'Delivered' ? '#D1FAE5' : order.order_status === 'Cancelled' ? '#FEE2E2' : '#FEF3C7',
                            color: order.order_status === 'Delivered' ? '#065F46' : order.order_status === 'Cancelled' ? '#991B1B' : '#92400E'
                          }}>
                            {order.order_status}
                          </span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #eee' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                          DELIVERY TRACKING ({order.courier || 'Grabb-it Express Logistics'} — ID: {order.tracking_number || 'N/A'})
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                          {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'].map((st, idx) => {
                            const isCurrent = order.order_status === st;
                            return (
                              <span key={idx} style={{ 
                                padding: '0.2rem 0.5rem', 
                                border: isCurrent ? '1px solid #111' : '1px solid #ddd', 
                                backgroundColor: isCurrent ? '#111' : '#fff',
                                color: isCurrent ? '#fff' : '#666',
                                fontWeight: isCurrent ? 800 : 400
                              }}>
                                {st}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <img src={item.image_url} alt="" style={{ width: '45px', height: '60px', objectFit: 'cover', border: '1px solid var(--border-light)' }} />
                            <div style={{ flex: 1, fontSize: '0.85rem' }}>
                              <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.product_name}</div>
                              <div style={{ color: 'var(--text-light)' }}>Size: {item.size} | Color: {item.color.toUpperCase()} | Qty: {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>₹{Math.round(item.price * item.quantity)}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                        <div>Total Amount: <strong>₹{Math.round(order.total_amount)}</strong> ({order.payment_method})</div>
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
                SAVED DELIVERY ADDRESSES
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {addresses.map(addr => (
                  <div key={addr.id} style={{ backgroundColor: '#fff', border: '1px solid var(--border-dark)', padding: '1.5rem', position: 'relative' }}>
                    {addr.is_default === 1 && (
                      <span style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--text-main)', color: '#fff', fontSize: '0.65rem', padding: '0.2rem 0.5rem', fontWeight: 800 }}>
                        DEFAULT
                      </span>
                    )}
                    <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{addr.full_name}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {addr.address_line}<br />
                      {addr.city}, {addr.state} - {addr.pincode}<br />
                      Phone: {addr.phone}
                    </div>
                    <button 
                      onClick={() => handleDeleteAddress(addr.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--accent-badge)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', marginTop: '1rem', padding: 0 }}
                    >
                      REMOVE ADDRESS
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Address Form */}
              <form onSubmit={handleAddAddress} style={{ backgroundColor: '#fff', border: '1px solid var(--border-light)', padding: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
                  + ADD NEW ADDRESS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input type="text" placeholder="Full Name" className="form-select" style={{ padding: '0.5rem' }} value={newAddr.full_name} onChange={e => setNewAddr({ ...newAddr, full_name: e.target.value })} required />
                  <input type="tel" placeholder="Phone Number" className="form-select" style={{ padding: '0.5rem' }} value={newAddr.phone} onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })} required />
                </div>
                <input type="text" placeholder="Street Address / Flat No" className="form-select" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }} value={newAddr.address_line} onChange={e => setNewAddr({ ...newAddr, address_line: e.target.value })} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <input type="text" placeholder="City" className="form-select" style={{ padding: '0.5rem' }} value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} required />
                  <input type="text" placeholder="State" className="form-select" style={{ padding: '0.5rem' }} value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} required />
                  <input type="text" placeholder="Pincode" className="form-select" style={{ padding: '0.5rem' }} value={newAddr.pincode} onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary">SAVE ADDRESS</button>
              </form>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
                CHANGE PASSWORD
              </h2>

              <form onSubmit={handleChangePassword} style={{ backgroundColor: '#fff', border: '1px solid var(--border-dark)', padding: '2rem', maxWidth: '440px' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">CURRENT PASSWORD</label>
                  <input type="password" className="form-select" style={{ width: '100%', padding: '0.6rem' }} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">NEW PASSWORD (MIN 6 CHARACTERS)</label>
                  <input type="password" className="form-select" style={{ width: '100%', padding: '0.6rem' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>

                {passMsg && <div style={{ color: 'var(--accent-olive)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>{passMsg}</div>}
                {passErr && <div style={{ color: 'var(--accent-badge)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>{passErr}</div>}

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
