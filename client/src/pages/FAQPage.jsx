import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, HelpCircle, Search, MessageSquare, ArrowLeft, Package, CreditCard, RefreshCw, Ruler, ShieldCheck } from 'lucide-react';

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndices, setOpenIndices] = useState([0]); // First item open by default

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'orders', label: 'Orders & Payment', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Package },
    { id: 'returns', label: 'Returns & Exchanges', icon: RefreshCw },
    { id: 'sizing', label: 'Sizing & Fabric', icon: Ruler },
    { id: 'security', label: 'Account & Security', icon: ShieldCheck },
  ];

  const faqs = [
    {
      category: 'orders',
      question: 'How do I place an order on GRABB-IT?',
      answer: 'Browse our collection, select your desired size and color, and click "Add to Bag" or "Buy Now". When you are ready, proceed to Checkout, provide your shipping details, select your preferred payment method (UPI QR, Card, NetBanking, or COD if available), and confirm your order.'
    },
    {
      category: 'orders',
      question: 'What payment methods do you accept?',
      answer: 'We support all major Indian payment channels including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit and Debit Cards (Visa, Mastercard, RuPay), Net Banking across major banks, and direct UPI QR scan during checkout.'
    },
    {
      category: 'orders',
      question: 'Can I cancel or modify my order after placing it?',
      answer: 'Orders can be modified or cancelled within 2 hours of placement or before they are dispatched from our warehouse. Contact our support team immediately at grabbitmensclothing@gmail.com with your Order ID for assistance.'
    },
    {
      category: 'shipping',
      question: 'How long does delivery take?',
      answer: 'Metropolitan cities typically receive orders within 3 to 5 business days. Other regions across India take between 4 to 7 business days. You will receive an SMS and email notification with tracking details as soon as your parcel ships.'
    },
    {
      category: 'shipping',
      question: 'Do you charge for shipping?',
      answer: 'We offer FREE standard shipping across India on orders above ₹999. A nominal flat delivery fee of ₹99 is applicable on orders below ₹999.'
    },
    {
      category: 'shipping',
      question: 'How do I track my shipment?',
      answer: 'Once your order is handed over to our courier partner, you will receive an AWB tracking number via email and SMS. You can also view live delivery status in the "My Orders" tab inside your account.'
    },
    {
      category: 'returns',
      question: 'What is your return and exchange policy?',
      answer: 'We offer an easy 7-day return and exchange window from the date of delivery. Items must be unwashed, unworn, in their original condition with all brand tags and packaging intact. Note that socks and final clearance items are non-returnable for hygiene reasons.'
    },
    {
      category: 'returns',
      question: 'How do I initiate a return or exchange?',
      answer: 'Visit our Returns & Exchanges page or email grabbitmensclothing@gmail.com with your Order ID, product details, and reason for return. Our courier partner will pick up the parcel from your doorstep within 48 to 72 hours.'
    },
    {
      category: 'returns',
      question: 'When will I receive my refund?',
      answer: 'Once the returned garment passes quality inspection at our warehouse, your refund will be processed within 5-7 business days back to your original payment method (or via UPI/NEFT for COD orders).'
    },
    {
      category: 'sizing',
      question: 'How do I pick the right size for streetwear?',
      answer: 'Most of our oversized drops are crafted with a relaxed, dropped-shoulder streetwear drape. If you prefer the true oversized runway aesthetic, choose your regular size. If you prefer a regular or fitted silhouette, we recommend sizing down one size. Check our detailed Size & Fit Guide for exact dimensions.'
    },
    {
      category: 'sizing',
      question: 'What fabric quality do you use?',
      answer: 'All GRABB-IT t-shirts are crafted from premium 100% combed cotton, heavyweight 240+ GSM single jersey knit, pre-shrunk and bio-washed for lasting softness, high breathability, and anti-pilling durability.'
    },
    {
      category: 'security',
      question: 'Is my personal and payment data safe?',
      answer: 'Yes. We utilize 256-bit SSL encryption across all checkout flows and partner exclusively with RBI-compliant payment gateways. We never store your full card numbers, CVV, or banking passwords on our servers.'
    }
  ];

  const toggleAccordion = (index) => {
    if (openIndices.includes(index)) {
      setOpenIndices(openIndices.filter(i => i !== index));
    } else {
      setOpenIndices([...openIndices, index]);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="info-page-container">
      {/* Breadcrumb */}
      <div className="info-page-breadcrumb">
        <Link to="/" className="breadcrumb-link"><ArrowLeft size={16} /> Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Frequently Asked Questions</span>
      </div>

      {/* Header */}
      <div className="info-page-header">
        <span className="info-page-badge">Support Center</span>
        <h1 className="info-page-title">FREQUENTLY ASKED QUESTIONS</h1>
        <p className="info-page-subtitle">
          Everything you need to know about our drops, sizing, shipping, returns, and ordering process.
        </p>

        {/* Search Bar */}
        <div style={{ maxWidth: '600px', margin: '2rem auto 0', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Search questions (e.g. tracking, return, fabric, refund)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.25rem 1rem 3.25rem',
              borderRadius: '9999px',
              border: '2px solid #222',
              backgroundColor: '#0a0a0a',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              outline: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.target.style.borderColor = '#222'}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '3rem' }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? '#f59e0b' : '#141414',
                color: isActive ? '#000000' : '#CCCCCC',
                border: isActive ? '1px solid #f59e0b' : '1px solid #282828'
              }}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        {filteredFaqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#0f0f0f', borderRadius: '12px', border: '1px solid #222' }}>
            <HelpCircle size={48} style={{ color: '#f59e0b', margin: '0 auto 1rem', opacity: 0.7 }} />
            <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>No answers found</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              We could not find any questions matching "{searchQuery}". Try different keywords or reach out directly.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="btn btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={idx}
                className="faq-item"
                style={{
                  marginBottom: '1rem',
                  border: isOpen ? '1px solid #f59e0b' : '1px solid #262626',
                  borderRadius: '12px',
                  background: '#0d0d0d',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '1.05rem',
                    fontWeight: '600'
                  }}
                >
                  <span style={{ color: isOpen ? '#f59e0b' : '#FFFFFF', transition: 'color 0.2s ease' }}>
                    {faq.question}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: isOpen ? '#f59e0b' : '#1f1f1f',
                    color: isOpen ? '#000000' : '#FFFFFF',
                    flexShrink: 0
                  }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 1.5rem 1.25rem',
                    color: '#BBBBBB',
                    fontSize: '0.95rem',
                    lineHeight: '1.65',
                    borderTop: '1px solid #1a1a1a',
                    paddingTop: '1rem'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still need help CTA */}
      <div style={{
        maxWidth: '850px',
        margin: '4rem auto 0',
        padding: '2.5rem 2rem',
        background: 'linear-gradient(135deg, #111111 0%, #171717 100%)',
        border: '1px solid #282828',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <MessageSquare size={36} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Still have questions?
        </h3>
        <p style={{ color: '#888', maxWidth: '500px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
          Can’t find the answer you’re looking for? Our customer support team is available Monday to Saturday to assist you.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/contact" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}>
            Contact Support
          </Link>
          <Link to="/men" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.85rem' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
