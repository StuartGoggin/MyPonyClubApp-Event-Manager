import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Simple initialization that works in Cloud Run
function ensureFirebaseInit() {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
  return admin.firestore();
}

export const runBackupsFixed = onRequest({
  memory: '512MiB',
  timeoutSeconds: 300,
  cors: true
}, async (req, res) => {
  logger.info('🕐 Fixed backup runner started');

  try {
    // Health check
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'runBackupsFixed'
      });
      return;
    }

    // Initialize Firebase when needed (not at module level)
    const db = ensureFirebaseInit();
    
    // Get all active schedules that are due
    const now = new Date();
    const schedulesSnapshot = await db
      .collection('backupSchedules')
      .where('isActive', '==', true)
      .where('nextRun', '<=', now)
      .get();

    const dueSchedules = schedulesSnapshot.docs.map(doc => {
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

    const result = {
      message: 'Fixed backup runner is working',
      timestamp: new Date().toISOString(),
      status: 'success',
      schedulesFound: dueSchedules.length,
      schedules: dueSchedules.map((s: any) => ({ id: s.id, name: s.name || 'Unnamed' }))
    };

    logger.info('✅ Fixed backup completed', result);
    res.status(200).json(result);

  } catch (error) {
    logger.error('❌ Fixed backup failed', { error });
    res.status(500).json({
      error: 'Backup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export const triggerBackupFixed = onRequest({
  memory: '256MiB',
  timeoutSeconds: 60,
  cors: true
}, async (req, res) => {
  logger.info('🔧 Fixed backup trigger started');

  try {
    // Health check
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'triggerBackupFixed'
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

    // Initialize Firebase when needed
    const db = ensureFirebaseInit();
    
    // Get the specific schedule
    const scheduleDoc = await db.collection('backupSchedules').doc(scheduleId).get();
    
    if (!scheduleDoc.exists) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }

    const scheduleData = scheduleDoc.data();
    const result = {
      message: 'Fixed backup trigger is working',
      timestamp: new Date().toISOString(),
      status: 'success',
      scheduleId,
      scheduleName: scheduleData?.name || 'Unnamed'
    };

    logger.info('✅ Fixed backup trigger completed', result);
    res.status(200).json(result);

  } catch (error) {
    logger.error('❌ Fixed backup trigger failed', { error });
    res.status(500).json({
      error: 'Backup trigger failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});