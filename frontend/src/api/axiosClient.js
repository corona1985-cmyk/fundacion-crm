import axios from 'axios';

const RAILWAY_API = 'https://crm-becas-backend-production.up.railway.app/api';
const STALE_HOSTS = ['onrender.com', 'lhr.life', 'loca.lt', 'ngrok'];

function isStaleHost(url) {
  return STALE_HOSTS.some((host) => url.includes(host));
}

function normalizeBaseUrl(url) {
  if (!url) return '';
  const trimmed = url.replace(/\/+$/, '');
  if (isStaleHost(trimmed)) {
    return RAILWAY_API;
  }
  return trimmed;
}

function getBaseURL() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('custom_api_url');
    if (customUrl) {
      if (isStaleHost(customUrl)) {
        localStorage.removeItem('custom_api_url');
      } else {
        const normalized = normalizeBaseUrl(customUrl);
        return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
      }
    }
  }

  const configured = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('web.app') || hostname.includes('firebaseapp.com') || hostname.includes('vercel.app')) {
      return RAILWAY_API;
    }
  }

  return '/api';
}

const axiosClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.error?.message
      || (error.code === 'ECONNABORTED' ? 'El servidor tardó demasiado en responder. Intenta de nuevo.' : null)
      || error.message
      || 'Error de red o conexión con el servidor';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
