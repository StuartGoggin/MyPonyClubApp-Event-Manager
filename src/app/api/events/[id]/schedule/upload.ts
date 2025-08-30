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
    // Debug logging after file is defined
    if (file) {
      console.log('Original file name:', file.name);
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    // Upload file to Firebase Storage using Admin SDK
    const bucket = admin.storage().bucket();
    // Extract original filename (without extension)
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const fileType = file.name.split('.').pop() || 'pdf';
    // Get current date in YYYYMMDD format
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    // Compose new filename
    const fileNameOnly = `${originalName}_${dateStr}.${fileType}`;
    const fileName = `event-schedules/${eventId}/${fileNameOnly}`;
    // Use a unique fileId for Firestore
    const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    // Debug logging
    console.log('Original file name:', file.name);
    console.log('Computed fileNameOnly:', fileNameOnly);
    console.log('Full storage path:', fileName);

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
      fileName: fileNameOnly,
      uploadedAt: new Date(),
      status: 'pending',
      submittedBy,
    };

    // Save schedule to Firestore
    await adminDb.collection('eventSchedules').doc(fileId).set(schedule);
    // Overwrite event's schedule reference with the latest schedule object
    await adminDb.collection('events').doc(eventId).update({ schedule });

    return NextResponse.json({ success: true, schedule });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}