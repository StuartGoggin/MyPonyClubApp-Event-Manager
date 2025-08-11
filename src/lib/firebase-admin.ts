
// lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountStr) {
    throw new Error('Missing environment variable FIREBASE_SERVICE_ACCOUNT_KEY');
}

try {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(serviceAccountStr);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
} catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
}


const adminDb = getFirestore();

export { adminDb };
