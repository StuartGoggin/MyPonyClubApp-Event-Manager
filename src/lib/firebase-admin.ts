
// lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Don't initialize during build time or if env var is missing
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

export type DatabaseStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

let adminDb: any = null;
let dbConnectionStatus: DatabaseStatus = 'unknown';

// Only initialize if we have credentials and we're not in a build context
if (serviceAccountStr) {
    try {
        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(serviceAccountStr);
            // Handle private key formatting - check if it needs newline replacement
            let formattedPrivateKey = serviceAccount.private_key;
            if (formattedPrivateKey.includes('\\n')) {
                // The private_key has escaped newlines, replace with actual newlines
                formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    ...serviceAccount,
                    private_key: formattedPrivateKey,
                }),
                storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
            });
            
            // Get Firestore instance and configure it only when first initializing
            adminDb = getFirestore();
            adminDb.settings({ ignoreUndefinedProperties: true });
            dbConnectionStatus = 'connected';
            console.log('✅ Firebase Admin SDK initialized successfully');
        } else {
            // If app already exists, just get the existing Firestore instance
            // Don't call settings() again as it can only be called once
            adminDb = getFirestore();
            dbConnectionStatus = 'connected';
            console.log('✅ Using existing Firebase Admin SDK instance');
        }
    } catch (error: any) {
        console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
        console.error('❌ Full error:', error);
        dbConnectionStatus = 'error';
        // Only throw in development or when we're supposed to have credentials
        if (process.env.NODE_ENV === 'development') {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
        }
        // In production, just log the error and continue
        console.log('⚠️ Continuing without Firebase Admin SDK in production build environment');
    }
} else {
    console.log('⚠️ Firebase Admin SDK not initialized: Missing FIREBASE_SERVICE_ACCOUNT_KEY');
    console.log('ℹ️  This is expected during build time or when credentials are not configured');
    dbConnectionStatus = 'disconnected';
}

// Helper function to check database connection
export const isDatabaseConnected = () => {
    return adminDb !== null && dbConnectionStatus === 'connected';
};

// Helper function to get connection status
export const getDatabaseStatus = (): DatabaseStatus => {
    return dbConnectionStatus;
};

// Helper function to get database error message
export const getDatabaseErrorMessage = (): string | null => {
    const status = dbConnectionStatus as DatabaseStatus;
    switch (status) {
        case 'disconnected':
            return 'Database connection not configured. Please check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.';
        case 'error':
            return 'Database connection failed. Please check your Firebase configuration and network connectivity.';
        case 'unknown':
            return 'Database connection status unknown.';
        case 'connected':
            return null;
        default:
            return null;
    }
};

// Export adminDb - will be null during build time if no credentials
export { adminDb };
