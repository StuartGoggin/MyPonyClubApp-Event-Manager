import { ClubJsonData, processClubsFromJson } from './club-data-utils';
import { getAllZones } from './server-data';
import { adminDb } from './firebase-admin';

/**
 * Import clubs from JSON data and add them to the database
 */
export async function importClubsFromJson(jsonData: ClubJsonData[]) {
  console.log(`🎯 Starting import process for ${jsonData.length} clubs`);
  
  try {
    // Get all zones from the database
    const zones = await getAllZones();
    console.log(`📍 Found ${zones.length} zones in database`);
    
    // Process the club data
    const result = await processClubsFromJson(jsonData, zones);
    
    console.log(`📊 Processing results:`);
    console.log(`  ✅ Valid clubs: ${result.validClubs.length}`);
    console.log(`  ❌ Invalid clubs: ${result.invalidClubs.length}`);
    console.log(`  🔍 Missing zones: ${result.missingZones.join(', ') || 'none'}`);
    
    // Report invalid clubs
    if (result.invalidClubs.length > 0) {
      console.log(`\n❌ Invalid clubs:`);
      result.invalidClubs.forEach(({ data, errors }) => {
        console.log(`  - ${data.club_name}: ${errors.join(', ')}`);
      });
    }
    
    // Report missing zones
    if (result.missingZones.length > 0) {
      console.log(`\n🔍 Missing zones that need to be created:`);
      result.missingZones.forEach(zoneName => {
        console.log(`  - ${zoneName}`);
      });
    }
    
    // Import valid clubs
    let imported = 0;
    let skipped = 0;
    
    for (const club of result.validClubs) {
      try {
        // Check if club already exists by name and zone using Admin SDK
        const existingClubsSnapshot = await adminDb
          .collection('clubs')
          .where('name', '==', club.name)
          .where('zoneId', '==', club.zoneId)
          .limit(1)
          .get();
        
        if (!existingClubsSnapshot.empty) {
          console.log(`⏭️  Skipping ${club.name} - already exists`);
          skipped++;
          continue;
        }
        
        // Add to database using Admin SDK
        const clubRef = adminDb.collection('clubs').doc(); // Auto-generate ID
        await clubRef.set({
          ...club,
          id: clubRef.id // Add the generated ID to the club data
        });
        console.log(`✅ Imported ${club.name}`);
        imported++;
      } catch (error) {
        console.error(`❌ Failed to import ${club.name}:`, error);
      }
    }
    
    console.log(`\n🎉 Import completed:`);
    console.log(`  ✅ Imported: ${imported} clubs`);
    console.log(`  ⏭️  Skipped: ${skipped} clubs (already exist)`);
    console.log(`  ❌ Failed: ${result.invalidClubs.length} clubs`);
    
    return {
      imported,
      skipped,
      failed: result.invalidClubs.length,
      invalidClubs: result.invalidClubs,
      missingZones: result.missingZones
    };
    
  } catch (error) {
    console.error('🔥 Import process failed:', error);
    throw error;
  }
}

/**
 * Example JSON data structure (based on your description)
 */
export const exampleClubJsonData: ClubJsonData[] = [
  {
    club_id: 101,
    club_name: "Bealiba Pony Club",
    zone: "Central Zone",
    physical_address: "Park Lane, Bealiba VIC 3475",
    postal_address: "PO Box 123, Bealiba VIC 3475",
    email: "secretary@bealibaponyclub.com.au",
    phone: "03 5468 1234",
    website_url: "https://www.bealibaponyclub.com.au",
    social_media_url: "https://www.facebook.com/bealibaponyclub"
  },
  {
    club_id: 102,
    club_name: "Avoca Pony Club",
    zone: "Central Zone", 
    physical_address: "Recreation Reserve, High Street, Avoca VIC 3467",
    postal_address: "PO Box 45, Avoca VIC 3467",
    email: "info@avocaponyclub.org.au",
    phone: "03 5465 7890",
    website_url: "https://www.avocaponyclub.org.au",
    social_media_url: "https://www.facebook.com/avocaponyclub"
  }
];

/**
 * Helper function to upload club images
 */
export async function uploadClubImage(clubId: string, imageFile: File): Promise<string> {
  // This would integrate with your file upload system
  // For now, return a placeholder URL
  const filename = `clubs/${clubId}/${imageFile.name}`;
  
  // TODO: Implement actual file upload to Firebase Storage or your chosen service
  // Example with Firebase Storage:
  // const storage = getStorage();
  // const storageRef = ref(storage, filename);
  // const snapshot = await uploadBytes(storageRef, imageFile);
  // const downloadURL = await getDownloadURL(snapshot.ref);
  // return downloadURL;
  
  return `https://example.com/${filename}`;
}

/**
 * Update club with image URL after upload
 */
export async function updateClubImage(clubId: string, imageUrl: string): Promise<void> {
  // TODO: Update the club document with the image URL
  // const clubRef = doc(db, 'clubs', clubId);
  // await updateDoc(clubRef, { imageUrl });
  
  console.log(`Updated club ${clubId} with image: ${imageUrl}`);
}
