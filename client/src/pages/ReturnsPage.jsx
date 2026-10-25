import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, CheckCircle, Clock, AlertTriangle, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';

const ReturnsPage = () => {
  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / <span>RETURNS &amp; EXCHANGES</span>
      </div>

      {/* Header */}
      <header className="info-page-header">
        <div className="info-page-badge">
          <Sparkles size={16} color="var(--color-turmeric)" />
          <span>HASSLE-FREE PROMISE</span>
          <Sparkles size={16} color="var(--color-turmeric)" />
        </div>
        <h1 className="info-page-title">
          RETURNS &amp; EXCHANGES
        </h1>
        <p className="info-page-subtitle">
          We want you to love your fit. If a size isn't right or you are not completely satisfied, our 7-day easy return and exchange policy has you covered.
        </p>
      </header>

      {/* Policy Highlights */}
      <section className="info-card-grid">
        <div className="info-card">
          <div className="info-card-icon">
            <Clock size={22} />
          </div>
          <h2 className="info-card-title">7-Day Window</h2>
          <p className="info-card-text">
            Submit an exchange or return request within <strong>7 days</strong> from the date of confirmed delivery.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <RotateCcw size={22} />
          </div>
          <h2 className="info-card-title">Doorstep Reverse Pickup</h2>
          <p className="info-card-text">
            Our courier partner will arrange a doorstep reverse pickup from your shipping address within 24 to 48 hours of request approval.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <CheckCircle size={22} />
          </div>
          <h2 className="info-card-title">Free Size Exchanges</h2>
          <p className="info-card-text">
            Exchange your piece for a different size at zero additional cost, subject to stock availability in our warehouse.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <Sparkles size={22} />
          </div>
          <h2 className="info-card-title">5–7 Day Refunds</h2>
          <p className="info-card-text">
            Prepaid orders are refunded to the original payment source within 5–7 business days after passing warehouse quality inspection.
          </p>
        </div>
      </section>

      {/* Step-by-Step Return Process */}
      <section className="info-content-block">
        <h2 className="info-section-title">
          How to Request a Return or Exchange
        </h2>
        <div className="info-prose">
          <ol style={{ paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>
              <strong>Initiate Your Request:</strong> Navigate to{' '}
              <Link to="/account" style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline' }}>
                My Account &gt; Order History
              </Link>{' '}
              or contact support directly via WhatsApp at <strong>+91 78718 32815</strong> or email at <strong>grabbitmensclothing@gmail.com</strong> with your Order ID and photos if necessary.
            </li>
            <li>
              <strong>Reverse Pickup Scheduling:</strong> Once verified, our logistics team assigns a reverse pickup. Please keep the item folded in its original GRABB-IT garment bag with tags attached.
            </li>
            <li>
              <strong>Warehouse Quality Audit:</strong> Upon receipt at our facility, our quality inspection team verifies that the garment is unworn, unwashed, and undamaged.
            </li>
            <li>
              <strong>Refund or Exchange Dispatch:</strong> If an exchange was requested, the replacement size is dispatched immediately. If a refund was requested, funds are credited back to your original payment method (or UPI for COD orders).
            </li>
          </ol>
        </div>
      </section>

      {/* Eligibility & Condition Criteria */}
      <section className="info-content-block">
        <h2 className="info-section-title">
          <AlertTriangle size={22} color="var(--color-turmeric)" /> Condition Requirements &amp; Exceptions
        </h2>
        <div className="info-prose">
          <p>
            To qualify for a full refund or size exchange, garments must satisfy the following condition criteria:
          </p>
          <ul>
            <li><strong>Tags Intact:</strong> Original GRABB-IT barcode and brand tags must remain firmly attached.</li>
            <li><strong>Unworn &amp; Unwashed:</strong> Items with perfume, deodorant stains, body odor, makeup marks, or washing detergent scents cannot be accepted.</li>
            <li><strong>Original Packaging:</strong> Returned inside the protective branded polybag provided.</li>
            <li><strong>Non-Returnable Items:</strong> Face coverings, innerwear, socks, and archive mystery drops explicitly marked "Final Sale" cannot be returned for hygiene and exclusivity reasons.</li>
          </ul>
        </div>
      </section>

      {/* COD Refund Notice */}
      <div className="info-callout gold">
        <strong>Cash on Delivery (COD) Refunds:</strong> For orders paid via COD, our support team will provide a secure link to collect your verified UPI ID or NEFT/IMPS bank account details once the package reaches our hub.
      </div>

      <div style={{ marginTop: '3.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/contact" className="btn-primary">
          INITIATE A RETURN / CONTACT SUPPORT <ArrowRight size={18} />
        </Link>
        <Link to="/size-guide" className="btn-secondary">
          CHECK SIZE &amp; FIT GUIDE
        </Link>
      </div>
    </main>
  );
};

export default ReturnsPage;
