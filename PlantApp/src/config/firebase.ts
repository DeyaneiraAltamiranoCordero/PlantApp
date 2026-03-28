import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCS1r1cU_8Xyph0lZRuNgEPUz8RIWYf1Fk",
  authDomain: "flora-movilapp-35b57.firebaseapp.com",
  projectId: "flora-movilapp-35b57",
  storageBucket: "flora-movilapp-35b57.firebasestorage.app",
  messagingSenderId: "671777128731",
  appId: "1:671777128731:android:9af16e8bac9ee65d9093be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
