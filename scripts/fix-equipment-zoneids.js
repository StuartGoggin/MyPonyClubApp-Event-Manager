/**
 * Fix Equipment Records Missing zoneId
 * 
 * This script finds equipment records that are missing zoneId and attempts to
 * infer it from existing bookings or prompts for manual assignment.
 */

const admin = require('firebase-admin');
const readline = require('readline');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountStr) {
    console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
    console.error('Make sure .env.local exists with FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    // Handle private key formatting
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

// Terminal interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function findEquipmentMissingZoneId() {
  console.log('\n🔍 Scanning equipment collection for missing zoneId...\n');
  
  const equipmentSnap = await db.collection('equipment').get();
  const missing = [];
  
  equipmentSnap.forEach(doc => {
    const data = doc.data();
    if (!data.zoneId || data.zoneId === '' || data.zoneId === null || data.zoneId === undefined) {
      missing.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        storageLocation: data.storageLocation,
        createdAt: data.createdAt
      });
    }
  });
  
  return missing;
}

async function inferZoneIdFromBookings(equipmentId) {
  // Try to find zoneId from existing bookings
  const bookingsSnap = await db.collection('equipment_bookings')
    .where('equipmentId', '==', equipmentId)
    .limit(1)
    .get();
  
  if (!bookingsSnap.empty) {
    const booking = bookingsSnap.docs[0].data();
    return booking.zoneId;
  }
  
  return null;
}

async function listAvailableZones() {
  const zonesSnap = await db.collection('zones').get();
  const zones = [];
  
  zonesSnap.forEach(doc => {
    zones.push({
      id: doc.id,
      name: doc.data().name
    });
  });
  
  return zones;
}

async function fixEquipmentZoneId(equipmentId, zoneId) {
  await db.collection('equipment').doc(equipmentId).update({
    zoneId: zoneId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`✅ Updated equipment ${equipmentId} with zoneId: ${zoneId}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Equipment zoneId Fix Utility');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const missing = await findEquipmentMissingZoneId();
  
  if (missing.length === 0) {
    console.log('✅ All equipment records have zoneId assigned!\n');
    rl.close();
    return;
  }
  
  console.log(`⚠️  Found ${missing.length} equipment record(s) missing zoneId:\n`);
  
  missing.forEach((eq, index) => {
    console.log(`${index + 1}. ${eq.name}`);
    console.log(`   ID: ${eq.id}`);
    console.log(`   Category: ${eq.category}`);
    console.log(`   Storage: ${eq.storageLocation || 'Not specified'}`);
    console.log('');
  });
  
  // Get available zones
  const zones = await listAvailableZones();
  console.log('\n📍 Available Zones:\n');
  zones.forEach((zone, index) => {
    console.log(`${index + 1}. ${zone.name} (${zone.id})`);
  });
  console.log('');
  
  // Process each equipment item
  for (const eq of missing) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\nFixing: ${eq.name} (${eq.id})\n`);
    
    // Try to infer from bookings
    const inferredZoneId = await inferZoneIdFromBookings(eq.id);
    
    if (inferredZoneId) {
      const zone = zones.find(z => z.id === inferredZoneId);
      console.log(`✨ Found zoneId from existing booking: ${zone?.name || inferredZoneId}`);
      
      const useInferred = await question(`Use this zone? (yes/no): `);
      
      if (useInferred.toLowerCase() === 'yes' || useInferred.toLowerCase() === 'y') {
        await fixEquipmentZoneId(eq.id, inferredZoneId);
        continue;
      }
    }
    
    // Manual selection
    console.log('\nAvailable zones:');
    zones.forEach((zone, index) => {
      console.log(`${index + 1}. ${zone.name}`);
    });
    
    const selection = await question(`\nEnter zone number (1-${zones.length}), or 's' to skip: `);
    
    if (selection.toLowerCase() === 's') {
      console.log('⏭️  Skipped');
      continue;
    }
    
    const zoneIndex = parseInt(selection) - 1;
    
    if (zoneIndex >= 0 && zoneIndex < zones.length) {
      const selectedZone = zones[zoneIndex];
      await fixEquipmentZoneId(eq.id, selectedZone.id);
    } else {
      console.log('❌ Invalid selection, skipped');
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✅ Finished processing all equipment!\n');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
