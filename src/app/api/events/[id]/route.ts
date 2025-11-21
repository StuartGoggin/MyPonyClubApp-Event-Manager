import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { invalidateEventsCache } from '@/lib/server-data';

async function updateEvent(eventId: string, updateData: any) {
  if (!adminDb) {
    throw new Error('Database not available');
  }

  console.log('API: Received update for event ID:', eventId);
  console.log('API: Update data received:', updateData);
  
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  // Handle date conversion if provided
  const processedUpdateData = { ...updateData };
  if (updateData.date) {
    const eventDate = new Date(updateData.date);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Invalid date provided');
    }
    processedUpdateData.date = Timestamp.fromDate(eventDate);
  }

  // Add timestamp for the update
  const eventUpdate = {
    ...processedUpdateData,
    updatedAt: Timestamp.now()
  };

  console.log('API: Final event update data:', eventUpdate);

  // First, let's read the current document to see what's there
  const currentDoc = await adminDb.collection('events').doc(eventId).get();
  console.log('API: Current document data before update:', currentDoc.data());

  await adminDb.collection('events').doc(eventId).update(eventUpdate);
  
  console.log('API: Firebase update completed');
  
  // Let's read the document again to verify the update
  const updatedDoc = await adminDb.collection('events').doc(eventId).get();
  console.log('API: Document data after update:', updatedDoc.data());
  
  console.log('API: Event updated successfully');
  
  // Invalidate the events cache so changes appear immediately
  invalidateEventsCache();
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    await updateEvent(params.id, updateData);
    
    return NextResponse.json({ 
      success: true,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('API Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('required') ? 400 : 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    await updateEvent(params.id, updateData);
    
    return NextResponse.json({ 
      success: true,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('API Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: error instanceof Error && error.message.includes('required') ? 400 : 500 }
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
    
    // Invalidate the events cache so deletion appears immediately
    invalidateEventsCache();
    
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
