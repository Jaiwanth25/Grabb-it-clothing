import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Ruler, CheckCircle, Info, Sparkles } from 'lucide-react';

const SizeGuidePage = () => {
  const [unit, setUnit] = useState('inches'); // 'inches' | 'cm'
  const [activeTab, setActiveTab] = useState('oversized'); // 'oversized' | 'regular' | 'hoodies' | 'bottoms'

  // Conversion helper: converts inch values (as strings or numbers) to cm
  const toUnit = (inchVal) => {
    if (unit === 'inches') return inchVal;
    if (typeof inchVal === 'number') {
      return (inchVal * 2.54).toFixed(1);
    }
    // Handle ranges like "40 - 42"
    if (typeof inchVal === 'string' && inchVal.includes('-')) {
      const parts = inchVal.split('-').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return `${(parts[0] * 2.54).toFixed(1)} - ${(parts[1] * 2.54).toFixed(1)}`;
      }
    }
    const parsed = parseFloat(inchVal);
    return isNaN(parsed) ? inchVal : (parsed * 2.54).toFixed(1);
  };

  const tables = {
    oversized: {
      title: 'Oversized Streetwear T-Shirts (Boxy Fit / Dropped Shoulder)',
      description: 'Crafted with exaggerated chest width and dropped shoulder seams for a modern relaxed drape. Stick to your usual size for the true oversized look; size down for a standard regular fit.',
      headers: ['Size', 'Chest (Around)', 'Front Length', 'Shoulder Width', 'Sleeve Length'],
      rows: [
        { size: 'S', chest: 42, length: 28, shoulder: 20.5, sleeve: 9.0 },
        { size: 'M', chest: 44, length: 29, shoulder: 21.5, sleeve: 9.5 },
        { size: 'L', chest: 46, length: 30, shoulder: 22.5, sleeve: 10.0 },
        { size: 'XL', chest: 48, length: 31, shoulder: 23.5, sleeve: 10.5 },
        { size: 'XXL', chest: 50, length: 32, shoulder: 24.5, sleeve: 11.0 },
      ]
    },
    regular: {
      title: 'Standard Fit Graphic T-Shirts (Regular Cut)',
      description: 'Classic unisex profile designed to sit true-to-body around chest and shoulders with standard armhole depth.',
      headers: ['Size', 'Chest (Around)', 'Front Length', 'Shoulder Width', 'Sleeve Length'],
      rows: [
        { size: 'S', chest: 38, length: 27, shoulder: 17.5, sleeve: 8.0 },
        { size: 'M', chest: 40, length: 28, shoulder: 18.5, sleeve: 8.5 },
        { size: 'L', chest: 42, length: 29, shoulder: 19.5, sleeve: 9.0 },
        { size: 'XL', chest: 44, length: 30, shoulder: 20.5, sleeve: 9.5 },
        { size: 'XXL', chest: 46, length: 31, shoulder: 21.5, sleeve: 10.0 },
      ]
    },
    hoodies: {
      title: 'Heavyweight Hoodies & Pullover Sweatshirts (380+ GSM)',
      description: 'Fleece-lined heavyweight cuts tailored with double-layered hood and ribbed cuff hems for insulation and comfort.',
      headers: ['Size', 'Chest (Around)', 'Body Length', 'Shoulder Width', 'Sleeve Length'],
      rows: [
        { size: 'S', chest: 44, length: 27.5, shoulder: 21.0, sleeve: 24.0 },
        { size: 'M', chest: 46, length: 28.5, shoulder: 22.0, sleeve: 24.5 },
        { size: 'L', chest: 48, length: 29.5, shoulder: 23.0, sleeve: 25.0 },
        { size: 'XL', chest: 50, length: 30.5, shoulder: 24.0, sleeve: 25.5 },
        { size: 'XXL', chest: 52, length: 31.5, shoulder: 25.0, sleeve: 26.0 },
      ]
    },
    bottoms: {
      title: 'Cargo Pants & Relaxed Streetwear Joggers',
      description: 'Features elasticated drawcord waistbands and relaxed taper through the ankle.',
      headers: ['Size', 'Waist (Elastic Range)', 'Inseam Length', 'Outseam Length', 'Thigh (Round)'],
      rows: [
        { size: 'S (28-30)', chest: '28 - 30', length: 29.0, shoulder: 39.5, sleeve: 24.0 },
        { size: 'M (31-32)', chest: '31 - 32', length: 29.5, shoulder: 40.5, sleeve: 25.0 },
        { size: 'L (33-34)', chest: '33 - 34', length: 30.0, shoulder: 41.5, sleeve: 26.0 },
        { size: 'XL (35-36)', chest: '35 - 36', length: 30.5, shoulder: 42.5, sleeve: 27.0 },
        { size: 'XXL (37-38)', chest: '37 - 38', length: 31.0, shoulder: 43.5, sleeve: 28.0 },
      ]
    }
  };

  const currentTable = tables[activeTab];

  return (
    <div className="info-page-container">
      {/* Breadcrumb */}
      <div className="info-page-breadcrumb">
        <Link to="/" className="breadcrumb-link"><ArrowLeft size={16} /> Home</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Size & Fit Guide</span>
      </div>

      {/* Header */}
      <div className="info-page-header">
        <span className="info-page-badge">Fit & Sizing</span>
        <h1 className="info-page-title">SIZE & FIT GUIDE</h1>
        <p className="info-page-subtitle">
          Find your signature silhouette. Use our detailed measurement charts to select the perfect fit for your street style.
        </p>

        {/* Unit Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#141414', padding: '4px', borderRadius: '9999px', border: '1px solid #282828', marginTop: '2rem' }}>
          <button
            onClick={() => setUnit('inches')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              backgroundColor: unit === 'inches' ? '#f59e0b' : 'transparent',
              color: unit === 'inches' ? '#000000' : '#888',
              transition: 'all 0.2s ease'
            }}
          >
            Inches (in)
          </button>
          <button
            onClick={() => setUnit('cm')}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              backgroundColor: unit === 'cm' ? '#f59e0b' : 'transparent',
              color: unit === 'cm' ? '#000000' : '#888',
              transition: 'all 0.2s ease'
            }}
          >
            Centimeters (cm)
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
        {[
          { id: 'oversized', label: 'Oversized Tees' },
          { id: 'regular', label: 'Standard Graphic Tees' },
          { id: 'hoodies', label: 'Hoodies & Sweatshirts' },
          { id: 'bottoms', label: 'Pants & Cargoes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
              backgroundColor: activeTab === tab.id ? '#FFFFFF' : '#141414',
              color: activeTab === tab.id ? '#000000' : '#888888',
              border: activeTab === tab.id ? '1px solid #FFFFFF' : '1px solid #282828'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div style={{ maxWidth: '950px', margin: '0 auto', background: '#0d0d0d', border: '1px solid #242424', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {currentTable.title}
          </h2>
          <p style={{ color: '#AAAAAA', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {currentTable.description}
          </p>
        </div>

        {/* Responsive Table Wrapper */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #282828' }}>
                {currentTable.headers.map((header, idx) => (
                  <th
                    key={idx}
                    style={{
                      padding: '1rem',
                      color: '#f59e0b',
                      fontSize: '0.85rem',
                      fontWeight: '800',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {header} {idx > 0 ? `(${unit === 'inches' ? 'in' : 'cm'})` : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: '1px solid #1a1a1a',
                    backgroundColor: rIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                >
                  <td style={{ padding: '1rem', color: '#FFFFFF', fontWeight: '800', fontSize: '0.95rem' }}>
                    {row.size}
                  </td>
                  <td style={{ padding: '1rem', color: '#DDDDDD', fontSize: '0.95rem' }}>
                    {toUnit(row.chest)}
                  </td>
                  <td style={{ padding: '1rem', color: '#DDDDDD', fontSize: '0.95rem' }}>
                    {toUnit(row.length)}
                  </td>
                  <td style={{ padding: '1rem', color: '#DDDDDD', fontSize: '0.95rem' }}>
                    {toUnit(row.shoulder)}
                  </td>
                  <td style={{ padding: '1rem', color: '#DDDDDD', fontSize: '0.95rem' }}>
                    {toUnit(row.sleeve)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#888', fontSize: '0.8rem' }}>
          <Info size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span>Note: Measurements provided are garment dimensions. Please allow for a manual production tolerance of ±0.5 inches (±1.2 cm).</span>
        </div>
      </div>

      {/* How to Measure Grid */}
      <div style={{ maxWidth: '950px', margin: '4rem auto 0' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '1.5rem', textAlign: 'center' }}>
          HOW TO MEASURE YOURSELF
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="info-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f59e0b', color: '#000000', fontWeight: '800' }}>1</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF' }}>Chest / Bust</h3>
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Wrap the measuring tape horizontally around the fullest part of your chest, keeping the tape parallel to the floor under your armpits.
            </p>
          </div>

          <div className="info-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f59e0b', color: '#000000', fontWeight: '800' }}>2</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF' }}>Garment Length</h3>
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Measure vertically from the highest point of your shoulder (next to the collar) straight down to the bottom hemline.
            </p>
          </div>

          <div className="info-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f59e0b', color: '#000000', fontWeight: '800' }}>3</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF' }}>Shoulder Width</h3>
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Measure horizontally across your back from the tip of one shoulder bone to the tip of the other. Streetwear tees feature extended drop-shoulders.
            </p>
          </div>
        </div>
      </div>

      {/* Pro Fit Tip Banner */}
      <div style={{
        maxWidth: '950px',
        margin: '3rem auto 0',
        padding: '2rem',
        borderRadius: '16px',
        background: 'linear-gradient(90deg, #111111 0%, #1a1608 100%)',
        border: '1px solid #f59e0b44',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Sparkles size={32} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div>
            <h4 style={{ color: '#FFFFFF', fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Unsure between two sizes?</h4>
            <p style={{ color: '#AAAAAA', fontSize: '0.85rem', margin: 0 }}>
              If you enjoy relaxed streetwear drape with plenty of room, pick the larger size. Contact our stylists for advice.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/contact" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            Ask Our Team
          </Link>
          <Link to="/men" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            Shop Men's Drops
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SizeGuidePage;
