import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Endpoints where a 401 is a normal form-validation failure (wrong password,
// expired OTP, etc.) and must NOT wipe an existing valid session. Without
// this guard, a logged-in user who opens /login in a second tab and types a
// wrong password would have their good session silently destroyed.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/resend-otp'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const requestUrl = err?.config?.url || '';
      const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => requestUrl.includes(p));
      if (!isAuthEndpoint) {
        localStorage.removeItem('pk_token');
        localStorage.removeItem('pk_user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
