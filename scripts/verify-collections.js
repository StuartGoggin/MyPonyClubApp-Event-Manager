/**
 * Verify equipment and booking collections to confirm no migration needed
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountStr) {
    console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
    process.exit(1);
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    let formattedPrivateKey = serviceAccount.private_key;
    if (formattedPrivateKey.includes('\\n')) {
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: formattedPrivateKey,
      }),
    });
    
    console.log('✅ Firebase Admin initialized');
    console.log(`📊 Project ID: ${serviceAccount.project_id}\n`);
    
  } catch (error) {
    console.error('❌ Error parsing service account credentials:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function verifyCollections() {
  console.log('='.repeat(70));
  console.log('VERIFYING FIREBASE COLLECTIONS');
  console.log('='.repeat(70));
  
  // Check 'equipment' collection (correct name)
  console.log('\n📦 Checking collection: equipment');
  console.log('-'.repeat(70));
  const equipmentSnapshot = await db.collection('equipment').get();
  console.log(`   Count: ${equipmentSnapshot.size} items`);
  if (equipmentSnapshot.size > 0) {
    console.log('   Items:');
    equipmentSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`     - ${doc.id}: ${data.name} (Zone: ${data.zoneId || 'N/A'})`);
    });
  }
  
  // Check 'equipment-items' collection (old incorrect name - should be empty)
  console.log('\n📦 Checking collection: equipment-items (OLD NAME - should be empty)');
  console.log('-'.repeat(70));
  const oldEquipmentSnapshot = await db.collection('equipment-items').get();
  console.log(`   Count: ${oldEquipmentSnapshot.size} items`);
  if (oldEquipmentSnapshot.size > 0) {
    console.log('   ⚠️  WARNING: Found items in old collection!');
    oldEquipmentSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`     - ${doc.id}: ${data.name || 'Unknown'}`);
    });
  } else {
    console.log('   ✅ Empty (as expected)');
  }
  
  // Check 'equipment_bookings' collection (correct name)
  console.log('\n📅 Checking collection: equipment_bookings');
  console.log('-'.repeat(70));
  const bookingsSnapshot = await db.collection('equipment_bookings').get();
  console.log(`   Count: ${bookingsSnapshot.size} bookings`);
  if (bookingsSnapshot.size > 0) {
    console.log('   Recent bookings:');
    const recent = bookingsSnapshot.docs.slice(0, 5);
    recent.forEach(doc => {
      const data = doc.data();
      console.log(`     - ${data.bookingReference || doc.id}: ${data.equipmentName || 'Unknown'} (Status: ${data.status})`);
    });
    if (bookingsSnapshot.size > 5) {
      console.log(`     ... and ${bookingsSnapshot.size - 5} more`);
    }
  }
  
  // Check 'equipment-bookings' collection (old incorrect name - should be empty)
  console.log('\n📅 Checking collection: equipment-bookings (OLD NAME - should be empty)');
  console.log('-'.repeat(70));
  const oldBookingsSnapshot = await db.collection('equipment-bookings').get();
  console.log(`   Count: ${oldBookingsSnapshot.size} bookings`);
  if (oldBookingsSnapshot.size > 0) {
    console.log('   ⚠️  WARNING: Found items in old collection!');
    oldBookingsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`     - ${data.bookingReference || doc.id}: ${data.equipmentName || 'Unknown'}`);
    });
  } else {
    console.log('   ✅ Empty (as expected)');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  
  const needsMigration = oldEquipmentSnapshot.size > 0 || oldBookingsSnapshot.size > 0;
  
  if (needsMigration) {
    console.log('\n⚠️  MIGRATION REQUIRED!');
    console.log('\nFound data in old collection names:');
    if (oldEquipmentSnapshot.size > 0) {
      console.log(`   - equipment-items: ${oldEquipmentSnapshot.size} items need to move to 'equipment'`);
    }
    if (oldBookingsSnapshot.size > 0) {
      console.log(`   - equipment-bookings: ${oldBookingsSnapshot.size} bookings need to move to 'equipment_bookings'`);
    }
  } else {
    console.log('\n✅ NO MIGRATION NEEDED!');
    console.log('\nAll data is already in the correct collections:');
    console.log(`   - equipment: ${equipmentSnapshot.size} items ✓`);
    console.log(`   - equipment_bookings: ${bookingsSnapshot.size} bookings ✓`);
    console.log('\nThe code fix to update collection names is all that was required.');
  }
  
  console.log('\n' + '='.repeat(70));
}

verifyCollections().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
