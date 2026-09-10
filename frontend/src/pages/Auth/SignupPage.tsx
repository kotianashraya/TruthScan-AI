import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { ErrorMessage, Field } from './LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { getAuthErrorMessage, UserProfileError } from '@/services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const { signUp, retryUserProfileSetup } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileSetupFailed, setProfileSetupFailed] = useState(false);

  const redirectToDashboard = () => {
    try {
      console.info('[NAV] redirecting user');
      navigate('/dashboard', { replace: true });
    } catch (navigationError) {
      console.error('[NAVIGATION ERROR] redirect failed', {
        operation: 'redirect-to-dashboard',
        message: navigationError instanceof Error ? navigationError.message : 'Unknown error',
      });
      setError('Your account is ready, but we could not open the dashboard. Please try again.');
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayName.trim()) return setError('Please enter your full name.');
    if (!emailPattern.test(email)) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setError('');
    setProfileSetupFailed(false);
    setSubmitting(true);
    try {
      await signUp({ displayName: displayName.trim(), email: email.trim(), password });
      redirectToDashboard();
    } catch (signupError) {
      if (signupError instanceof UserProfileError) {
        setProfileSetupFailed(true);
        setError(signupError.message);
      } else {
        setError(getAuthErrorMessage(signupError));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const retryProfileSetup = async () => {
    setError('');
    setSubmitting(true);
    try {
      await retryUserProfileSetup();
      redirectToDashboard();
    } catch (profileError) {
      setError(profileError instanceof UserProfileError ? profileError.message : getAuthErrorMessage(profileError));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout title="Create your account" description="Set up secure access to the TruthScan AI platform.">
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <ErrorMessage message={error} />}
      {profileSetupFailed && <button type="button" onClick={() => void retryProfileSetup()} disabled={submitting} className="w-full py-2.5 rounded-lg border border-brand-cyan/30 bg-cyan-500/10 hover:bg-cyan-500/15 text-brand-cyan font-semibold text-sm transition disabled:opacity-50">{submitting ? 'Retrying profile setup...' : 'Retry profile setup'}</button>}
      <Field label="Full name" type="text" value={displayName} onChange={setDisplayName} autoComplete="name" />
      <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
      <Field label="Confirm password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
      <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
    <p className="text-sm text-gray-400 text-center mt-6">Already have an account? <Link className="text-brand-cyan hover:text-cyan-300" to="/login">Sign in</Link></p>
  </AuthLayout>;
}
