import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Compass, HeartHandshake } from 'lucide-react';

const AboutPage = () => {
  return (
    <main className="section-space container" style={{ backgroundColor: 'var(--bg-main)', minHeight: '80vh' }}>
      {/* Breadcrumbs */}
      <div className="breadcrumbs" style={{ fontFamily: 'var(--font-title)', fontSize: '0.78rem', letterSpacing: '1px' }}>
        <Link to="/">HOME</Link> / <span>ABOUT GRABB-IT</span>
      </div>

      {/* Header */}
      <header className="info-page-header">
        <div className="info-page-badge">
          <Sparkles size={16} color="var(--color-turmeric)" />
          <span>OUR STORY &amp; CULTURE</span>
          <Sparkles size={16} color="var(--color-turmeric)" />
        </div>
        <h1 className="info-page-title">
          WEAR YOUR ATTITUDE.
        </h1>
        <p className="info-page-subtitle">
          GRABB-IT is a contemporary Indian streetwear and everyday fashion label inspired by the relentless energy, rich colors, and raw attitude of urban India.
        </p>
      </header>

      {/* Core Brand Narrative */}
      <section className="info-content-block">
        <div className="info-prose">
          <p>
            Born out of the desire for unapologetic authenticity, GRABB-IT crafts high-frequency street drops, heavyweight cotton blanks, and timeless boxy silhouettes built for modern lifestyles. We believe Indian streetwear is not merely a trend—it is a cultural dialogue between heritage craftsmanship and contemporary subculture.
          </p>
          <p>
            From high-density organic cottons and Japanese selvedge-inspired denims to relaxed linens and architectural outerwear, our garments are engineered to survive the streets and elevate everyday wardrobes with minimal effort.
          </p>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="info-card-grid">
        <div className="info-card">
          <div className="info-card-icon">
            <Flame size={22} />
          </div>
          <h2 className="info-card-title">Heavyweight Street Blanks</h2>
          <p className="info-card-text">
            Custom-knit 240+ GSM combed cottons, French terry weaves, and reinforced seams designed for superior drape and long-lasting durability through every wash.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <Compass size={22} />
          </div>
          <h2 className="info-card-title">Cultural Street Synergy</h2>
          <p className="info-card-text">
            Rooted in India's creative renaissance. Every drop merges clean minimalist aesthetics with vibrant subcultural motifs and modern typography.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <ShieldCheck size={22} />
          </div>
          <h2 className="info-card-title">Conscious Craftsmanship</h2>
          <p className="info-card-text">
            Ethically cut and stitched in verified partner manufacturing facilities. We minimize seasonal overproduction through limited curated batches.
          </p>
        </div>

        <div className="info-card">
          <div className="info-card-icon">
            <HeartHandshake size={22} />
          </div>
          <h2 className="info-card-title">Fair &amp; Transparent Pricing</h2>
          <p className="info-card-text">
            Direct-to-consumer architecture eliminates predatory retail markups. Premium luxury-grade fits accessible directly to our community.
          </p>
        </div>
      </section>

      {/* Brand Callout */}
      <div className="info-callout gold">
        <strong>Community Note:</strong> GRABB-IT drops are released in limited collection quantities. Once a seasonal drop sells out, archives are rarely restocked in identical colorways, honoring individuality and exclusivity.
      </div>

      {/* Next Destination CTA */}
      <div style={{ marginTop: '3.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/men" className="btn-primary">
          EXPLORE THE MEN'S COLLECTION <ArrowRight size={18} />
        </Link>
        <Link to="/contact" className="btn-secondary">
          CONTACT OUR TEAM
        </Link>
      </div>
    </main>
  );
};

export default AboutPage;
