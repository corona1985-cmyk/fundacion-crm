import axios from 'axios';

function getBaseURL() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (
      hostname.includes('web.app')
      || hostname.includes('firebaseapp.com')
      || hostname.includes('localhost')
      || hostname.includes('127.0.0.1')
    ) {
      return '/api';
    }
  }

  const configured = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (configured && !configured.includes('onrender.com') && !configured.includes('railway.app')) {
    return configured;
  }

  return '/api';
}

const axiosClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
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
      console.warn('API 401: acceso temporal abierto, no se redirige al login.');
    }
    const message = error.response?.data?.error?.message
      || (error.code === 'ECONNABORTED' ? 'El servidor tardó demasiado en responder. Intenta de nuevo.' : null)
      || error.message
      || 'Error de red o conexión con el servidor';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
