import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Clock, ShieldCheck, MapPin, PackageCheck, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

const ShippingPage = () => {
  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / <span>SHIPPING &amp; DELIVERY</span>
      </div>

      {/* Header */}
      <header className="info-page-header">
        <div className="info-page-badge">
          <Sparkles size={16} color="var(--color-turmeric)" />
          <span>DOORSTEP LOGISTICS</span>
          <Sparkles size={16} color="var(--color-turmeric)" />
        </div>
        <h1 className="info-page-title">
          SHIPPING &amp; DELIVERY
        </h1>
        <p className="info-page-subtitle">
          Transparent, secure, and express doorstep delivery across all serviceable PIN codes throughout India.
        </p>
      </header>

      {/* Highlights Grid */}
      <section className="info-card-grid">
        <div className="info-card">
          <div className="info-card-icon">
            <Truck size={22} />
          </div>
          <h2 className="info-card-title">Free Express Shipping</h2>
          <p className="info-card-text">
            Complimentary express delivery on all orders over <strong>₹999</strong> across India. Orders below ₹999 carry a nominal shipping charge of ₹99.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <Clock size={22} />
          </div>
          <h2 className="info-card-title">Dispatch in 24–48 Hours</h2>
          <p className="info-card-text">
            All drops and verified orders are packed and dispatched from our fulfillment center within 24 to 48 business hours (excluding Sundays &amp; public holidays).
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <MapPin size={22} />
          </div>
          <h2 className="info-card-title">3–5 Business Days</h2>
          <p className="info-card-text">
            Major Tier-1 metros (Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chennai, Kolkata, Pune) typically receive delivery in 3 to 5 business days.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <PackageCheck size={22} />
          </div>
          <h2 className="info-card-title">Real-Time AWB Tracking</h2>
          <p className="info-card-text">
            Instant Air Waybill (AWB) tracking number sent directly via WhatsApp and Email as soon as your shipment is handed over to the courier partner.
          </p>
        </div>
      </section>

      {/* Detailed Shipping Policies */}
      <section className="info-content-block">
        <h2 className="info-section-title">
          <ShieldCheck size={22} color="var(--color-turmeric)" /> Delivery Guidelines &amp; Timelines
        </h2>
        <div className="info-prose">
          <p>
            GRABB-IT collaborates with India's leading surface and air courier networks, including <strong>Delhivery, BlueDart, DTDC, and Shiprocket</strong>, ensuring safe handling of streetwear garments and rapid transit times.
          </p>

          <div className="size-table-wrap">
            <table className="size-table">
              <thead>
                <tr>
                  <th>Destination Tier</th>
                  <th>Estimated Delivery Window</th>
                  <th>Shipping Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Metros (Delhi, Mumbai, Bengaluru, Hyderabad, etc.)</td>
                  <td>3 to 5 Business Days</td>
                  <td>FREE on orders ₹999+ (₹99 for orders below ₹999)</td>
                </tr>
                <tr>
                  <td>Tier 2 &amp; Tier 3 Cities</td>
                  <td>4 to 6 Business Days</td>
                  <td>FREE on orders ₹999+ (₹99 for orders below ₹999)</td>
                </tr>
                <tr>
                  <td>North-East, J&amp;K, and Remote Islands</td>
                  <td>6 to 8 Business Days</td>
                  <td>Standard Rates Apply</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <em>*Note for Store Operations: Exact shipping rates and delivery thresholds are configurable via the Store Settings dashboard.</em>
          </p>
        </div>
      </section>

      <section className="info-content-block">
        <h2 className="info-section-title">
          <AlertCircle size={22} color="var(--color-turmeric)" /> Package Inspection &amp; Delivery Exceptions
        </h2>
        <div className="info-prose">
          <p>
            <strong>Inspect Before Accepting:</strong> All GRABB-IT shipments are secured with tamper-evident packaging. In the unlikely event that your package arrives visibly torn, opened, or resealed, please photograph the parcel and refuse delivery, or contact customer care immediately at <a href="mailto:support@grabb-it.com" style={{ color: '#000000', fontWeight: 800 }}>support@grabb-it.com</a> within 24 hours.
          </p>
          <p>
            <strong>Severe Weather &amp; Transit Delays:</strong> Delivery times may occasionally be extended due to regional weather disruptions, logistical strikes, or high-volume festive seasons (Diwali, New Year, Independence Day drops). Our team proactively monitors all delayed consignments.
          </p>
        </div>
      </section>

      {/* Need Help Callout */}
      <div className="info-callout gold">
        <strong>Need an urgent delivery update?</strong> Track your order in your{' '}
        <Link to="/account" style={{ color: '#000000', fontWeight: 800, textDecoration: 'underline' }}>
          My Account Dashboard
        </Link>{' '}
        or ping our WhatsApp support desk at <strong>+91 99999 88888</strong>.
      </div>

      <div style={{ marginTop: '3.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/men" className="btn-primary">
          CONTINUE SHOPPING <ArrowRight size={18} />
        </Link>
        <Link to="/returns" className="btn-secondary">
          VIEW RETURNS &amp; EXCHANGES
        </Link>
      </div>
    </main>
  );
};

export default ShippingPage;
