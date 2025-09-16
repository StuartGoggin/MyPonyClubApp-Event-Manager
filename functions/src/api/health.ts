import { Router } from 'express';
import { adminDb, getDatabaseStatus } from '../lib/firebase-admin';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const status = getDatabaseStatus();
    
    // Try a simple database operation
    let dbTest = 'not tested';
    if (adminDb && status === 'connected') {
      try {
        const testCollection = adminDb.collection('test');
        await testCollection.limit(1).get();
        dbTest = 'success';
      } catch (error) {
        dbTest = `error: ${error}`;
      }
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status,
        test: dbTest
      },
      environment: {
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
