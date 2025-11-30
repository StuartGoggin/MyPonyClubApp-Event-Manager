/**
 * Cleanup old equipment collections after migration
 * 
 * This script DELETES the old collections:
 *   - equipment-items (migrated to 'equipment')
 *   - equipment-bookings (migrated to 'equipment_bookings')
 * 
 * ⚠️ WARNING: This is PERMANENT and cannot be undone!
 * Only run this after verifying the migration was successful.
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

async function deleteCollection(collectionName, batchSize = 100) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Deleting collection: ${collectionName}`);
  console.log('='.repeat(70));
  
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      console.log('✅ No more documents to delete');
      resolve();
      return;
    }

    console.log(`🗑️  Deleting ${snapshot.size} documents...`);

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Deleted ${snapshot.size} documents`);

    // Recurse on the next process tick to avoid overwhelming the stack
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function verifyBeforeDelete() {
  console.log('='.repeat(70));
  console.log('PRE-DELETION VERIFICATION');
  console.log('='.repeat(70));
  
  // Check new collections have data
  const newEquipment = await db.collection('equipment').get();
  const newBookings = await db.collection('equipment_bookings').get();
  
  console.log(`\n📊 New collections:`);
  console.log(`   equipment: ${newEquipment.size} documents`);
  console.log(`   equipment_bookings: ${newBookings.size} documents`);
  
  if (newEquipment.size === 0 || newBookings.size === 0) {
    console.log('\n❌ ERROR: New collections are empty!');
    console.log('Migration may not have completed successfully.');
    console.log('Aborting deletion to prevent data loss.\n');
    return false;
  }
  
  // Check old collections
  const oldEquipment = await db.collection('equipment-items').get();
  const oldBookings = await db.collection('equipment-bookings').get();
  
  console.log(`\n📊 Old collections to delete:`);
  console.log(`   equipment-items: ${oldEquipment.size} documents`);
  console.log(`   equipment-bookings: ${oldBookings.size} documents`);
  
  if (oldEquipment.size === 0 && oldBookings.size === 0) {
    console.log('\n✅ Old collections are already empty - nothing to delete.\n');
    return false;
  }
  
  // Safety check: compare counts
  if (newEquipment.size < oldEquipment.size) {
    console.log(`\n⚠️  WARNING: New equipment collection (${newEquipment.size}) has fewer items than old (${oldEquipment.size})`);
    console.log('Some data may not have migrated properly.');
    return false;
  }
  
  if (newBookings.size < oldBookings.size) {
    console.log(`\n⚠️  WARNING: New bookings collection (${newBookings.size}) has fewer items than old (${oldBookings.size})`);
    console.log('Some data may not have migrated properly.');
    return false;
  }
  
  console.log('\n✅ Verification passed - safe to delete old collections');
  return true;
}

async function cleanup() {
  console.log('='.repeat(70));
  console.log('CLEANUP OLD EQUIPMENT COLLECTIONS');
  console.log('='.repeat(70));
  console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE the following collections:');
  console.log('   • equipment-items');
  console.log('   • equipment-bookings');
  console.log('\nThis operation CANNOT be undone!\n');
  
  try {
    // Verify before deleting
    const safeToDelete = await verifyBeforeDelete();
    
    if (!safeToDelete) {
      console.log('='.repeat(70));
      console.log('DELETION ABORTED');
      console.log('='.repeat(70));
      console.log('\nNo changes made to your database.\n');
      return;
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('PROCEEDING WITH DELETION');
    console.log('='.repeat(70));
    
    // Delete old equipment collection
    await deleteCollection('equipment-items');
    
    // Delete old bookings collection
    await deleteCollection('equipment-bookings');
    
    // Final verification
    console.log('\n' + '='.repeat(70));
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(70));
    
    const verifyEquipment = await db.collection('equipment-items').get();
    const verifyBookings = await db.collection('equipment-bookings').get();
    
    console.log(`\n✅ equipment-items: ${verifyEquipment.size} documents remaining`);
    console.log(`✅ equipment-bookings: ${verifyBookings.size} documents remaining`);
    
    if (verifyEquipment.size === 0 && verifyBookings.size === 0) {
      console.log('\n' + '='.repeat(70));
      console.log('✅ CLEANUP COMPLETED SUCCESSFULLY');
      console.log('='.repeat(70));
      console.log('\nOld collections have been permanently deleted.');
      console.log('Your application is now using:');
      console.log('   • equipment');
      console.log('   • equipment_bookings\n');
    } else {
      console.log('\n⚠️  Some documents may remain - run the script again if needed.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
