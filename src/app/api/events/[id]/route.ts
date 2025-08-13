import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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
    const updateData = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Handle date conversion if provided
    const processedUpdateData = { ...updateData };
    if (updateData.date) {
      const eventDate = new Date(updateData.date);
      if (isNaN(eventDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date provided' },
          { status: 400 }
        );
      }
      processedUpdateData.date = Timestamp.fromDate(eventDate);
    }

    // Add timestamp for the update
    const eventUpdate = {
      ...processedUpdateData,
      updatedAt: Timestamp.now()
    };

    await adminDb.collection('events').doc(eventId).update(eventUpdate);
    
    return NextResponse.json({ 
      success: true,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await adminDb.collection('events').doc(eventId).delete();
    
    return NextResponse.json({ 
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
