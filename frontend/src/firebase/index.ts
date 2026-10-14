import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD_8pL8Ty_47ucaKO_qLAYpOFR6jt_R7Z0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "truthscan-ai-2eb39.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "truthscan-ai-2eb39",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "truthscan-ai-2eb39.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "320330162750",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:320330162750:web:61fb3099f059392c7a276f",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
