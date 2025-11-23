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
} from '@/lib/equipment-service';

interface RouteParams {
  params: {
    id: string;
  };
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
    const { id } = params;
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
    const { id } = params;
    const body = await request.json();

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

    // TODO: Add authorization check (only zone manager or booking owner)

    // Update booking
    await updateBooking(id, body);

    // Fetch updated booking
    const updated = await getBooking(id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking updated successfully',
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
 * Cancel booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

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

    // TODO: Add authorization check
    // TODO: Implement booking cancellation workflow with email notifications

    // Cancel booking (set status to cancelled)
    await updateBooking(id, { status: 'cancelled' });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
