import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, User, ShoppingBag, Heart, X, Shield, ArrowRight, Bell } from 'lucide-react';
import { useGender } from '../context/GenderContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { gender, setGender } = useGender();
  const { count } = useCart();
  const { user, isAdmin, token } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    const fetchNotifications = () => {
      fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          setNotifications(data);
          const unread = data.filter(n => n.is_read === 0).length;
          setUnreadCount(unread);
        })
        .catch(err => console.error('Fetch notifications failed:', err));
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, token]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
    if (location.pathname === '/' || location.pathname === '/men' || location.pathname === '/women') {
      navigate(`/${selectedGender}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/${gender}?search=${encodeURIComponent(searchQuery.trim())}`);
      setDrawerOpen(false);
    }
  };

  return (
    <header className="header-sticky">
      {/* Top Banner Bar */}
      <div className="header-top-bar">
        FREE SHIPPING ABOVE ₹999 • USE CODE: <strong>GRABB10</strong> FOR 10% OFF
      </div>

      {/* Main Responsive Header */}
      <nav className="header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* LEFT: Branding & Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="icon-btn mobile-only"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            title="Menu"
          >
            <Menu size={24} />
          </button>
          
          <Link to="/" className="header-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
            <img
              src="/assets/grabb-it-logo.png"
              alt="Grabb-it Logo"
              className="header-logo-img"
              onError={(e) => {
                e.target.src = '/assets/grabb-it-logo.svg';
              }}
            />
            <span className="header-brand-title" style={{ fontFamily: 'var(--font-title)' }}>GRABB-IT</span>
          </Link>
        </div>

        {/* CENTER: Desktop Menu Links */}
        <div className="desktop-only" style={{ display: 'flex', gap: '1.25rem' }}>
          <Link to="/men" className={`gender-btn ${gender === 'men' ? 'active' : ''}`} onClick={() => setGender('men')}>
            MEN
          </Link>
          <Link to="/women" className={`gender-btn ${gender === 'women' ? 'active' : ''}`} onClick={() => setGender('women')}>
            WOMEN
          </Link>
          <Link to={`/${gender}?isNew=true`} className="gender-btn">
            NEW ARRIVALS
          </Link>
          <Link to={`/${gender}?isTrending=true`} className="gender-btn">
            TRENDING
          </Link>
          <a href="#collections" className="gender-btn" onClick={(e) => {
            e.preventDefault();
            if (location.pathname !== '/') {
              navigate('/');
              setTimeout(() => {
                document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
              }, 300);
            } else {
              document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}>
            COLLECTIONS
          </a>
          <Link to="/offers" className="gender-btn">
            OFFERS
          </Link>
        </div>

        {/* RIGHT: Search & Icons */}
        <div className="header-right">
          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="search-input-box desktop-only">
            <Search size={16} color="#666" />
            <input
              type="text"
              placeholder={`Search ${gender}'s fashion...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Account */}
          <Link to={user ? "/account" : "/login"} className="icon-btn" title="Account">
            <User size={22} />
          </Link>

          {/* Wishlist */}
          <Link to="/wishlist" className="icon-btn" title="Wishlist">
            <Heart size={22} />
          </Link>

          {/* Notifications Bell */}
          {user && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button 
                className="icon-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                <Bell size={22} />
                {unreadCount > 0 && <span className="cart-count-badge" style={{ backgroundColor: 'var(--accent-badge)' }}>{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, width: '320px', 
                  backgroundColor: '#ffffff', border: '1px solid var(--border-dark)', 
                  zIndex: 2000, padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto',
                  marginTop: '0.75rem', textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{ fontSize: '0.72rem', color: 'var(--text-light)', textDecoration: 'underline', fontWeight: 700 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      No new notifications.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => n.is_read === 0 && handleMarkAsRead(n.id)}
                          style={{
                            padding: '0.5rem', borderBottom: '1px solid var(--border-light)',
                            backgroundColor: n.is_read === 0 ? 'var(--bg-subtle)' : 'transparent',
                            cursor: n.is_read === 0 ? 'pointer' : 'default',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                            <span style={{ fontWeight: n.is_read === 0 ? 800 : 600, color: 'var(--text-main)' }}>{n.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <Link to="/cart" className="icon-btn" title="Shopping Cart">
            <ShoppingBag size={22} />
            {count > 0 && <span className="cart-count-badge">{count}</span>}
          </Link>
        </div>
      </nav>

      {/* NAVIGATION DRAWER */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-menu">
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/assets/grabb-it-logo.png" alt="Grabb-it" style={{ height: '28px' }} />
                <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '1px' }}>GRABB-IT</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="icon-btn">
                <X size={24} />
              </button>
            </div>

            {/* Mobile Search */}
            <div style={{ padding: '1rem' }}>
              <form onSubmit={handleSearchSubmit} className="search-input-box" style={{ width: '100%' }}>
                <Search size={16} color="#666" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Gender Toggle Inside Drawer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0 1rem 1rem 1rem', gap: '0.5rem' }}>
              <button
                className={`btn-primary ${gender === 'men' ? '' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={() => {
                  handleGenderSelect('men');
                  setDrawerOpen(false);
                }}
              >
                MEN
              </button>
              <button
                className={`btn-primary ${gender === 'women' ? '' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.6rem' }}
                onClick={() => {
                  handleGenderSelect('women');
                  setDrawerOpen(false);
                }}
              >
                WOMEN
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="drawer-nav-list">
              <Link to="/" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                Home <ArrowRight size={16} color="#999" />
              </Link>
              <Link to="/men" className="drawer-nav-item" onClick={() => { setGender('men'); setDrawerOpen(false); }}>
                Men's Collection <ArrowRight size={16} color="#999" />
              </Link>
              <Link to="/women" className="drawer-nav-item" onClick={() => { setGender('women'); setDrawerOpen(false); }}>
                Women's Collection <ArrowRight size={16} color="#999" />
              </Link>
              <Link to={`/${gender}?isNew=true`} className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                New Arrivals <ArrowRight size={16} color="#999" />
              </Link>
              <Link to={`/${gender}?isTrending=true`} className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                Trending Outfits <ArrowRight size={16} color="#999" />
              </Link>
              <Link to="/offers" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                Special Offers <ArrowRight size={16} color="#999" />
              </Link>
              <Link to="/wishlist" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                Wishlist <ArrowRight size={16} color="#999" />
              </Link>
              <Link to="/cart" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                Shopping Cart ({count}) <ArrowRight size={16} color="#999" />
              </Link>
              <Link to="/account" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                My Account <ArrowRight size={16} color="#999" />
              </Link>

              {isAdmin && (
                <Link to="/admin" className="drawer-nav-item" style={{ backgroundColor: '#111', color: '#fff' }} onClick={() => setDrawerOpen(false)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={16} /> Admin Dashboard</span>
                  <ArrowRight size={16} color="#fff" />
                </Link>
              )}

              {!user && (
                <Link to="/admin/login" className="drawer-nav-item" style={{ color: '#666', fontSize: '0.85rem' }} onClick={() => setDrawerOpen(false)}>
                  Admin Login
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
