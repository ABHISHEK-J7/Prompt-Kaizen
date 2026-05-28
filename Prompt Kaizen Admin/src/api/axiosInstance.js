import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pk_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401s coming back from /auth/login are wrong-password rejections, not
// session-expired signals — never wipe storage based on those.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/resend-otp'];

// Module-level flag prevents a thundering herd of toasts + redirects when the
// dashboard fires several admin calls in parallel and the token has just
// expired. The first 401 starts the redirect; subsequent 401s are tagged so
// their rejection can be silently swallowed downstream.
//
// The flag is normally cleared by the full-page reload that
// `window.location.href = '/login'` triggers. But if the redirect path is
// suppressed (e.g. the user is already on /login when the 401 lands, or
// they SPA-navigate back to the app after a manual login) the flag would
// stay set for the rest of the bundle's lifetime. `resetSessionExpired()`
// is exported so AuthContext.login() can clear it after a successful sign-in.
let sessionExpired = false;
export function resetSessionExpired() { sessionExpired = false; }
export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired.');
    this.name = 'SessionExpiredError';
    this.sessionExpired = true;
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      const requestUrl = err?.config?.url || '';
      const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => requestUrl.includes(p));
      if (!isAuthEndpoint) {
        if (!sessionExpired) {
          sessionExpired = true;
          localStorage.removeItem('pk_admin_token');
          localStorage.removeItem('pk_admin_user');
          if (!window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
        // Reject with a sentinel error so component-level .catch handlers
        // can opt out of showing a stale "Failed to load..." toast while the
        // page is being yanked out from under them.
        return Promise.reject(new SessionExpiredError());
      }
    }
    return Promise.reject(err);
  }
);

export default api;
