import { Request, Response } from 'express';
import { logger } from 'firebase-functions/v2';
import { checkAdminAccess } from '../../../lib/auth-middleware';
import { adminDb } from '../../../lib/firebase-admin';

export async function testFirebase(req: Request, res: Response) {
  try {
    // Check admin authentication
    const { authorized, user } = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn('Unauthorized access attempt to admin Firebase test');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    logger.info('Admin Firebase test requested', { 
      adminUser: user?.email 
    });

    // Enhanced debugging information for Firebase Functions environment
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!envVar);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Key length:', envVar?.length || 0);
    
    // Try to parse the JSON to see if it's valid
    let parseResult = null;
    let parseError = null;
    if (envVar) {
      try {
        const parsed = JSON.parse(envVar);
        parseResult = {
          hasProjectId: !!parsed.project_id,
          projectId: parsed.project_id,
          hasPrivateKey: !!parsed.private_key,
          privateKeyLength: parsed.private_key?.length || 0,
          hasClientEmail: !!parsed.client_email,
          keyType: parsed.type
        };
      } catch (error: any) {
        parseError = error.message;
      }
    }
    
    // Check if adminDb is initialized
    if (!adminDb) {
      logger.error('Firebase Admin SDK not initialized');
      return res.json({ 
        success: false, 
        message: 'Firebase Admin SDK not initialized. Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.',
        debug: {
          hasEnvVar: !!envVar,
          nodeEnv: process.env.NODE_ENV,
          envKeyLength: envVar?.length || 0,
          parseResult,
          parseError
        }
      });
    }

    // Try a simple Firestore operation
    const testRef = adminDb.collection('test').doc('connection-test');
    await testRef.set({ 
      timestamp: new Date().toISOString(),
      test: 'Firebase connection successful',
      testedBy: user?.email || 'admin',
      environment: 'firebase-functions'
    });

    // Read back the document to confirm write operation
    const testDoc = await testRef.get();
    const testData = testDoc.data();

    logger.info('Firebase test completed successfully', { 
      adminUser: user?.email,
      testResult: testData 
    });

    return res.json({ 
      success: true, 
      message: 'Firebase Admin SDK is working correctly',
      testData,
      debug: {
        hasEnvVar: !!envVar,
        nodeEnv: process.env.NODE_ENV,
        parseResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Firebase test error', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return res.status(500).json({
      success: false,
      error: 'Firebase test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}