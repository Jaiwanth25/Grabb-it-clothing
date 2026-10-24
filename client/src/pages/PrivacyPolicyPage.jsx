import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle, Mail, MapPin } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <div className="info-page-container">
      {/* Breadcrumb */}
      <div className="info-page-breadcrumb">
        <Link to="/" className="breadcrumb-link"><ArrowLeft size={16} /> Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Privacy Policy</span>
      </div>

      {/* Header */}
      <div className="info-page-header">
        <span className="info-page-badge">Legal & Transparency</span>
        <h1 className="info-page-title">PRIVACY POLICY</h1>
        <p className="info-page-subtitle">
          Last Updated: October 2024. Your privacy is paramount. Learn how GRABB-IT collects, protects, and handles your personal information under applicable Indian data privacy regulations.
        </p>
      </div>

      {/* Main Content Layout */}
      <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Section 1: Introduction */}
        <section className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Shield size={22} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
              1. Introduction & Scope
            </h2>
          </div>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            This Privacy Policy describes how <strong>GRABB-IT Clothing</strong> ("we", "us", "our") collects, uses, stores, and protects personal data obtained through our e-commerce store at <Link to="/" style={{ color: '#f59e0b', textDecoration: 'underline' }}>grabb-it.com</Link> and associated services. We are dedicated to respecting your privacy in adherence with the <em>Information Technology Act, 2000</em>, the <em>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</em>, and the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em> of India.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Eye size={22} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
              2. Information We Collect
            </h2>
          </div>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            We only collect information necessary to deliver our streetwear apparel, process orders, and communicate updates. This includes:
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ display: 'flex', gap: '0.75rem', color: '#BBBBBB', fontSize: '0.9rem' }}>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>•</span>
              <div><strong style={{ color: '#FFFFFF' }}>Contact & Identification Data:</strong> Your full name, mobile phone number, email address, and delivery shipping addresses provided during checkout or account registration.</div>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', color: '#BBBBBB', fontSize: '0.9rem' }}>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>•</span>
              <div><strong style={{ color: '#FFFFFF' }}>Order & Transaction History:</strong> Products purchased, size selections, billing addresses, order totals, transaction identifiers, and return/exchange inquiries.</div>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', color: '#BBBBBB', fontSize: '0.9rem' }}>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>•</span>
              <div><strong style={{ color: '#FFFFFF' }}>Technical & Device Log Data:</strong> IP addresses, browser types, device identifiers, and operating systems automatically recorded when accessing our website.</div>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', color: '#BBBBBB', fontSize: '0.9rem' }}>
              <span style={{ color: '#f59e0b', fontWeight: '800' }}>•</span>
              <div><strong style={{ color: '#FFFFFF' }}>Communications:</strong> Feedback, support tickets, emails, or newsletter subscriptions submitted via our forms.</div>
            </li>
          </ul>
        </section>

        {/* Section 3: Payment Processing */}
        <section className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Lock size={22} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
              3. Payment Security & Third-Party Processors
            </h2>
          </div>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            Online payments (including UPI QR, Debit/Credit Cards, and NetBanking) are processed through secure, RBI-authorized third-party payment gateways. <strong>GRABB-IT does not store, view, or process sensitive payment credentials</strong> such as credit card numbers, CVVs, or UPI PINs on its servers. All payment data is tokenized and transmitted under strict 256-bit PCI-DSS compliant encryption protocols by the payment gateway.
          </p>
        </section>

        {/* Section 4: How We Use Your Information */}
        <section className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <FileText size={22} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
              4. How We Use Your Information
            </h2>
          </div>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '0.75rem' }}>
            We use your personal data exclusively for lawful purposes including:
          </p>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#BBBBBB', fontSize: '0.9rem', lineHeight: '1.7' }}>
            <li>Processing, packing, dispatching, and tracking your apparel orders.</li>
            <li>Sending transactional updates via SMS, WhatsApp, and email (order confirmations, dispatch alerts, OTPs).</li>
            <li>Handling customer support queries, exchanges, and warranty inquiries.</li>
            <li>Detecting, preventing, and mitigating fraudulent transactions or cyber incidents.</li>
            <li>Sending newsletter announcements regarding new streetwear drops and offers (only with your explicit opt-in).</li>
          </ul>
        </section>

        {/* Section 5: Cookies and Storage */}
        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            5. Cookies & Local Storage
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            We utilize essential session tokens and local storage cookies to remember your shopping cart items, keep you authenticated in your account, and maintain your preferred UI settings. We do not sell your browsing habits or share unauthorized third-party tracking cookies with advertisers.
          </p>
        </section>

        {/* Section 6: Data Sharing with Logistics Partners */}
        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            6. Third-Party Service Providers & Logistics
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            To fulfill orders, we share minimal required information (recipient name, address, contact phone number, order package details) with verified third-party courier aggregators and shipping partners across India (such as Delhivery, Shiprocket, or BlueDart). These partners are legally bound to use your data solely for package delivery.
          </p>
        </section>

        {/* Section 7: Data Retention & Security */}
        <section className="info-card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            7. Data Retention & Safeguards
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
            We store personal data only as long as necessary for fulfillment, accounting compliance, tax obligations, and legal claims. We apply industry-standard security measures including SSL/TLS encryption, firewall architectures, and role-based administrative access controls to safeguard data from unauthorized access or destruction.
          </p>
        </section>

        {/* Section 8: Your Rights & Grievance Redressal */}
        <section className="info-card" style={{ border: '1px solid #f59e0b55' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem', textTransform: 'uppercase' }}>
            8. Customer Rights & Grievance Redressal
          </h2>
          <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1rem' }}>
            Under the Digital Personal Data Protection Act, you have the right to request access to the personal data we hold, ask for corrections, or request deletion of your account. In accordance with Rule 5(9) of the Information Technology Rules, 2011, any inquiries, complaints, or grievances may be directed to our designated Grievance Officer:
          </p>
          <div style={{ backgroundColor: '#141414', padding: '1.25rem', borderRadius: '8px', border: '1px solid #282828' }}>
            <p style={{ color: '#FFFFFF', fontWeight: '700', margin: '0 0 0.5rem 0' }}>Grievance Officer: Customer Support Lead</p>
            <p style={{ color: '#AAAAAA', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Company: GRABB-IT Clothing India</p>
            <p style={{ color: '#AAAAAA', fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Email: <a href="mailto:support@grabb-it.com" style={{ color: '#f59e0b' }}>support@grabb-it.com</a></p>
            <p style={{ color: '#888888', fontSize: '0.8rem', margin: 0 }}>Response Time: Within 7 working days as prescribed under applicable laws.</p>
          </div>
        </section>

        {/* Back navigation */}
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/terms" style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: '700', textDecoration: 'underline', marginRight: '1.5rem' }}>
            Read Terms & Conditions →
          </Link>
          <Link to="/men" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            Return to Shopping
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
