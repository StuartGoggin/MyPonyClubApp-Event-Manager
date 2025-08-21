import { NextRequest, NextResponse } from 'next/server';
import { getEvents, getZones, getClubs, getEventTypes } from '@/lib/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const zone = searchParams.get('zone');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Fetch all data
    const [events, zones, clubs, eventTypes] = await Promise.all([
      getEvents(),
      getZones(),
      getClubs(),
      getEventTypes()
    ]);

    // Filter events if needed
    let filteredEvents = events;
    
    if (upcoming) {
      const now = new Date();
      filteredEvents = filteredEvents.filter(event => new Date(event.date) >= now);
    }
    
    if (zone) {
      const selectedZone = zones.find(z => z.id === zone || z.name.toLowerCase() === zone.toLowerCase());
      if (selectedZone) {
        const zoneClubs = clubs.filter(c => c.zoneId === selectedZone.id);
        const zoneClubIds = zoneClubs.map(c => c.id);
        filteredEvents = filteredEvents.filter(event => zoneClubIds.includes(event.clubId));
      }
    }
    
    if (limit) {
      filteredEvents = filteredEvents.slice(0, limit);
    }

    // Sort by date
    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Enhance events with club and zone information
    const enhancedEvents = filteredEvents.map(event => {
      const club = clubs.find(c => c.id === event.clubId);
      const zone = zones.find(z => z.id === club?.zoneId);
      const eventType = eventTypes.find(et => et.id === event.eventTypeId);
      
      return {
        ...event,
        clubName: club?.name || 'Unknown Club',
        zoneName: zone?.name || 'Unknown Zone',
        eventTypeName: eventType?.name || 'Unknown Event Type',
        clubLocation: club?.physicalAddress || club?.address?.street || null,
        coordinates: club?.latitude && club?.longitude ? {
          lat: club.latitude,
          lng: club.longitude
        } : null
      };
    });

    // Return data based on format
    if (format === 'ical' || format === 'ics') {
      // Generate iCal format for calendar subscriptions
      const icalContent = generateICalContent(enhancedEvents);
      return new NextResponse(icalContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="pony-club-events.ics"'
        }
      });
    }

    // Default JSON response
    const response = {
      events: enhancedEvents,
      metadata: {
        totalEvents: enhancedEvents.length,
        zones: zones.length,
        clubs: clubs.length,
        eventTypes: eventTypes.length,
        lastUpdated: new Date().toISOString(),
        filters: {
          zone: zone || null,
          upcoming: upcoming,
          limit: limit || null
        }
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300' // 5 minutes cache
      }
    });

  } catch (error) {
    console.error('Error in embed API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

function generateICalContent(events: any[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MyPonyClub//Event Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pony Club Events',
    'X-WR-CALDESC:Victorian Pony Club Events Calendar'
  ];

  events.forEach(event => {
    const startDate = new Date(event.date);
    const endDate = new Date(event.date); // Since we only have one date, end date is the same
    
    // Format dates for iCal (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@myponyclub.events`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.notes || ''}\\n\\nClub: ${event.clubName}\\nZone: ${event.zoneName}\\nType: ${event.eventTypeName}`,
      `LOCATION:${event.clubLocation || event.clubName}`,
      `STATUS:${event.status === 'approved' ? 'CONFIRMED' : 'TENTATIVE'}`,
      `LAST-MODIFIED:${formatICalDate(new Date())}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
