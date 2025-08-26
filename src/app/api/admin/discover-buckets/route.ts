import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function GET() {
  try {
    console.log('🔍 Listing all available storage buckets...');
    
    const storage = admin.storage();
    const projectId = admin.app().options.projectId;
    
    console.log('📋 Project ID:', projectId);
    console.log('🔍 Expected bucket name:', `${projectId}.appspot.com`);
    
    // Try different possible bucket names
    const possibleBuckets = [
      `${projectId}.appspot.com`,
      `${projectId}`,
      `${projectId}-default-rtdb`,
      `${projectId}.firebaseapp.com`,
      `gs://${projectId}.appspot.com`,
      `gs://${projectId}`
    ];
    
    const results = [];
    
    for (const bucketName of possibleBuckets) {
      try {
        console.log(`🧪 Testing bucket: ${bucketName}`);
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();
        
        if (exists) {
          const [metadata] = await bucket.getMetadata();
          results.push({
            name: bucketName,
            exists: true,
            location: metadata.location,
            created: metadata.timeCreated
          });
          console.log(`✅ Found bucket: ${bucketName}`);
        } else {
          results.push({
            name: bucketName,
            exists: false
          });
          console.log(`❌ Bucket not found: ${bucketName}`);
        }
      } catch (error: any) {
        results.push({
          name: bucketName,
          exists: false,
          error: error.message
        });
        console.log(`❌ Error checking ${bucketName}:`, error.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      projectId,
      bucketResults: results,
      foundBuckets: results.filter(r => r.exists),
      instructions: [
        'If no buckets were found:',
        '1. Check the Firebase Console Storage section',
        '2. Look for the exact bucket name displayed',
        '3. Ensure the bucket was created in the same project',
        '4. The bucket name might be different from the expected format'
      ]
    });
    
  } catch (error: any) {
    console.error('❌ Bucket discovery failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to discover buckets',
      details: error.message,
      instructions: [
        'Please check:',
        '1. Firebase Storage is properly enabled',
        '2. Service account has Storage permissions',
        '3. The bucket name in Firebase Console Storage section'
      ]
    }, { status: 500 });
  }
}
