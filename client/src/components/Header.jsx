import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, User, ShoppingBag, Heart, X, Shield, ArrowRight } from 'lucide-react';
import { useGender } from '../context/GenderContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { gender, setGender } = useGender();
  const { count } = useCart();
  const { user, isAdmin } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

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
        FREE EXPRESS SHIPPING ON ORDERS OVER $75 • USE CODE: <strong>GRABB10</strong> FOR 10% OFF
      </div>

      {/* Main Responsive Header */}
      <nav className="header-nav">
        {/* LEFT SECTION */}
        <div className="header-left">
          <button
            className="icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            title="Menu"
          >
            <Menu size={24} />
          </button>

          {/* Desktop Gender Switcher */}
          <div className="gender-switcher desktop-only" style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className={`gender-btn ${gender === 'men' ? 'active' : ''}`}
              onClick={() => handleGenderSelect('men')}
            >
              MEN
            </button>
            <button
              className={`gender-btn ${gender === 'women' ? 'active' : ''}`}
              onClick={() => handleGenderSelect('women')}
            >
              WOMEN
            </button>
          </div>
        </div>

        {/* CENTER SECTION: Official Rabbit Logo + GRABB-IT */}
        <Link to="/" className="header-center">
          <img
            src="/assets/grabb-it-logo.png"
            alt="Grabb-it Logo"
            className="header-logo-img"
            onError={(e) => {
              e.target.src = '/assets/grabb-it-logo.svg';
            }}
          />
          <span className="header-brand-title">GRABB-IT</span>
        </Link>

        {/* RIGHT SECTION */}
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
          <Link to="/wishlist" className="icon-btn desktop-only" title="Wishlist">
            <Heart size={22} />
          </Link>

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
