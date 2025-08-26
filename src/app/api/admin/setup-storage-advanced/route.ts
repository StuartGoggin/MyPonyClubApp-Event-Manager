import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function POST() {
  try {
    console.log('🔧 Firebase Storage Comprehensive Setup...');
    
    // Get the Firebase app
    const app = admin.app();
    const projectId = app.options.projectId;
    console.log('📋 Project ID:', projectId);
    
    // Initialize storage
    const storage = admin.storage();
    const bucketName = `${projectId}.appspot.com`;
    console.log('📦 Target bucket:', bucketName);
    
    // Get bucket reference
    const bucket = storage.bucket(bucketName);
    
    try {
      // Try to access the bucket metadata (this will fail if bucket doesn't exist)
      console.log('🔍 Checking bucket metadata...');
      const [metadata] = await bucket.getMetadata();
      console.log('✅ Bucket exists and accessible:', metadata.name);
      
      return NextResponse.json({
        success: true,
        message: 'Firebase Storage bucket is properly configured',
        bucketName,
        location: metadata.location,
        storageClass: metadata.storageClass,
        created: metadata.timeCreated
      });
      
    } catch (metadataError: any) {
      console.log('⚠️ Bucket metadata error:', metadataError.message);
      
      if (metadataError.code === 404) {
        console.log('🔧 Bucket does not exist, attempting to create...');
        
        try {
          // Create the bucket
          await bucket.create({
            location: 'us-central1',
            storageClass: 'STANDARD',
          });
          
          console.log('✅ Bucket created successfully!');
          
          // Verify creation
          const [newMetadata] = await bucket.getMetadata();
          
          return NextResponse.json({
            success: true,
            message: 'Firebase Storage bucket created successfully',
            bucketName,
            location: newMetadata.location,
            storageClass: newMetadata.storageClass,
            created: newMetadata.timeCreated
          });
          
        } catch (createError: any) {
          console.error('❌ Failed to create bucket:', createError);
          
          return NextResponse.json({
            success: false,
            error: 'Failed to create storage bucket',
            details: createError.message,
            code: createError.code,
            troubleshooting: [
              'The Firebase Storage service might not be fully enabled.',
              'Please ensure:',
              '1. Firebase Storage is enabled in the Firebase Console',
              '2. Your service account has Storage Admin permissions',
              '3. Billing is enabled for your Firebase project (required for Storage)',
              '',
              'Manual Setup:',
              '1. Go to https://console.firebase.google.com/',
              `2. Select the "${projectId}" project`,
              '3. Go to Storage > Get Started',
              '4. Follow the setup wizard',
              '5. Ensure billing is enabled if prompted'
            ]
          }, { status: 500 });
        }
        
      } else if (metadataError.code === 403) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied accessing storage bucket',
          details: 'Service account lacks Storage permissions',
          troubleshooting: [
            'Your Firebase service account needs Storage Admin permissions.',
            'To fix this:',
            '1. Go to Google Cloud Console',
            '2. Navigate to IAM & Admin > IAM',
            '3. Find your Firebase service account',
            '4. Add "Storage Admin" role',
            '',
            'Or regenerate the service account key with proper permissions.'
          ]
        }, { status: 403 });
        
      } else {
        throw metadataError;
      }
    }
    
  } catch (error: any) {
    console.error('❌ Firebase Storage setup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Firebase Storage setup failed',
      details: error.message,
      code: error.code,
      troubleshooting: [
        'General troubleshooting steps:',
        '1. Verify Firebase Storage is enabled in Firebase Console',
        '2. Check that billing is enabled for your Firebase project',
        '3. Ensure your service account has proper permissions',
        '4. Try regenerating your Firebase service account key'
      ]
    }, { status: 500 });
  }
}
