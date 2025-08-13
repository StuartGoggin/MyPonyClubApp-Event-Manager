import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
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
      events.push({
        id: doc.id,
        name: data.name,
        date: data.date.toDate(), // Convert Firestore timestamp to Date
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
    
    // Add timestamps
    const newEvent = {
      ...eventData,
      date: new Date(eventData.date),
      createdAt: new Date(),
      updatedAt: new Date()
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
