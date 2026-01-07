import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBDrFWRcjbZszTTSmE0oNmNsWc4Ie0HinA",
  authDomain: "our-story-app-330dd.firebaseapp.com",
  projectId: "our-story-app-330dd",
  storageBucket: "our-story-app-330dd.appspot.com",
  messagingSenderId: "85142110290",
  appId: "1:85142110290:web:c2a7f5a2408a2873ad5f8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('✅ Firebase initialized successfully');
console.log('📦 Storage bucket:', firebaseConfig.storageBucket);

export default app;
