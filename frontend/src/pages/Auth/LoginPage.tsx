import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { getAuthErrorMessage } from '@/services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { signIn, currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen bg-[#030712] text-gray-400 flex items-center justify-center font-mono text-sm">Loading secure session...</div>;
  if (currentUser) return <Navigate to="/dashboard" replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailPattern.test(email)) return setError('Please enter a valid email address.');
    if (!password) return setError('Please enter your password.');
    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout title="Welcome back" description="Sign in to access your TruthScan AI workspace.">
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <div className="text-right -mt-1"><Link className="text-xs text-brand-cyan hover:text-cyan-300 transition" to="/forgot-password">Forgot password?</Link></div>
      <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
    <p className="text-sm text-gray-400 text-center mt-6">New to TruthScan? <Link className="text-brand-cyan hover:text-cyan-300" to="/signup">Create an account</Link></p>
  </AuthLayout>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"><ShieldAlert className="w-4 h-4 shrink-0" />{message}</div>;
}

export function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return <label className="block"><span className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none text-sm transition" /></label>;
}
