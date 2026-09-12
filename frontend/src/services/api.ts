import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Decisión técnica para el docente: Interceptor de Axios para inyectar automáticamente
// el token JWT en cada petición HTTP al backend.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vitajuice_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para redirección si el token expiró
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('vitajuice_token');
      localStorage.removeItem('vitajuice_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
