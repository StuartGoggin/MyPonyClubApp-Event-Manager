// Quick script to add ev_event event type to Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedEvEventType() {
  try {
    console.log('Adding ev_event event type to Firestore...');
    
    await db.collection('eventTypes').doc('ev_event').set({
      id: 'ev_event',
      name: 'EV Event'
    });
    
    console.log('✅ Successfully added ev_event event type!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding ev_event event type:', error);
    process.exit(1);
  }
}

seedEvEventType();
