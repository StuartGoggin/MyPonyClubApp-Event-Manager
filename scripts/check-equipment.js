/**
 * Check Equipment Document
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
  } catch (error) {
    console.error('❌ Error parsing service account credentials:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function checkEquipment() {
  console.log('\n🔍 Searching for all equipment...\n');
  
  const snapshot = await db.collection('equipment').get();
  
  console.log(`Found ${snapshot.size} equipment items:\n`);
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Zone ID: ${data.zoneId || 'MISSING'}`);
    console.log(`  Category: ${data.category}`);
    console.log('');
  });
  
  // Also check for Dressage Trailer specifically
  console.log('\n🔍 Searching for "Dressage Trailer"...\n');
  
  const dressageSnapshot = await db.collection('equipment')
    .where('name', '==', 'Dressage Trailer')
    .get();
  
  if (dressageSnapshot.empty) {
    console.log('❌ No Dressage Trailer found by name');
  } else {
    console.log(`Found ${dressageSnapshot.size} Dressage Trailer(s):\n`);
    dressageSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  Zone ID: ${data.zoneId || 'MISSING'}`);
      console.log(`  Zone Name: ${data.zoneName}`);
      console.log(`  Status: ${data.status}`);
      console.log('');
    });
  }
  
  // Check the specific ID from the log
  const equipmentId = 'fAwxjjERKsHhVh7cMa4v';
  console.log(`\n🔍 Checking specific ID: ${equipmentId}...\n`);
  
  const doc = await db.collection('equipment').doc(equipmentId).get();
  
  if (!doc.exists) {
    console.log('❌ Equipment with this ID does NOT exist!');
    console.log('   This means the booking is referencing a deleted or invalid equipment item.');
  } else {
    const data = doc.data();
    console.log('✅ Equipment found:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkEquipment().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
