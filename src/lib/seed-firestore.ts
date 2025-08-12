// seed-firestore.ts
import { adminDb } from './firebase-admin';
import { zonesMock, clubsMock, eventTypesMock } from './data';

const seedData = async () => {
  console.log('Seeding data...');
  const batch = adminDb.batch();

  try {
    // Seed Zones
    const zonesSnapshot = await adminDb.collection('zones').limit(1).get();
    if (zonesSnapshot.empty) {
        console.log('Seeding zones...');
        zonesMock.forEach(zone => {
            const zoneRef = adminDb.collection('zones').doc(zone.id);
            batch.set(zoneRef, zone);
        });
    }

    // Seed Clubs
    const clubsSnapshot = await adminDb.collection('clubs').limit(1).get();
    if (clubsSnapshot.empty) {
        console.log('Seeding clubs...');
        clubsMock.forEach(club => {
            const clubRef = adminDb.collection('clubs').doc(club.id);
            batch.set(clubRef, club);
        });
    }

    // Seed Event Types
    const eventTypesSnapshot = await adminDb.collection('eventTypes').limit(1).get();
    if (eventTypesSnapshot.empty) {
        console.log('Seeding event types...');
        eventTypesMock.forEach(eventType => {
            const eventTypeRef = adminDb.collection('eventTypes').doc(eventType.id);
            batch.set(eventTypeRef, eventType);
        });
    }

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
