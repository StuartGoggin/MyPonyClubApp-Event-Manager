"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDb = void 0;
// lib/firebase-admin.ts
var admin = require("firebase-admin");
var firestore_1 = require("firebase-admin/firestore");
var serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountStr) {
    throw new Error('Missing environment variable FIREBASE_SERVICE_ACCOUNT_KEY');
}
try {
    if (!admin.apps.length) {
        var serviceAccount = JSON.parse(serviceAccountStr);
        // The private_key in the environment variable will have its newlines escaped.
        // We need to replace the `\\n` with `\n` for the SDK to parse it correctly.
        var formattedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
        admin.initializeApp({
            credential: admin.credential.cert(__assign(__assign({}, serviceAccount), { private_key: formattedPrivateKey })),
        });
    }
}
catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ".concat(error.message));
}
var adminDb = (0, firestore_1.getFirestore)();
exports.adminDb = adminDb;
