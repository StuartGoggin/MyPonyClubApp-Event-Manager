
// lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export type DatabaseStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

let adminDb: any = null;
let storageInstance: any = null;
let dbConnectionStatus: DatabaseStatus = 'unknown';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        // Already initialized
        adminDb = getFirestore();
        storageInstance = getStorage();
        dbConnectionStatus = 'connected';
        return;
    }

    try {
        // Check for service account key (for local development)
        const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        if (serviceAccountStr) {
            // Local development with explicit service account
            console.log('🔑 Using explicit service account credentials');
            const serviceAccount = JSON.parse(serviceAccountStr);
            
            // Handle private key formatting - check if it needs newline replacement
            let formattedPrivateKey = serviceAccount.private_key;
            if (formattedPrivateKey.includes('\\n')) {
                formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    ...serviceAccount,
                    private_key: formattedPrivateKey,
                }),
                storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
            });
        } else {
            // Production environment (Firebase App Hosting) - use default credentials
            console.log('🏠 Using Firebase App Hosting default credentials');
            admin.initializeApp({
                // Firebase App Hosting automatically provides credentials
                storageBucket: 'ponyclub-events.firebasestorage.app',
            });
        }
        
        // Get Firestore instance and configure it
        adminDb = getFirestore();
        adminDb.settings({ ignoreUndefinedProperties: true });
        
        // Get Storage instance
        storageInstance = getStorage();
        
        dbConnectionStatus = 'connected';
        console.log('✅ Firebase Admin SDK initialized successfully');
        
    } catch (error: any) {
        console.error('❌ Firebase Admin SDK initialization failed:', error.message);
        console.error('❌ Full error:', error);
        dbConnectionStatus = 'error';
        
        // Only throw in development
        if (process.env.NODE_ENV === 'development' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
        }
        
        // In production, just log the error and continue
        console.log('⚠️ Continuing without Firebase Admin SDK in production build environment');
    }
}

// Initialize immediately
initializeFirebaseAdmin();

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

// Export storage bucket - will be null during build time if no credentials
export const bucket = storageInstance?.bucket();
