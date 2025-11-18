
// lib/firebase-admin.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

export type DatabaseStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

let adminDb: any = null;
let storageInstance: any = null;
let dbConnectionStatus: DatabaseStatus = 'unknown';
let initializationError: Error | null = null;

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
            const isDev = process.env.NODE_ENV === 'development';
            if (isDev) {
                console.log('🔑 Using explicit service account credentials');
                console.log(`📊 Service account key length: ${serviceAccountStr.length} characters`);
            }
            
            try {
                const serviceAccount = JSON.parse(serviceAccountStr);
                if (isDev) {
                    console.log(`✅ Successfully parsed service account JSON`);
                    console.log(`📧 Client email: ${serviceAccount.client_email}`);
                    console.log(`🆔 Project ID: ${serviceAccount.project_id}`);
                }
                
                // Handle private key formatting - check if it needs newline replacement
                let formattedPrivateKey = serviceAccount.private_key;
                if (formattedPrivateKey.includes('\\n')) {
                    console.log('🔄 Replacing \\\\n with actual newlines in private key');
                    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
                }

                admin.initializeApp({
                    credential: admin.credential.cert({
                        ...serviceAccount,
                        private_key: formattedPrivateKey,
                    }),
                    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
                });
            } catch (parseError: any) {
                console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
                throw parseError;
            }
        } else {
            // Try to load from service account file (fallback)
            try {
                console.log('🔑 Attempting to load service account from file');
                const fs = require('fs');
                const path = require('path');
                const serviceAccountPath = path.join(process.cwd(), 'ponyclub-events-firebase-adminsdk-fbsvc-8c2550360b.json');
                
                if (fs.existsSync(serviceAccountPath)) {
                    console.log('📁 Found service account file, using it');
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccountPath),
                        storageBucket: 'ponyclub-events.firebasestorage.app',
                    });
                } else {
                    // Check if we're in a production Firebase environment
                    const isFirebaseEnv = process.env.K_SERVICE || process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT;
                    
                    if (isFirebaseEnv) {
                        // Production environment (Firebase App Hosting) - use default credentials
                        console.log('🏠 Using Firebase App Hosting default credentials');
                        admin.initializeApp({
                            // Firebase App Hosting automatically provides credentials
                            storageBucket: 'ponyclub-events.firebasestorage.app',
                        });
                    } else {
                        // Local development without credentials - don't initialize
                        throw new Error('No Firebase credentials available. Set FIREBASE_SERVICE_ACCOUNT_KEY or add service account file.');
                    }
                }
            } catch (fileError) {
                // Only try default credentials if we're actually in a cloud environment
                const isFirebaseEnv = process.env.K_SERVICE || process.env.FIREBASE_CONFIG || process.env.GCLOUD_PROJECT;
                
                if (isFirebaseEnv) {
                    console.error('Failed to load from file, trying default credentials:', fileError);
                    console.log('🏠 Using Firebase App Hosting default credentials');
                    admin.initializeApp({
                        storageBucket: 'ponyclub-events.firebasestorage.app',
                    });
                } else {
                    // Not in cloud environment, re-throw the error
                    throw fileError;
                }
            }
        }
        
        // Get Firestore instance and configure it
        adminDb = getFirestore();
        adminDb.settings({ ignoreUndefinedProperties: true });
        
        // Get Storage instance
        storageInstance = getStorage();
        
        dbConnectionStatus = 'connected';
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Firebase Admin SDK initialized successfully');
        }
        
    } catch (error: any) {
        console.error('❌ Firebase Admin SDK initialization failed:', error.message);
        console.error('❌ Full error:', error);
        dbConnectionStatus = 'error';
        initializationError = error;
        
        // Set adminDb to undefined to trigger fast failures
        adminDb = undefined;
        
        // Only throw in development with explicit credentials
        if (process.env.NODE_ENV === 'development' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${error.message}`);
        }
        
        // In production/build, log warning
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ Firebase Admin SDK not configured for local development');
            console.log('💡 To use Firestore locally, set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
            console.log('💡 Or use Firebase emulators: firebase emulators:start');
        }
    }
}

// Initialize immediately
initializeFirebaseAdmin();

// Helper function to check database connection
export const isDatabaseConnected = () => {
    return adminDb !== null && adminDb !== undefined && dbConnectionStatus === 'connected';
};

// Helper function to get connection status
export const getDatabaseStatus = (): DatabaseStatus => {
    return dbConnectionStatus;
};

// Helper function to get initialization error
export const getInitializationError = (): Error | null => {
    return initializationError;
};

// Helper function to get database error message
export const getDatabaseErrorMessage = (): string | null => {
    const status = dbConnectionStatus as DatabaseStatus;
    switch (status) {
        case 'disconnected':
            return 'Database connection not configured. Please check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.';
        case 'error':
            if (initializationError) {
                return `Database initialization failed: ${initializationError.message}`;
            }
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
