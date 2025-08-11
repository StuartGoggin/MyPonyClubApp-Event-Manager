// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ponyclub-events",
  appId: "1:987605803813:web:afc63eb0d9549060f9b0cc",
  storageBucket: "ponyclub-events.firebasestorage.app",
  apiKey: "AIzaSyBOaLwaK97uX9F2rJdCVPQWq6u6DZFmeaU",
  authDomain: "ponyclub-events.firebaseapp.com",
  messagingSenderId: "987605803813",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
