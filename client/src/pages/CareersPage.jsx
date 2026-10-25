import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Sparkles, Target, Users, Mail, MapPin, ArrowRight } from 'lucide-react';

const CareersPage = () => {
  const openings = [
    {
      title: 'Senior Streetwear Apparel Designer',
      department: 'Creative & Fashion',
      type: 'Full-time',
      location: 'India (Hybrid / On-site)',
      description: 'Lead visual concepts for seasonal oversized graphic drops, fabric development (heavyweight cotton, waffle knit, terry fleece), and typographic print layouts.'
    },
    {
      title: 'Social Media & Community Lead',
      department: 'Marketing & Brand Culture',
      type: 'Full-time',
      location: 'Remote / Hybrid',
      description: 'Cultivate our underground streetwear movement across Instagram, TikTok, and community Discord. Coordinate influencer seeding and guerrilla street shoots.'
    },
    {
      title: 'E-Commerce Operations & Fulfillment Specialist',
      department: 'Supply Chain & Logistics',
      type: 'Full-time',
      location: 'India (Warehouse & Hub)',
      description: 'Manage inventory velocity, warehouse packing workflows, 3PL courier integrations, and ensure swift same-day dispatch standards.'
    },
    {
      title: 'Full-Stack Web Developer (React / Node.js)',
      department: 'Engineering & Tech',
      type: 'Full-time / Contract',
      location: 'Remote',
      description: 'Maintain and scale our lightning-fast React e-commerce experience, checkout funnel optimization, and internal inventory management systems.'
    }
  ];

  return (
    <div className="info-page-container">
      {/* Breadcrumb */}
      <div className="info-page-breadcrumb">
        <Link to="/" className="breadcrumb-link"><ArrowLeft size={16} /> Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Careers</span>
      </div>

      {/* Header */}
      <div className="info-page-header">
        <span className="info-page-badge">Join The Movement</span>
        <h1 className="info-page-title">BUILD THE CULTURE WITH US</h1>
        <p className="info-page-subtitle">
          We are assembling a squad of designers, creators, storytellers, and builders who live and breathe Indian street fashion.
        </p>
      </div>

      {/* Culture Values Grid */}
      <div style={{ maxWidth: '950px', margin: '0 auto 4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="info-card">
          <Sparkles size={28} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>Raw Authenticity</h3>
          <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            We champion individuality and bold streetwear aesthetics over corporate conformity. We design pieces we would proudly wear ourselves.
          </p>
        </div>

        <div className="info-card">
          <Target size={28} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>Uncompromising Quality</h3>
          <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            From 240+ GSM bio-washed cotton to ultra-durable high-density screenprints, our obsession with detail sets us apart.
          </p>
        </div>

        <div className="info-card">
          <Users size={28} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem' }}>Community First</h3>
          <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
            GRABB-IT isn't just an apparel brand; it's a tight-knit subculture of youth pushing Indian urban expression forward.
          </p>
        </div>
      </div>

      {/* Open Roles Section */}
      <div style={{ maxWidth: '950px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', margin: 0 }}>
              Current Open Roles
            </h2>
            <p style={{ color: '#888888', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Explore opportunities to work with our creative and operational teams.
            </p>
          </div>
          <span style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem', backgroundColor: '#161616', border: '1px solid #333', borderRadius: '9999px', color: '#f59e0b', fontWeight: '700' }}>
            {openings.length} Positions Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {openings.map((job, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #242424',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#242424';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                    {job.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase' }}>
                      {job.department}
                    </span>
                    <span style={{ color: '#555' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>{job.type}</span>
                    <span style={{ color: '#555' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>{job.location}</span>
                  </div>
                </div>
                <a
                  href={`mailto:grabbitmensclothing@gmail.com?subject=Application for ${encodeURIComponent(job.title)}`}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.15rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px'
                  }}
                >
                  Apply via Email <ArrowRight size={14} />
                </a>
              </div>
              <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                {job.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Application Instructions Card */}
      <div style={{
        maxWidth: '950px',
        margin: '4rem auto 0',
        padding: '2.5rem',
        borderRadius: '16px',
        backgroundColor: '#111111',
        border: '1px solid #282828',
        textAlign: 'center'
      }}>
        <Mail size={36} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Don't see your specific role?
        </h3>
        <p style={{ color: '#888888', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
          We are always eager to meet driven creators, photographers, videographers, and marketers. Send your portfolio, CV, and a quick note about why you want to build GRABB-IT to:
        </p>
        <div style={{ display: 'inline-block', backgroundColor: '#0a0a0a', padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #333', marginBottom: '1.5rem' }}>
          <span style={{ color: '#AAAAAA', fontSize: '0.85rem' }}>Official Hiring Email: </span>
          <strong style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '0.04em' }}>grabbitmensclothing@gmail.com</strong>
        </div>
        <div>
          <Link to="/about" style={{ color: '#AAAAAA', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Learn more about our brand journey →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
