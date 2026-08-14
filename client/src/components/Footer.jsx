import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Instagram, Facebook, Twitter, Youtube, Sparkles } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
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
              <Instagram size={22} cursor="pointer" />
              <Facebook size={22} cursor="pointer" />
              <Twitter size={22} cursor="pointer" />
              <Youtube size={22} cursor="pointer" />
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="footer-col-title">Shop Collection</h4>
            <ul className="footer-links">
              <li><Link to="/men">Men's Apparel</Link></li>
              <li><Link to="/women">Women's Apparel</Link></li>
              <li><Link to="/men?isNew=true">New Arrivals</Link></li>
              <li><Link to="/men?isTrending=true">Trending Outfits</Link></li>
              <li><Link to="/offers">Festive Offers</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links">
              <li><a href="#contact">Contact Support</a></li>
              <li><a href="#shipping">Shipping &amp; Delivery</a></li>
              <li><a href="#returns">Returns &amp; Exchanges</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
              <li><a href="#size-guide">Size &amp; Fit Guide</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-col-title">Brand Info</h4>
            <ul className="footer-links">
              <li><a href="#about">About GRABB-IT</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><Link to="/admin/login">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="footer-col-title">Join The Carnival</h4>
            <p style={{ color: '#d4c8b8', fontSize: '0.88rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Subscribe for exclusive drop alerts, VIP festive offers, and 15% off your first order.
            </p>
            {subscribed ? (
              <div style={{ backgroundColor: 'rgba(13, 92, 70, 0.3)', color: '#4caf50', padding: '0.85rem', fontSize: '0.88rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #4caf50' }}>
                ✓ Welcome to the GRABB-IT Carnival!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex' }}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid var(--border-medium)',
                    color: '#fff',
                    padding: '0.8rem 1rem',
                    fontSize: '0.85rem',
                    flex: 1,
                    outline: 'none',
                    borderRadius: '8px 0 0 8px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--color-saffron)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0 1.25rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    borderRadius: '0 8px 8px 0'
                  }}
                >
                  <ArrowRight size={18} />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>&copy; 2026 GRABB-IT Clothing India Pvt. Ltd. All Rights Reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
