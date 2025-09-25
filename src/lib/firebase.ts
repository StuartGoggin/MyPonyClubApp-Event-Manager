import {initializeApp, getApps, getApp, FirebaseOptions} from 'firebase/app';
import {getFirestore, Firestore} from 'firebase/firestore/lite';

const firebaseConfig: FirebaseOptions = {
  projectId: 'ponyclub-events',
  appId: '1:987605803813:web:afc63eb0d9549060f9b0cc',
  storageBucket: 'ponyclub-events.firebasestorage.app',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: 'ponyclub-events.firebaseapp.com',
  messagingSenderId: '987605803813',
};


function getClientApp() {
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}

const db: Firestore = getFirestore(getClientApp());
const app = getClientApp();


export {app, db};
