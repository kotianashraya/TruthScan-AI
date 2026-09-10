import { Route, Routes } from 'react-router-dom';
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

export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<App />} />
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
    <Route path="*" element={<App />} />
  </Routes>;
}
