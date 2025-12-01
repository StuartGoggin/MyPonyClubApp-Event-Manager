/**
 * Equipment Automations API
 * GET /api/equipment-automations?zoneId={zoneId} - Get automation settings and history
 * POST /api/equipment-automations - Update automation settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireZoneManager } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';

const AUTOMATIONS_COLLECTION = 'equipment_automation_settings';
const BOOKINGS_COLLECTION = 'equipment_bookings';

/**
 * GET /api/equipment-automations
 * Get automation settings and history for a zone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: 'Zone ID is required' },
        { status: 400 }
      );
    }

    // Get automation settings for zone
    const settingsDoc = await adminDb
      .collection(AUTOMATIONS_COLLECTION)
      .doc(zoneId)
      .get();

    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    
    const autoApproval = {
      enabled: settings?.autoApproval?.enabled || false
    };
    
    const autoEmail = {
      bookingRequests: settings?.autoEmail?.bookingRequests || false,
      bookingApprovals: settings?.autoEmail?.bookingApprovals || false
    };

    // Get auto-approved bookings for this zone
    const autoApprovedSnapshot = await adminDb
      .collection(BOOKINGS_COLLECTION)
      .where('zoneId', '==', zoneId)
      .where('autoApproved', '==', true)
      .orderBy('approvedAt', 'desc')
      .limit(100)
      .get();

    const autoApprovedBookings = autoApprovedSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      autoApproval,
      autoEmail,
      autoApprovedBookings
    });
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch automation settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment-automations
 * Update automation settings for a zone
 * @param processExisting - If true, auto-approve existing conflict-free pending bookings when enabling auto-approval
 * @param processExistingDraftEmails - If true, approve pending draft emails when enabling auto-email
 * @param emailType - For autoEmail type: 'bookingRequests' or 'bookingApprovals'
 */
export async function POST(request: NextRequest) {
  try {
    const { zoneId, type, enabled, processExisting = false, processExistingDraftEmails = false, emailType } = await request.json();

    if (!zoneId || !type || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Zone ID, type, and enabled status are required' },
        { status: 400 }
      );
    }

    // Validate automation type
    if (!['autoApproval', 'autoEmail'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid automation type' },
        { status: 400 }
      );
    }

    // For autoEmail, emailType is required
    if (type === 'autoEmail' && !emailType) {
      return NextResponse.json(
        { success: false, error: 'Email type is required for autoEmail automation' },
        { status: 400 }
      );
    }

    // Verify user has access to this zone
    const authResult = await requireZoneManager(request, zoneId);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Update automation settings
    const settingsRef = adminDb.collection(AUTOMATIONS_COLLECTION).doc(zoneId);
    
    if (type === 'autoEmail') {
      // Update specific email automation type
      await settingsRef.set(
        {
          autoEmail: {
            [emailType]: enabled,
            updatedAt: new Date().toISOString(),
            updatedBy: user.email || 'system'
          }
        },
        { merge: true }
      );
    } else {
      // Update other automation types
      await settingsRef.set(
        {
          [type]: {
            enabled,
            updatedAt: new Date().toISOString(),
            updatedBy: user.email || 'system'
          }
        },
        { merge: true }
      );
    }

    // If enabling auto-approval and processExisting=true, auto-approve conflict-free pending bookings
    let processedCount = 0;
    let skippedCount = 0;
    const processedBookings: string[] = [];

    if (type === 'autoApproval' && enabled && processExisting) {
      console.log(`🔄 Processing existing pending bookings for zone ${zoneId}...`);
      
      // Get all equipment for this zone
      const equipmentSnapshot = await adminDb
        .collection('equipment')
        .where('zoneId', '==', zoneId)
        .get();
      
      const equipmentIds = equipmentSnapshot.docs.map((doc: any) => doc.id);
      
      if (equipmentIds.length > 0) {
        // Get all pending bookings for this zone's equipment
        const pendingBookingsSnapshot = await adminDb
          .collection(BOOKINGS_COLLECTION)
          .where('equipmentId', 'in', equipmentIds)
          .where('status', '==', 'pending')
          .get();
        
        console.log(`📊 Found ${pendingBookingsSnapshot.size} pending bookings to process`);
        
        // Process each pending booking
        for (const bookingDoc of pendingBookingsSnapshot.docs) {
          const booking = bookingDoc.data();
          const bookingId = bookingDoc.id;
          
          // Check for conflicts with other bookings
          const conflictingBookings = await adminDb
            .collection(BOOKINGS_COLLECTION)
            .where('equipmentId', '==', booking.equipmentId)
            .where('status', 'in', ['approved', 'confirmed', 'picked_up', 'in_use'])
            .get();
          
          let hasConflict = false;
          const pickupTime = new Date(booking.pickupDate).getTime();
          const returnTime = new Date(booking.returnDate).getTime();
          
          conflictingBookings.forEach((conflictDoc: any) => {
            const existingBooking = conflictDoc.data();
            
            // Skip comparing booking with itself
            if (conflictDoc.id === bookingId) {
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
            }
          });
          
          // Auto-approve if no conflict
          if (!hasConflict) {
            await adminDb.collection(BOOKINGS_COLLECTION).doc(bookingId).update({
              status: 'approved',
              approvedBy: 'auto-approval-system',
              approvedAt: new Date(),
              autoApproved: true,
              bulkProcessed: true
            });
            
            processedCount++;
            processedBookings.push(booking.bookingReference || bookingId);
            console.log(`✅ Auto-approved existing booking ${booking.bookingReference}`);
          } else {
            skippedCount++;
            console.log(`⚠️ Skipped booking ${booking.bookingReference} due to conflicts`);
          }
        }
      }
      
      console.log(`🎯 Bulk processing complete: ${processedCount} approved, ${skippedCount} skipped`);
    }

    // If enabling auto-email and processExistingDraftEmails=true, approve pending draft emails
    let emailsProcessed = 0;
    if (type === 'autoEmail' && enabled && processExistingDraftEmails) {
      console.log(`📧 Processing existing draft emails for zone ${zoneId} (${emailType})...`);
      
      try {
        // Get draft emails for this zone's equipment bookings
        const emailMetadataType = emailType === 'bookingRequests' ? 'booking_received' : 'booking_confirmed';
        
        // Query email queue for draft emails
        const draftEmailsSnapshot = await adminDb
          .collection('email_queue')
          .where('status', '==', 'draft')
          .where('type', '==', 'Equipment-Request')
          .where('metadata.emailType', '==', emailMetadataType)
          .get();
        
        console.log(`📊 Found ${draftEmailsSnapshot.size} draft ${emailType} emails`);
        
        // Filter to only emails for this zone's equipment
        const equipmentSnapshot = await adminDb
          .collection('equipment')
          .where('zoneId', '==', zoneId)
          .get();
        const zoneEquipmentIds = equipmentSnapshot.docs.map((doc: any) => doc.id);
        
        for (const emailDoc of draftEmailsSnapshot.docs) {
          const emailData = emailDoc.data();
          const equipmentId = emailData.metadata?.equipmentId;
          
          // Only process emails for this zone's equipment
          if (equipmentId && zoneEquipmentIds.includes(equipmentId)) {
            await adminDb.collection('email_queue').doc(emailDoc.id).update({
              status: 'pending', // Change from draft to pending (ready to send)
              updatedAt: new Date().toISOString(),
              approvedBy: user.email || 'auto-email-system',
              approvedAt: new Date().toISOString()
            });
            emailsProcessed++;
            console.log(`✅ Approved draft email ${emailDoc.id} for ${emailMetadataType}`);
          }
        }
        
        console.log(`📧 Email processing complete: ${emailsProcessed} emails approved`);
      } catch (emailError) {
        console.error('Error processing draft emails:', emailError);
        // Continue even if email processing fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'autoEmail' ? `Auto-email ${emailType}` : type} ${enabled ? 'enabled' : 'disabled'} successfully`,
      bulkProcessing: processExisting ? {
        processed: processedCount,
        skipped: skippedCount,
        bookings: processedBookings
      } : undefined,
      emailProcessing: processExistingDraftEmails ? {
        processed: emailsProcessed
      } : undefined
    });
  } catch (error) {
    console.error('Error updating automation settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update automation settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
