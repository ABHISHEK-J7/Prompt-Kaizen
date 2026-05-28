import { createContext, useContext, useEffect, useState } from 'react';
import api, { resetSessionExpired } from '../api/axiosInstance.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('pk_admin_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Validate the cached session against the server on every mount. The old
  // logic only revalidated when localStorage had a token but no user — which
  // meant a user deleted from the DB (or stripped of admin role) kept seeing
  // the dashboard skeleton until their first API call 401'd. Now we always
  // confirm the cached session is still valid + still admin.
  useEffect(() => {
    const token = localStorage.getItem('pk_admin_token');
    if (!token) return;
    setLoading(true);
    api.get('/auth/me')
      .then((res) => {
        if (res.data.user.role !== 'admin') {
          localStorage.removeItem('pk_admin_token');
          localStorage.removeItem('pk_admin_user');
          setUser(null);
          return;
        }
        setUser(res.data.user);
        localStorage.setItem('pk_admin_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        // 401 → axios interceptor already redirected to /login; just clear
        // local state. Network errors fall through silently — the cached user
        // remains usable until the first real request fails.
        localStorage.removeItem('pk_admin_token');
        localStorage.removeItem('pk_admin_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'admin') {
      const err = new Error('This account is not an admin.');
      err.code = 'NOT_ADMIN';
      throw err;
    }
    localStorage.setItem('pk_admin_token', data.token);
    localStorage.setItem('pk_admin_user', JSON.stringify(data.user));
    setUser(data.user);
    // Clear the axios session-expired latch so future 401s in this bundle
    // lifetime correctly trigger the redirect again.
    resetSessionExpired();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('pk_admin_token');
    localStorage.removeItem('pk_admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
