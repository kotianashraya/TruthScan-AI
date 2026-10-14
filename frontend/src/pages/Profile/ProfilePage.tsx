import { useState, useEffect, type FormEvent } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Shield, CheckCircle2, AlertCircle, KeyRound, LogOut, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';

interface UserProfileData {
  displayName?: string | null;
  email?: string;
  role?: string;
  subscription?: string;
  totalScans?: number;
  scansUsed?: number;
  createdAt?: unknown;
}

export default function ProfilePage() {
  const { currentUser, signOut, resetPassword } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '');
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setDisplayName(currentUser.displayName ?? '');

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data() as UserProfileData);
        }
      } catch (err) {
        console.warn('[PROFILE] could not fetch extra profile data', err);
      }
    };

    void fetchUserProfile();
  }, [currentUser]);

  const handleUpdateName = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!displayName.trim()) {
      setErrorMsg('Display name cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Update Firebase Auth profile
      await updateProfile(currentUser, { displayName: displayName.trim() });

      // 2. Update Firestore document
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          displayName: displayName.trim(),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Not critical if firestore doc update lags
      }

      setSuccessMsg('Your profile name has been updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('[PROFILE] update failed', err);
      setErrorMsg('Failed to update profile name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    try {
      await resetPassword(currentUser.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error('[PROFILE] reset email failed', err);
      setErrorMsg('Could not send password reset email. Please try again.');
    }
  };

  const initials = (currentUser?.displayName || currentUser?.email || 'U')
    .substring(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#030712] text-white p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">User Profile</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your identity, authentication credentials, and account details.</p>
        </div>

        {/* User Card */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-blue flex items-center justify-center font-bold text-xl text-gray-900 shadow-lg shadow-cyan-500/20">
            {initials}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-white">
              {currentUser?.displayName || 'TruthScan User'}
            </h2>
            <p className="text-xs text-gray-400 font-mono">{currentUser?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {profileData?.subscription ? profileData.subscription.toUpperCase() : 'FREE PLAN'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-gray-300 border border-white/10">
                {profileData?.totalScans ?? 0} Scans Performed
              </span>
            </div>
          </div>
        </div>

        {/* Edit Name Form */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            Personal Information
          </h3>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateName} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-xs text-gray-400 mb-1.5">Full Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={currentUser?.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 text-sm text-gray-400 cursor-not-allowed"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">Email address cannot be changed directly for security.</span>
            </div>

            <button
              type="submit"
              disabled={saving || displayName.trim() === currentUser?.displayName}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center gap-2 transition disabled:opacity-40"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving Changes...' : 'Save Name Changes'}
            </button>
          </form>
        </div>

        {/* Security & Credentials */}
        <div className="p-6 bg-white/3 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-blue" />
            Security & Authentication
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/2 rounded-xl border border-white/5">
            <div>
              <div className="text-sm font-semibold text-white">Password Management</div>
              <div className="text-xs text-gray-400 mt-0.5">
                Send a secure password reset link to your registered email address.
              </div>
            </div>
            <button
              onClick={() => void handlePasswordReset()}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {resetSent ? 'Reset Email Sent!' : 'Reset Password'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-rose-500/5 rounded-xl border border-rose-500/15">
            <div>
              <div className="text-sm font-semibold text-white">Sign Out</div>
              <div className="text-xs text-gray-400 mt-0.5">
                End your active session securely on this device.
              </div>
            </div>
            <button
              onClick={() => void signOut()}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
