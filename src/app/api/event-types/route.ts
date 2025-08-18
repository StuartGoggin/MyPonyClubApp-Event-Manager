import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from '@/lib/firebase-admin';
import { EventType } from '@/lib/types';

export async function GET() {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      console.warn('⚠️ Event Types API: Database connection issue -', errorMessage);
      return NextResponse.json(
        { 
          error: 'Database connection unavailable', 
          message: errorMessage,
          eventTypes: [] 
        },
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
  } catch (error: any) {
    console.error('Error fetching event types:', error);
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ Event Types API: Database connection timeout or unavailable');
      return NextResponse.json(
        { 
          error: 'Database connection timeout', 
          message: 'Unable to connect to the database. Please check your network connection and try again.',
          eventTypes: [] 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch event types', eventTypes: [] },
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
