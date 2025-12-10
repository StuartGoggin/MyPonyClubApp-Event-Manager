import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { EventScheduleStatus } from '@/lib/types';

// PATCH: Review/approve/reject schedule document for an event
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const body = await request.json();
  const { scheduleId, action, reviewedBy, notes } = body;

  if (!scheduleId || !action || !['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const status: EventScheduleStatus = action;
  const reviewedAt = new Date();

  // Update schedule status in Firestore
  await adminDb.collection('eventSchedules').doc(scheduleId).update({
    status,
    reviewedBy,
    reviewedAt,
    notes,
  });
  await adminDb.collection('events').doc(eventId).update({
    'schedule.status': status,
    'schedule.reviewedBy': reviewedBy,
    'schedule.reviewedAt': reviewedAt,
    'schedule.notes': notes,
  });

  return NextResponse.json({ success: true, status });
}
