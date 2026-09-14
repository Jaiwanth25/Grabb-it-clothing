import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Context Providers
import { GenderProvider } from './context/GenderContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import ErrorBoundary from './components/ErrorBoundary';

function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

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
    return <Navigate to="/admin/login" replace />;
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

                {/* Admin Routes */}
                <Route path="/admin/login" element={<Layout><AdminLogin /></Layout>} />
                <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                <Route path="/admin/*" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />

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
