/**
 * Equipment Bookings Calendar API
 * GET /api/calendar/equipment-bookings - Get equipment bookings formatted as calendar events
 */

import { NextRequest, NextResponse } from 'next/server';
import { listBookings, getEquipment } from '@/lib/equipment-service';
import { type Event } from '@/lib/types';
import { eachDayOfInterval } from 'date-fns';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar/equipment-bookings
 * Returns equipment bookings formatted as calendar events
 * Query params: zoneId, clubId, startDate, endDate
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: any = {};
    const zoneId = searchParams.get('zoneId');
    const clubId = searchParams.get('clubId');
    
    if (zoneId && zoneId !== 'all') {
      filters.zoneId = zoneId;
    }
    
    if (clubId && clubId !== 'all') {
      filters.clubId = clubId;
    }

    // Fetch all equipment bookings
    const bookings = await listBookings(filters);
    
    // Filter to show all bookings except cancelled/rejected
    const activeBookings = bookings.filter(b => 
      !['cancelled', 'rejected'].includes(b.status)
    );

    // Fetch all equipment upfront to avoid N+1 queries
    const uniqueEquipmentIds = [...new Set(activeBookings.map(b => b.equipmentId))];
    const equipmentMap = new Map();
    
    // Fetch equipment in parallel
    await Promise.all(
      uniqueEquipmentIds.map(async (id) => {
        const equipment = await getEquipment(id);
        if (equipment) {
          equipmentMap.set(id, equipment);
        }
      })
    );

    // Convert bookings to calendar events
    // Each booking creates events for each day of the rental period
    const calendarEvents: Event[] = [];
    
    for (const booking of activeBookings) {
      const pickupDate = new Date(booking.pickupDate);
      const returnDate = new Date(booking.returnDate);
      
      // Get the equipment icon from our pre-fetched map
      const equipment = equipmentMap.get(booking.equipmentId);
      const equipmentIcon = equipment?.icon || '📦';
      
      // Generate an event for each day of the booking
      const days = eachDayOfInterval({ start: pickupDate, end: returnDate });
      
      for (const day of days) {
        // Map booking status to calendar event status
        // 'pending' bookings show as 'proposed' on calendar
        // 'approved', 'confirmed', etc. show as 'approved'
        const eventStatus = booking.status === 'pending' ? 'proposed' : 'approved';
        
        calendarEvents.push({
          id: `${booking.id}-${day.toISOString().split('T')[0]}`,
          name: `${equipmentIcon} ${booking.equipmentName}`,
          title: `${equipmentIcon} ${booking.equipmentName}`,
          description: `Equipment: ${booking.equipmentName}\nClub: ${booking.clubName}${booking.eventName ? `\nEvent: ${booking.eventName}` : ''}\nCustodian: ${booking.custodian.name}\nStatus: ${booking.status}`,
          date: day,
          location: booking.useLocation.address,
          status: eventStatus,
          source: 'equipment_booking',
          clubId: booking.clubId,
          zoneId: booking.zoneId,
          eventTypeId: '', // Equipment bookings don't have event types
          // Add metadata for identifying the booking
          metadata: {
            bookingId: booking.id,
            bookingReference: booking.bookingReference,
            equipmentId: booking.equipmentId,
            equipmentName: booking.equipmentName,
            equipmentIcon: equipmentIcon,
            custodianName: booking.custodian.name,
            custodianEmail: booking.custodian.email,
            pickupDate: booking.pickupDate,
            returnDate: booking.returnDate,
            bookingStatus: booking.status,
          }
        } as Event);
      }
    }

    return NextResponse.json({
      success: true,
      data: calendarEvents,
      count: calendarEvents.length,
      bookingsCount: activeBookings.length,
    });
  } catch (error) {
    console.error('Error fetching equipment bookings for calendar:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment bookings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
