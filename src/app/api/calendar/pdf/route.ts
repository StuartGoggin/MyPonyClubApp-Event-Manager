import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarPDF } from '@/lib/calendar-pdf';
import { getEvents, getClubs, getEventTypes, getZones } from '@/lib/data';

// Force dynamic rendering for this route since it uses request parameters
export const dynamic = 'force-dynamic';

// GET: Generate a PDF of the calendar (month or year view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'month';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterScope = searchParams.get('filterScope') || 'all';
    const zoneId = searchParams.get('zoneId');
    const clubId = searchParams.get('clubId');

    // Fetch real events from Firestore
    const [events, clubs, eventTypes, zones] = await Promise.all([
      getEvents(),
      getClubs(), 
      getEventTypes(),
      getZones()
    ]);

    // Filter events for the requested date range
    let filteredEvents = events;
    
    if (scope === 'month') {
      // Filter events for the specific month
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month;
      });
    } else if (scope === 'year') {
      // Filter events for the specific year
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year;
      });
    } else if (scope === 'custom' && startDate && endDate) {
      // Filter events for custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      });
    }

    // Apply scope filtering (all events, zone events, or club events)
    if (filterScope === 'zone' && zoneId) {
      // Filter events for specific zone
      const zoneClubs = clubs.filter(club => club.zoneId === zoneId);
      const zoneClubIds = zoneClubs.map(club => club.id);
      filteredEvents = filteredEvents.filter(event => 
        event.clubId && zoneClubIds.includes(event.clubId)
      );
    } else if (filterScope === 'club' && clubId) {
      // Filter events for specific club
      filteredEvents = filteredEvents.filter(event => event.clubId === clubId);
    }
    // If filterScope === 'all', no additional filtering needed

    // Enhance events with additional information
    const enhancedEvents = filteredEvents.map(event => {
      const club = clubs.find(c => c.id === event.clubId);
      const eventType = eventTypes.find(et => et.id === event.eventTypeId);
      
      return {
  name: event.name || eventType?.name || 'Event',
  date: event.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
  status: event.status || 'pending',
  club: club?.name,
  eventType: eventType?.name,
  location: event.location || club?.physicalAddress || (club?.address ? ((Object.prototype.hasOwnProperty.call(club.address, 'suburb') ? (club.address as any).suburb : (club.address as any).town) || '') : ''),
  contact: event.coordinatorContact || club?.email || club?.phone,
  coordinator: event.coordinatorName
      };
    });

    console.log(`PDF: Found ${enhancedEvents.length} events for ${scope} ${year}${scope === 'month' ? '-' + month : ''}`);

    // Prepare months array for PDF utility
    const months = [];
    if (scope === 'month') {
      months.push({ year, month });
    } else if (scope === 'year') {
      for (let m = 1; m <= 12; m++) months.push({ year, month: m });
    } else if (scope === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let y = start.getFullYear(), m = start.getMonth() + 1;
      const endY = end.getFullYear(), endM = end.getMonth() + 1;
      while (y < endY || (y === endY && m <= endM)) {
        months.push({ year: y, month: m });
        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    // Generate dynamic title based on filter scope
    let calendarTitle = 'PonyClub Events Calendar';
    if (filterScope === 'zone' && zoneId) {
      const zone = zones.find(z => z.id === zoneId);
      if (zone) {
        calendarTitle = `${zone.name} Zone Events Calendar`;
      }
    } else if (filterScope === 'club' && clubId) {
      const club = clubs.find(c => c.id === clubId);
      if (club) {
        calendarTitle = `${club.name} Events Calendar`;
      }
    }

    // Generate PDF
    const pdfBuffer = generateCalendarPDF({ 
      months, 
      events: enhancedEvents, 
      title: calendarTitle 
    });

    const filename = scope === 'month' ? `calendar_month_${year}_${month.toString().padStart(2, '0')}.pdf` :
                    scope === 'year' ? `calendar_year_${year}.pdf` :
                    `calendar_custom_${startDate}_to_${endDate}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed.' }, { status: 500 });
  }
}
