import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { EventType } from '@/lib/types';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const snapshot = await adminDb.collection('eventTypes').orderBy('name').get();
    const eventTypes: EventType[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      eventTypes.push({
        id: doc.id,
        name: data.name
      });
    });

    return NextResponse.json({ eventTypes });
  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Event type name is required' },
        { status: 400 }
      );
    }

    const newEventType = {
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await adminDb.collection('eventTypes').add(newEventType);
    
    return NextResponse.json({ 
      success: true, 
      eventTypeId: docRef.id,
      eventType: {
        id: docRef.id,
        name
      }
    });
  } catch (error) {
    console.error('Error creating event type:', error);
    return NextResponse.json(
      { error: 'Failed to create event type' },
      { status: 500 }
    );
  }
}
