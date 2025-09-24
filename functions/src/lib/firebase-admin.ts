import * as admin from "firebase-admin";
import {getFirestore} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";

export type DatabaseStatus = "connected" | "disconnected" | "error" | "unknown";

// Lazy initialization variables - internal use only
let _adminDb: any = null;
let _storageInstance: any = null;
let dbConnectionStatus: DatabaseStatus = "unknown";
let initializationAttempted = false;

/**
 * Lazy initialization function - only initializes when first called
 * This prevents Cloud Run startup failures caused by module-level initialization
 */
function initializeFirebaseAdmin(): void {
  if (initializationAttempted) {
    return; // Don't attempt initialization multiple times
  }
  
  initializationAttempted = true;

  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      _adminDb = getFirestore();
      _storageInstance = getStorage();
      dbConnectionStatus = "connected";
      return;
    }

    // Determine environment and configuration
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV === "development";
    
    if (isEmulator) {
      // Emulator environment
      console.log("🧪 Initializing Firebase Admin SDK for emulator environment");
      
      admin.initializeApp({
        projectId: "demo-project",
        storageBucket: "demo-project.appspot.com",
      });

      _adminDb = getFirestore();
      _adminDb.settings({
        ignoreUndefinedProperties: true,
        host: "127.0.0.1:8081",
        ssl: false,
      });

      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
      _storageInstance = getStorage();
      dbConnectionStatus = "connected";
      console.log("✅ Firebase Admin SDK initialized for emulator");
      
    } else {
      // Production environment - try different credential sources
      let initialized = false;

      // Try service account from environment variable
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountStr && !initialized) {
        try {
          let serviceAccount = JSON.parse(serviceAccountStr);
          
          // Handle private key formatting
          if (serviceAccount.private_key && serviceAccount.private_key.includes("\\n")) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
          }

          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
          });
          
          initialized = true;
          console.log("✅ Firebase Admin SDK initialized with service account from environment");
        } catch (error) {
          console.warn("⚠️ Failed to initialize with FIREBASE_SERVICE_ACCOUNT_KEY:", error);
        }
      }

      // Try default Cloud Run credentials if service account failed
      if (!initialized) {
        try {
          admin.initializeApp();
          initialized = true;
          console.log("✅ Firebase Admin SDK initialized with default credentials");
        } catch (error) {
          console.error("❌ Failed to initialize with default credentials:", error);
          dbConnectionStatus = "error";
          return;
        }
      }

      // Initialize services
      _adminDb = getFirestore();
      _adminDb.settings({ignoreUndefinedProperties: true});
      _storageInstance = getStorage();
      dbConnectionStatus = "connected";
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error);
    dbConnectionStatus = "error";
  }
}

// Lazy getter for adminDb - initializes on first access
export const getAdminDb = (): any => {
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  return _adminDb;
};

// Lazy getter for storage - initializes on first access  
export const getStorageInstance = (): any => {
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  return _storageInstance;
};

export const getDatabaseStatus = (): DatabaseStatus => {
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  return dbConnectionStatus;
};

// Helper function to check database connection
export const isDatabaseConnected = () => {
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  return _adminDb !== null && dbConnectionStatus === "connected";
};

// Helper function to get database error message
export const getDatabaseErrorMessage = (): string | null => {
  if (!initializationAttempted) {
    initializeFirebaseAdmin();
  }
  
  const status = dbConnectionStatus as DatabaseStatus;
  switch (status) {
  case "disconnected":
    return "Database connection not configured. Please check FIREBASE_SERVICE_ACCOUNT_KEY environment variable.";
  case "error":
    return "Database connection failed. Please check your Firebase configuration and network connectivity.";
  case "unknown":
    return "Database connection status unknown.";
  case "connected":
    return null;
  default:
    return null;
  }
};

// Create a proxy that initializes lazily but looks like the real object
let _adminDbProxy: any = null;
let _storageProxy: any = null;

function createAdminDbProxy() {
  if (_adminDbProxy) return _adminDbProxy;
  
  _adminDbProxy = new Proxy({} as any, {
    get(target, prop) {
      const db: any = getAdminDb();
      if (!db) {
        throw new Error('Firebase Admin DB not initialized');
      }
      const value = db[prop];
      return typeof value === 'function' ? value.bind(db) : value;
    },
    has(target, prop) {
      const db: any = getAdminDb();
      return db ? prop in db : false;
    }
  });
  
  return _adminDbProxy;
}

function createStorageProxy() {
  if (_storageProxy) return _storageProxy;
  
  _storageProxy = new Proxy({} as any, {
    get(target, prop) {
      const storage: any = getStorageInstance();
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }
      const value = storage[prop];
      return typeof value === 'function' ? value.bind(storage) : value;
    },
    has(target, prop) {
      const storage: any = getStorageInstance();
      return storage ? prop in storage : false;
    }
  });
  
  return _storageProxy;
}

// Export lazy-initialized proxies
export const adminDb: any = createAdminDbProxy();
export const storageInstance: any = createStorageProxy();

export default admin;
