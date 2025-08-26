import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function POST() {
  try {
    console.log('🔧 Attempting to initialize Firebase Storage...');
    
    // Get the default app
    const app = admin.app();
    console.log('✅ Firebase app found:', app.name);
    
    // Try to get storage instance
    const storage = admin.storage(app);
    console.log('✅ Storage service initialized');
    
    // Try to create/access the bucket
    const bucketName = `${app.options.projectId}.appspot.com`;
    console.log('📦 Attempting to access bucket:', bucketName);
    
    const bucket = storage.bucket(bucketName);
    
    // Check if bucket exists
    try {
      const [exists] = await bucket.exists();
      console.log('📋 Bucket exists check:', exists);
      
      if (!exists) {
        console.log('🔧 Creating bucket...');
        await bucket.create({
          location: 'us-central1',
          storageClass: 'STANDARD',
        });
        console.log('✅ Bucket created successfully');
      }
      
      // Test bucket access by trying to list files
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log('📁 Bucket access test successful, file count:', files.length);
      
      return NextResponse.json({
        success: true,
        bucketName,
        exists: true,
        message: 'Firebase Storage is properly configured'
      });
      
    } catch (bucketError: any) {
      console.error('❌ Bucket error:', bucketError);
      
      // If bucket doesn't exist, try to create it
      if (bucketError.code === 404 || bucketError.message?.includes('does not exist')) {
        console.log('🔧 Bucket not found, attempting to create...');
        try {
          await bucket.create({
            location: 'us-central1',
            storageClass: 'STANDARD',
          });
          console.log('✅ Bucket created successfully');
          
          return NextResponse.json({
            success: true,
            bucketName,
            exists: true,
            message: 'Firebase Storage bucket created successfully'
          });
        } catch (createError: any) {
          console.error('❌ Failed to create bucket:', createError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create storage bucket',
            details: createError.message,
            bucketName,
            instructions: [
              'Please enable Firebase Storage manually:',
              '1. Go to https://console.firebase.google.com/',
              `2. Select the ${app.options.projectId} project`,
              '3. Click on "Storage" in the left sidebar',
              '4. Click "Get started"',
              '5. Choose "Start in test mode" for now',
              '6. Select a location (preferably us-central1)',
              '7. Click "Done"'
            ]
          }, { status: 500 });
        }
      } else {
        throw bucketError;
      }
    }
    
  } catch (error: any) {
    console.error('❌ Firebase Storage setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Firebase Storage setup failed',
      details: error.message,
      instructions: [
        'Please enable Firebase Storage manually:',
        '1. Go to https://console.firebase.google.com/',
        '2. Select your project',
        '3. Click on "Storage" in the left sidebar',
        '4. Click "Get started"',
        '5. Choose "Start in test mode" for now',
        '6. Select a location',
        '7. Click "Done"'
      ]
    }, { status: 500 });
  }
}
