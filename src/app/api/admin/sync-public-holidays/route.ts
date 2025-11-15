import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';
import { invalidateEventsCache } from '@/lib/server-data';
import { getYear } from 'date-fns';

interface PublicHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

interface SyncMetadata {
  lastSyncDate: Date | { toDate: () => Date };
  lastSyncSuccess: boolean;
  holidaysCount: number;
  yearsSync: number[];
}

interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    added: number;
    updated: number;
    deleted: number;
    unchanged: number;
    total: number;
  };
  lastSyncDate?: Date;
  errors?: string[];
}

// Check if sync is needed (last sync > 7 days ago)
async function shouldSync(forceSync: boolean = false): Promise<{ should: boolean; lastSync?: Date }> {
  if (forceSync) {
    return { should: true };
  }

  try {
    const metadataDoc = await adminDb!.collection('system_metadata').doc('public_holidays_sync').get();
    
    if (!metadataDoc.exists) {
      return { should: true }; // Never synced before
    }

    const metadata = metadataDoc.data() as SyncMetadata;
    const lastSync = metadata.lastSyncDate instanceof Date 
      ? metadata.lastSyncDate 
      : metadata.lastSyncDate.toDate();
    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      should: daysSinceSync >= 7,
      lastSync
    };
  } catch (error) {
    console.error('Error checking sync metadata:', error);
    return { should: true }; // Sync if we can't check
  }
}

// Update sync metadata
async function updateSyncMetadata(success: boolean, holidaysCount: number, years: number[]): Promise<void> {
  try {
    await adminDb!.collection('system_metadata').doc('public_holidays_sync').set({
      lastSyncDate: new Date(),
      lastSyncSuccess: success,
      holidaysCount,
      yearsSync: years,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating sync metadata:', error);
  }
}

// Fetch holidays from external API
async function fetchHolidaysFromAPI(startYear: number, yearsAhead: number = 5): Promise<Map<string, PublicHoliday>> {
  const holidaysMap = new Map<string, PublicHoliday>();
  
  for (let i = 0; i <= yearsAhead; i++) {
    const year = startYear + i;
    
    try {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/AU`);
      if (!response.ok) {
        console.warn(`Failed to fetch public holidays for ${year}:`, response.statusText);
        continue;
      }
      
      const holidays: PublicHoliday[] = await response.json();
      
      // Filter for Victorian holidays
      holidays
        .filter(holiday => holiday.counties === null || holiday.counties?.includes('AU-VIC'))
        .forEach(holiday => {
          const key = `${holiday.date}-${holiday.name}`;
          holidaysMap.set(key, holiday);
        });
      
    } catch (error) {
      console.error(`Error fetching public holidays for ${year}:`, error);
    }
  }
  
  return holidaysMap;
}

// Sync public holidays
async function syncPublicHolidays(yearsAhead: number = 5): Promise<SyncResult> {
  const stats = {
    added: 0,
    updated: 0,
    deleted: 0,
    unchanged: 0,
    total: 0
  };
  const errors: string[] = [];
  
  try {
    const currentYear = getYear(new Date());
    const years = Array.from({ length: yearsAhead + 1 }, (_, i) => currentYear + i);
    
    // Fetch holidays from external API
    console.log('🎉 Fetching public holidays from external API...');
    const externalHolidays = await fetchHolidaysFromAPI(currentYear, yearsAhead);
    
    // Fetch existing public holidays from Firestore
    console.log('📚 Fetching existing public holidays from Firestore...');
    const eventsSnapshot = await adminDb!.collection('events')
      .where('source', '==', 'public_holiday')
      .get();
    
    const existingHolidays = new Map<string, { id: string; date: string; name: string }>();
    eventsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const dateStr = data.date.toDate().toISOString().split('T')[0];
      const key = `${dateStr}-${data.name}`;
      existingHolidays.set(key, {
        id: doc.id,
        date: dateStr,
        name: data.name
      });
    });
    
    console.log(`Found ${externalHolidays.size} holidays from API, ${existingHolidays.size} existing in Firestore`);
    
    // Add or update holidays
    for (const [key, holiday] of externalHolidays.entries()) {
      try {
        const existing = existingHolidays.get(key);
        
        const eventData = {
          name: holiday.localName,
          date: new Date(holiday.date),
          clubId: null,
          zoneId: null,
          eventTypeId: 'ph',
          status: 'public_holiday',
          location: 'Victoria',
          source: 'public_holiday',
          updatedAt: new Date(),
          isQualifier: false,
          requiresApproval: false
        };
        
        if (existing) {
          // Update existing
          await adminDb!.collection('events').doc(existing.id).update(eventData);
          stats.updated++;
          existingHolidays.delete(key); // Mark as processed
        } else {
          // Add new
          await adminDb!.collection('events').add({
            ...eventData,
            createdAt: new Date()
          });
          stats.added++;
        }
        
        stats.total++;
      } catch (error) {
        const errMsg = `Error processing holiday ${holiday.localName}: ${error}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }
    
    // Delete holidays that no longer exist in the external API
    for (const [key, existing] of existingHolidays.entries()) {
      try {
        await adminDb!.collection('events').doc(existing.id).delete();
        stats.deleted++;
        console.log(`Deleted outdated holiday: ${existing.name} (${existing.date})`);
      } catch (error) {
        const errMsg = `Error deleting holiday ${existing.name}: ${error}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }
    
    // Update metadata
    await updateSyncMetadata(true, stats.total, years);
    
    // Invalidate events cache
    invalidateEventsCache();
    
    console.log(`✅ Sync complete: ${stats.added} added, ${stats.updated} updated, ${stats.deleted} deleted`);
    
    return {
      success: true,
      message: `Successfully synced ${stats.total} public holidays`,
      stats,
      lastSyncDate: new Date(),
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    console.error('Error syncing public holidays:', error);
    await updateSyncMetadata(false, 0, []);
    
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// POST: Sync public holidays
export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const forceSync = body.force === true;
    const yearsAhead = body.yearsAhead || 5;
    
    // Check if sync is needed
    const { should, lastSync } = await shouldSync(forceSync);
    
    if (!should && lastSync) {
      const daysSinceSync = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
      return NextResponse.json({
        success: false,
        message: `Sync not needed. Last sync was ${daysSinceSync} days ago. Use force=true to override.`,
        lastSyncDate: lastSync,
        stats: { added: 0, updated: 0, deleted: 0, unchanged: 0, total: 0 }
      }, { status: 200 });
    }
    
    console.log('🚀 Starting public holiday sync...', { forceSync, yearsAhead });
    const result = await syncPublicHolidays(yearsAhead);
    
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
    
  } catch (error) {
    console.error('Error in sync-public-holidays API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Check sync status
export async function GET() {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const metadataDoc = await adminDb.collection('system_metadata').doc('public_holidays_sync').get();
    
    if (!metadataDoc.exists) {
      return NextResponse.json({
        synced: false,
        message: 'No sync has been performed yet'
      });
    }

    const metadata = metadataDoc.data() as SyncMetadata;
    const lastSync = metadata.lastSyncDate instanceof Date 
      ? metadata.lastSyncDate 
      : metadata.lastSyncDate.toDate();
    const daysSinceSync = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
    const needsSync = daysSinceSync >= 7;
    
    return NextResponse.json({
      synced: true,
      lastSyncDate: lastSync,
      daysSinceSync,
      needsSync,
      lastSyncSuccess: metadata.lastSyncSuccess,
      holidaysCount: metadata.holidaysCount,
      yearsSync: metadata.yearsSync
    });
    
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}
