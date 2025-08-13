import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Check if adminDb is initialized
    if (!adminDb) {
      console.log('adminDb is null');
      console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      
      return NextResponse.json({ 
        success: false, 
        message: 'Firebase Admin SDK not initialized. Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.',
        debug: {
          hasEnvVar: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          nodeEnv: process.env.NODE_ENV,
          envKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0
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
