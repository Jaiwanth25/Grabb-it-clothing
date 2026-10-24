import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Instagram, Facebook, Twitter, Youtube, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { fetchApi } from '../services/api';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    try {
      await fetchApi('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStatus('success');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message || 'Subscription failed. Please try again.');
    }
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info & Official Logo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/assets/grabb-it-logo.png"
                  alt="GRABB-IT Official Logo"
                  style={{ height: '36px', width: 'auto', display: 'block' }}
                  onError={(e) => { e.target.src = '/assets/grabb-it-logo.svg'; }}
                />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '2.5px', color: '#ffffff', fontFamily: 'var(--font-title)' }}>
                GRABB<span style={{ color: 'var(--color-saffron)' }}>-IT</span>
              </span>
            </div>
            <p style={{ color: '#d4c8b8', fontSize: '0.9rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              Contemporary fashion inspired by the energy, colour, and culture of India. High-frequency street drops, heavy cotton blanks, and timeless silhouettes.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-turmeric)' }}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="GRABB-IT on Instagram" style={{ color: 'inherit' }}>
                <Instagram size={22} cursor="pointer" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="GRABB-IT on Facebook" style={{ color: 'inherit' }}>
                <Facebook size={22} cursor="pointer" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="GRABB-IT on Twitter" style={{ color: 'inherit' }}>
                <Twitter size={22} cursor="pointer" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="GRABB-IT on YouTube" style={{ color: 'inherit' }}>
                <Youtube size={22} cursor="pointer" />
              </a>
            </div>
          </div>

          {/* Shop Collection */}
          <div>
            <h4 className="footer-col-title">Shop Collection</h4>
            <ul className="footer-links">
              <li><Link to="/men">Men's Apparel</Link></li>
              <li><Link to="/men?isNew=true">New Arrivals</Link></li>
              <li><Link to="/men?isTrending=true">Trending Outfits</Link></li>
              <li><Link to="/offers">Festive Offers</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Support</Link></li>
              <li><Link to="/shipping">Shipping &amp; Delivery</Link></li>
              <li><Link to="/returns">Returns &amp; Exchanges</Link></li>
              <li><Link to="/faq">Frequently Asked Questions</Link></li>
              <li><Link to="/size-guide">Size &amp; Fit Guide</Link></li>
            </ul>
          </div>

          {/* Brand Info */}
          <div>
            <h4 className="footer-col-title">Brand Info</h4>
            <ul className="footer-links">
              <li><Link to="/about">About GRABB-IT</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/admin/login">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter / Join The Movement */}
          <div>
            <h4 className="footer-col-title">Join The Movement</h4>
            <p style={{ color: '#d4c8b8', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Subscribe for exclusive drop alerts, VIP festive offers, and special access to limited capsule releases.
            </p>

            {status === 'success' ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.85rem 1rem', fontSize: '0.88rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} />
                <span>You're in! Welcome to the GRABB-IT inner circle.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex' }}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'loading'}
                    required
                    aria-label="Email address for newsletter"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: status === 'error' ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                      color: '#fff',
                      padding: '0.8rem 1rem',
                      fontSize: '0.85rem',
                      flex: 1,
                      outline: 'none',
                      borderRadius: '8px 0 0 8px',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    aria-label="Submit newsletter subscription"
                    style={{
                      backgroundColor: 'var(--color-saffron)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0 1.25rem',
                      cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      borderRadius: '0 8px 8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: status === 'loading' ? 0.7 : 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    {status === 'loading' ? (
                      <Loader size={18} className="spin-animation" />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                </div>
                {status === 'error' && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>&copy; 2026 GRABB-IT Clothing India. All Rights Reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/privacy-policy" style={{ color: 'inherit' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'inherit' }}>Terms of Service</Link>
            <Link to="/shipping" style={{ color: 'inherit' }}>Shipping Info</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
