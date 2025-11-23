/**
 * Equipment Booking Approval API
 * POST /api/equipment-bookings/[id]/approve - Approve a pending booking
 * POST /api/equipment-bookings/[id]/reject - Reject a pending booking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getBooking,
  updateBooking,
} from '@/lib/equipment-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/equipment-bookings/[id]/approve
 * Approve a pending booking
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if booking exists
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

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Booking cannot be approved. Current status: ${booking.status}`,
        },
        { status: 400 }
      );
    }

    // TODO: Add authorization check for zone manager role

    const approvedBy = body.approvedBy || 'system';

    // Update booking status to approved
    await updateBooking(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });

    // TODO: Send approval notification email
    // TODO: Update adjacent bookings' handover details if needed

    const updated = await getBooking(id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking approved successfully',
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
