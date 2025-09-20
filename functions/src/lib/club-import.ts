import {ClubJsonData, processClubsFromJson} from "./club-data-utils";
import {getAllZones} from "./server-data";
import {adminDb} from "./firebase-admin";

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

    console.log("📊 Processing results:");
    console.log(`  ✅ Valid clubs: ${result.validClubs.length}`);
    console.log(`  ❌ Invalid clubs: ${result.invalidClubs.length}`);
    console.log(
      `  🔍 Missing zones: ${result.missingZones.join(", ") || "none"}`,
    );

    // Report invalid clubs
    if (result.invalidClubs.length > 0) {
      console.log("\n❌ Invalid clubs:");
      result.invalidClubs.forEach(({data, errors}) => {
        console.log(`  - ${data.club_name}: ${errors.join(", ")}`);
      });
    }

    // Report missing zones
    if (result.missingZones.length > 0) {
      console.log("\n🔍 Missing zones that need to be created:");
      result.missingZones.forEach((zoneName) => {
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
          .collection("clubs")
          .where("name", "==", club.name)
          .where("zoneId", "==", club.zoneId)
          .limit(1)
          .get();

        if (!existingClubsSnapshot.empty) {
          console.log(`⏭️  Skipping ${club.name} - already exists`);
          skipped++;
          continue;
        }

        // Add to database using Admin SDK
        const clubRef = adminDb.collection("clubs").doc(); // Auto-generate ID
        await clubRef.set({
          ...club,
          id: clubRef.id, // Add the generated ID to the club data
        });
        console.log(`✅ Imported ${club.name}`);
        imported++;
      } catch (error) {
        console.error(`❌ Failed to import ${club.name}:`, error);
      }
    }

    console.log("\n🎉 Import completed:");
    console.log(`  ✅ Imported: ${imported} clubs`);
    console.log(`  ⏭️  Skipped: ${skipped} clubs (already exist)`);
    console.log(`  ❌ Failed: ${result.invalidClubs.length} clubs`);

    return {
      imported,
      skipped,
      failed: result.invalidClubs.length,
      invalidClubs: result.invalidClubs,
      missingZones: result.missingZones,
    };
  } catch (error) {
    console.error("🔥 Import process failed:", error);
    throw error;
  }
}
