import { NextRequest, NextResponse } from 'next/server';
import { EventSchedule, EventScheduleStatus } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// POST: Upload schedule document for an event
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const submittedBy = formData.get('submittedBy') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    console.log('🔍 Debug info:', {
      hasAdminDb: !!adminDb,
      eventId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Upload file to Firebase Storage using Admin SDK
    try {
      console.log('📦 Getting storage bucket...');
      // Use the correct bucket name from Firebase Console
      const bucket = admin.storage().bucket('ponyclub-events.firebasestorage.app');
      console.log('✅ Storage bucket retrieved:', bucket.name);
      
      const fileType = file.name.split('.').pop() || 'pdf';
      const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const fileName = `event-schedules/${eventId}/${fileId}.${fileType}`;
      
      console.log('📁 Upload path:', fileName);
      
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fileRef = bucket.file(fileName);
      
      console.log('⬆️ Starting file upload...');
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: file.type,
        },
      });
      console.log('✅ File uploaded successfully');

      // Make file publicly accessible
      console.log('🔓 Making file public...');
      await fileRef.makePublic();
      const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log('🌐 File URL:', fileUrl);

      // Create EventSchedule object
      const schedule: EventSchedule = {
        id: fileId,
        eventId,
        fileUrl,
        fileType,
        uploadedAt: new Date(),
        status: 'pending',
        submittedBy,
      };

      // Save schedule to Firestore and associate with event
      await adminDb.collection('eventSchedules').doc(fileId).set(schedule);
      await adminDb.collection('events').doc(eventId).update({ schedule });

      return NextResponse.json({ success: true, schedule });
    } catch (storageError: any) {
      console.error('Storage upload error:', storageError);
      
      // Check if this is a "bucket doesn't exist" error
      if (storageError.message?.includes('does not exist') || storageError.status === 404) {
        return NextResponse.json({
          error: 'Firebase Storage not enabled',
          details: 'Please enable Firebase Storage in the Firebase Console',
          instructions: [
            '1. Go to https://console.firebase.google.com/',
            '2. Select the "ponyclub-events" project',
            '3. Click on "Storage" in the left sidebar',
            '4. Click "Get started"',
            '5. Choose "Start in test mode" for development',
            '6. Select a location (recommended: us-central1)',
            '7. Click "Done"',
            '8. Try uploading again'
          ],
          setupUrl: 'https://console.firebase.google.com/project/ponyclub-events/storage'
        }, { status: 503 });
      }
      
      // Other storage errors
      return NextResponse.json({
        error: 'File upload failed',
        details: storageError.message,
        code: storageError.code
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
