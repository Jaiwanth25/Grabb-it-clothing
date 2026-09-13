import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('grabb_it_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('grabb_it_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(getApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          if (res.status === 401 || res.status === 403) {
            // Token is expired or invalid
            setUser(null);
            setToken('');
            localStorage.removeItem('grabb_it_token');
            localStorage.removeItem('grabb_it_user');
          }
          return null;
        })
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('grabb_it_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {
          // Keep local user session on network failure
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('grabb_it_token', userToken);
    localStorage.setItem('grabb_it_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('grabb_it_token');
    localStorage.removeItem('grabb_it_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
