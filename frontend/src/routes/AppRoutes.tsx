import { Navigate, Route, Routes } from 'react-router-dom';
import App from '@/App';
import LoginPage from '@/pages/Auth/LoginPage';
import SignupPage from '@/pages/Auth/SignupPage';
import ForgotPasswordPage from '@/pages/Auth/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import ScannerPage from '@/pages/Scanner/ScannerPage';
import HistoryPage from '@/pages/History/HistoryPage';
import ReportsPage from '@/pages/Reports/ReportsPage';
import ProfilePage from '@/pages/Profile/ProfilePage';
import SettingsPage from '@/pages/Settings/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/firebase';

function RootEntry() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-400 flex items-center justify-center font-mono text-sm">
        Loading secure session...
      </div>
    );
  }

  // Returning authenticated user automatically routes to Dashboard
  if (currentUser ?? auth.currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Unauthenticated first-time visitor sees the complete public overview
  return <App />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootEntry />} />
      <Route path="/overview" element={<App />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
