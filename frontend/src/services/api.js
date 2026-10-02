import axios from 'axios';

// Get base URL from environment variable VITE_API_URL or VITE_API_BASE_URL
let envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

// Strip trailing slashes
envUrl = envUrl.replace(/\/+$/, '');

// Ensure /api prefix is present on the base URL
let API_BASE_URL = '/api';
if (envUrl) {
  if (envUrl.endsWith('/api')) {
    API_BASE_URL = envUrl;
  } else {
    API_BASE_URL = `${envUrl}/api`;
  }
}

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
