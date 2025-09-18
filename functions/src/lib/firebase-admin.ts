import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export type DatabaseStatus = "connected" | "disconnected" | "error" | "unknown";

let adminDb: any = null;
let storageInstance: any = null;
let dbConnectionStatus: DatabaseStatus = "unknown";

// Initialize Firebase Admin SDK
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';

// Check if we're running in emulator environment
if (isEmulator) {
  try {
    if (!admin.apps.length) {
      console.log("🧪 Initializing Firebase Admin SDK for emulator environment");
      
      admin.initializeApp({
        projectId: "demo-project",
        storageBucket: "demo-project.appspot.com",
      });

      adminDb = getFirestore();
      adminDb.settings({ 
        ignoreUndefinedProperties: true,
        host: "127.0.0.1:8081",
        ssl: false
      });
      
      // Set emulator host for Firestore
      process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
      
      storageInstance = getStorage();
      dbConnectionStatus = "connected";
      console.log("✅ Firebase Admin SDK initialized for emulator");
    } else {
      adminDb = getFirestore();
      storageInstance = getStorage();
      dbConnectionStatus = "connected";
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK emulator initialization failed:", error);
    dbConnectionStatus = "error";
  }
} else if (serviceAccountStr) {
  try {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      // Handle private key formatting
      let formattedPrivateKey = serviceAccount.private_key;
      if (formattedPrivateKey.includes("\\n")) {
        formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
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
      dbConnectionStatus = "connected";
      console.log("✅ Firebase Admin SDK initialized successfully");
    } else {
      adminDb = getFirestore();
      storageInstance = getStorage();
      dbConnectionStatus = "connected";
    }
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error);
    dbConnectionStatus = "error";
  }
} else {
  console.warn("⚠️ Firebase service account key not found");
  dbConnectionStatus = "disconnected";
}

export const getDatabaseStatus = (): DatabaseStatus => {
  return dbConnectionStatus;
};

// Helper function to check database connection
export const isDatabaseConnected = () => {
  return adminDb !== null && dbConnectionStatus === "connected";
};

// Helper function to get database error message
export const getDatabaseErrorMessage = (): string | null => {
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

export { adminDb, storageInstance };
export default admin;
