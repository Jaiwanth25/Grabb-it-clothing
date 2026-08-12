/**
 * API Service Helper for Grabb-it Frontend
 * Automatically handles VITE_API_URL for production backend on Render
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchApi(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
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
