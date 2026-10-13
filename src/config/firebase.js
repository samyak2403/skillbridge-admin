import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAeAl9CK-5OmuLbhhpW-eCQMFAt3FMSBqc",
  authDomain: "ai-based-student.firebaseapp.com",
  projectId: "ai-based-student",
  storageBucket: "ai-based-student.firebasestorage.app",
  messagingSenderId: "231576016241",
  appId: "1:231576016241:web:skillbridge-admin-portal"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
