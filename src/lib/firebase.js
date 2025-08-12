"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.app = void 0;
var app_1 = require("firebase/app");
var lite_1 = require("firebase/firestore/lite");
var firebaseConfig = {
    projectId: 'ponyclub-events',
    appId: '1:987605803813:web:afc63eb0d9549060f9b0cc',
    storageBucket: 'ponyclub-events.firebasestorage.app',
    apiKey: 'AIzaSyBOaLwaK97uX9F2rJdCVPQWq6u6DZFmeaU',
    authDomain: 'ponyclub-events.firebaseapp.com',
    messagingSenderId: '987605803813',
};
function getClientApp() {
    if ((0, app_1.getApps)().length)
        return (0, app_1.getApp)();
    return (0, app_1.initializeApp)(firebaseConfig);
}
var db = (0, lite_1.getFirestore)(getClientApp());
exports.db = db;
var app = getClientApp();
exports.app = app;
