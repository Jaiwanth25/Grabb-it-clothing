import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ProductListing from './pages/ProductListing';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import { Login, Register } from './pages/AuthPages';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';

// Information & Legal Pages
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ShippingPage from './pages/ShippingPage';
import ReturnsPage from './pages/ReturnsPage';
import FAQPage from './pages/FAQPage';
import SizeGuidePage from './pages/SizeGuidePage';
import CareersPage from './pages/CareersPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';

// Context Providers
import { GenderProvider } from './context/GenderContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import ErrorBoundary from './components/ErrorBoundary';

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

const ADMIN_PORTAL_PATH = (import.meta.env.VITE_ADMIN_PATH || '/manage-store-sec26').replace(/\/+$/, '');
const ADMIN_LOGIN_PATH = `${ADMIN_PORTAL_PATH}/login`;

function ProtectedAdminRoute({ children }) {
  const { user, token, loading } = useAuth();
  
  const currentToken = token || localStorage.getItem('grabb_it_token');
  const currentUser = user || (() => {
    try {
      const u = localStorage.getItem('grabb_it_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  })();

  if (loading && currentToken) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', color: '#000000', fontWeight: 800, letterSpacing: '1px' }}>
        AUTHENTICATING ADMIN ACCESS...
      </div>
    );
  }

  if (!currentToken || !currentUser) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GenderProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollToTop />
              <Routes>
                {/* Customer Routes with Header & Footer */}
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/products" element={<Layout><ProductListing /></Layout>} />
                <Route path="/men" element={<Layout><ProductListing /></Layout>} />
                <Route path="/women" element={<Navigate to="/men" replace />} />
                <Route path="/men/:category" element={<Layout><ProductListing /></Layout>} />
                <Route path="/women/:category" element={<Navigate to="/men" replace />} />
                <Route path="/offers" element={<Layout><ProductListing /></Layout>} />
                <Route path="/product/:slug" element={<Layout><ProductDetails /></Layout>} />
                <Route path="/cart" element={<Layout><CartPage /></Layout>} />
                <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
                <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                <Route path="/account" element={<Layout><AccountPage /></Layout>} />
                <Route path="/login" element={<Layout><Login /></Layout>} />
                <Route path="/register" element={<Layout><Register /></Layout>} />

                {/* Information, Support & Legal Pages */}
                <Route path="/about" element={<Layout><AboutPage /></Layout>} />
                <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
                <Route path="/shipping" element={<Layout><ShippingPage /></Layout>} />
                <Route path="/returns" element={<Layout><ReturnsPage /></Layout>} />
                <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
                <Route path="/size-guide" element={<Layout><SizeGuidePage /></Layout>} />
                <Route path="/careers" element={<Layout><CareersPage /></Layout>} />
                <Route path="/privacy-policy" element={<Layout><PrivacyPolicyPage /></Layout>} />
                <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
                <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />

                {/* Unique Configured Admin Routes */}
                <Route path={ADMIN_LOGIN_PATH} element={<Layout><AdminLogin /></Layout>} />
                <Route path={ADMIN_PORTAL_PATH} element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                <Route path={`${ADMIN_PORTAL_PATH}/*`} element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

                {/* Legacy public admin routes safely neutralized to home */}
                {ADMIN_PORTAL_PATH !== '/admin' && (
                  <>
                    <Route path="/admin/login" element={<Navigate to="/" replace />} />
                    <Route path="/admin" element={<Navigate to="/" replace />} />
                    <Route path="/admin/*" element={<Navigate to="/" replace />} />
                  </>
                )}

                {/* 404 Catch All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </GenderProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
