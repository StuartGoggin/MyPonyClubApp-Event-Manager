/**
 * Equipment Booking Rejection API
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
 * POST /api/equipment-bookings/[id]/reject
 * Reject a pending booking
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // Parse body safely
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // Invalid JSON
    }

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
          error: `Booking cannot be rejected. Current status: ${booking.status}`,
        },
        { status: 400 }
      );
    }

    // Require rejection reason
    if (!body.rejectionReason) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rejection reason is required',
        },
        { status: 400 }
      );
    }

    // TODO: Add authorization check for zone manager role

    // Update booking status to cancelled with rejection reason
    await updateBooking(id, {
      status: 'cancelled',
      rejectionReason: body.rejectionReason,
    });

    // TODO: Send rejection notification email

    const updated = await getBooking(id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking rejected',
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reject booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
