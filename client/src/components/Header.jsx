import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, User, ShoppingBag, Heart, X, Shield, ArrowRight, Bell, Sparkles } from 'lucide-react';
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
  const [topTickerMessage, setTopTickerMessage] = useState('FESTIVE DROP: FREE EXPRESS SHIPPING ABOVE ₹999 • USE CODE: GRABB10 FOR 10% OFF');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.freeShippingMessage) {
          setTopTickerMessage(data.freeShippingMessage);
        }
      })
      .catch(err => console.error('Fetch public settings error:', err));
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

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

  const handleGenderSelect = () => {
    setGender('men');
    if (location.pathname === '/' || location.pathname === '/men') {
      navigate('/men');
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
      {/* Top Bright Carnival Ticker Bar */}
      <div className="header-top-bar">
        <Sparkles size={16} color="var(--text-dark)" />
        <span>{topTickerMessage}</span>
        <Sparkles size={16} color="var(--text-dark)" />
      </div>

      {/* Main Navigation Container */}
      <nav className="header-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* LEFT: Branding & Mobile Menu Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            className="icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            title="Open Side Menu"
          >
            <Menu size={22} color="var(--text-dark)" />
          </button>
          
          <Link to="/" className="header-brand-container">
            <div className="header-logo-container">
              <img
                src="/assets/grabb-it-logo.png"
                alt="Grabb-it Logo"
                className="header-logo-img"
                onError={(e) => {
                  e.target.src = '/assets/grabb-it-logo.svg';
                }}
              />
            </div>
            <span className="header-brand-title">
              GRABB<span>-IT</span>
            </span>
          </Link>
        </div>

        {/* CENTER: Desktop Menu Links */}
        <div className="desktop-only" style={{ display: 'flex', gap: '1.25rem' }}>
          <Link to="/men" className="gender-btn active" onClick={() => setGender('men')}>
            MEN
          </Link>
          <Link to="/men?isNew=true" className="gender-btn">
            NEW DROPS
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

        {/* RIGHT: Search & Customer Actions */}
        <div className="header-right">
          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="search-input-box desktop-only">
            <Search size={16} color="var(--text-dark)" />
            <input
              type="text"
              placeholder="Search Men's fashion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Account */}
          <Link to={user ? "/account" : "/login"} className="icon-btn" title="Account">
            <User size={22} color="var(--text-dark)" />
          </Link>

          {/* Wishlist */}
          <Link to="/wishlist" className="icon-btn" title="Wishlist">
            <Heart size={22} color="var(--text-dark)" />
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
                <Bell size={22} color="var(--text-dark)" />
                {unreadCount > 0 && <span className="cart-count-badge">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, width: '320px', 
                  backgroundColor: '#ffffff', border: '2px solid var(--border-medium)', 
                  zIndex: 2000, padding: '1rem', boxShadow: 'var(--shadow-hover)',
                  display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto',
                  marginTop: '0.75rem', textAlign: 'left', borderRadius: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px', color: 'var(--text-dark)' }}>NOTIFICATIONS</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{ fontSize: '0.75rem', color: 'var(--text-dark)', textDecoration: 'underline', fontWeight: 800 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      No new notifications.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => n.is_read === 0 && handleMarkAsRead(n.id)}
                          style={{
                            padding: '0.65rem', borderBottom: '1px solid var(--border-light)',
                            backgroundColor: n.is_read === 0 ? 'var(--bg-subtle)' : 'transparent',
                            cursor: n.is_read === 0 ? 'pointer' : 'default',
                            fontSize: '0.8rem', borderRadius: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: n.is_read === 0 ? 800 : 600, color: 'var(--text-dark)' }}>{n.title}</span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', lineHeight: '1.35', margin: 0 }}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          <Link to="/cart" className="icon-btn" title="Shopping Bag">
            <ShoppingBag size={22} color="var(--text-dark)" />
            {count > 0 && <span className="cart-count-badge">{count}</span>}
          </Link>
        </div>
      </nav>

      {/* SIDE SLIDE NAVIGATION DRAWER MOUNTED VIA PORTAL TO DOCUMENT.BODY */}
      {drawerOpen && ReactDOM.createPortal(
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <div className="drawer-menu">
            {/* Drawer Header */}
            <div className="drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="header-logo-container">
                  <img
                    src="/assets/grabb-it-logo.png"
                    alt="Grabb-it Logo"
                    style={{ height: '32px', maxHeight: '32px' }}
                    onError={(e) => { e.target.src = '/assets/grabb-it-logo.svg'; }}
                  />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '1px', color: 'var(--text-dark)', fontFamily: 'var(--font-title)' }}>
                  GRABB<span style={{ color: 'var(--color-primary)' }}>-IT</span>
                </span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="icon-btn" 
                aria-label="Close menu"
                style={{ color: 'var(--text-dark)', width: '38px', height: '38px' }}
              >
                <X size={24} color="var(--text-dark)" />
              </button>
            </div>

            {/* Drawer Search Input */}
            <div style={{ padding: '1rem 1rem 0.5rem 1rem', flexShrink: 0 }}>
              <form onSubmit={handleSearchSubmit} className="search-input-box" style={{ width: '100%' }}>
                <Search size={16} color="var(--text-dark)" />
                <input
                  type="text"
                  placeholder="Search outfits & products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Scrollable Navigation List */}
            <div className="drawer-nav-list">
              <Link to="/" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>🏠 Home</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to="/men" className="drawer-nav-item" onClick={() => { setGender('men'); setDrawerOpen(false); }}>
                <span>👕 Men</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to={`/${gender}?isNew=true`} className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>✨ New Drops</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to={`/${gender}?isTrending=true`} className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>🔥 Trending</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to="/offers" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>🏷️ Offers</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <a 
                href="#collections" 
                className="drawer-nav-item" 
                onClick={(e) => {
                  e.preventDefault();
                  setDrawerOpen(false);
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  } else {
                    document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span>📦 Collections</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </a>

              <a 
                href="#looks" 
                className="drawer-nav-item" 
                onClick={(e) => {
                  e.preventDefault();
                  setDrawerOpen(false);
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      document.getElementById('looks')?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  } else {
                    document.getElementById('looks')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <span>👀 Shop the Look</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </a>

              <Link to="/wishlist" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>❤️ Wishlist</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to="/cart" className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>🛒 Cart ({count})</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to={user ? "/account" : "/login"} className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>📦 My Orders</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              <Link to={user ? "/account" : "/login"} className="drawer-nav-item" onClick={() => setDrawerOpen(false)}>
                <span>👤 My Account</span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>

              {/* ADMIN OPTION — MUST ALWAYS BE THE LAST ITEM */}
              <div className="drawer-admin-divider" />
              <Link 
                to={user?.role === 'admin' ? "/admin" : "/admin/login"} 
                className="drawer-nav-item drawer-admin-item" 
                onClick={() => setDrawerOpen(false)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <Shield size={18} color="var(--text-dark)" /> 🔐 ADMIN
                </span>
                <ArrowRight size={16} color="var(--text-dark)" />
              </Link>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};

export default Header;
