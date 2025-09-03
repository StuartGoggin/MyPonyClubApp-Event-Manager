import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarPDF } from '@/lib/calendar-pdf';
import { getEvents, getClubs, getEventTypes } from '@/lib/data';

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

    // Fetch real events from Firestore
    const [events, clubs, eventTypes] = await Promise.all([
      getEvents(),
      getClubs(), 
      getEventTypes()
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
        location: event.location || club?.physicalAddress || club?.address?.suburb,
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

    // Generate PDF
    const pdfBuffer = generateCalendarPDF({ 
      months, 
      events: enhancedEvents, 
      title: 'PonyClub Events Calendar' 
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
