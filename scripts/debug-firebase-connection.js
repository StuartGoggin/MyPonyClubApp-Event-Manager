/**
 * Debug Firebase connection and check equipment document directly
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
    console.log(`📊 Project ID: ${serviceAccount.project_id}`);
    console.log(`📧 Client Email: ${serviceAccount.client_email}`);
    
  } catch (error) {
    console.error('❌ Error parsing service account credentials:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function debugEquipmentFetch() {
  const equipmentId = 'fAwxjjERKsHhVh7cMa4v';
  
  console.log('\n' + '='.repeat(70));
  console.log('DEBUGGING EQUIPMENT DOCUMENT FETCH');
  console.log('='.repeat(70));
  
  console.log(`\n🔍 Attempting to fetch equipment ID: ${equipmentId}`);
  console.log(`📂 Collection: equipment`);
  console.log(`🆔 Document ID: ${equipmentId}\n`);
  
  try {
    const equipmentDoc = await db.collection('equipment').doc(equipmentId).get();
    
    console.log('📋 Document fetch result:');
    console.log(`   exists: ${equipmentDoc.exists}`);
    console.log(`   id: ${equipmentDoc.id}`);
    console.log(`   ref.path: ${equipmentDoc.ref.path}`);
    
    if (equipmentDoc.exists) {
      const data = equipmentDoc.data();
      console.log('\n✅ Document EXISTS!');
      console.log('\n📦 Document data:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ Document DOES NOT EXIST');
      console.log('\nLet me list ALL equipment documents...\n');
      
      const allEquipment = await db.collection('equipment').get();
      console.log(`📊 Total equipment documents: ${allEquipment.size}\n`);
      
      allEquipment.forEach(doc => {
        console.log(`  - ${doc.id}: ${doc.data().name}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error fetching document:', error);
  }
  
  console.log('\n' + '='.repeat(70));
}

debugEquipmentFetch().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
