import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: 'sans-serif'
        }}>
          <ShieldAlert size={64} color="#000000" style={{ marginBottom: '1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>
            SOMETHING WENT WRONG
          </h1>
          <p style={{ color: '#666666', fontSize: '0.95rem', maxWidth: '480px', marginBottom: '2rem', lineHeight: '1.6' }}>
            The page encountered an unexpected rendering issue. Don't worry, your cart and session data are safe.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 1.75rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              <RefreshCw size={16} /> RELOAD PAGE
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2px solid #000000',
                padding: '0.85rem 1.75rem',
                borderRadius: '9999px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              <Home size={16} /> RETURN TO STOREFRONT
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
