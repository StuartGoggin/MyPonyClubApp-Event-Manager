import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const isDev = process.env.NODE_ENV === 'development';

export async function GET() {
  try {
    // Enhanced debugging information
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (isDev) console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!envVar);
    if (isDev) console.log('NODE_ENV:', process.env.NODE_ENV);
    if (isDev) console.log('Key length:', envVar?.length || 0);
    
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
      return NextResponse.json({ 
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
      test: 'Firebase connection successful'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Firebase connection successful!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Firebase test error:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Firebase error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
}
