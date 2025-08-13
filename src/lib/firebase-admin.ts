
// lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Don't initialize during build time or if env var is missing
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let adminDb: any = null;

// Only initialize if we have credentials and we're not in a build context
if (serviceAccountStr) {
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
            
            // Get Firestore instance and configure it only when first initializing
            adminDb = getFirestore();
            adminDb.settings({ ignoreUndefinedProperties: true });
        } else {
            // If app already exists, just get the existing Firestore instance
            // Don't call settings() again as it can only be called once
            adminDb = getFirestore();
        }
    } catch (error: any) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        // Don't throw during build, just log
        if (process.env.NODE_ENV !== 'production' || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
        }
    }
} else {
    console.warn('⚠️ Firebase Admin SDK not initialized: Missing FIREBASE_SERVICE_ACCOUNT_KEY');
}

// Export adminDb - will be null during build time if no credentials
export { adminDb };
