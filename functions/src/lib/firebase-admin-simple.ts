import * as admin from "firebase-admin";

// Simple, reliable Firebase Admin initialization for Cloud Run
if (!admin.apps.length) {
  // In Cloud Run/Firebase Functions, the service account is automatically available
  admin.initializeApp();
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminAuth = admin.auth();

export default admin;