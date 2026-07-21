import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD_8pL8Ty_47ucaKO_qLAYpOFR6jt_R7Z0",
  authDomain: "truthscan-ai-2eb39.firebaseapp.com",
  projectId: "truthscan-ai-2eb39",
  storageBucket: "truthscan-ai-2eb39.firebasestorage.app",
  messagingSenderId: "320330162750",
  appId: "1:320330162750:web:61fb3099f059392c7a276f",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const storage = getStorage(app);

export { app, db, auth, storage };