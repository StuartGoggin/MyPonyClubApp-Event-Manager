// seed-firestore.js
const admin = require('firebase-admin');
const { zonesMock, clubsMock, eventTypesMock } = require('./src/lib/data'); // Adjust path if necessary

// Initialize Firebase Admin SDK
// Make sure you have your Firebase service account credentials configured
// e.g., via the GOOGLE_APPLICATION_CREDENTIALS environment variable
if (!admin.apps.length) {
  admin.initializeApp({
    // credential: admin.credential.applicationDefault(), // Use this if using GOOGLE_APPLICATION_CREDENTIALS
    // Or provide your service account key file path directly:
    // credential: admin.credential.cert(require('./path/to/your/serviceAccountKey.json'))
  });
}

const db = admin.firestore();

const seedData = async () => {
  console.log('Seeding data...');
  const batch = db.batch();

  try {
    // Seed Zones
    console.log('Seeding zones...');
    zonesMock.forEach(zone => {
      const zoneRef = db.collection('zones').doc(zone.id);
      batch.set(zoneRef, zone);
    });

    // Seed Clubs
    console.log('Seeding clubs...');
    clubsMock.forEach(club => {
      const clubRef = db.collection('clubs').doc(club.id);
      batch.set(clubRef, club);
    });

    // Seed Event Types
    console.log('Seeding event types...');
     eventTypesMock.forEach(eventType => {
         const eventTypeRef = db.collection('eventTypes').doc(eventType.id);
         batch.set(eventTypeRef, eventType);
     });


    await batch.commit();

    console.log('Seeding complete.');
    return { success: true, message: "Database seeded successfully." };
  } catch (error) {
    console.error("Error seeding database: ", error);
    return { success: false, message: "Error seeding database." };
  }
};

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  });