import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getEnvKey = (key, fallback) => {
  const val = import.meta.env[key];
  return (val && typeof val === 'string' && val.trim().length > 0 && !val.includes('your_')) ? val.trim() : fallback;
};

const firebaseConfig = {
  apiKey: getEnvKey("VITE_FIREBASE_API_KEY", "AIzaSyD_VmXiC7_oUKMDUn86GDTR9varcGSlsxs"),
  authDomain: getEnvKey("VITE_FIREBASE_AUTH_DOMAIN", "text-app-a0bf9.firebaseapp.com"),
  projectId: getEnvKey("VITE_FIREBASE_PROJECT_ID", "text-app-a0bf9"),
  storageBucket: getEnvKey("VITE_FIREBASE_STORAGE_BUCKET", "text-app-a0bf9.firebasestorage.app"),
  messagingSenderId: getEnvKey("VITE_FIREBASE_MESSAGING_SENDER_ID", "909463158236"),
  appId: getEnvKey("VITE_FIREBASE_APP_ID", "1:909463158236:web:e3eeb29b477b5193f92319"),
  measurementId: getEnvKey("VITE_FIREBASE_MEASUREMENT_ID", "G-1JMYNNF63L")
};

// Prevent re-initialization issues in React / Vite
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
