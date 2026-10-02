import axios from 'axios';

// Deployed Render backend base URL
const PRODUCTION_BACKEND_URL = 'https://smartpark-api-h4dn.onrender.com';

// Get base URL from environment variable VITE_API_URL or VITE_API_BASE_URL
let envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

// Strip /docs or trailing slashes
envUrl = envUrl.replace(/\/docs\/?$/, '').replace(/\/+$/, '');

// If envUrl is empty, inspect environment host to decide fallback
if (!envUrl) {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (isLocal) {
    envUrl = 'http://127.0.0.1:8000';
  } else {
    envUrl = PRODUCTION_BACKEND_URL;
  }
}

// Ensure /api prefix is present on the base URL
let API_BASE_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartpark_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Prevent duplicated /api/api if caller passes path starting with /api/
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
