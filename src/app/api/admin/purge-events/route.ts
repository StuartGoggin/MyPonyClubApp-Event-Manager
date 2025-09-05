import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Event, Club, Zone } from '@/lib/types';
import { getAllEvents, getAllClubs, getAllZones, deleteEvent, deleteEventsBatch } from '@/lib/server-data';
import { createHash } from 'crypto';

interface PurgeConfig {
  dryRun: boolean;
  requireConfirmation: boolean;
  filterByZone: string[];
  filterByClub: string[];
  filterByDateRange: {
    start: string;
    end: string;
  };
  skipScheduleFiles: boolean;
  createBackup: boolean;
}

interface MatchedEvent {
  id: string;
  name: string;
  date: string;
  club: string;
  zone: string;
  status: string;
  matchType: 'exact' | 'near' | 'partial';
  confidence: number;
  dbEvent?: Event;
  archiveEvent?: any;
}

interface ArchiveAnalysis {
  totalEvents: number;
  dateRange: { start: string; end: string };
  zones: string[];
  clubs: string[];
  eventTypes: string[];
  hasManifest: boolean;
  manifestVersion: string;
  checksumValid: boolean;
}

interface PurgeResult {
  success: boolean;
  totalMatched: number;
  deleted: number;
  skipped: number;
  errors: string[];
  backupCreated?: string;
  purgeTime: number;
  summary: {
    byZone: { [zone: string]: number };
    byClub: { [club: string]: number };
    byStatus: { [status: string]: number };
    byMatchType: { [type: string]: number };
  };
}

// Event matching algorithms
function calculateEventMatch(dbEvent: Event, archiveEvent: any, clubs: Club[], zones: Zone[]): MatchedEvent | null {
  let confidence = 0;
  let matchType: 'exact' | 'near' | 'partial' = 'partial';

  // Exact ID match (highest confidence)
  if (dbEvent.id === archiveEvent.id) {
    confidence += 40;
  }

  // Name similarity
  const nameSimilarity = calculateStringSimilarity(dbEvent.name.toLowerCase(), archiveEvent.name.toLowerCase());
  confidence += nameSimilarity * 25;

  // Date match
  if (dbEvent.date === archiveEvent.date) {
    confidence += 20;
  } else {
    const dateDiff = Math.abs(new Date(dbEvent.date).getTime() - new Date(archiveEvent.date).getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    if (daysDiff <= 1) confidence += 15;
    else if (daysDiff <= 7) confidence += 10;
  }

  // Club match
  if (dbEvent.clubId === archiveEvent.clubId) {
    confidence += 10;
  }

  // Event type match
  if (dbEvent.eventTypeId === archiveEvent.eventTypeId) {
    confidence += 5;
  }

  // Determine match type based on confidence
  if (confidence >= 80) matchType = 'exact';
  else if (confidence >= 60) matchType = 'near';
  else if (confidence < 40) return null; // Too low confidence

  const club = clubs.find(c => c.id === dbEvent.clubId);
  const zone = zones.find(z => z.id === club?.zoneId);

  return {
    id: dbEvent.id,
    name: dbEvent.name,
    date: dbEvent.date instanceof Date ? dbEvent.date.toISOString().split('T')[0] : dbEvent.date,
    club: club?.name || 'Unknown',
    zone: zone?.name || 'Unknown',
    status: dbEvent.status,
    matchType,
    confidence: Math.round(confidence),
    dbEvent,
    archiveEvent
  };
}

function calculateStringSimilarity(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  return maxLength === 0 ? 1 : 1 - (matrix[b.length][a.length] / maxLength);
}

async function analyzeArchive(zipBuffer: Buffer): Promise<{
  analysis: ArchiveAnalysis;
  matches: MatchedEvent[];
}> {
  const zip = new JSZip();
  const zipContents = await zip.loadAsync(zipBuffer);

  // Extract events from archive
  const eventsFile = zipContents.file('events.json');
  if (!eventsFile) {
    throw new Error('events.json not found in archive');
  }

  const eventsContent = await eventsFile.async('string');
  const archiveEvents = JSON.parse(eventsContent);

  // Extract other data files
  const clubsFile = zipContents.file('clubs.json');
  const zonesFile = zipContents.file('zones.json');
  const manifestFile = zipContents.file('manifest.json');

  let archiveClubs: Club[] = [];
  let archiveZones: Zone[] = [];
  let manifest: any = null;

  if (clubsFile) {
    const clubsContent = await clubsFile.async('string');
    archiveClubs = JSON.parse(clubsContent);
  }

  if (zonesFile) {
    const zonesContent = await zonesFile.async('string');
    archiveZones = JSON.parse(zonesContent);
  }

  if (manifestFile) {
    const manifestContent = await manifestFile.async('string');
    manifest = JSON.parse(manifestContent);
  }

  // Validate checksum if available
  let checksumValid = true;
  if (manifest && manifest.checksum) {
    const calculatedChecksum = createHash('sha256').update(eventsContent).digest('hex');
    checksumValid = calculatedChecksum === manifest.checksum;
  }

  // Analyze archive contents
  const dateRange = archiveEvents.reduce((range: any, event: any) => {
    const eventDate = event.date;
    return {
      start: !range.start || eventDate < range.start ? eventDate : range.start,
      end: !range.end || eventDate > range.end ? eventDate : range.end
    };
  }, {});

  const analysis: ArchiveAnalysis = {
    totalEvents: archiveEvents.length,
    dateRange,
    zones: [...new Set(archiveZones.map(z => z.name))],
    clubs: [...new Set(archiveClubs.map(c => c.name))],
    eventTypes: [...new Set(archiveEvents.map((e: any) => e.eventTypeId).filter(Boolean))] as string[],
    hasManifest: !!manifest,
    manifestVersion: manifest?.version || 'unknown',
    checksumValid
  };

  // Get current database events for matching
  const [dbEvents, dbClubs, dbZones] = await Promise.all([
    getAllEvents(),
    getAllClubs(),
    getAllZones()
  ]);

  // Find matches
  const matches: MatchedEvent[] = [];
  
  for (const dbEvent of dbEvents) {
    for (const archiveEvent of archiveEvents) {
      const match = calculateEventMatch(dbEvent, archiveEvent, dbClubs, dbZones);
      if (match) {
        // Check if we already have a better match for this database event
        const existingMatch = matches.find(m => m.id === match.id);
        if (!existingMatch || match.confidence > existingMatch.confidence) {
          if (existingMatch) {
            const index = matches.indexOf(existingMatch);
            matches[index] = match;
          } else {
            matches.push(match);
          }
        }
      }
    }
  }

  return { analysis, matches };
}

async function createBackup(events: Event[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-before-purge-${timestamp}.json`;
  
  // In a real implementation, you'd save this to a backup location
  // For now, we'll just return the filename that would be created
  const backupData = {
    timestamp,
    eventCount: events.length,
    events: events
  };
  
  // TODO: Save backup to secure location (file system, cloud storage, etc.)
  console.log(`Backup would be created: ${backupFilename} with ${events.length} events`);
  
  return backupFilename;
}

async function performPurge(matches: MatchedEvent[], config: PurgeConfig): Promise<PurgeResult> {
  const startTime = Date.now();
  let deleted = 0;
  let skipped = 0;
  const errors: string[] = [];
  let backupCreated: string | undefined;

  const summary = {
    byZone: {} as { [zone: string]: number },
    byClub: {} as { [club: string]: number },
    byStatus: {} as { [status: string]: number },
    byMatchType: {} as { [type: string]: number }
  };

  // Apply filters
  let filteredMatches = matches;

  if (config.filterByZone.length > 0) {
    filteredMatches = filteredMatches.filter(m => config.filterByZone.includes(m.zone));
  }

  if (config.filterByClub.length > 0) {
    filteredMatches = filteredMatches.filter(m => config.filterByClub.includes(m.club));
  }

  if (config.filterByDateRange.start || config.filterByDateRange.end) {
    filteredMatches = filteredMatches.filter(m => {
      const eventDate = new Date(m.date);
      const inRange = (!config.filterByDateRange.start || eventDate >= new Date(config.filterByDateRange.start)) &&
                     (!config.filterByDateRange.end || eventDate <= new Date(config.filterByDateRange.end));
      return inRange;
    });
  }

  // Create backup if requested
  if (config.createBackup && !config.dryRun) {
    try {
      const eventsToBackup = filteredMatches.map(m => m.dbEvent!);
      backupCreated = await createBackup(eventsToBackup);
    } catch (error: any) {
      errors.push(`Backup creation failed: ${error.message}`);
    }
  }

  // Process deletions in batches
  console.log(`Processing ${filteredMatches.length} events for ${config.dryRun ? 'simulation' : 'deletion'}`);

  // Update summary statistics
  for (const match of filteredMatches) {
    summary.byZone[match.zone] = (summary.byZone[match.zone] || 0) + 1;
    summary.byClub[match.club] = (summary.byClub[match.club] || 0) + 1;
    summary.byStatus[match.status] = (summary.byStatus[match.status] || 0) + 1;
    summary.byMatchType[match.matchType] = (summary.byMatchType[match.matchType] || 0) + 1;
  }

  if (config.dryRun) {
    // Simulate deletion - no actual database operations
    deleted = filteredMatches.length;
    console.log(`Dry run: would delete ${deleted} events`);
  } else {
    // Actual deletion using batch operations
    const eventIds = filteredMatches.map(match => match.id);
    const { success, failed } = await deleteEventsBatch(eventIds);
    
    deleted = success.length;
    skipped = failed.length;
    
    // Add errors for failed deletions
    for (const failedId of failed) {
      const failedMatch = filteredMatches.find(m => m.id === failedId);
      errors.push(`Failed to delete event: ${failedMatch?.name || failedId}`);
    }
    
    console.log(`Batch deletion completed: ${deleted} deleted, ${skipped} failed`);
  }

  return {
    success: true,
    totalMatched: filteredMatches.length,
    deleted,
    skipped,
    errors,
    backupCreated,
    purgeTime: Date.now() - startTime,
    summary
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operation = formData.get('operation') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        details: 'No file provided'
      }, { status: 400 });
    }

    const zipBuffer = Buffer.from(await file.arrayBuffer());

    if (operation === 'analyze') {
      // Analyze the archive and find matches
      const { analysis, matches } = await analyzeArchive(zipBuffer);

      return NextResponse.json({
        success: true,
        analysis,
        matches
      });

    } else if (operation === 'purge') {
      // Perform the actual purge operation
      const configString = formData.get('config') as string;
      const config: PurgeConfig = JSON.parse(configString);

      // First analyze to get matches
      const { matches } = await analyzeArchive(zipBuffer);

      // Then perform purge
      const result = await performPurge(matches, config);

      return NextResponse.json({
        success: true,
        result
      });

    } else {
      return NextResponse.json({
        success: false,
        details: 'Invalid operation'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Purge operation error:', error);
    return NextResponse.json({
      success: false,
      details: error.message || 'An unknown error occurred'
    }, { status: 500 });
  }
}
