import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export type DatabaseStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

let adminDb: any = null;
let storageInstance: any = null;
let dbConnectionStatus: DatabaseStatus = 'unknown';

// Initialize Firebase Admin SDK
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountStr) {
    try {
        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(serviceAccountStr);
            // Handle private key formatting
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
            
            adminDb = getFirestore();
            adminDb.settings({ ignoreUndefinedProperties: true });
            storageInstance = getStorage();
            dbConnectionStatus = 'connected';
            console.log('✅ Firebase Admin SDK initialized successfully');
        } else {
            adminDb = getFirestore();
            storageInstance = getStorage();
            dbConnectionStatus = 'connected';
        }
    } catch (error) {
        console.error('❌ Firebase Admin SDK initialization failed:', error);
        dbConnectionStatus = 'error';
    }
} else {
    console.warn('⚠️ Firebase service account key not found');
    dbConnectionStatus = 'disconnected';
}

export const getDatabaseStatus = (): DatabaseStatus => {
    return dbConnectionStatus;
};

// Helper function to check database connection
export const isDatabaseConnected = () => {
    return adminDb !== null && dbConnectionStatus === 'connected';
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

export { adminDb, storageInstance };
export default admin;
