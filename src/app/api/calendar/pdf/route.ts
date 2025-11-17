import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarPDF } from '@/lib/calendar-pdf';
import { getAllEvents, getAllClubs, getAllEventTypes, getAllZones } from '@/lib/server-data';

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
    const format = searchParams.get('format') || 'standard';
    
    // Event sources (comma-separated list: 'pca', 'zone', 'state', 'ev_scraper', 'equestrian_victoria', 'public_holiday')
    const eventSourcesParam = searchParams.get('eventSources') || '';
    const eventSources = eventSourcesParam.split(',').filter(s => s.length > 0);

    // Fetch real events from Firestore using cached functions
    const [events, clubs, eventTypes, zones] = await Promise.all([
      getAllEvents(),
      getAllClubs(), 
      getAllEventTypes(),
      getAllZones()
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

    // STEP 1: Apply event source filtering first
    // Map event sources to event categories to include
    // Event sources: 'pca' (club events), 'zone', 'state', 'ev_scraper', 'equestrian_victoria', 'public_holiday'
    const includeClubEvents = eventSources.includes('pca');
    const includeZoneEvents = eventSources.includes('zone');
    const includeStateEvents = eventSources.includes('state');
    const includeEVEvents = eventSources.includes('ev_scraper') || eventSources.includes('equestrian_victoria');
    const includePublicHolidays = eventSources.includes('public_holiday');
    
    filteredEvents = filteredEvents.filter(event => {
      // Determine event category
      const isPublicHoliday = event.status === 'public_holiday' || event.source === 'public_holiday';
      const isEVEvent = event.source === 'ev_scraper' || event.source === 'equestrian_victoria' || event.status === 'ev_event';
      const isStateEvent = event.source === 'state';
      const isZoneEvent = event.zoneId && !event.clubId;
      const isClubEvent = event.clubId && !isPublicHoliday && !isEVEvent && !isStateEvent;
      
      // Apply event type filters based on event sources
      if (isPublicHoliday && !includePublicHolidays) return false;
      if (isEVEvent && !includeEVEvents) return false;
      if (isStateEvent && !includeStateEvents) return false;
      if (isZoneEvent && !includeZoneEvents) return false;
      if (isClubEvent && !includeClubEvents) return false;
      
      return true;
    });

    // STEP 2: Apply zone/club scope filtering
    // This only filters which zone/club events to include (state, EV, and public holidays are always included if enabled above)
    if (filterScope === 'zone' && zoneId) {
      // Filter for specific zone: only include zone-level events and club events from this zone
      const zoneClubs = clubs.filter(club => club.zoneId === zoneId);
      const zoneClubIds = zoneClubs.map(club => club.id);
      filteredEvents = filteredEvents.filter(event => {
        // Determine event category
        const isPublicHoliday = event.status === 'public_holiday' || event.source === 'public_holiday';
        const isEVEvent = event.source === 'ev_scraper' || event.source === 'equestrian_victoria' || event.status === 'ev_event';
        const isStateEvent = event.source === 'state';
        
        // Always include public holidays, EV events, and state events (already filtered by event type above)
        if (isPublicHoliday || isEVEvent || isStateEvent) {
          return true;
        }
        
        // For zone/club events, only include those in the selected zone
        return (event.zoneId === zoneId && !event.clubId) || // Zone-level events
               (event.clubId && zoneClubIds.includes(event.clubId)); // Club events within the zone
      });
    } else if (filterScope === 'club' && clubId) {
      // Filter for specific club: only include events from this club
      filteredEvents = filteredEvents.filter(event => {
        // Determine event category
        const isPublicHoliday = event.status === 'public_holiday' || event.source === 'public_holiday';
        const isEVEvent = event.source === 'ev_scraper' || event.source === 'equestrian_victoria' || event.status === 'ev_event';
        const isStateEvent = event.source === 'state';
        
        // Always include public holidays, EV events, and state events (already filtered by event type above)
        if (isPublicHoliday || isEVEvent || isStateEvent) {
          return true;
        }
        
        // For club events, only include those for the selected club
        return event.clubId === clubId;
      });
    }
    // If filterScope === 'all', no zone/club scope filtering - all events are included based on event type filters

    // Enhance events with additional information
    const enhancedEvents = filteredEvents.map(event => {
      const club = clubs.find(c => c.id === event.clubId);
      const eventType = eventTypes.find(et => et.id === event.eventTypeId);
      const zone = zones.find(z => z.id === (club?.zoneId || event.zoneId));
      
      // Check if this is a public holiday
      const isPublicHoliday = event.status === 'public_holiday' || event.source === 'public_holiday';
      
      // Check if this is a zone-level event (has zoneId but no clubId)
      const isZoneEvent = event.zoneId && !event.clubId;
      
      // Check if this is a state-level event
      const isStateEvent = event.source === 'state';
      
      return {
  name: event.name || eventType?.name || 'Event',
  date: event.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
  status: event.status || 'pending',
  club: isPublicHoliday ? '' : isStateEvent ? 'State Event' : isZoneEvent ? `${zone?.name || 'Zone'} (Zone Event)` : (club?.name || ''),
  eventType: eventType?.name,
  location: event.location || club?.physicalAddress || (club?.address ? ((Object.prototype.hasOwnProperty.call(club.address, 'suburb') ? (club.address as any).suburb : (club.address as any).town) || '') : ''),
  contact: event.coordinatorContact || club?.email || club?.phone,
  coordinator: event.coordinatorName,
  zone: zone?.name || 'Unknown Zone',
  state: 'VIC', // Default to VIC for now - can be enhanced later
  isQualifier: event.isQualifier || false,
  source: event.source // Pass the source field to PDF generator
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
        // Remove "Zone" from the end of zone name if it exists to avoid duplication
        const zoneName = zone.name.replace(/\s+Zone$/i, '');
        calendarTitle = `${zoneName} Zone Events Calendar`;
      }
    } else if (filterScope === 'club' && clubId) {
      const club = clubs.find(c => c.id === clubId);
      if (club) {
        // Remove "Pony Club" from the end of club name if it exists to avoid duplication
        const clubName = club.name.replace(/\s+Pony Club$/i, '');
        calendarTitle = `${clubName} Events Calendar`;
      }
    }

    // Generate PDF
    const pdfBuffer = generateCalendarPDF({ 
      months, 
      events: enhancedEvents, 
      title: calendarTitle,
      format: format as 'standard' | 'zone' // Pass format to existing generator
    });

    // Generate filename with zone-specific naming convention when format is 'zone'
    let filename = '';
    
    // Helper function to format date as DDmmmYYYY
    const formatAsOfDate = (date: Date): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                          'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthName = monthNames[date.getMonth()];
      const yearNum = date.getFullYear();
      return `${day}${monthName}${yearNum}`;
    };
    
    const today = new Date();
    const asOfDate = formatAsOfDate(today);
    
    console.log('PDF Filename generation:', { format, filterScope, zoneId, clubId, scope, year, month });
    
    // Zone format with zone filter
    if (format === 'zone' && filterScope === 'zone' && zoneId) {
      const zone = zones.find(z => z.id === zoneId);
      const zoneName = zone?.name || 'Zone';
      
      if (scope === 'month') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[month - 1];
        filename = `${zoneName} ${monthName} ${year} as of ${asOfDate}.pdf`;
      } else if (scope === 'year') {
        filename = `${zoneName} Calendar ${year} as of ${asOfDate}.pdf`;
      } else if (scope === 'custom') {
        filename = `${zoneName} Calendar ${startDate} to ${endDate} as of ${asOfDate}.pdf`;
      }
      console.log('Generated zone filename:', filename);
    }
    // Zone format with club filter
    else if (format === 'zone' && filterScope === 'club' && clubId) {
      const club = clubs.find(c => c.id === clubId);
      const clubName = club?.name || 'Club';
      
      if (scope === 'month') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[month - 1];
        filename = `${clubName} ${monthName} ${year} as of ${asOfDate}.pdf`;
      } else if (scope === 'year') {
        filename = `${clubName} Calendar ${year} as of ${asOfDate}.pdf`;
      } else if (scope === 'custom') {
        filename = `${clubName} Calendar ${startDate} to ${endDate} as of ${asOfDate}.pdf`;
      }
      console.log('Generated club filename:', filename);
    }
    // Zone format with all events
    else if (format === 'zone' && filterScope === 'all') {
      if (scope === 'month') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[month - 1];
        filename = `PonyClub Events ${monthName} ${year} as of ${asOfDate}.pdf`;
      } else if (scope === 'year') {
        filename = `PonyClub Events Calendar ${year} as of ${asOfDate}.pdf`;
      } else if (scope === 'custom') {
        filename = `PonyClub Events ${startDate} to ${endDate} as of ${asOfDate}.pdf`;
      }
      console.log('Generated all events filename:', filename);
    }
    // Standard format downloads
    else {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      if (scope === 'month') {
        const monthName = monthNames[month - 1];
        if (filterScope === 'zone' && zoneId) {
          const zone = zones.find(z => z.id === zoneId);
          const zoneName = zone?.name || 'Zone';
          filename = `${zoneName} ${monthName} ${year} as of ${asOfDate}.pdf`;
        } else if (filterScope === 'club' && clubId) {
          const club = clubs.find(c => c.id === clubId);
          const clubName = club?.name || 'Club';
          filename = `${clubName} ${monthName} ${year} as of ${asOfDate}.pdf`;
        } else {
          filename = `PonyClub Events ${monthName} ${year} as of ${asOfDate}.pdf`;
        }
      } else if (scope === 'year') {
        if (filterScope === 'zone' && zoneId) {
          const zone = zones.find(z => z.id === zoneId);
          const zoneName = zone?.name || 'Zone';
          filename = `${zoneName} Calendar ${year} as of ${asOfDate}.pdf`;
        } else if (filterScope === 'club' && clubId) {
          const club = clubs.find(c => c.id === clubId);
          const clubName = club?.name || 'Club';
          filename = `${clubName} Calendar ${year} as of ${asOfDate}.pdf`;
        } else {
          filename = `PonyClub Events Calendar ${year} as of ${asOfDate}.pdf`;
        }
      } else if (scope === 'custom') {
        if (filterScope === 'zone' && zoneId) {
          const zone = zones.find(z => z.id === zoneId);
          const zoneName = zone?.name || 'Zone';
          filename = `${zoneName} Calendar ${startDate} to ${endDate} as of ${asOfDate}.pdf`;
        } else if (filterScope === 'club' && clubId) {
          const club = clubs.find(c => c.id === clubId);
          const clubName = club?.name || 'Club';
          filename = `${clubName} Calendar ${startDate} to ${endDate} as of ${asOfDate}.pdf`;
        } else {
          filename = `PonyClub Events ${startDate} to ${endDate} as of ${asOfDate}.pdf`;
        }
      }
      console.log('Generated standard filename:', filename);
    }

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
