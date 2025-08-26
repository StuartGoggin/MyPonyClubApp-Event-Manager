import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function POST() {
  try {
    console.log('🔧 Creating Firebase Storage bucket...');
    
    const storage = admin.storage();
    const projectId = admin.app().options.projectId;
    const bucketName = `${projectId}.appspot.com`;
    
    console.log('📦 Creating bucket:', bucketName);
    
    // Create the bucket
    const bucket = storage.bucket(bucketName);
    await bucket.create({
      location: 'us-central1', // You can change this to your preferred location
      storageClass: 'STANDARD',
    });
    
    console.log('✅ Bucket created successfully!');
    
    // Verify the bucket was created
    const [metadata] = await bucket.getMetadata();
    
    // Set up CORS rules for web access (optional but recommended)
    await bucket.setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE'],
        origin: ['*'], // In production, restrict this to your domain
        responseHeader: ['Content-Type', 'Authorization'],
      },
    ]);
    
    console.log('✅ CORS configuration set');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Storage bucket created successfully',
      bucket: {
        name: bucketName,
        location: metadata.location,
        storageClass: metadata.storageClass,
        created: metadata.timeCreated
      }
    });
    
  } catch (error: any) {
    console.error('❌ Bucket creation failed:', error);
    
    if (error.code === 409) {
      // Bucket already exists - that's actually good!
      return NextResponse.json({
        success: true,
        message: 'Bucket already exists (which is good!)',
        note: 'The bucket was already created, no action needed'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create storage bucket',
      details: error.message,
      code: error.code,
      instructions: [
        'Bucket creation failed. This might be because:',
        '1. Firebase Storage is not enabled in your project',
        '2. Your service account lacks Storage Admin permissions',
        '3. Billing is not enabled (required for Storage)',
        '',
        'Manual fix:',
        '1. Go to https://console.firebase.google.com/',
        '2. Select ponyclub-events project',
        '3. Go to Storage > Get Started',
        '4. Complete the setup wizard',
        '5. Ensure billing is enabled if prompted'
      ]
    }, { status: 500 });
  }
}
