/**
 * Equipment Bookings API Routes
 * GET /api/equipment-bookings - List all bookings (with filters)
 * POST /api/equipment-bookings - Create new booking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listBookings,
  createBooking,
} from '@/lib/equipment-service';
import { queueBookingConfirmationEmail } from '@/lib/equipment-email-templates';
import type { CreateBookingRequest } from '@/types/equipment';

/**
 * GET /api/equipment-bookings
 * List bookings with optional filters
 * Query params: equipmentId, clubId, zoneId, status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      equipmentId: searchParams.get('equipmentId') || undefined,
      clubId: searchParams.get('clubId') || undefined,
      zoneId: searchParams.get('zoneId') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const bookings = await listBookings(filters);

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment-bookings
 * Create new equipment booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Get authenticated user info
    const requestedBy = body.requestedBy || 'system';
    const requestedByEmail = body.requestedByEmail || 'system@example.com';

    // Validate required fields
    const requiredFields = [
      'equipmentId',
      'clubId',
      'pickupDate',
      'returnDate',
      'custodian',
      'useLocation',
    ];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missingFields,
        },
        { status: 400 }
      );
    }

    // Validate custodian fields
    if (!body.custodian.name || !body.custodian.email || !body.custodian.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Custodian must have name, email, and phone',
        },
        { status: 400 }
      );
    }

    // Validate use location
    if (!body.useLocation.address || !body.useLocation.coordinates) {
      return NextResponse.json(
        {
          success: false,
          error: 'Use location must have address and coordinates',
        },
        { status: 400 }
      );
    }

    const bookingData: CreateBookingRequest = {
      equipmentId: body.equipmentId,
      clubId: body.clubId,
      linkedEventId: body.linkedEventId,
      pickupDate: new Date(body.pickupDate),
      returnDate: new Date(body.returnDate),
      custodian: body.custodian,
      backupContact: body.backupContact,
      useLocation: body.useLocation,
      specialRequirements: body.specialRequirements,
      clubNotes: body.clubNotes,
    };

    const booking = await createBooking(
      bookingData,
      requestedBy,
      requestedByEmail
    );

    // Queue confirmation email
    const queueEmail = body.queueEmail !== false; // Default to true
    if (queueEmail) {
      try {
        await queueBookingConfirmationEmail(booking, true);
        console.log(`📧 Booking confirmation email queued for ${booking.bookingReference}`);
      } catch (emailError) {
        console.error('Error queueing confirmation email:', emailError);
        // Don't fail the booking if email fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: booking,
        message: 'Equipment booking created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
