import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';
import type { Event, EventType } from '@/lib/types';

interface EVEventData {
  name: string;
  discipline: string;
  location: string;
  start_date: string;  // DD/MM/YYYY format
  end_date: string;    // DD/MM/YYYY format
  url?: string;
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

// Parse DD/MM/YYYY format to Date
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

// Find or create event type for discipline
async function getOrCreateEventType(discipline: string): Promise<string> {
  if (!adminDb) throw new Error('Database not connected');

  // Normalize discipline name
  const normalizedDiscipline = discipline.trim();
  
  // Search for existing event type
  const snapshot = await adminDb
    .collection('event_types')
    .where('name', '==', normalizedDiscipline)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  // Create new event type
  const docRef = await adminDb.collection('event_types').add({
    name: normalizedDiscipline
  });

  console.log(`Created new event type: ${normalizedDiscipline}`);
  return docRef.id;
}

// Sync EV events from JSON data
async function syncEVEvents(eventsData: EVEventData[]): Promise<SyncResult> {
  if (!adminDb || !isDatabaseConnected()) {
    throw new Error('Database not connected');
  }

  const result: SyncResult = {
    success: false,
    message: '',
    stats: { added: 0, updated: 0, deleted: 0, unchanged: 0, total: 0 },
    errors: []
  };

  try {
    // Get existing EV events
    const existingEventsSnapshot = await adminDb
      .collection('events')
      .where('source', '==', 'equestrian_victoria')
      .get();

    const existingEvents = new Map<string, any>();
    existingEventsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      // Create key from name + start date
      const key = `${data.name}_${new Date(data.date.toDate()).toISOString().split('T')[0]}`;
      existingEvents.set(key, { id: doc.id, ...data });
    });

    const processedKeys = new Set<string>();

    // Process each EV event from JSON
    for (const evEvent of eventsData) {
      try {
        const startDate = parseDate(evEvent.start_date);
        const eventKey = `${evEvent.name}_${startDate.toISOString().split('T')[0]}`;
        
        // Get event type ID
        const eventTypeId = await getOrCreateEventType(evEvent.discipline);

        // Prepare event data
        const eventData: Partial<Event> = {
          name: evEvent.name,
          date: startDate,
          eventTypeId: eventTypeId,
          location: evEvent.location,
          source: 'equestrian_victoria',
          status: 'approved', // EV events are pre-approved
          description: evEvent.url ? `More info: ${evEvent.url}` : '',
          // No clubId or zoneId for state-level events
        };

        const existingEvent = existingEvents.get(eventKey);

        if (existingEvent) {
          // Check if update needed
          const needsUpdate = 
            existingEvent.name !== eventData.name ||
            existingEvent.location !== eventData.location ||
            existingEvent.eventTypeId !== eventData.eventTypeId;

          if (needsUpdate) {
            await adminDb.collection('events').doc(existingEvent.id).update({
              ...eventData,
              updatedAt: new Date()
            });
            result.stats.updated++;
            console.log(`Updated EV event: ${evEvent.name}`);
          } else {
            result.stats.unchanged++;
          }

          processedKeys.add(eventKey);
        } else {
          // Add new event
          await adminDb.collection('events').add({
            ...eventData,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          result.stats.added++;
          console.log(`Added new EV event: ${evEvent.name}`);
        }

        result.stats.total++;
      } catch (error) {
        console.error(`Error processing event ${evEvent.name}:`, error);
        result.errors?.push(`Failed to process ${evEvent.name}: ${error}`);
      }
    }

    // Delete events that are no longer in the source
    for (const [key, event] of existingEvents.entries()) {
      if (!processedKeys.has(key)) {
        await adminDb.collection('events').doc(event.id).delete();
        result.stats.deleted++;
        console.log(`Deleted outdated EV event: ${event.name}`);
      }
    }

    // Update sync metadata
    await adminDb.collection('system_metadata').doc('ev_events_sync').set({
      lastSyncDate: new Date(),
      lastSyncSuccess: true,
      eventsCount: result.stats.total,
      stats: result.stats
    }, { merge: true });

    result.success = true;
    result.message = `Synced ${result.stats.total} EV events (${result.stats.added} added, ${result.stats.updated} updated, ${result.stats.deleted} deleted, ${result.stats.unchanged} unchanged)`;
    result.lastSyncDate = new Date();

    return result;
  } catch (error) {
    console.error('Error syncing EV events:', error);
    result.success = false;
    result.message = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

// POST: Sync EV events from JSON
export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected { events: [...] }' },
        { status: 400 }
      );
    }

    console.log(`🏇 Starting EV events sync with ${body.events.length} events...`);
    const result = await syncEVEvents(body.events as EVEventData[]);
    
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

// GET: Check sync status
export async function GET() {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const metadataDoc = await adminDb.collection('system_metadata').doc('ev_events_sync').get();
    
    if (!metadataDoc.exists) {
      return NextResponse.json({
        synced: false,
        message: 'No sync has been performed yet'
      });
    }

    const metadata = metadataDoc.data();
    const lastSync = metadata?.lastSyncDate?.toDate ? metadata.lastSyncDate.toDate() : metadata?.lastSyncDate;
    const daysSinceSync = lastSync ? Math.floor((Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    return NextResponse.json({
      synced: true,
      lastSyncDate: lastSync,
      daysSinceSync,
      lastSyncSuccess: metadata?.lastSyncSuccess,
      eventsCount: metadata?.eventsCount,
      stats: metadata?.stats
    });
    
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
