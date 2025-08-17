import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Set persistence ke local (hanya perlu dijalankan sekali, misal di file ini)
setPersistence(auth, browserLocalPersistence);
