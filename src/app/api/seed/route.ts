import { getZones, getClubs, getEventTypes, getEvents } from '../../../lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [zones, clubs, eventTypes, events] = await Promise.all([
      getZones(),
      getClubs(),
      getEventTypes(),
      getEvents(),
    ]);
    return NextResponse.json({
      zones,
      clubs,
      eventTypes,
      events,
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching seed data from database:', error);
    return NextResponse.json({ message: 'An error occurred fetching seed data.', status: 500 });
  }
}