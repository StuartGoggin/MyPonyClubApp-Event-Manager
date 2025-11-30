/**
 * Migrate equipment and bookings from old collection names to new ones
 * 
 * OLD → NEW:
 *   equipment-items → equipment
 *   equipment-bookings → equipment_bookings
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

async function migrateCollection(oldName, newName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Migrating: ${oldName} → ${newName}`);
  console.log('='.repeat(70));
  
  try {
    // Get all documents from old collection
    const oldSnapshot = await db.collection(oldName).get();
    
    if (oldSnapshot.empty) {
      console.log(`✅ No documents in ${oldName} - nothing to migrate`);
      return { migrated: 0, skipped: 0 };
    }
    
    console.log(`📊 Found ${oldSnapshot.size} documents to migrate\n`);
    
    let migrated = 0;
    let skipped = 0;
    
    // Use batched writes for efficiency
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_LIMIT = 500;
    
    for (const doc of oldSnapshot.docs) {
      const docId = doc.id;
      const data = doc.data();
      
      // Check if document already exists in new collection
      const newDocRef = db.collection(newName).doc(docId);
      const newDocSnap = await newDocRef.get();
      
      if (newDocSnap.exists) {
        console.log(`⏭️  Skipping ${docId} - already exists in ${newName}`);
        skipped++;
        continue;
      }
      
      // Copy to new collection
      batch.set(newDocRef, data);
      batchCount++;
      
      console.log(`✅ Queued ${docId} for migration`);
      migrated++;
      
      // Commit batch if we hit the limit
      if (batchCount >= BATCH_LIMIT) {
        console.log(`\n📤 Committing batch of ${batchCount} documents...`);
        await batch.commit();
        batchCount = 0;
      }
    }
    
    // Commit any remaining documents
    if (batchCount > 0) {
      console.log(`\n📤 Committing final batch of ${batchCount} documents...`);
      await batch.commit();
    }
    
    console.log(`\n✅ Migration complete: ${migrated} migrated, ${skipped} skipped`);
    
    return { migrated, skipped };
    
  } catch (error) {
    console.error(`❌ Error migrating ${oldName}:`, error);
    throw error;
  }
}

async function verifyMigration(oldName, newName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Verifying: ${oldName} → ${newName}`);
  console.log('='.repeat(70));
  
  const oldSnapshot = await db.collection(oldName).get();
  const newSnapshot = await db.collection(newName).get();
  
  console.log(`📊 Old collection (${oldName}): ${oldSnapshot.size} documents`);
  console.log(`📊 New collection (${newName}): ${newSnapshot.size} documents`);
  
  if (oldSnapshot.size === 0 && newSnapshot.size > 0) {
    console.log('✅ Migration successful - all data in new collection');
    return true;
  } else if (oldSnapshot.size > 0) {
    console.log('⚠️  Old collection still has documents');
    return false;
  } else {
    console.log('⚠️  No documents in either collection');
    return false;
  }
}

async function migrate() {
  console.log('='.repeat(70));
  console.log('EQUIPMENT COLLECTIONS MIGRATION');
  console.log('='.repeat(70));
  console.log('\nThis script will migrate data from old to new collection names:');
  console.log('  • equipment-items → equipment');
  console.log('  • equipment-bookings → equipment_bookings');
  console.log('\nExisting documents in new collections will NOT be overwritten.\n');
  
  try {
    // Migrate equipment
    const equipmentResult = await migrateCollection('equipment-items', 'equipment');
    
    // Migrate bookings
    const bookingsResult = await migrateCollection('equipment-bookings', 'equipment_bookings');
    
    // Verify migrations
    console.log(`\n${'='.repeat(70)}`);
    console.log('VERIFICATION');
    console.log('='.repeat(70));
    
    const equipmentVerified = await verifyMigration('equipment-items', 'equipment');
    const bookingsVerified = await verifyMigration('equipment-bookings', 'equipment_bookings');
    
    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nEquipment:`);
    console.log(`  Migrated: ${equipmentResult.migrated}`);
    console.log(`  Skipped: ${equipmentResult.skipped}`);
    console.log(`  Status: ${equipmentVerified ? '✅ Success' : '⚠️  Incomplete'}`);
    console.log(`\nBookings:`);
    console.log(`  Migrated: ${bookingsResult.migrated}`);
    console.log(`  Skipped: ${bookingsResult.skipped}`);
    console.log(`  Status: ${bookingsVerified ? '✅ Success' : '⚠️  Incomplete'}`);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log('IMPORTANT: OLD COLLECTIONS NOT DELETED');
    console.log('='.repeat(70));
    console.log('\nThe old collections (equipment-items, equipment-bookings) have NOT been deleted.');
    console.log('They are kept as backup. After verifying everything works correctly,');
    console.log('you can manually delete them from the Firebase Console if desired.');
    console.log('\n✅ Migration complete! Test the application before deleting old collections.\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
