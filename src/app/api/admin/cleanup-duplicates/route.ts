import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Get all zones
    const zonesSnapshot = await adminDb.collection('zones').get();
    const zones = zonesSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${zones.length} zones to check`);
    
    // Group zones by name to find duplicates
    const zonesByName: Record<string, any[]> = {};
    zones.forEach((zone: any) => {
      if (!zonesByName[zone.name]) {
        zonesByName[zone.name] = [];
      }
      zonesByName[zone.name].push(zone);
    });
    
    let deletedCount = 0;
    const deletions = [];
    
    // For each zone name that has duplicates
    for (const [zoneName, duplicateZones] of Object.entries(zonesByName)) {
      if (duplicateZones.length > 1) {
        console.log(`🔍 Found ${duplicateZones.length} duplicates for "${zoneName}"`);
        
        // Keep the one with numeric ID (base seed data), delete the text-based IDs
        const numericZone = duplicateZones.find((z: any) => /^\d+$/.test(z.id));
        const textZones = duplicateZones.filter((z: any) => !/^\d+$/.test(z.id));
        
        if (numericZone && textZones.length > 0) {
          for (const textZone of textZones) {
            console.log(`🗑️ Deleting duplicate zone: ${textZone.id} (${textZone.name})`);
            await adminDb.collection('zones').doc(textZone.id).delete();
            deletions.push(`${textZone.id} (${textZone.name})`);
            deletedCount++;
          }
        }
      }
    }
    
    // Also clean up any clubs that might reference the deleted zone IDs
    const clubsSnapshot = await adminDb.collection('clubs').get();
    const clubs = clubsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    let updatedClubs = 0;
    for (const club of clubs) {
      // If club references a text-based zone ID, update it to numeric
      if (club.zoneId && club.zoneId.startsWith('zone-')) {
        // Find the correct numeric zone ID for this club's zone
        const zoneName = Object.keys(zonesByName).find(name => 
          zonesByName[name].some((z: any) => z.id === club.zoneId)
        );
        
        if (zoneName) {
          const numericZone = zonesByName[zoneName].find((z: any) => /^\d+$/.test(z.id));
          if (numericZone) {
            console.log(`🔄 Updating club ${club.name} from zone ${club.zoneId} to ${numericZone.id}`);
            await adminDb.collection('clubs').doc(club.id).update({
              zoneId: numericZone.id
            });
            updatedClubs++;
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      results: {
        duplicateZonesDeleted: deletedCount,
        clubsUpdated: updatedClubs,
        deletedZones: deletions
      }
    });

  } catch (error) {
    console.error('Database cleanup error:', error);
    
    return NextResponse.json(
      { 
        error: 'Database cleanup failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
