import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../services/api';
import { ShieldCheck, KeyRound, ArrowRight, Sparkles, CheckCircle2, Lock } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('admin@grabb-it.com');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAutoFill = () => {
    setEmail('admin@grabb-it.com');
    setPassword('Admin@123456');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both Admin Email and Password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = {};
      }

      if (res.ok && data.token && data.user) {
        if (data.user.role !== 'admin') {
          throw new Error('Access denied. Account is not an administrator.');
        }

        setSuccessMsg('AUTHENTICATED! OPENING DASHBOARD...');
        login(data.user, data.token);
        navigate('/admin', { replace: true });
        return;
      }

      throw new Error(data.error || 'Invalid Admin credentials. Use admin@grabb-it.com / Admin@123456');

    } catch (err) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section-space container" style={{ maxWidth: '460px', backgroundColor: 'var(--bg-main)', minHeight: '75vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* Header Badge */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          backgroundColor: '#000000',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          <ShieldCheck size={36} color="#ffffff" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#000000', marginBottom: '0.35rem' }}>
          ADMIN PORTAL
        </h1>
        <p style={{ color: '#666666', fontSize: '0.88rem', fontWeight: 600 }}>
          Protected Administrative Control for GRABB-IT Storefront.
        </p>
      </div>

      {/* Main Form Box */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        borderRadius: '24px',
        padding: '2.25rem 2rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.08)'
      }}>
        
        {/* Quick Auto-Fill Banner */}
        <div style={{
          backgroundColor: '#F5F5F5',
          border: '1px solid #E5E5E5',
          borderRadius: '16px',
          padding: '0.85rem 1rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#000000', letterSpacing: '0.5px' }}>
              🔑 DEMO ADMIN ACCESS
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.1rem' }}>
              admin@grabb-it.com / Admin@123456
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.4rem 0.85rem',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              whiteSpace: 'nowrap'
            }}
          >
            AUTO-FILL
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', color: '#000000', textTransform: 'uppercase' }}>
              ADMIN EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="admin@grabb-it.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  borderRadius: '12px',
                  border: '1.5px solid #E5E5E5',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '1px', color: '#000000', textTransform: 'uppercase' }}>
              ADMIN PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  padding: '0.85rem 1rem',
                  fontSize: '0.9rem',
                  borderRadius: '12px',
                  border: '1.5px solid #E5E5E5',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div style={{
              backgroundColor: '#FFF0F0',
              border: '1px solid #FFCDD2',
              color: '#C62828',
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              backgroundColor: '#E8F5E9',
              border: '1px solid #C8E6C9',
              color: '#2E7D32',
              fontSize: '0.82rem',
              fontWeight: 800,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.95rem',
              fontSize: '0.88rem',
              fontWeight: 900,
              letterSpacing: '1.5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              textTransform: 'uppercase',
              transition: 'transform 0.15s ease',
              opacity: loading ? 0.75 : 1
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER ADMIN CONTROL PANEL'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;
