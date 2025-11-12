import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { bucket, adminDb } from '@/lib/firebase-admin';
import { Event, Club, Zone, EventType } from '@/lib/types';
import { createHash } from 'crypto';
import { invalidateEventsCache } from '@/lib/server-data';

interface ImportConfig {
  eventTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  dryRun: boolean;
  validateManifest: boolean;
  allowDuplicates: boolean;
  skipSchedules: boolean;
}

interface ConflictItem {
  id: string;
  type: 'duplicate_id' | 'duplicate_name' | 'date_conflict' | 'club_missing' | 'type_missing';
  severity: 'high' | 'medium' | 'low';
  existing: any;
  imported: any;
  resolution: 'skip' | 'overwrite' | 'rename' | 'merge' | null;
  message: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  conflicts: ConflictItem[];
  schedulesUploaded: number;
}

interface ManifestData {
  version: string;
  exportDate: string;
  totalEvents: number;
  files: Array<{
    name: string;
    size: number;
    checksum: string;
  }>;
  metadata: {
    exportedBy: string;
    appVersion: string;
    includesSchedules: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configStr = formData.get('config') as string;
    const conflictsStr = formData.get('conflicts') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    const config: ImportConfig = JSON.parse(configStr);
    const resolvedConflicts: ConflictItem[] = conflictsStr ? JSON.parse(conflictsStr) : [];

    // Read and parse ZIP file
    const arrayBuffer = await file.arrayBuffer();
    const zip = new JSZip();
    const archive = await zip.loadAsync(arrayBuffer);

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      conflicts: [],
      schedulesUploaded: 0
    };

    // Validate manifest if required
    if (config.validateManifest && archive.files['manifest.json']) {
      try {
        const manifestStr = await archive.files['manifest.json'].async('string');
        const manifest: ManifestData = JSON.parse(manifestStr);
        
        // Check version compatibility
        if (manifest.version !== '1.0') {
          result.errors.push(`Incompatible export version: ${manifest.version}`);
          return NextResponse.json({
            success: false,
            details: 'Version incompatibility detected',
            result
          }, { status: 400 });
        }

        // Validate file checksums
        for (const fileInfo of manifest.files) {
          if (archive.files[fileInfo.name]) {
            const fileContent = await archive.files[fileInfo.name].async('uint8array');
            const hash = createHash('sha256').update(fileContent).digest('hex');
            
            if (hash !== fileInfo.checksum) {
              result.errors.push(`Checksum mismatch for ${fileInfo.name}`);
            }
          }
        }

        if (result.errors.length > 0) {
          return NextResponse.json({
            success: false,
            details: 'File integrity validation failed',
            result
          }, { status: 400 });
        }
      } catch (error) {
        result.errors.push('Failed to validate manifest');
        return NextResponse.json({
          success: false,
          details: 'Manifest validation error',
          result
        }, { status: 400 });
      }
    }

    // Check required files
    const requiredFiles = ['events.json', 'clubs.json', 'zones.json', 'event-types.json'];
    for (const requiredFile of requiredFiles) {
      if (!archive.files[requiredFile]) {
        result.errors.push(`Missing required file: ${requiredFile}`);
      }
    }

    if (result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        details: 'Required files missing',
        result
      }, { status: 400 });
    }

    // Parse data files
    const eventsStr = await archive.files['events.json'].async('string');
    const clubsStr = await archive.files['clubs.json'].async('string');
    const zonesStr = await archive.files['zones.json'].async('string');
    const eventTypesStr = await archive.files['event-types.json'].async('string');

    const importData = {
      events: JSON.parse(eventsStr) as Event[],
      clubs: JSON.parse(clubsStr) as Club[],
      zones: JSON.parse(zonesStr) as Zone[],
      eventTypes: JSON.parse(eventTypesStr) as EventType[]
    };

    // If dry run, just return statistics without making changes
    if (config.dryRun) {
      result.imported = importData.events.length;
      result.conflicts = resolvedConflicts;
      
      return NextResponse.json({
        success: true,
        details: 'Dry run completed - no changes made',
        result
      });
    }

    // Get existing data for conflict detection
    const existingEvents = await adminDb.collection('events').get();
    const existingEventsMap = new Map();
    existingEvents.forEach((doc: any) => {
      existingEventsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Prepare batch operations - use admin SDK for server-side operations
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        details: 'Database connection not available',
        result: { ...result, errors: ['Database connection not configured'] }
      }, { status: 500 });
    }

    let batch = adminDb.batch();
    let operationCount = 0;

    // Import zones first (dependencies)
    for (const zone of importData.zones) {
      const zoneRef = adminDb.collection('zones').doc(zone.id);
      batch.set(zoneRef, zone);
      operationCount++;
    }

    // Import clubs
    for (const club of importData.clubs) {
      const clubRef = adminDb.collection('clubs').doc(club.id);
      batch.set(clubRef, club);
      operationCount++;
    }

    // Import event types
    for (const eventType of importData.eventTypes) {
      const eventTypeRef = adminDb.collection('event-types').doc(eventType.id);
      batch.set(eventTypeRef, eventType);
      operationCount++;
    }

    // Import events with conflict resolution
    for (const event of importData.events) {
      const conflict = resolvedConflicts.find(c => 
        c.imported.id === event.id || c.imported.name === event.name
      );

      if (conflict) {
        switch (conflict.resolution) {
          case 'skip':
            result.skipped++;
            continue;
          
          case 'overwrite':
            // Use existing ID but imported data
            const eventRef = adminDb.collection('events').doc(conflict.existing.id);
            batch.set(eventRef, { ...event, id: conflict.existing.id });
            operationCount++;
            break;
          
          case 'rename':
            // Generate new ID for imported event
            const newId = `${event.id}_imported_${Date.now()}`;
            const newEventRef = adminDb.collection('events').doc(newId);
            batch.set(newEventRef, { ...event, id: newId, name: `${event.name} (Imported)` });
            operationCount++;
            break;
          
          default:
            result.skipped++;
            continue;
        }
      } else {
        // No conflict, import as-is
        const eventRef = adminDb.collection('events').doc(event.id);
        batch.set(eventRef, event);
        operationCount++;
      }

      result.imported++;

      // Firestore has a limit of 500 operations per batch
      if (operationCount >= 450) {
        await batch.commit();
        // Create new batch
        batch = adminDb.batch();
        operationCount = 0;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
    }
    
    // Invalidate the events cache after bulk import
    invalidateEventsCache();

    // Upload schedule files if not skipped
    if (!config.skipSchedules) {
      const scheduleFiles = Object.keys(archive.files).filter(name => 
        name.startsWith('schedules/') && !name.endsWith('/')
      );

      for (const fileName of scheduleFiles) {
        try {
          const fileContent = await archive.files[fileName].async('uint8array');
          const storagePath = `schedules/${fileName.replace('schedules/', '')}`;
          
          const file = bucket.file(storagePath);
          await file.save(Buffer.from(fileContent), {
            metadata: {
              contentType: 'application/pdf'
            }
          });
          
          result.schedulesUploaded++;
        } catch (error) {
          result.errors.push(`Failed to upload ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      details: `Import completed: ${result.imported} events imported, ${result.skipped} skipped, ${result.schedulesUploaded} schedules uploaded`,
      result
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      result: {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        conflicts: [],
        schedulesUploaded: 0
      }
    }, { status: 500 });
  }
}
