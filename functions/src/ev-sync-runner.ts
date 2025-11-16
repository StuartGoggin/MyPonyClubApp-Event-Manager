import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { adminDb } from './lib/firebase-admin';

interface SyncConfig {
  disciplines: string[];
  yearsAhead: number;
  syncIntervalDays: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

interface SyncMetadata {
  lastSyncDate: any;
  lastSyncSuccess: boolean;
  eventsCount: number;
  yearsSync: number[];
  disciplinesSync: string[];
}

/**
 * HTTP function to run scheduled EV events sync
 * Can be called by Google Cloud Scheduler or manually
 * 
 * Usage:
 * - Manual: POST https://your-project.cloudfunctions.net/runEvEventsSync
 * - Scheduler: Set up Google Cloud Scheduler to call this endpoint daily
 */
export const runEvEventsSync = onRequest({
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes
  cors: true,
  region: 'asia-east1'
}, async (req, res) => {
  logger.info('🏇 EV Events sync runner started');

  // Health check endpoint
  if (req.method === 'GET' && req.path === '/health') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'runEvEventsSync'
    });
    return;
  }

  try {
    // Get sync configuration
    const configDoc = await adminDb.collection('system_config').doc('ev_events_sync').get();
    
    if (!configDoc.exists) {
      logger.info('⚠️  No sync configuration found, skipping sync');
      res.status(200).json({
        status: 'skipped',
        message: 'No sync configuration found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const config = configDoc.data() as SyncConfig;
    
    if (!config.isActive) {
      logger.info('⚠️  Sync is disabled in configuration, skipping sync');
      res.status(200).json({
        status: 'skipped',
        message: 'Sync is disabled',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if sync is needed based on interval
    const metadataDoc = await adminDb.collection('system_metadata').doc('ev_events_sync').get();
    
    if (metadataDoc.exists) {
      const metadata = metadataDoc.data() as SyncMetadata;
      const lastSync = metadata.lastSyncDate?.toDate();
      
      if (lastSync) {
        const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceSync < config.syncIntervalDays) {
          logger.info(`⏭️  Sync not needed yet. Last sync was ${daysSinceSync.toFixed(1)} days ago (interval: ${config.syncIntervalDays} days)`);
          res.status(200).json({
            status: 'skipped',
            message: `Sync not needed. Last sync was ${daysSinceSync.toFixed(1)} days ago`,
            timestamp: new Date().toISOString(),
            daysSinceSync: daysSinceSync.toFixed(1),
            intervalDays: config.syncIntervalDays
          });
          return;
        }
      }
    }

    logger.info('🚀 Starting EV events sync...', {
      disciplines: config.disciplines,
      yearsAhead: config.yearsAhead,
      syncIntervalDays: config.syncIntervalDays
    });

    // Call the sync API endpoint with force=true to bypass interval check
    // (We already checked the interval above)
    const syncUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${syncUrl}/api/admin/sync-ev-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force: true })
    });

    const result = await response.json();

    if (result.success) {
      logger.info('✅ EV events sync completed successfully', {
        stats: result.stats,
        eventsCount: result.stats?.total || 0
      });

      res.status(200).json({
        status: 'success',
        message: result.message,
        stats: result.stats,
        timestamp: new Date().toISOString()
      });
    } else {
      logger.error('❌ EV events sync failed', {
        message: result.message,
        errors: result.errors
      });

      res.status(500).json({
        status: 'failed',
        message: result.message,
        errors: result.errors,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    logger.error('❌ Error in EV events sync runner:', error);
    
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});
