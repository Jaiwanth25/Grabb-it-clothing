import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Phone, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotErr, setForgotErr] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect');

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
      } else if (redirectTarget) {
        navigate(redirectTarget);
      } else {
        navigate('/account');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotErr('');
    setForgotMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotMsg(data.message);
      setForgotStep(2);
    } catch (err) {
      setForgotErr(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotErr('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetToken(data.resetToken);
      setForgotStep(3);
    } catch (err) {
      setForgotErr(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotErr('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotMsg('Password reset successfully! Please sign in with your new password.');
      setForgotStep(4);
    } catch (err) {
      setForgotErr(err.message);
    }
  };

  return (
    <main className="section-space container" style={{ maxWidth: '440px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img src="/assets/grabb-it-logo.png" alt="Grabb-it" style={{ height: '48px', margin: '0 auto 0.75rem auto' }} />
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, textTransform: 'uppercase' }}>
          {showForgot ? 'PASSWORD RESET' : 'CUSTOMER SIGN IN'}
        </h1>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>
          {showForgot ? 'Follow the steps to recover your account.' : 'Access your orders, wishlist, and exclusive drops.'}
        </p>
      </div>

      {!showForgot ? (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button 
                type="button" 
                onClick={() => setShowForgot(true)} 
                style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
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
            Don't have an account? <Link to={redirectTarget ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : "/register"} style={{ fontWeight: 800, color: '#111' }}>Register Here</Link>
          </div>
        </form>
      ) : (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', padding: '2rem' }}>
          {forgotStep === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Enter Account Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your.email@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              {forgotErr && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '1rem' }}>{forgotErr}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                SEND 6-DIGIT OTP
              </button>
            </form>
          )}

          {forgotStep === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1rem' }}>{forgotMsg}</p>
              <div className="form-group">
                <label className="form-label">6-Digit Verification OTP Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 849201"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              {forgotErr && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '1rem' }}>{forgotErr}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                VERIFY OTP
              </button>
            </form>
          )}

          {forgotStep === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">Enter New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              {forgotErr && <div style={{ color: '#c62828', fontSize: '0.85rem', marginBottom: '1rem' }}>{forgotErr}</div>}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
                UPDATE PASSWORD
              </button>
            </form>
          )}

          {forgotStep === 4 && (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={48} color="var(--accent-olive)" style={{ marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem', color: '#333', marginBottom: '1.5rem' }}>{forgotMsg}</p>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ width: '100%', padding: '0.85rem' }}
                onClick={() => { setShowForgot(false); setForgotStep(1); }}
              >
                RETURN TO SIGN IN
              </button>
            </div>
          )}

          {forgotStep !== 4 && (
            <button 
              type="button" 
              onClick={() => { setShowForgot(false); setForgotStep(1); }}
              style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel & Return to Login
            </button>
          )}
        </div>
      )}
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
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectTarget = queryParams.get('redirect');

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
      if (redirectTarget) {
        navigate(redirectTarget);
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
          <input type="tel" className="form-input" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
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
          Already have an account? <Link to={redirectTarget ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : "/login"} style={{ fontWeight: 800, color: '#111' }}>Sign In</Link>
        </div>
      </form>
    </main>
  );
};
