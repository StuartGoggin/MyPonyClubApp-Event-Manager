import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET() {
  try {
    const bucket = admin.storage().bucket();
    console.log('✅ Storage bucket accessed:', bucket.name);
    
    // Test bucket existence
    const [exists] = await bucket.exists();
    console.log('📦 Bucket exists:', exists);
    
    return NextResponse.json({ 
      success: true, 
      bucketName: bucket.name,
      exists 
    });
  } catch (error) {
    console.error('❌ Storage test error:', error);
    return NextResponse.json({ 
      error: 'Storage test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
