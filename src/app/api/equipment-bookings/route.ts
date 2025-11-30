/**
 * Equipment Bookings API Routes
 * GET /api/equipment-bookings - List all bookings (with filters)
 * POST /api/equipment-bookings - Create new booking
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listBookings,
  createBooking,
  updateBooking,
  getBooking,
} from '@/lib/equipment-service';
import { queueAllBookingNotifications, queueBookingConfirmationEmail, queueBookingReceivedEmail } from '@/lib/equipment-email-templates';
import { autoSendQueuedEmail } from '@/lib/auto-send-email';
import type { CreateBookingRequest } from '@/types/equipment';
import { adminDb } from '@/lib/firebase-admin';

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
      eventName: body.eventName, // Direct event name from form
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

    console.log(`📋 Booking status after creation: ${booking.status}`);
    console.log(`🔑 Booking ID: ${booking.id}`);
    console.log(`🎯 Equipment ID: ${booking.equipmentId}`);

    // Check for auto-approval if booking is pending
    if (booking.status === 'pending') {
      console.log(`✅ Booking is pending - entering conflict detection block`);
      try {
        // Get equipment details to find zoneId
        const equipmentDoc = await adminDb.collection('equipment').doc(booking.equipmentId).get();
        
        if (!equipmentDoc.exists) {
          console.log(`❌ Equipment document does NOT exist for ID: ${booking.equipmentId}`);
        } else {
          const equipment = equipmentDoc.data();
          console.log(`📦 Equipment found: ${equipment?.name}`);
          console.log(`🏷️ Equipment zoneId: ${equipment?.zoneId}`);
          console.log(`📍 Full equipment data:`, JSON.stringify(equipment, null, 2));
        }
        
        const equipment = equipmentDoc.data();
        
        if (equipment?.zoneId) {
          // ALWAYS check for conflicts with other bookings (including pending for first-come-first-served priority)
          const conflictingBookings = await adminDb
            .collection('equipment_bookings')
            .where('equipmentId', '==', booking.equipmentId)
            .where('status', 'in', ['pending', 'approved', 'confirmed', 'picked_up', 'in_use'])
            .get();
          
          console.log(`🔍 Checking conflicts for ${booking.bookingReference} (ID: ${booking.id})`);
          console.log(`📊 Found ${conflictingBookings.size} total bookings for this equipment`);
          
          let hasConflict = false;
          const conflictDetails: any[] = [];
          const pickupTime = bookingData.pickupDate.getTime();
          const returnTime = bookingData.returnDate.getTime();
          
          conflictingBookings.forEach((doc: any) => {
            const existingBooking = doc.data();
            console.log(`  Checking booking ${existingBooking.bookingReference} (doc.id: ${doc.id}, data.id: ${existingBooking.id})`);
            
            // Skip comparing booking with itself
            if (existingBooking.id === booking.id || doc.id === booking.id) {
              console.log(`    ⏭️  Skipping self-comparison`);
              return;
            }
            
            const existingPickup = new Date(existingBooking.pickupDate).getTime();
            const existingReturn = new Date(existingBooking.returnDate).getTime();
            
            // Check if dates overlap
            if (
              (pickupTime >= existingPickup && pickupTime <= existingReturn) ||
              (returnTime >= existingPickup && returnTime <= existingReturn) ||
              (pickupTime <= existingPickup && returnTime >= existingReturn)
            ) {
              hasConflict = true;
              conflictDetails.push({
                bookingReference: existingBooking.bookingReference,
                clubName: existingBooking.clubName,
                pickupDate: existingBooking.pickupDate,
                returnDate: existingBooking.returnDate,
                custodianName: existingBooking.custodian?.name
              });
            }
          });
          
          // Store conflict info in booking metadata (always, regardless of auto-approval setting)
          if (hasConflict && conflictDetails.length > 0) {
            await updateBooking(booking.id, {
              conflictDetected: true,
              conflictingBookings: conflictDetails
            });
            // Re-fetch to get updated data
            const updatedBooking = await getBooking(booking.id);
            if (updatedBooking) {
              booking.conflictDetected = true;
              booking.conflictingBookings = conflictDetails;
            }
            console.log(`⚠️ Conflict detected for ${booking.bookingReference} with ${conflictDetails.length} existing booking(s)`);
          }
          
          // Check if auto-approval is enabled for this zone
          const automationDoc = await adminDb
            .collection('equipment_automation_settings')
            .doc(equipment.zoneId)
            .get();
          
          const automationSettings = automationDoc.exists ? automationDoc.data() : {};
          const autoApprovalEnabled = automationSettings?.autoApproval?.enabled || false;
          
          if (autoApprovalEnabled) {
            // Auto-approve ONLY if no conflict
            if (!hasConflict) {
              await updateBooking(booking.id, {
                status: 'approved',
                approvedBy: 'auto-approval-system',
                approvedAt: new Date(),
                autoApproved: true
              });
              
              // Re-fetch the updated booking
              const updatedBooking = await getBooking(booking.id);
              if (updatedBooking) {
                booking.status = updatedBooking.status;
                booking.approvedBy = updatedBooking.approvedBy;
                booking.approvedAt = updatedBooking.approvedAt;
              }
              
              console.log(`✅ Booking ${booking.bookingReference} auto-approved (no conflicts)`);
              
              // Check if auto-email is also enabled - send full confirmation email
              const autoEmailEnabled = automationSettings?.autoEmail?.enabled || false;
              if (autoEmailEnabled && updatedBooking) {
                try {
                  await queueBookingConfirmationEmail(updatedBooking);
                  console.log(`📧 Auto-email (confirmation) queued for auto-approved booking ${booking.bookingReference}`);
                } catch (emailError) {
                  console.error('Error queueing auto-email:', emailError);
                }
              }
            } else {
              console.log(`⏸️ Booking ${booking.bookingReference} requires manual approval (conflict detected)`);
            }
          }
        }
      } catch (autoApprovalError) {
        console.error('Error checking auto-approval:', autoApprovalError);
        // Don't fail the booking creation if auto-approval check fails
      }
    }

    // Queue confirmation email
    const queueEmail = body.queueEmail !== false; // Default to true
    if (queueEmail) {
      try {
        // Send different email based on booking status
        let emailIds: string[] = [];
        if (booking.status === 'approved') {
          // Booking is approved - send confirmation with full details
          const result = await queueAllBookingNotifications(booking, 'confirmed');
          emailIds = result.ids;
          console.log(`📧 Booking confirmation emails queued for ${booking.bookingReference}`);
        } else {
          // Booking is pending - send received notification
          const result = await queueAllBookingNotifications(booking, 'received');
          emailIds = result.ids;
          console.log(`📧 Booking received emails queued for ${booking.bookingReference}`);
        }
        
        // Auto-send pending emails (if auto-send is enabled, emails will have status='pending')
        for (const emailId of emailIds) {
          try {
            console.log(`🚀 Attempting auto-send for email ${emailId}`);
            const autoSendResult = await autoSendQueuedEmail(emailId);
            if (autoSendResult.success) {
              console.log(`✅ Email ${emailId} auto-sent successfully`);
            } else {
              console.log(`⏸️ Email ${emailId} not auto-sent: ${autoSendResult.error}`);
            }
          } catch (autoSendError) {
            console.error(`Auto-send error for email ${emailId}:`, autoSendError);
            // Don't fail the booking if auto-send fails
          }
        }
      } catch (emailError) {
        console.error('Error queueing email:', emailError);
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
