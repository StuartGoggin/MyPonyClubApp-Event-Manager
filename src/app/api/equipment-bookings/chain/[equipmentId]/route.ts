/**
 * Equipment Booking Chain API
 * GET /api/equipment-bookings/chain/[equipmentId] - Get booking chain for equipment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBookingChain } from '@/lib/equipment-service';
import { addDays } from 'date-fns';

interface RouteParams {
  params: {
    equipmentId: string;
  };
}

/**
 * GET /api/equipment-bookings/chain/[equipmentId]
 * Get booking chain for equipment within a date range
 * Query params: startDate, endDate (optional, defaults to ±30 days from now)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { equipmentId } = params;
    const { searchParams } = new URL(request.url);

    // Default to 30 days before and after current date
    const now = new Date();
    const defaultStart = addDays(now, -30);
    const defaultEnd = addDays(now, 30);

    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : defaultStart;

    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : defaultEnd;

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

    const chain = await getBookingChain(equipmentId, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: chain,
      count: chain.length,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching booking chain:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking chain',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
