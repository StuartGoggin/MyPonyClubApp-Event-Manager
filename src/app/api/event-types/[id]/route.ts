import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      return NextResponse.json(
        { error: 'Database not available', message: errorMessage },
        { status: 503 }
      );
    }

    const { name } = await request.json();
    const { id } = await params;
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Event type name is required' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Event type ID is required' },
        { status: 400 }
      );
    }

    // Check if event type exists
    const docRef = adminDb.collection('eventTypes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    // Check if another event type with same name exists (excluding current one)
    const existingSnapshot = await adminDb
      .collection('eventTypes')
      .where('name', '==', name.trim())
      .get();

    const conflictingDoc = existingSnapshot.docs.find((doc: any) => doc.id !== id);
    if (conflictingDoc) {
      return NextResponse.json(
        { error: 'Event type with this name already exists' },
        { status: 409 }
      );
    }

    // Update the event type
    await docRef.update({
      name: name.trim(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({ 
      success: true,
      eventType: {
        id,
        name: name.trim()
      }
    });
  } catch (error) {
    console.error('Error updating event type:', error);
    return NextResponse.json(
      { error: 'Failed to update event type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      return NextResponse.json(
        { error: 'Database not available', message: errorMessage },
        { status: 503 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event type ID is required' },
        { status: 400 }
      );
    }

    // Check if event type exists
    const docRef = adminDb.collection('eventTypes').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Event type not found' },
        { status: 404 }
      );
    }

    // Check if any events are using this event type
    const eventsUsingType = await adminDb
      .collection('events')
      .where('eventTypeId', '==', id)
      .get();

    if (!eventsUsingType.empty) {
      return NextResponse.json(
        { 
          error: 'Cannot delete event type that is being used by events',
          eventsCount: eventsUsingType.size
        },
        { status: 409 }
      );
    }

    // Delete the event type
    await docRef.delete();
    
    return NextResponse.json({ 
      success: true,
      message: 'Event type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event type:', error);
    return NextResponse.json(
      { error: 'Failed to delete event type' },
      { status: 500 }
    );
  }
}