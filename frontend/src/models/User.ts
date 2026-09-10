import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'user';
export type UserSubscription = 'free';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  subscription: UserSubscription;
  scansUsed: number;
  totalScans: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
