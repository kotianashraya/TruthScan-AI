import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase';
import {
  initializeAuthPersistence,
  resetPassword as resetPasswordService,
  retryUserProfileSetup as retryUserProfileSetupService,
  signIn as signInService,
  signOut as signOutService,
  signUp as signUpService,
  type SignUpInput,
} from '@/services/authService';

export interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  retryUserProfileSetup: () => Promise<User>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    void initializeAuthPersistence()
      .catch(() => undefined)
      .finally(() => {
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!active) return;
          setCurrentUser(user);
          setLoading(false);
        });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    loading,
    signUp: signUpService,
    signIn: signInService,
    signOut: signOutService,
    resetPassword: resetPasswordService,
    retryUserProfileSetup: retryUserProfileSetupService,
  }), [currentUser, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
