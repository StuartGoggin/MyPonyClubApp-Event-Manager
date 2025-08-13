import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔥 Starting database purge...');
    
    const results = {
      zones: { deleted: 0, errors: [] as string[] },
      clubs: { deleted: 0, errors: [] as string[] },
      clubPictures: { deleted: 0, errors: [] as string[] }
    };

    // Purge Zones
    console.log('🗑️ Purging zones collection...');
    try {
      const zonesSnapshot = await adminDb.collection('zones').get();
      console.log(`Found ${zonesSnapshot.docs.length} zones to delete`);
      
      const zoneBatch = adminDb.batch();
      zonesSnapshot.docs.forEach((doc: any) => {
        zoneBatch.delete(doc.ref);
      });
      
      if (zonesSnapshot.docs.length > 0) {
        await zoneBatch.commit();
        results.zones.deleted = zonesSnapshot.docs.length;
        console.log(`✅ Deleted ${results.zones.deleted} zones`);
      }
    } catch (error) {
      const errorMsg = `Error deleting zones: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.zones.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    // Purge Clubs
    console.log('🗑️ Purging clubs collection...');
    try {
      const clubsSnapshot = await adminDb.collection('clubs').get();
      console.log(`Found ${clubsSnapshot.docs.length} clubs to delete`);
      
      const clubBatch = adminDb.batch();
      clubsSnapshot.docs.forEach((doc: any) => {
        clubBatch.delete(doc.ref);
      });
      
      if (clubsSnapshot.docs.length > 0) {
        await clubBatch.commit();
        results.clubs.deleted = clubsSnapshot.docs.length;
        console.log(`✅ Deleted ${results.clubs.deleted} clubs`);
      }
    } catch (error) {
      const errorMsg = `Error deleting clubs: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.clubs.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    // Purge Club Pictures (if they exist as a separate collection)
    console.log('🗑️ Purging club pictures collection...');
    try {
      const picturesSnapshot = await adminDb.collection('clubPictures').get();
      console.log(`Found ${picturesSnapshot.docs.length} club pictures to delete`);
      
      const picturesBatch = adminDb.batch();
      picturesSnapshot.docs.forEach((doc: any) => {
        picturesBatch.delete(doc.ref);
      });
      
      if (picturesSnapshot.docs.length > 0) {
        await picturesBatch.commit();
        results.clubPictures.deleted = picturesSnapshot.docs.length;
        console.log(`✅ Deleted ${results.clubPictures.deleted} club pictures`);
      }
    } catch (error) {
      const errorMsg = `Error deleting club pictures: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.clubPictures.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    const totalDeleted = results.zones.deleted + results.clubs.deleted + results.clubPictures.deleted;
    const totalErrors = results.zones.errors.length + results.clubs.errors.length + results.clubPictures.errors.length;

    console.log(`🎉 Database purge completed!`);
    console.log(`  Total items deleted: ${totalDeleted}`);
    console.log(`  Total errors: ${totalErrors}`);

    return NextResponse.json({
      success: totalErrors === 0,
      message: totalErrors === 0 
        ? `Database purge completed successfully. Deleted ${totalDeleted} items.`
        : `Database purge completed with ${totalErrors} errors. Deleted ${totalDeleted} items.`,
      results: {
        summary: {
          totalDeleted,
          totalErrors
        },
        details: results
      }
    });

  } catch (error) {
    console.error('Database purge error:', error);
    
    return NextResponse.json(
      { 
        error: 'Database purge failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
