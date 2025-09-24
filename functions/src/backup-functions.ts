import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { adminDb } from './lib/firebase-admin';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

/**
 * HTTP function to run scheduled backups
 * Can be called by Google Cloud Scheduler or manually
 * 
 * Usage:
 * - Manual: POST https://your-project.cloudfunctions.net/runBackups
 * - Scheduler: Set up Google Cloud Scheduler to call this endpoint every 15 minutes
 */
export const runBackups = onRequest({
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes
  cors: true
}, async (req, res) => {
  logger.info('🕐 Backup runner started');

  // Health check endpoint
  if (req.method === 'GET' && req.path === '/health') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'runBackups'
    });
    return;
  }

  try {
    // Get all active schedules that are due
    const now = new Date();
    const schedulesSnapshot = await adminDb
      .collection('backupSchedules')
      .where('isActive', '==', true)
      .where('nextRun', '<=', now)
      .get();

    const dueSchedules = schedulesSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        nextRun: data.nextRun?.toDate(),
        lastRun: data.lastRun?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    logger.info(`📅 Found ${dueSchedules.length} schedules due for execution`);

    const results = [];

    for (const schedule of dueSchedules) {
      try {
        logger.info(`🚀 Executing backup for schedule: ${schedule.name}`);
        
        // Execute the backup
        const result = await executeScheduleBackup(schedule);
        results.push(result);
        
        logger.info(`✅ Backup completed for schedule: ${schedule.name}`, {
          status: result.status,
          duration: result.duration
        });

      } catch (error) {
        logger.error(`❌ Backup failed for schedule: ${schedule.name}`, {
          error: error instanceof Error ? error.message : error
        });
        
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('✅ Backup runner completed', {
      totalSchedules: dueSchedules.length,
      successfulBackups: results.filter(r => r.status === 'completed').length,
      failedBackups: results.filter(r => r.status === 'failed').length
    });

    res.json({
      success: true,
      executedBackups: results.length,
      results: results.map(r => ({
        scheduleName: r.scheduleName,
        status: r.status,
        error: r.error || undefined
      }))
    });

  } catch (error) {
    logger.error('❌ Backup runner failed', {
      error: error instanceof Error ? error.message : error
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to run backups',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * HTTP function to manually trigger a specific backup schedule
 * POST /triggerBackup with { scheduleId: "abc123" }
 */
export const triggerBackup = onRequest({
  memory: '512MiB',
  timeoutSeconds: 300,
  cors: true
}, async (req, res) => {
  // Health check endpoint
  if (req.method === 'GET' && req.path === '/health') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'triggerBackup'
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { scheduleId } = req.body;
  
  if (!scheduleId) {
    res.status(400).json({ error: 'scheduleId is required' });
    return;
  }

  try {
    logger.info(`🔧 Manual backup trigger for schedule: ${scheduleId}`);

    // Get the specific schedule
    const scheduleDoc = await adminDb.collection('backupSchedules').doc(scheduleId).get();
    
    if (!scheduleDoc.exists) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    const schedule = {
      id: scheduleDoc.id,
      ...scheduleDoc.data(),
      nextRun: scheduleDoc.data()?.nextRun?.toDate(),
      lastRun: scheduleDoc.data()?.lastRun?.toDate(),
      createdAt: scheduleDoc.data()?.createdAt?.toDate(),
      updatedAt: scheduleDoc.data()?.updatedAt?.toDate()
    };

    // Execute the backup
    const result = await executeScheduleBackup(schedule);

    res.json({
      success: true,
      message: 'Backup executed successfully',
      result: {
        scheduleName: result.scheduleName,
        status: result.status,
        duration: result.duration,
        error: result.error || undefined
      }
    });

  } catch (error) {
    logger.error('❌ Manual backup trigger failed', {
      error: error instanceof Error ? error.message : error
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to trigger backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Execute a single backup schedule
 */
async function executeScheduleBackup(schedule: any) {
  const startTime = Date.now();
  const executionId = Math.random().toString(36).substring(7);

  try {
    // Create execution record
    const execution = {
      id: executionId,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      startTime: new Date(),
      status: 'running',
      deliveryStatus: {},
      metadata: {
        exportedRecords: {
          events: 0,
          users: 0,
          clubs: 0,
          zones: 0,
          eventTypes: 0
        },
        executionDuration: 0,
        triggeredBy: 'schedule'
      }
    };

    // Save execution record
    await adminDb.collection('backupExecutions').doc(executionId).set(execution);

    // TODO: Implement actual backup creation and delivery
    // For now, simulate the backup process
    logger.info(`📦 Creating backup for schedule: ${schedule.name}`);
    
    // Simulate backup creation (replace with actual backup logic)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update execution as completed
    const duration = Date.now() - startTime;
    
    await adminDb.collection('backupExecutions').doc(executionId).update({
      status: 'completed',
      endTime: new Date(),
      'metadata.executionDuration': duration
    });

    // Update schedule's last run and next run
    const nextRun = calculateNextRun(schedule.schedule);
    await adminDb.collection('backupSchedules').doc(schedule.id).update({
      lastRun: new Date(),
      nextRun: nextRun,
      totalRuns: (schedule.totalRuns || 0) + 1,
      successfulRuns: (schedule.successfulRuns || 0) + 1,
      updatedAt: new Date()
    });

    return {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      status: 'completed',
      duration: duration
    };

  } catch (error) {
    // Update execution as failed
    await adminDb.collection('backupExecutions').doc(executionId).update({
      status: 'failed',
      endTime: new Date(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      'metadata.executionDuration': Date.now() - startTime
    });

    // Update schedule failure count
    await adminDb.collection('backupSchedules').doc(schedule.id).update({
      failedRuns: (schedule.failedRuns || 0) + 1,
      updatedAt: new Date()
    });

    return {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

/**
 * Calculate next run time for a schedule
 */
function calculateNextRun(scheduleConfig: any): Date {
  const now = new Date();
  const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, move to the next occurrence
  if (nextRun <= now) {
    switch (scheduleConfig.frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilWeekday = (7 + (scheduleConfig.weekday || 0) - nextRun.getDay()) % 7;
        nextRun.setDate(nextRun.getDate() + (daysUntilWeekday || 7));
        break;
      case 'monthly':
        if (scheduleConfig.dayOfMonth) {
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(scheduleConfig.dayOfMonth);
        }
        break;
      default:
        nextRun.setDate(nextRun.getDate() + 1);
        break;
    }
  }

  return nextRun;
}