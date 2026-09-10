import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

export interface SignUpInput {
  displayName: string;
  email: string;
  password: string;
}

export class UserProfileError extends Error {
  readonly operation = 'create-user-profile';
  readonly code: string;

  constructor(error: unknown) {
    const code = getErrorCode(error);
    super(code === 'permission-denied'
      ? 'Your account was created, but we could not create your profile because of a Firestore permission issue.'
      : code === 'unavailable'
        ? 'Your account was created, but we could not reach Firestore to finish setting up your profile.'
        : 'Your account was created, but we could not finish setting up your profile.');
    this.name = 'UserProfileError';
    this.code = code;
  }
}

function getErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
}

export async function initializeAuthPersistence(): Promise<void> {
  await setPersistence(auth, browserLocalPersistence);
}

async function createUserProfile(user: User): Promise<void> {
  console.info('[FIRESTORE] user profile creation started');
  try {
    const profileRef = doc(db, 'users', user.uid);
    const existingProfile = await getDoc(profileRef);

    if (existingProfile.exists()) {
      console.info('[FIRESTORE] user profile already exists');
      return;
    }

    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      role: 'user',
      subscription: 'free',
      scansUsed: 0,
      totalScans: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info('[FIRESTORE] user profile creation completed');
  } catch (error) {
    console.error('[FIRESTORE ERROR] user profile creation failed', {
      operation: 'create-user-profile',
      code: getErrorCode(error),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new UserProfileError(error);
  }
}

export async function signUp({ displayName, email, password }: SignUpInput): Promise<User> {
  console.info('[AUTH] signup started');
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, email, password);
    console.info('[AUTH] Firebase account created');
  } catch (error) {
    console.error('[AUTH ERROR] account creation failed', {
      operation: 'create-user-with-email-and-password',
      code: getErrorCode(error),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }

  try {
    await updateProfile(credential.user, { displayName });
    console.info('[AUTH] profile update completed');
  } catch (error) {
    console.error('[AUTH ERROR] profile update failed', {
      operation: 'update-profile',
      code: getErrorCode(error),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }

  await createUserProfile(credential.user);
  console.info('[AUTH] signup completed');
  return credential.user;
}

export async function retryUserProfileSetup(): Promise<User> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user is available to complete profile setup.');
  await createUserProfile(user);
  return user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function getAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/user-not-found': 'No account was found with this email.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  };

  return messages[code] ?? 'Something went wrong. Please try again.';
}
