import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBDg6VrelyY6dT-OCqO4OOkrcNxK7RpBNk",
  authDomain: "realtymchatbysabaree.firebaseapp.com",
  projectId: "realtymchatbysabaree",
  storageBucket: "realtymchatbysabaree.firebasestorage.app",
  messagingSenderId: "689718464857",
  appId: "1:689718464857:web:1461c996b6c212f6e3bc48",
  measurementId: "G-61MDJVPGQ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging conditionally (it may not be supported in all browsers)
export const initializeMessaging = async () => {
  try {
    const isFCMSupported = await isSupported();
    if (isFCMSupported) {
      return getMessaging(app);
    }
    console.log('Firebase Cloud Messaging is not supported in this browser');
    return null;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
};

export default app;