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

    // Upload file to Firebase Storage using Admin SDK
    const bucket = admin.storage().bucket();
    const fileType = file.name.split('.').pop() || 'pdf';
    const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const fileName = `event-schedules/${eventId}/${fileId}.${fileType}`;
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileRef = bucket.file(fileName);
    
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

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
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
