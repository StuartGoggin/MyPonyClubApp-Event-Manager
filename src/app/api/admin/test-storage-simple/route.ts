import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { isDatabaseConnected } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('🔍 Testing Firebase Storage permissions...');
    
    // Ensure Firebase is initialized by importing the admin config
    if (!isDatabaseConnected()) {
      console.log('❌ Firebase Admin SDK not initialized');
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized'
      }, { status: 503 });
    }
    
    // Get storage instance
    const storage = admin.storage();
    const bucket = storage.bucket();
    
    console.log('📦 Bucket name:', bucket.name);
    
    // Try to list files (this tests read permission)
    console.log('📋 Testing bucket access...');
    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log('✅ Bucket access successful. Files found:', files.length);
    
    // Try to get bucket metadata
    console.log('🔍 Getting bucket metadata...');
    const [metadata] = await bucket.getMetadata();
    console.log('✅ Bucket metadata retrieved:', {
      name: metadata.name,
      location: metadata.location,
      created: metadata.timeCreated
    });
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Storage is working correctly',
      bucket: {
        name: bucket.name,
        location: metadata.location,
        created: metadata.timeCreated,
        fileCount: files.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Storage test failed:', error);
    
    let troubleshooting = [];
    let errorType = 'Unknown error';
    
    if (error.code === 404) {
      errorType = 'Bucket not found';
      troubleshooting = [
        'The Firebase Storage bucket does not exist.',
        'This usually means Firebase Storage was not properly set up.',
        '',
        'To fix:',
        '1. Go to https://console.firebase.google.com/',
        '2. Select your project: ponyclub-events',
        '3. Click "Storage" in the left menu',
        '4. If you see "Get started", click it and follow the setup',
        '5. If Storage is already enabled, check if the bucket exists',
        '6. The bucket should be named: ponyclub-events.appspot.com'
      ];
    } else if (error.code === 403) {
      errorType = 'Permission denied';
      troubleshooting = [
        'Your service account lacks permissions for Firebase Storage.',
        '',
        'To fix:',
        '1. Go to Google Cloud Console IAM',
        '2. Find your Firebase service account',
        '3. Add "Storage Admin" or "Storage Object Admin" role',
        '',
        'Or regenerate your Firebase service account key with Storage permissions.'
      ];
    } else {
      troubleshooting = [
        'Unexpected error occurred.',
        'Check the error details below.',
        'You may need to regenerate your Firebase service account key.'
      ];
    }
    
    return NextResponse.json({
      success: false,
      errorType,
      error: error.message,
      code: error.code,
      troubleshooting
    }, { status: 500 });
  }
}
