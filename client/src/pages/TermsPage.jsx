import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, CheckSquare, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="info-page-container">
      {/* Breadcrumb */}
      <div className="info-page-breadcrumb">
        <Link to="/" className="breadcrumb-link"><ArrowLeft size={16} /> Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Terms of Service</span>
      </div>

      {/* Header */}
      <div className="info-page-header">
        <span className="info-page-badge">Legal & Terms</span>
        <h1 className="info-page-title">TERMS & CONDITIONS</h1>
        <p className="info-page-subtitle">
          Please review these terms carefully before accessing or shopping on the GRABB-IT e-commerce website.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        <section className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Scale size={22} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
              1. Acceptance of Terms
            </h2>
          </div>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            By visiting or purchasing from GRABB-IT ("we", "our", or "us"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree with any portion of these terms, please discontinue using the website. We reserve the right to revise or modify these Terms at any time, and continuing to use the platform confirms your acceptance of any revisions.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            2. Eligibility & Account Security
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            By placing an order, you represent that you are at least 18 years of age or possess the legal capacity to enter into a binding contract under the Indian Contract Act, 1872. You are responsible for safeguarding your account credentials, passwords, and order numbers, and you agree to notify us immediately if you suspect unauthorized activity.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            3. Product Catalog, Colors & Pricing
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '0.75rem' }}>
            We make every reasonable effort to display garment colors, cuts, prints, and fabric textures accurately. However, actual colors may slightly differ based on your device display calibration.
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#BBBBBB', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <li>All prices listed on the website are displayed in Indian Rupees (₹ INR) and include applicable Goods and Services Tax (GST) unless explicitly noted.</li>
            <li>We reserve the right to adjust prices, modify drops, or discontinue items without prior notice.</li>
            <li>In the rare event of a pricing or typographical error, we reserve the right to cancel affected orders and issue a full refund.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            4. Orders, Payments & Order Acceptance
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            Receipt of an electronic order confirmation does not constitute our legal acceptance of your order. We reserve the right to accept, limit, or decline your order at any time after receipt for reasons including stock shortages, payment authorization delays, or identified fraudulent activity. Validated payments for cancelled orders will be refunded promptly.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            5. Shipping, Title & Risk of Loss
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            Delivery timelines are estimates provided by third-party logistics partners and are not guaranteed deadlines. Risk of loss and title for products pass to you upon delivery of the items by the courier partner to the address provided during checkout. Please refer to our <Link to="/shipping" style={{ color: '#f59e0b', textDecoration: 'underline' }}>Shipping & Delivery Policy</Link> for detailed transit information.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            6. Returns, Exchanges & Refunds
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            Eligible unworn, unwashed streetwear apparel with intact tags may be exchanged or returned within 7 days of delivery. Custom-printed garments and items marked "Final Sale" cannot be returned. Review our comprehensive <Link to="/returns" style={{ color: '#f59e0b', textDecoration: 'underline' }}>Returns & Exchanges Policy</Link> for inspection criteria and instructions.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            7. Intellectual Property Rights
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            All content on this website, including but not limited to brand logos, graphic streetwear designs, typography, photographs, video snippets, and user interfaces, is the exclusive property of GRABB-IT and protected under Indian and international copyright and trademark laws. You may not reproduce, distribute, or create derivative works without prior written consent.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            8. Prohibited Conduct
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '0.75rem' }}>
            When using our platform, you agree not to:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#BBBBBB', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <li>Engage in scraping, automated data harvesting, or reverse-engineering of site assets.</li>
            <li>Use false credentials, stolen cards, or fraudulent UPI payment details.</li>
            <li>Interfere with or bypass server security, authentication tokens, or rate-limiting measures.</li>
            <li>Impersonate any brand representative or tamper with the administrative portal.</li>
          </ul>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            9. Limitation of Liability
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            To the maximum extent permitted by applicable Indian law, GRABB-IT shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use this site. In no event shall our total liability exceed the actual purchase price paid by you for the specific garment order giving rise to the claim.
          </p>
        </section>

        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            10. Governing Law & Dispute Resolution
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            These Terms are governed by and construed in accordance with the substantive laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of India.
          </p>
        </section>

        <section className="info-card" style={{ border: '1px solid #f59e0b55' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            11. Inquiries & Legal Contact
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            If you have any questions or require legal clarification regarding these Terms, please reach out to our team at <a href="mailto:grabbitmensclothing@gmail.com" style={{ color: '#f59e0b', textDecoration: 'underline' }}>grabbitmensclothing@gmail.com</a> or via our <Link to="/contact" style={{ color: '#f59e0b', textDecoration: 'underline' }}>Contact Form</Link>.
          </p>
        </section>

        {/* Back navigation */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/privacy-policy" style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'underline', marginRight: '1.5rem' }}>
            ← View Privacy Policy
          </Link>
          <Link to="/men" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            Back to Shopping
          </Link>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;
