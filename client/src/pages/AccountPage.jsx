import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User, MapPin, Key, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AccountPage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

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
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch(err => setLoadingOrders(false));

    // Fetch Addresses
    fetch('/api/auth/addresses', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAddresses(data));
  }, [token]);

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
      if (!res.ok) throw new Error(data.error);

      setPassMsg(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPassErr(err.message || 'Failed to update password');
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
        body: JSON.stringify({ ...newAddr, is_default: 1 })
      });
      if (res.ok) {
        const added = await res.json();
        setAddresses([added, ...addresses]);
        setNewAddr({ full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <main className="section-space container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #111', paddingBottom: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>MY ACCOUNT</h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Welcome back, <strong>{user.name}</strong> ({user.email})</p>
        </div>

        <button className="btn-secondary" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={16} /> LOGOUT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '3rem' }} className="account-layout">
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            className={`drawer-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            style={{ fontWeight: 700, backgroundColor: activeTab === 'orders' ? '#111' : '#fff', color: activeTab === 'orders' ? '#fff' : '#111' }}
            onClick={() => setActiveTab('orders')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={18} /> My Orders</span>
          </button>
          <button
            className={`drawer-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            style={{ fontWeight: 700, backgroundColor: activeTab === 'profile' ? '#111' : '#fff', color: activeTab === 'profile' ? '#fff' : '#111' }}
            onClick={() => setActiveTab('profile')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={18} /> Profile Info</span>
          </button>
          <button
            className={`drawer-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
            style={{ fontWeight: 700, backgroundColor: activeTab === 'addresses' ? '#111' : '#fff', color: activeTab === 'addresses' ? '#fff' : '#111' }}
            onClick={() => setActiveTab('addresses')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={18} /> Saved Addresses</span>
          </button>
          <button
            className={`drawer-nav-item ${activeTab === 'password' ? 'active' : ''}`}
            style={{ fontWeight: 700, backgroundColor: activeTab === 'password' ? '#111' : '#fff', color: activeTab === 'password' ? '#fff' : '#111' }}
            onClick={() => setActiveTab('password')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={18} /> Change Password</span>
          </button>
          <Link to="/wishlist" className="drawer-nav-item" style={{ fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={18} /> Wishlist</span>
          </Link>
        </div>

        {/* Tab Contents */}
        <div>
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>ORDER HISTORY</h2>
              {loadingOrders ? (
                <div>Loading your orders...</div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '2rem', backgroundColor: '#f9f9f9', textAlign: 'center' }}>
                  <p>You haven't placed any orders yet.</p>
                  <Link to="/men" className="btn-primary" style={{ marginTop: '1rem' }}>START SHOPPING</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ border: '1px solid #e5e5e5', padding: '1.5rem', backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>Order #{order.order_number}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Placed on {new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ backgroundColor: order.order_status === 'Delivered' ? '#e8f5e9' : '#fff3e0', color: order.order_status === 'Delivered' ? '#2e7d32' : '#e65100', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 800 }}>
                            {order.order_status.toUpperCase()}
                          </span>
                          <div style={{ fontSize: '0.9rem', fontWeight: 900, marginTop: '0.25rem' }}>${order.total_amount.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>{item.product_name} ({item.size} / {item.color}) x {item.quantity}</span>
                            <span style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '500px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>PROFILE INFORMATION</h2>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" value={user.name} readOnly style={{ backgroundColor: '#f5f5f5' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={user.email} readOnly style={{ backgroundColor: '#f5f5f5' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Role</label>
                <input type="text" className="form-input" value={user.role.toUpperCase()} readOnly style={{ backgroundColor: '#f5f5f5' }} />
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>SAVED ADDRESSES</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {addresses.map(addr => (
                  <div key={addr.id} style={{ border: '1px solid #e5e5e5', padding: '1.25rem', backgroundColor: '#f9f9f9' }}>
                    <div style={{ fontWeight: 800 }}>{addr.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.3rem' }}>
                      {addr.address_line}<br />
                      {addr.city}, {addr.state} - {addr.pincode}<br />
                      Phone: {addr.phone}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Address Form */}
              <div style={{ maxWidth: '500px', borderTop: '1px solid #ddd', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>ADD NEW ADDRESS</h4>
                <form onSubmit={handleAddAddress}>
                  <div className="form-group">
                    <input type="text" placeholder="Full Name" className="form-input" value={newAddr.full_name} onChange={e => setNewAddr({ ...newAddr, full_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Phone Number" className="form-input" value={newAddr.phone} onChange={e => setNewAddr({ ...newAddr, phone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Address Line" className="form-input" value={newAddr.address_line} onChange={e => setNewAddr({ ...newAddr, address_line: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <input type="text" placeholder="City" className="form-input" value={newAddr.city} onChange={e => setNewAddr({ ...newAddr, city: e.target.value })} required />
                    <input type="text" placeholder="State" className="form-input" value={newAddr.state} onChange={e => setNewAddr({ ...newAddr, state: e.target.value })} required />
                    <input type="text" placeholder="Pincode" className="form-input" value={newAddr.pincode} onChange={e => setNewAddr({ ...newAddr, pincode: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>SAVE ADDRESS</button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div style={{ maxWidth: '450px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>CHANGE PASSWORD</h2>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                {passMsg && <div style={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem' }}>{passMsg}</div>}
                {passErr && <div style={{ color: '#c62828', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem' }}>{passErr}</div>}
                <button type="submit" className="btn-primary">UPDATE PASSWORD</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AccountPage;
