
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
        // The private_key in the environment variable will have its newlines escaped.
        // We need to replace the `\\n` with `\n` for the SDK to parse it correctly.
        const formattedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

        admin.initializeApp({
            credential: admin.credential.cert({
                ...serviceAccount,
                private_key: formattedPrivateKey,
            }),
        });
    }
} catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
}


const adminDb = getFirestore();

export { adminDb };
