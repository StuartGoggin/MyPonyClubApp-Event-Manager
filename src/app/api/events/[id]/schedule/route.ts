import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { invalidateEventsCache } from '@/lib/server-data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    const { status, comment } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get the event
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    
    if (!eventData?.schedule) {
      return NextResponse.json(
        { error: 'Event has no schedule' },
        { status: 400 }
      );
    }

    // Update the schedule status
    const updateData: any = {
      'schedule.status': status,
      'schedule.reviewedAt': new Date(),
    };

    if (comment) {
      updateData['schedule.reviewComment'] = comment;
    }

    await eventRef.update(updateData);

    // Invalidate cache
    invalidateEventsCache();

    return NextResponse.json({
      success: true,
      message: `Schedule ${status}`,
      eventId,
      status
    });

  } catch (error) {
    console.error('Error updating schedule status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update schedule status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
