import { NextRequest, NextResponse } from 'next/server';
import { requireZoneManager } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import type { EquipmentBooking } from '@/types/equipment';

/**
 * GET /api/equipment-bookings/[id]/handover-chain
 * Get the handover chain for a specific booking (previous booking, current, next booking)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireZoneManager(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id: bookingId } = await params;

    // Fetch the current booking
    const bookingDoc = await adminDb.collection('equipment_bookings').doc(bookingId).get();
    
    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const currentBooking = {
      id: bookingDoc.id,
      ...bookingDoc.data(),
    } as EquipmentBooking;

    // Verify zone manager has access to this zone
    if (authResult.user.role === 'zone_manager' && currentBooking.zoneId !== authResult.user.zoneId) {
      return NextResponse.json(
        { error: 'Access denied - booking belongs to different zone' },
        { status: 403 }
      );
    }

    // Fetch all bookings for the same equipment
    const equipmentBookingsSnapshot = await adminDb
      .collection('equipment_bookings')
      .where('equipmentId', '==', currentBooking.equipmentId)
      .where('status', 'in', ['pending', 'confirmed', 'approved', 'picked_up', 'in_use'])
      .get();

    console.log(`[Handover Chain] Found ${equipmentBookingsSnapshot.size} bookings for equipment ${currentBooking.equipmentId}`);

    const allBookings: EquipmentBooking[] = [];
    equipmentBookingsSnapshot.forEach((doc: any) => {
      const booking = {
        id: doc.id,
        ...doc.data(),
      } as EquipmentBooking;
      // Exclude cancelled bookings from handover chain
      if (booking.status !== 'cancelled') {
        console.log(`[Handover Chain] Including booking ${booking.id} (${booking.equipmentName}) - status: ${booking.status}`);
        allBookings.push(booking);
      } else {
        console.log(`[Handover Chain] Excluding cancelled booking ${booking.id} (${booking.equipmentName})`);
      }
    });

    // Sort bookings by pickup date
    const sortedBookings = allBookings.sort((a, b) => {
      const dateA = a.pickupDate instanceof Date ? a.pickupDate : new Date(a.pickupDate);
      const dateB = b.pickupDate instanceof Date ? b.pickupDate : new Date(b.pickupDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Find the position of the current booking
    const currentIndex = sortedBookings.findIndex(b => b.id === bookingId);

    if (currentIndex === -1) {
      return NextResponse.json(
        { error: 'Booking not found in chain' },
        { status: 404 }
      );
    }

    // Build the handover chain
    const chain = {
      previous: currentIndex > 0 ? sortedBookings[currentIndex - 1] : undefined,
      current: currentBooking,
      next: currentIndex < sortedBookings.length - 1 ? sortedBookings[currentIndex + 1] : undefined,
    };

    return NextResponse.json({
      success: true,
      chain,
      metadata: {
        totalBookingsInChain: sortedBookings.length,
        positionInChain: currentIndex + 1,
      },
    });

  } catch (error) {
    console.error('Error fetching handover chain:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch handover chain',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
