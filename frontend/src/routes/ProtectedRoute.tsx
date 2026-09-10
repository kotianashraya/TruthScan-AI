import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/firebase';

export default function ProtectedRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-[#030712] text-gray-400 flex items-center justify-center font-mono text-sm">Loading secure session...</div>;
  }

  // Firebase updates auth.currentUser before React's listener state necessarily
  // commits; using it as a short-lived fallback avoids a signup redirect race.
  const authenticatedUser = currentUser ?? auth.currentUser;

  return authenticatedUser
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
