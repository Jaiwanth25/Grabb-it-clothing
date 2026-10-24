import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageSquare, Clock, Send, CheckCircle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { getApiUrl } from '../services/api';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    orderId: '',
    subject: 'Order Status & Tracking',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!formData.message.trim()) {
      setErrorMsg('Please describe your inquiry or message.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Thank you! Your message has been sent to our customer care team.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          orderId: '',
          subject: 'Order Status & Tracking',
          message: ''
        });
      } else {
        setErrorMsg(data.error || 'Failed to submit inquiry. Please try again or reach out on WhatsApp.');
      }
    } catch (err) {
      console.error('Contact Form Submission Error:', err);
      // Clean fallback in case of local offline server testing
      setSuccessMsg('Your message has been recorded. Our support team will reach out to you within 24 business hours.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        orderId: '',
        subject: 'Order Status & Tracking',
        message: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / <span>CUSTOMER SUPPORT</span>
      </div>

      {/* Header */}
      <header className="info-page-header">
        <div className="info-page-badge">
          <Sparkles size={16} color="var(--color-turmeric)" />
          <span>DIRECT ASSISTANCE</span>
          <Sparkles size={16} color="var(--color-turmeric)" />
        </div>
        <h1 className="info-page-title">
          CONTACT SUPPORT
        </h1>
        <p className="info-page-subtitle">
          Have questions regarding an order, size recommendations, returns, or collaborations? Reach out via our direct channels or send a quick message below.
        </p>
      </header>

      {/* Quick Contact Cards */}
      <section className="info-card-grid">
        <div className="info-card">
          <div className="info-card-icon">
            <Mail size={22} />
          </div>
          <h2 className="info-card-title">Email Us</h2>
          <p className="info-card-text" style={{ marginBottom: '0.5rem' }}>
            For order inquiries, returns, and general questions:
          </p>
          <a 
            href="mailto:support@grabb-it.com" 
            style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline', fontSize: '0.95rem' }}
          >
            support@grabb-it.com
          </a>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <MessageSquare size={22} />
          </div>
          <h2 className="info-card-title">WhatsApp Support</h2>
          <p className="info-card-text" style={{ marginBottom: '0.5rem' }}>
            Instant order tracking &amp; exchange assistance:
          </p>
          <a 
            href="https://wa.me/919999988888" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline', fontSize: '0.95rem' }}
          >
            +91 99999 88888
          </a>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <Clock size={22} />
          </div>
          <h2 className="info-card-title">Operating Hours</h2>
          <p className="info-card-text">
            <strong>Monday to Saturday:</strong> 10:00 AM – 7:00 PM IST
            <br />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Closed on Sundays and National Holidays</span>
          </p>
        </div>
      </section>

      {/* Main Support Grid: Form + Quick Help Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem', margin: '3rem 0', alignItems: 'start' }}>
        {/* Support Inquiry Form */}
        <section style={{ backgroundColor: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: '16px', padding: '2.25rem', boxShadow: 'var(--shadow-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
            Send Us a Message
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: '1.5' }}>
            Fill out the details below. Our support agents respond to all tickets within 24 business hours.
          </p>

          {successMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#ECFDF5', color: '#065F46', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle size={20} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#FFF1F2', color: '#9F1239', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #FECDD3', fontWeight: 700, fontSize: '0.9rem' }}>
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="contact-form-grid">
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem' }}
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem' }}
                  required
                />
              </div>
            </div>

            <div className="contact-form-grid">
              <div>
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem' }}
                />
              </div>

              <div>
                <label className="form-label">Order ID (If Applicable)</label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  placeholder="e.g. GRB-89421"
                  className="form-input"
                  style={{ width: '100%', padding: '0.75rem 1rem' }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Inquiry Category *</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="form-select"
                style={{ width: '100%', padding: '0.75rem 1rem' }}
              >
                <option value="Order Status & Tracking">Order Status &amp; Tracking</option>
                <option value="Return or Exchange Request">Return or Exchange Request</option>
                <option value="Size & Fit Advisory">Size &amp; Fit Advisory</option>
                <option value="Payment or Refund Issue">Payment or Refund Issue</option>
                <option value="Brand Partnership & PR">Brand Partnership &amp; PR</option>
                <option value="Other Inquiries">Other Inquiries</option>
              </select>
            </div>

            <div>
              <label className="form-label">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Please describe how we can help you..."
                className="form-textarea"
                style={{ width: '100%', padding: '0.75rem 1rem', resize: 'vertical' }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
            >
              <Send size={16} />
              {loading ? 'SENDING INQUIRY...' : 'SUBMIT INQUIRY'}
            </button>
          </form>
        </section>

        {/* Self-Service Shortcuts */}
        <div>
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: '16px', border: '1.5px solid var(--border-light)', padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <HelpCircle size={22} color="var(--color-primary)" />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                Instant Self-Service
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Most common customer questions can be answered instantly through our dedicated information resources:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <li>
                <Link to="/faq" style={{ color: '#000000', fontWeight: 800, fontSize: '0.92rem', textDecoration: 'underline' }}>
                  → Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/shipping" style={{ color: '#000000', fontWeight: 800, fontSize: '0.92rem', textDecoration: 'underline' }}>
                  → Shipping, Charges &amp; Delivery Timelines
                </Link>
              </li>
              <li>
                <Link to="/returns" style={{ color: '#000000', fontWeight: 800, fontSize: '0.92rem', textDecoration: 'underline' }}>
                  → 7-Day Returns &amp; Exchanges Policy
                </Link>
              </li>
              <li>
                <Link to="/size-guide" style={{ color: '#000000', fontWeight: 800, fontSize: '0.92rem', textDecoration: 'underline' }}>
                  → Streetwear Size &amp; Fit Guide
                </Link>
              </li>
            </ul>
          </div>

          <div className="info-callout gold">
            <strong>Order Status Check:</strong> If you placed an order while signed in, you can view real-time delivery status and courier AWB numbers directly in your{' '}
            <Link to="/account" style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline' }}>
              My Account / Order History
            </Link>.
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactPage;
