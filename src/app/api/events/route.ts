import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Event } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const status = searchParams.get('status');
    const clubId = searchParams.get('clubId');

    let query = adminDb.collection('events');

    // Filter by zone through clubs if zoneId is provided
    if (zoneId) {
      // First get clubs in the zone
      const clubsSnapshot = await adminDb.collection('clubs').where('zoneId', '==', zoneId).get();
      const clubIds = clubsSnapshot.docs.map((doc: any) => doc.id);
      
      if (clubIds.length === 0) {
        return NextResponse.json({ events: [] });
      }
      
      // Filter events by clubs in the zone
      query = query.where('clubId', 'in', clubIds);
    }

    // Filter by specific club if provided
    if (clubId && !zoneId) {
      query = query.where('clubId', '==', clubId);
    }

    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by date
    query = query.orderBy('date', 'desc');

    const snapshot = await query.get();
    const events: Event[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      
      // Handle date conversion with error handling
      let eventDate: Date;
      try {
        if (data.date && typeof data.date.toDate === 'function') {
          eventDate = data.date.toDate();
        } else if (data.date instanceof Date) {
          eventDate = data.date;
        } else if (typeof data.date === 'string') {
          eventDate = new Date(data.date);
        } else {
          console.warn(`Invalid date format for event ${doc.id}:`, data.date);
          eventDate = new Date(); // Fallback to current date
        }
      } catch (error) {
        console.error(`Error converting date for event ${doc.id}:`, error);
        eventDate = new Date(); // Fallback to current date
      }
      
      events.push({
        id: doc.id,
        name: data.name,
        date: eventDate,
        clubId: data.clubId,
        eventTypeId: data.eventTypeId,
        status: data.status,
        location: data.location,
        source: data.source,
        coordinatorName: data.coordinatorName,
        coordinatorContact: data.coordinatorContact,
        isQualifier: data.isQualifier,
        notes: data.notes,
        submittedBy: data.submittedBy,
        submittedByContact: data.submittedByContact
      });
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
