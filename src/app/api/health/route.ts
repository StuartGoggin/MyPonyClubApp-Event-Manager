import { NextRequest, NextResponse } from 'next/server';
import { adminDb, getDatabaseStatus } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
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
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}