import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { invalidateEventsCache } from '@/lib/server-data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const eventId = params.id;
    const { status, zoneManagerNotes, processedBy, processedAt } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update event with new status and processing info
    const eventUpdate = {
      status,
      zoneManagerNotes: zoneManagerNotes || '',
      processedBy: processedBy || '',
      processedAt: processedAt ? new Date(processedAt) : new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection('events').doc(eventId).update(eventUpdate);
    
    // Invalidate the events cache so status changes appear immediately
    invalidateEventsCache();
    
    return NextResponse.json({ 
      success: true,
      message: `Event ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { error: 'Failed to update event status' },
      { status: 500 }
    );
  }
}
