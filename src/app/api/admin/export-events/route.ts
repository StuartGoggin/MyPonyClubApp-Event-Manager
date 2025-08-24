import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, getAllEventTypes, getAllClubs, getAllZones } from '@/lib/server-data';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting events export process...');

    // Fetch all related data for comprehensive export
    console.log('📅 Fetching events...');
    const events = await getAllEvents();
    console.log(`✅ Retrieved ${events.length} events`);

    console.log('🏷️ Fetching event types...');
    const eventTypes = await getAllEventTypes();
    console.log(`✅ Retrieved ${eventTypes.length} event types`);

    console.log('🏇 Fetching clubs for reference...');
    const clubs = await getAllClubs();
    console.log(`✅ Retrieved ${clubs.length} clubs`);

    console.log('📍 Fetching zones for reference...');
    const zones = await getAllZones();
    console.log(`✅ Retrieved ${zones.length} zones`);

    // Create mappings for enriched data
    const clubsMap = clubs.reduce((acc, club) => {
      acc[club.id] = club;
      return acc;
    }, {} as Record<string, any>);

    const zonesMap = zones.reduce((acc, zone) => {
      acc[zone.id] = zone;
      return acc;
    }, {} as Record<string, any>);

    const eventTypesMap = eventTypes.reduce((acc, eventType) => {
      acc[eventType.id] = eventType;
      return acc;
    }, {} as Record<string, any>);

    // Enrich events with related data
    const enrichedEvents = events.map(event => ({
      ...event,
      clubName: event.clubId ? clubsMap[event.clubId]?.name || 'Unknown Club' : 'Unknown Club',
      zoneName: event.clubId && clubsMap[event.clubId] ? zonesMap[clubsMap[event.clubId].zoneId]?.name || 'Unknown Zone' : 'Unknown Zone',
      eventTypeName: event.eventTypeId ? eventTypesMap[event.eventTypeId]?.name || 'Unknown Event Type' : 'Unknown Event Type',
      club: event.clubId ? clubsMap[event.clubId] || null : null,
      zone: event.clubId && clubsMap[event.clubId] ? zonesMap[clubsMap[event.clubId].zoneId] || null : null,
      eventType: event.eventTypeId ? eventTypesMap[event.eventTypeId] || null : null
    }));

    // Group events by status for summary
    const eventsByStatus = events.reduce((acc, event) => {
      if (!acc[event.status]) acc[event.status] = [];
      acc[event.status].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    // Group events by event type for summary
    const eventsByType = events.reduce((acc, event) => {
      const typeName = eventTypesMap[event.eventTypeId]?.name || 'Unknown Type';
      if (!acc[typeName]) acc[typeName] = [];
      acc[typeName].push(event);
      return acc;
    }, {} as Record<string, any[]>);

    // Create export data structure
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: 'Pony Club Event Manager',
        version: '1.0',
        totalEvents: events.length,
        totalEventTypes: eventTypes.length,
        totalClubs: clubs.length,
        totalZones: zones.length,
        description: 'Complete export of events and related data from Pony Club Event Manager database'
      },
      events: enrichedEvents,
      eventTypes: eventTypes,
      summary: {
        eventsByStatus: Object.keys(eventsByStatus).map(status => ({
          status,
          count: eventsByStatus[status].length,
          events: eventsByStatus[status].map(e => ({
            id: e.id,
            name: e.name,
            date: e.date,
            clubName: clubsMap[e.clubId]?.name || 'Unknown Club'
          }))
        })),
        eventsByType: Object.keys(eventsByType).map(typeName => ({
          eventType: typeName,
          count: eventsByType[typeName].length,
          events: eventsByType[typeName].map(e => ({
            id: e.id,
            name: e.name,
            date: e.date,
            status: e.status,
            clubName: clubsMap[e.clubId]?.name || 'Unknown Club'
          }))
        })),
        statusCounts: Object.keys(eventsByStatus).reduce((acc, status) => {
          acc[status] = eventsByStatus[status].length;
          return acc;
        }, {} as Record<string, number>),
        typeCounts: Object.keys(eventsByType).reduce((acc, typeName) => {
          acc[typeName] = eventsByType[typeName].length;
          return acc;
        }, {} as Record<string, number>)
      },
      references: {
        clubs: clubs,
        zones: zones,
        eventTypes: eventTypes
      }
    };

    console.log('✅ Events export completed successfully');

    // Return the data as JSON
    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `pony-club-events-export-${new Date().toISOString().split('T')[0]}.json`
    });

  } catch (error) {
    console.error('❌ Error exporting events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to export events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
