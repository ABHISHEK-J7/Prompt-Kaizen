import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-flame-500">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin-slow text-flame-900" />
          <span className="text-sm">Loading admin console…</span>
        </div>
      </div>
    );
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
