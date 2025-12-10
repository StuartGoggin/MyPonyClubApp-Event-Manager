import { NextRequest, NextResponse } from 'next/server';
import { EventSchedule, EventScheduleStatus } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST: Upload schedule document for an event (LOCAL STORAGE VERSION)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
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

    // Save file locally for now (temporary solution)
    const fileType = file.name.split('.').pop() || 'pdf';
    const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const fileName = `${fileId}.${fileType}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'event-schedules', eventId);
    await mkdir(uploadsDir, { recursive: true });
    
    const filePath = path.join(uploadsDir, fileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    console.log('💾 Saving file locally:', filePath);
    await writeFile(filePath, fileBuffer);
    console.log('✅ File saved successfully');

    // Create public URL for the file
    const fileUrl = `/uploads/event-schedules/${eventId}/${fileName}`;
    console.log('🌐 File URL:', fileUrl);

    // Create EventSchedule object
    const schedule: EventSchedule = {
      id: fileId,
      eventId,
      fileUrl,
      fileType,
      fileName,
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
    return NextResponse.json({ error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
