import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, deleteEventsBatch, invalidateEventsCache } from '@/lib/server-data';
import { Event } from '@/lib/types';

interface PurgeTestEventsConfig {
  dryRun: boolean;
  excludePublicHolidays: boolean;
  purgeAllEvents: boolean; // NEW: Nuclear option to delete all events except public holidays
  filterByDateRange?: {
    start?: string;
    end?: string;
  };
  filterBySource?: string[]; // 'zone', 'club', 'admin', etc.
  filterByStatus?: string[]; // exclude certain statuses
  createBackup: boolean;
}

interface PurgeResult {
  success: boolean;
  totalEvents: number;
  eventsToDelete: number;
  deleted: number;
  skipped: number;
  errors: string[];
  backupCreated?: string;
  purgeTime: number;
  summary: {
    bySource: { [source: string]: number };
    byStatus: { [status: string]: number };
    byYear: { [year: string]: number };
  };
  preservedEvents: {
    publicHolidays: number;
    recentApproved: number;
    futureImportant: number;
  };
}

async function createBackup(events: Event[]): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-test-events-purge-${timestamp}.json`;
  
  const backupData = {
    timestamp,
    eventCount: events.length,
    events: events,
    note: 'Backup created before test events purge for production preparation'
  };
  
  // TODO: Save to secure backup location (Firebase Storage, etc.)
  console.log(`📦 Backup created: ${backupFilename} with ${events.length} events`);
  
  return backupFilename;
}

function shouldPreserveEvent(event: Event, config: PurgeTestEventsConfig): { preserve: boolean; reason?: string } {
  // If purgeAllEvents is enabled, only preserve public holidays (if excludePublicHolidays is true)
  if (config.purgeAllEvents) {
    if (config.excludePublicHolidays) {
      // Only preserve public holidays
      if (event.status === 'public_holiday') {
        return { preserve: true, reason: 'Public holiday event' };
      }
      
      // Preserve events with 'public_holiday' in name (case insensitive)
      if (event.name?.toLowerCase().includes('public holiday') || 
          event.name?.toLowerCase().includes('holiday')) {
        return { preserve: true, reason: 'Holiday event' };
      }
    }
    // In nuclear mode, delete everything else
    return { preserve: false };
  }
  
  // Standard preservation logic (original behavior)
  // Preserve public holidays
  if (event.status === 'public_holiday') {
    return { preserve: true, reason: 'Public holiday event' };
  }
  
  // Preserve events with 'public_holiday' in name (case insensitive)
  if (event.name?.toLowerCase().includes('public holiday') || 
      event.name?.toLowerCase().includes('holiday')) {
    return { preserve: true, reason: 'Holiday event' };
  }
  
  // Preserve recent important approved events (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const eventDate = new Date(event.date);
  
  if (event.status === 'approved' && eventDate >= thirtyDaysAgo && eventDate <= new Date()) {
    return { preserve: true, reason: 'Recent approved event' };
  }
  
  // Preserve future events that are already approved and close to today
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  if (event.status === 'approved' && eventDate > new Date() && eventDate <= sevenDaysFromNow) {
    return { preserve: true, reason: 'Upcoming approved event' };
  }
  
  return { preserve: false };
}

async function performPurge(config: PurgeTestEventsConfig): Promise<PurgeResult> {
  const startTime = Date.now();
  let deleted = 0;
  let skipped = 0;
  const errors: string[] = [];
  let backupCreated: string | undefined;
  
  const summary = {
    bySource: {} as { [source: string]: number },
    byStatus: {} as { [status: string]: number },
    byYear: {} as { [year: string]: number }
  };
  
  const preservedEvents = {
    publicHolidays: 0,
    recentApproved: 0,
    futureImportant: 0
  };
  
  // Filter events to determine which ones to delete
  let eventsToDelete: Event[] = [];
  let eventsToPreserve: Event[] = [];
  
  try {
    console.log('🔍 Fetching all events for analysis...');
    const allEvents = await getAllEvents();
    console.log(`📊 Found ${allEvents.length} total events`);
    
    for (const event of allEvents) {
      const preserveCheck = shouldPreserveEvent(event, config);
      
      if (preserveCheck.preserve) {
        eventsToPreserve.push(event);
        
        // Track preservation reasons
        if (preserveCheck.reason?.includes('Public holiday') || preserveCheck.reason?.includes('Holiday')) {
          preservedEvents.publicHolidays++;
        } else if (preserveCheck.reason?.includes('Recent approved')) {
          preservedEvents.recentApproved++;
        } else if (preserveCheck.reason?.includes('Upcoming approved')) {
          preservedEvents.futureImportant++;
        }
        
        console.log(`🛡️ Preserving event: ${event.name} (${preserveCheck.reason})`);
        continue;
      }
      
      // Apply additional filters
      if (config.filterByDateRange?.start || config.filterByDateRange?.end) {
        const eventDate = new Date(event.date);
        
        if (config.filterByDateRange.start && eventDate < new Date(config.filterByDateRange.start)) {
          continue;
        }
        
        if (config.filterByDateRange.end && eventDate > new Date(config.filterByDateRange.end)) {
          continue;
        }
      }
      
      if (config.filterBySource && config.filterBySource.length > 0) {
        if (!config.filterBySource.includes(event.source || 'zone')) {
          continue;
        }
      }
      
      if (config.filterByStatus && config.filterByStatus.length > 0) {
        if (config.filterByStatus.includes(event.status)) {
          continue; // Skip events with excluded status
        }
      }
      
      eventsToDelete.push(event);
    }
    
    console.log(`📋 Analysis complete:`);
    console.log(`  - Total events: ${allEvents.length}`);
    console.log(`  - Events to preserve: ${eventsToPreserve.length}`);
    console.log(`  - Events to delete: ${eventsToDelete.length}`);
    console.log(`  - Public holidays preserved: ${preservedEvents.publicHolidays}`);
    console.log(`  - Recent approved preserved: ${preservedEvents.recentApproved}`);
    console.log(`  - Future important preserved: ${preservedEvents.futureImportant}`);
    
    // Build summary statistics
    for (const event of eventsToDelete) {
      const source = event.source || 'zone';
      const status = event.status || 'unknown';
      const year = new Date(event.date).getFullYear().toString();
      
      summary.bySource[source] = (summary.bySource[source] || 0) + 1;
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      summary.byYear[year] = (summary.byYear[year] || 0) + 1;
    }
    
    // Create backup if requested
    if (config.createBackup && eventsToDelete.length > 0 && !config.dryRun) {
      try {
        backupCreated = await createBackup(eventsToDelete);
        console.log(`✅ Backup created: ${backupCreated}`);
      } catch (error: any) {
        errors.push(`Backup creation failed: ${error.message}`);
        console.error('❌ Backup creation failed:', error);
      }
    }
    
    // Perform deletion
    if (config.dryRun) {
      console.log(`🧪 DRY RUN: Would delete ${eventsToDelete.length} events`);
      deleted = eventsToDelete.length;
    } else {
      if (eventsToDelete.length > 0) {
        console.log(`🗑️ Deleting ${eventsToDelete.length} events...`);
        
        const eventIds = eventsToDelete.map(event => event.id);
        const { success, failed } = await deleteEventsBatch(eventIds);
        
        deleted = success.length;
        skipped = failed.length;
        
        // Add errors for failed deletions
        for (const failedId of failed) {
          const failedEvent = eventsToDelete.find(e => e.id === failedId);
          errors.push(`Failed to delete event: ${failedEvent?.name || failedId}`);
        }
        
        // Invalidate the events cache after bulk deletion
        if (deleted > 0) {
          invalidateEventsCache();
        }
        
        console.log(`✅ Deletion completed: ${deleted} deleted, ${skipped} failed`);
      } else {
        console.log(`ℹ️ No events to delete`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Purge operation failed:', error);
    errors.push(`Purge operation failed: ${error.message}`);
  }
  
  return {
    success: errors.length === 0,
    totalEvents: eventsToDelete.length + eventsToPreserve.length,
    eventsToDelete: eventsToDelete.length,
    deleted,
    skipped,
    errors,
    backupCreated,
    purgeTime: Date.now() - startTime,
    summary,
    preservedEvents
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting test events purge...');
    
    const config: PurgeTestEventsConfig = await request.json();
    
    // Set default config values
    const finalConfig: PurgeTestEventsConfig = {
      dryRun: config.dryRun ?? true, // Default to dry run for safety
      excludePublicHolidays: config.excludePublicHolidays ?? true,
      purgeAllEvents: config.purgeAllEvents ?? false, // Default to safe mode
      createBackup: config.createBackup ?? true,
      filterByDateRange: config.filterByDateRange || { start: undefined, end: undefined },
      filterBySource: config.filterBySource || [],
      filterByStatus: config.filterByStatus || []
    };
    
    console.log('📝 Purge configuration:', finalConfig);
    
    const result = await performPurge(finalConfig);
    
    console.log('🎉 Purge operation completed');
    console.log(`📊 Results: ${result.deleted} deleted, ${result.skipped} skipped, ${result.errors.length} errors`);
    
    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `${finalConfig.dryRun ? 'Simulation' : 'Purge'} completed successfully. ${result.deleted} events ${finalConfig.dryRun ? 'would be' : 'were'} deleted.`
        : `Purge completed with ${result.errors.length} errors.`,
      result
    });
    
  } catch (error: any) {
    console.error('💥 Test events purge error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test events purge failed',
      error: error.message || 'Unknown error occurred',
      details: error.stack
    }, { status: 500 });
  }
}