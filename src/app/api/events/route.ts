import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Event } from '@/lib/types';
import { getAllEvents } from '@/lib/server-data';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      console.warn('⚠️ Events API: Database connection issue -', errorMessage);
      return NextResponse.json(
        { 
          error: 'Database connection unavailable', 
          message: errorMessage,
          events: [] 
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const status = searchParams.get('status');
    const clubId = searchParams.get('clubId');

    // Use cached getAllEvents which includes public holidays
    let allEvents = await getAllEvents();

    // Apply filters if provided
    if (zoneId) {
      // First get clubs in the zone
      const clubsSnapshot = await adminDb.collection('clubs').where('zoneId', '==', zoneId).get();
      const clubIds = clubsSnapshot.docs.map((doc: any) => doc.id);
      
      if (clubIds.length === 0) {
        return NextResponse.json({ events: [] });
      }
      
      // Filter events by clubs in the zone
      allEvents = allEvents.filter(event => event.clubId && clubIds.includes(event.clubId));
    }

    // Filter by specific club if provided
    if (clubId && !zoneId) {
      allEvents = allEvents.filter(event => event.clubId === clubId);
    }

    // Filter by status if provided
    if (status) {
      allEvents = allEvents.filter(event => event.status === status);
    }

    // Sort by date descending
    allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json({ events: allEvents });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ Events API: Database connection timeout or unavailable');
      return NextResponse.json(
        { 
          error: 'Database connection timeout', 
          message: 'Unable to connect to the database. Please check your network connection and try again.',
          events: [] 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch events', events: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      console.warn('⚠️ Events API POST: Database connection issue -', errorMessage);
      return NextResponse.json(
        { 
          error: 'Database connection unavailable', 
          message: errorMessage
        },
        { status: 503 }
      );
    }

    const eventData = await request.json();
    
    // Convert date string to Firestore Timestamp
    const eventDate = new Date(eventData.date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date provided' },
        { status: 400 }
      );
    }
    
    // Add timestamps using Firestore Timestamp
    const newEvent = {
      ...eventData,
      date: Timestamp.fromDate(eventDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await adminDb.collection('events').add(newEvent);
    
    return NextResponse.json({ 
      success: true, 
      eventId: docRef.id 
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ Events API POST: Database connection timeout or unavailable');
      return NextResponse.json(
        { 
          error: 'Database connection timeout', 
          message: 'Unable to connect to the database. Please check your network connection and try again.'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
