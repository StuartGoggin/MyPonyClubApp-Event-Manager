/**
 * Equipment Booking Detail API Routes
 * GET /api/equipment-bookings/[id] - Get specific booking
 * PUT /api/equipment-bookings/[id] - Update booking
 * DELETE /api/equipment-bookings/[id] - Cancel booking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBooking,
  updateBooking,
  deleteBooking,
} from '@/lib/equipment-service';
import { getUserFromRequest, userHasRole, userInZone } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/equipment-bookings/[id]
 * Get booking by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const booking = await getBooking(id);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/equipment-bookings/[id]
 * Update booking
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required to update bookings',
        },
        { status: 401 }
      );
    }

    // Check if booking exists
    const existing = await getBooking(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Authorization check: Only zone rep (in same zone), state admin, or super user can modify
    const isZoneRep = userHasRole(user, 'zone_rep') && userInZone(user, existing.zoneId);
    const isAdmin = userHasRole(user, 'state_admin', 'super_user');

    if (!isZoneRep && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to modify this booking. Only zone representatives or administrators can update bookings.',
        },
        { status: 403 }
      );
    }

    // Update the booking
    const updates = await request.json();
    const updatedBooking = await updateBooking(id, updates);

    return NextResponse.json({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/equipment-bookings/[id]
 * Delete booking permanently
 * Query parameter: ?permanent=true for permanent deletion, otherwise just cancels
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';
    
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required to delete bookings',
        },
        { status: 401 }
      );
    }

    // Check if booking exists
    const existing = await getBooking(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Authorization check: Only zone rep (in same zone), state admin, or super user can delete
    const isZoneRep = userHasRole(user, 'zone_rep') && userInZone(user, existing.zoneId);
    const isAdmin = userHasRole(user, 'state_admin', 'super_user');

    if (!isZoneRep && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to delete this booking. Only zone representatives or administrators can delete bookings.',
        },
        { status: 403 }
      );
    }

    // Only super users can permanently delete bookings
    if (permanent && !userHasRole(user, 'super_user')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Only super users can permanently delete bookings. Use cancel instead.',
        },
        { status: 403 }
      );
    }

    if (permanent) {
      // Permanently delete the booking
      await deleteBooking(id);
      
      console.log(`🗑️ Booking ${id} permanently deleted by ${user.name} (${user.role})`);
      
      return NextResponse.json({
        success: true,
        message: 'Booking deleted permanently',
      });
    } else {
      // Just cancel the booking (set status to cancelled)
      await updateBooking(id, { status: 'cancelled' });
      
      // NOTE: Handover details are now computed dynamically, so no need to refresh chain
      // The handover-chain API will automatically compute the correct chain when requested
      console.log(`✅ Cancelled booking ${id} by ${user.name} (${user.role}) - handover chain will be recomputed dynamically`);
      
      // TODO: Implement booking cancellation email notifications
      
      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
