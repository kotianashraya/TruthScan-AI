import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { ErrorMessage, Field } from './LoginPage';
import { useAuth } from '@/hooks/useAuth';
import { getAuthErrorMessage } from '@/services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailPattern.test(email)) return setError('Please enter a valid email address.');
    setError('');
    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthLayout title="Reset your password" description="Enter your email and we’ll send a secure reset link.">
    {success ? <div className="space-y-5"><div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" />If an account exists for this address, a password reset email has been sent.</div><Link className="block text-center text-sm text-brand-cyan hover:text-cyan-300" to="/login">Back to sign in</Link></div> : <form onSubmit={submit} noValidate className="space-y-4">
      {error && <ErrorMessage message={error} />}
      <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-cyan-400 hover:to-blue-500 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50">{submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? 'Sending reset email...' : 'Send reset email'}</button>
      <Link className="block text-center text-sm text-brand-cyan hover:text-cyan-300" to="/login">Back to sign in</Link>
    </form>}
  </AuthLayout>;
}
