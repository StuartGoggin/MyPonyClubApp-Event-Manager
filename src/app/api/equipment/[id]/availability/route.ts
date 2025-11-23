/**
 * Equipment Availability Check API
 * POST /api/equipment/[id]/availability - Check if equipment is available for date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/equipment-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/equipment/[id]/availability
 * Check equipment availability for a date range
 * Body: { startDate: string, endDate: string, excludeBookingId?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: startDate and endDate',
        },
        { status: 400 }
      );
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format',
        },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'End date must be after start date',
        },
        { status: 400 }
      );
    }

    const availability = await checkAvailability(
      id,
      startDate,
      endDate,
      body.excludeBookingId
    );

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
