// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDrFWRcjbZszTTSmE0oNmNsWc4Ie0HinA",
  authDomain: "our-story-app-330dd.firebaseapp.com",
  projectId: "our-story-app-330dd",
  storageBucket: "our-story-app-330dd.firebasestorage.app",
  messagingSenderId: "85142110290",
  appId: "1:85142110290:web:c2a7f5a2408a2873ad5f8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('FCM not supported:', error);
  }
}

export { messaging };

// VAPID Key for push notifications
export const VAPID_KEY = "BGsB9nJaBmVyrMa2YOy61R9a3nsSe1pX7_td3UuMpfqK0vAvF2-IuM19SzcMOf0UXkgMB8chOklDle4HwNNajeE";

export default app;
