import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

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
          {/* Brand Info & Official Logo at the End */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src="/assets/grabb-it-logo.png"
                  alt="GRABB-IT Official Logo"
                  style={{ height: '36px', width: 'auto', display: 'block' }}
                  onError={(e) => { e.target.src = '/assets/grabb-it-logo.svg'; }}
                />
              </div>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '2px', color: '#ffffff' }}>GRABB-IT</span>
            </div>
            <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Modern, minimal, high-frequency clothing engineered for effortless confidence. Pure solid aesthetics with premium craftsmanship.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: '#ccc' }}>
              <Instagram size={20} cursor="pointer" />
              <Facebook size={20} cursor="pointer" />
              <Twitter size={20} cursor="pointer" />
              <Youtube size={20} cursor="pointer" />
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="footer-col-title">Shop</h4>
            <ul className="footer-links">
              <li><Link to="/men">Men's Collection</Link></li>
              <li><Link to="/women">Women's Collection</Link></li>
              <li><Link to="/men?isNew=true">New Arrivals</Link></li>
              <li><Link to="/men?isTrending=true">Trending Outfits</Link></li>
              <li><Link to="/offers">Special Offers</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links">
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#shipping">Shipping &amp; Delivery</a></li>
              <li><a href="#returns">Returns &amp; Exchanges</a></li>
              <li><a href="#faq">FAQs</a></li>
              <li><a href="#size-guide">Size Guide</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms &amp; Conditions</a></li>
              <li><Link to="/admin/login">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="footer-col-title">Join The Club</h4>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Subscribe to get exclusive early access to drops and 15% off your first order.
            </p>
            {subscribed ? (
              <div style={{ backgroundColor: '#222', color: '#4caf50', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px' }}>
                ✓ Thank you for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    backgroundColor: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '0.75rem 1rem',
                    fontSize: '0.85rem',
                    flex: 1,
                    outline: 'none',
                    borderRadius: '8px 0 0 8px'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#fff',
                    color: '#111',
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
          <div>&copy; 2026 GRABB-IT Inc. All Rights Reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
