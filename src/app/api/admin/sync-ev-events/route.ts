import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';
import { invalidateEventsCache } from '@/lib/server-data';
import { getYear } from 'date-fns';

interface EvEvent {
  name: string;
  url: string;
  start_date: string;
  end_date: string;
  discipline: string | null;
  location: string;
  latitude?: number;
  longitude?: number;
  tier: string | null;
  description: string | null;
}

interface SyncConfig {
  disciplines: string[];
  yearsAhead: number;
  syncIntervalDays: number;
  isActive: boolean;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
}

interface SyncMetadata {
  lastSyncDate: Date | { toDate: () => Date };
  lastSyncSuccess: boolean;
  eventsCount: number;
  yearsSync: number[];
  disciplinesSync: string[];
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

// Check if sync is needed based on config
async function shouldSync(forceSync: boolean = false): Promise<{ should: boolean; lastSync?: Date; config?: SyncConfig }> {
  try {
    // Get sync configuration
    const configDoc = await adminDb!.collection('system_config').doc('ev_events_sync').get();
    
    if (!configDoc.exists) {
      return { should: false }; // No configuration yet
    }

    const config = configDoc.data() as SyncConfig;
    
    // If force sync, return config but mark as should sync
    if (forceSync) {
      return { should: true, config };
    }
    
    if (!config.isActive) {
      return { should: false, config }; // Sync is disabled
    }

    // Check last sync date
    const metadataDoc = await adminDb!.collection('system_metadata').doc('ev_events_sync').get();
    
    if (!metadataDoc.exists) {
      return { should: true, config }; // Never synced before
    }

    const metadata = metadataDoc.data() as SyncMetadata;
    const lastSync = metadata.lastSyncDate instanceof Date 
      ? metadata.lastSyncDate 
      : metadata.lastSyncDate.toDate();
    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      should: daysSinceSync >= config.syncIntervalDays,
      lastSync,
      config
    };
  } catch (error) {
    console.error('Error checking sync metadata:', error);
    return { should: false }; // Don't sync if we can't check
  }
}

// Update sync metadata
async function updateSyncMetadata(
  success: boolean, 
  eventsCount: number, 
  years: number[], 
  disciplines: string[]
): Promise<void> {
  try {
    await adminDb!.collection('system_metadata').doc('ev_events_sync').set({
      lastSyncDate: new Date(),
      lastSyncSuccess: success,
      eventsCount,
      yearsSync: years,
      disciplinesSync: disciplines,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating sync metadata:', error);
  }
}

// Fetch events from scraper Cloud Function
async function fetchEventsFromScraper(
  year: number, 
  disciplines: string[]
): Promise<EvEvent[]> {
  try {
    const disciplinesParam = disciplines.length > 0 ? `&disciplines=${disciplines.join(',')}` : '';
    const url = `https://scrapeequestrianevents-gt54xuwvaq-de.a.run.app?year=${year}${disciplinesParam}`;
    
    console.log(`Fetching events from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch EV events for ${year}:`, response.statusText);
      return [];
    }
    
    const result = await response.json();
    
    if (!result.success || !result.events) {
      console.warn(`Invalid response for ${year}:`, result);
      return [];
    }
    
    return result.events;
    
  } catch (error) {
    console.error(`Error fetching EV events for ${year}:`, error);
    return [];
  }
}

// Convert DD/MM/YYYY to Date object
function parseEvDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

// Sync EV events
async function syncEvEvents(config: SyncConfig): Promise<SyncResult> {
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
    const years = Array.from({ length: config.yearsAhead + 1 }, (_, i) => currentYear + i);
    
    console.log('🎪 Fetching EV events from scraper...');
    console.log(`Years: ${years.join(', ')}`);
    console.log(`Disciplines: ${config.disciplines.join(', ') || 'all'}`);
    
    // Fetch events from scraper for all years
    const eventsPromises = years.map(year => fetchEventsFromScraper(year, config.disciplines));
    const eventsArrays = await Promise.all(eventsPromises);
    const externalEvents = eventsArrays.flat();
    
    console.log(`🎪 Fetched ${externalEvents.length} events from scraper`);
    console.log(`📊 Events breakdown by year:`, eventsArrays.map((arr, i) => `${years[i]}: ${arr.length}`).join(', '));
    if (externalEvents.length > 0) {
      console.log(`📝 Sample event:`, JSON.stringify(externalEvents[0], null, 2));
    }
    
    // Create a map of external events by unique key (URL|start_date)
    const externalEventsMap = new Map<string, EvEvent>();
    externalEvents.forEach(event => {
      const key = `${event.url}|${event.start_date}`;
      externalEventsMap.set(key, event);
    });
    
    // Fetch existing EV events from Firestore
    console.log('📚 Fetching existing EV events from Firestore...');
    const eventsSnapshot = await adminDb!.collection('events')
      .where('source', '==', 'ev_scraper')
      .get();
    
    const existingEvents = new Map<string, { id: string; url: string; start_date: string }>();
    eventsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const startDate = data.date.toDate();
      const dateStr = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}/${startDate.getFullYear()}`;
      const key = `${data.eventLink || data.url}|${dateStr}`;
      existingEvents.set(key, {
        id: doc.id,
        url: data.eventLink || data.url || '',
        start_date: dateStr
      });
    });
    
    console.log(`Found ${externalEventsMap.size} events from scraper, ${existingEvents.size} existing in Firestore`);
    
    // Add or update events
    for (const [key, event] of externalEventsMap.entries()) {
      try {
        const existing = existingEvents.get(key);
        const eventDate = parseEvDate(event.start_date);
        
        // Use a generic event type ID for EV events since disciplines don't map to our event types
        // The discipline is stored separately in the discipline field
        const eventData = {
          name: event.name,
          date: eventDate,
          eventLink: event.url,
          description: event.description || (event.tier ? `Tier: ${event.tier}` : null),
          clubId: null,
          zoneId: null,
          eventTypeId: 'ev_event', // Generic EV event type
          status: 'ev_event' as const,
          location: event.location,
          latitude: event.latitude || null,
          longitude: event.longitude || null,
          source: 'ev_scraper' as const,
          discipline: event.discipline,
          tier: event.tier,
          updatedAt: new Date(),
          isQualifier: false,
          requiresApproval: false
        };

        console.log(`📝 Creating/updating event with source: ${eventData.source}, status: ${eventData.status}`);
        
        if (existing) {
          // Update existing
          await adminDb!.collection('events').doc(existing.id).update(eventData);
          stats.updated++;
          existingEvents.delete(key); // Mark as processed
          console.log(`✏️  Updated event: ${event.name} (${event.start_date})`);
        } else {
          // Add new
          const docRef = await adminDb!.collection('events').add({
            ...eventData,
            createdAt: new Date()
          });
          stats.added++;
          console.log(`➕ Added new event: ${event.name} (${event.start_date}) with ID: ${docRef.id}`);
        }
        
        stats.total++;
      } catch (error) {
        const errMsg = `Error processing event ${event.name}: ${error}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }
    
    // Delete events that no longer exist in the external source
    for (const [key, existing] of existingEvents.entries()) {
      try {
        await adminDb!.collection('events').doc(existing.id).delete();
        stats.deleted++;
        console.log(`Deleted outdated event: ${key}`);
      } catch (error) {
        const errMsg = `Error deleting event ${key}: ${error}`;
        console.error(errMsg);
        errors.push(errMsg);
      }
    }
    
    // Update metadata
    await updateSyncMetadata(true, stats.total, years, config.disciplines);
    
    // Invalidate events cache
    invalidateEventsCache();
    
    console.log(`✅ Sync complete: ${stats.added} added, ${stats.updated} updated, ${stats.deleted} deleted`);
    
    return {
      success: true,
      message: `Successfully synced ${stats.total} EV events`,
      stats,
      lastSyncDate: new Date(),
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    console.error('Error syncing EV events:', error);
    await updateSyncMetadata(false, 0, [], []);
    
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// POST: Sync EV events
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
    
    console.log('🔍 Sync request:', { forceSync, body });
    
    // Check if sync is needed
    const { should, lastSync, config } = await shouldSync(forceSync);
    
    console.log('📋 Sync check result:', { should, hasConfig: !!config, configActive: config?.isActive });
    
    if (!config) {
      console.warn('⚠️  No sync configuration found');
      return NextResponse.json({
        success: false,
        message: 'Sync configuration not found. Please configure sync settings first.',
        stats: { added: 0, updated: 0, deleted: 0, unchanged: 0, total: 0 }
      }, { status: 400 });
    }
    
    if (!should && lastSync) {
      const daysSinceSync = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
      return NextResponse.json({
        success: false,
        message: `Sync not needed. Last sync was ${daysSinceSync} days ago (interval: ${config.syncIntervalDays} days). Use force=true to override.`,
        lastSyncDate: lastSync,
        stats: { added: 0, updated: 0, deleted: 0, unchanged: 0, total: 0 }
      }, { status: 200 });
    }
    
    console.log('🚀 Starting EV events sync...', { forceSync, config });
    const result = await syncEvEvents(config);
    
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
    
  } catch (error) {
    console.error('Error in sync-ev-events API:', error);
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

// GET: Check sync status and configuration
export async function GET() {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    // Get configuration
    const configDoc = await adminDb.collection('system_config').doc('ev_events_sync').get();
    const config = configDoc.exists ? configDoc.data() as SyncConfig : null;

    // Get metadata
    const metadataDoc = await adminDb.collection('system_metadata').doc('ev_events_sync').get();
    
    if (!metadataDoc.exists) {
      return NextResponse.json({
        synced: false,
        message: 'No sync has been performed yet',
        config
      });
    }

    const metadata = metadataDoc.data() as SyncMetadata;
    const lastSync = metadata.lastSyncDate instanceof Date 
      ? metadata.lastSyncDate 
      : metadata.lastSyncDate.toDate();
    const daysSinceSync = Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
    const needsSync = config && config.isActive ? daysSinceSync >= config.syncIntervalDays : false;
    
    return NextResponse.json({
      synced: true,
      lastSyncDate: lastSync,
      daysSinceSync,
      needsSync,
      lastSyncSuccess: metadata.lastSyncSuccess,
      eventsCount: metadata.eventsCount,
      yearsSync: metadata.yearsSync,
      disciplinesSync: metadata.disciplinesSync,
      config
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

// PUT: Update sync configuration
export async function PUT(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { disciplines, yearsAhead, syncIntervalDays, isActive } = body;

    console.log('📝 Received config update:', { disciplines, yearsAhead, syncIntervalDays, isActive });

    // Validate input
    if (!Array.isArray(disciplines)) {
      return NextResponse.json(
        { error: 'disciplines must be an array' },
        { status: 400 }
      );
    }

    if (typeof yearsAhead !== 'number' || yearsAhead < 1 || yearsAhead > 5) {
      return NextResponse.json(
        { error: 'yearsAhead must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    if (typeof syncIntervalDays !== 'number' || syncIntervalDays < 1 || syncIntervalDays > 30) {
      return NextResponse.json(
        { error: 'syncIntervalDays must be a number between 1 and 30' },
        { status: 400 }
      );
    }

    // Get existing config to check if it exists
    const configDoc = await adminDb.collection('system_config').doc('ev_events_sync').get();
    const now = new Date();

    const configData: any = {
      disciplines,
      yearsAhead,
      syncIntervalDays,
      isActive: isActive ?? true,
      updatedAt: now
    };

    if (!configDoc.exists) {
      configData.createdAt = now;
    }

    await adminDb.collection('system_config').doc('ev_events_sync').set(configData, { merge: true });

    console.log('✅ Configuration saved successfully:', configData);

    return NextResponse.json({
      success: true,
      message: 'Sync configuration updated successfully',
      config: configData
    });

  } catch (error) {
    console.error('Error updating sync configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update sync configuration' },
      { status: 500 }
    );
  }
}
