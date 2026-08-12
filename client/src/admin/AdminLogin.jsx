import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
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

      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Account is not an administrator.');
      }

      login(data.user, data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="section-space container" style={{ maxWidth: '440px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Shield size={48} color="#111" style={{ margin: '0 auto 0.75rem auto' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase' }}>ADMIN CONTROL PORTAL</h1>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>Protected Administrative Access for GRABB-IT Store.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#ffffff', border: '2px solid #111', padding: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Admin Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Admin Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: '#c62828', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem' }}>{error}</div>}

        <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.9rem' }} disabled={loading}>
          {loading ? 'AUTHENTICATING...' : 'LOGIN TO ADMIN PANEL'} <ArrowRight size={16} />
        </button>
      </form>
    </main>
  );
};

export default AdminLogin;
