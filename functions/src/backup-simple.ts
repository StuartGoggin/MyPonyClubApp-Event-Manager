import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

/**
 * Simple backup runner for testing
 */
export const runBackupsSimple = onRequest({
  memory: '512MiB',
  timeoutSeconds: 300,
  cors: true
}, async (req, res) => {
  logger.info('🕐 Simple backup runner started');

  try {
    // Health check
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'runBackupsSimple'
      });
      return;
    }

    // Simple backup logic
    const result = {
      message: 'Backup runner is working',
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    logger.info('✅ Simple backup completed', result);
    res.status(200).json(result);

  } catch (error) {
    logger.error('❌ Simple backup failed', { error });
    res.status(500).json({
      error: 'Backup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Simple backup trigger for testing
 */
export const triggerBackupSimple = onRequest({
  memory: '256MiB',
  timeoutSeconds: 60,
  cors: true
}, async (req, res) => {
  logger.info('🔧 Simple backup trigger started');

  try {
    // Health check
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'triggerBackupSimple'
      });
      return;
    }

    const result = {
      message: 'Backup trigger is working',
      timestamp: new Date().toISOString(),
      status: 'success'
    };

    logger.info('✅ Simple backup trigger completed', result);
    res.status(200).json(result);

  } catch (error) {
    logger.error('❌ Simple backup trigger failed', { error });
    res.status(500).json({
      error: 'Backup trigger failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});