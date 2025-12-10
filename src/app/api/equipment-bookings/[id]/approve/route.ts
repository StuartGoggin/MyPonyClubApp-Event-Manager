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
import { requireZoneManager } from '@/lib/api-auth';
import { queueAllBookingNotifications } from '@/lib/equipment-email-templates';
import { autoSendQueuedEmail } from '@/lib/auto-send-email';
import { adminDb } from '@/lib/firebase-admin';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/equipment-bookings/[id]/approve
 * Approve a pending booking
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  try {
    // Parse body if present, otherwise use empty object
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No body or invalid JSON, use empty object
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
          error: `Booking cannot be approved. Current status: ${booking.status}`,
        },
        { status: 400 }
      );
    }

    // Require zone manager authentication for the booking's zone
    const authResult = await requireZoneManager(request, booking.zoneId);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;
    const approvedBy = user.id;

    // Update booking status to approved
    console.log('Updating booking:', id, 'with:', {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });
    
    await updateBooking(id, {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
    });

    console.log('Booking updated successfully, fetching updated booking...');
    
    const updated = await getBooking(id);
    console.log('Updated booking fetched:', updated?.bookingReference);

    // Send approval notification email with handover details
    if (updated) {
      try {
        const result = await queueAllBookingNotifications(updated, 'approved');
        console.log('✅ Approval emails queued for booking:', id);
        
        // Auto-send pending emails
        for (const emailId of result.ids) {
          try {
            console.log(`🚀 Attempting auto-send for approval email ${emailId}`);
            const autoSendResult = await autoSendQueuedEmail(emailId);
            if (autoSendResult.success) {
              console.log(`✅ Approval email ${emailId} auto-sent successfully`);
            } else {
              console.log(`⏸️ Approval email ${emailId} not auto-sent: ${autoSendResult.error}`);
            }
          } catch (autoSendError) {
            console.error(`Auto-send error for email ${emailId}:`, autoSendError);
            // Don't fail the approval if auto-send fails
          }
        }
      } catch (emailError) {
        console.error('Error queueing approval emails:', emailError);
        // Don't fail the approval if email queueing fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Booking approved successfully',
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
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
