/**
 * API Service Helper for Grabb-it Frontend
 * Automatically handles VITE_API_URL for production backend on Render
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
}

export function formatImageUrl(url) {
  if (!url) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80';
  }
  // Full HTTP/HTTPS or Base64 Data URL
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // Relative uploads path
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const base = API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');
    return `${base}${cleanPath}`;
  }
  return url;
}

export async function fetchApi(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const token = localStorage.getItem('grabb_it_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const sessionId = localStorage.getItem('grabb_it_session_id');
  if (sessionId) {
    defaultHeaders['x-session-id'] = sessionId;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Fetch Error [${endpoint}]:`, err.message);
    throw err;
  }
}
