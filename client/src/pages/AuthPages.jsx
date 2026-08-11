import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');

      login(data.user, data.token);

      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section-space container" style={{ maxWidth: '440px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/assets/grabb-it-logo.png" alt="Grabb-it" style={{ height: '48px', margin: '0 auto 0.75rem auto' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase' }}>CUSTOMER SIGN IN</h1>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>Access your orders, wishlist, and exclusive drops.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', padding: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="customer@grabb-it.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: '#c62828', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
          {loading ? 'SIGNING IN...' : 'SIGN IN'} <ArrowRight size={16} />
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
          Don't have an account? <Link to="/register" style={{ fontWeight: 800, color: '#111' }}>Register Here</Link>
        </div>

        <div style={{ backgroundColor: '#f5f5f5', padding: '0.75rem', marginTop: '1.5rem', fontSize: '0.75rem', border: '1px dashed #ccc' }}>
          <strong>Sample Customer Login:</strong><br />
          Email: customer@grabb-it.com | Password: Customer@123
        </div>
      </form>
    </main>
  );
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');

      login(data.user, data.token);
      navigate('/account');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section-space container" style={{ maxWidth: '480px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/assets/grabb-it-logo.png" alt="Grabb-it" style={{ height: '48px', margin: '0 auto 0.75rem auto' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase' }}>CREATE ACCOUNT</h1>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>Join GRABB-IT for fast checkout and reward perks.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', padding: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input type="text" className="form-input" placeholder="Alex Morgan" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input type="tel" className="form-input" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input type="password" className="form-input" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        {error && <div style={{ color: '#c62828', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'} <ArrowRight size={16} />
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 800, color: '#111' }}>Sign In</Link>
        </div>
      </form>
    </main>
  );
};
