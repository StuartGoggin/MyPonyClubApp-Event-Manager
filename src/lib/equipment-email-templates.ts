/**
 * Equipment Rental Email Templates
 * 
 * This file contains email templates for equipment booking notifications,
 * handover coordination, and location changes. Uses the existing email queue system.
 */

import { EquipmentBooking, HandoverDetails } from '@/types/equipment';
import { format } from 'date-fns';
import { addEmailToQueue, getEmailQueueConfig } from '@/lib/email-queue-admin';
import { adminDb } from '@/lib/firebase-admin';
import { computeHandoverDetails } from '@/lib/equipment-service';

// =======================================================================
// EMAIL TEMPLATE GENERATION FUNCTIONS
// =======================================================================

/**
 * Generate booking received (pending) email HTML
 * Sent when booking is created but awaiting approval
 */
export function generateBookingReceivedHTML(booking: EquipmentBooking): string {
  const pickupDate = format(new Date(booking.pickupDate), 'EEEE, MMMM d, yyyy');
  const returnDate = format(new Date(booking.returnDate), 'EEEE, MMMM d, yyyy');
  const hasConflict = (booking as any).conflictDetected === true;
  const conflictingBookings = (booking as any).conflictingBookings || [];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Equipment Booking Received</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  
  <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${hasConflict ? '#dc3545 0%, #c82333 100%' : '#f59e0b 0%, #d97706 100%'}); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">${hasConflict ? '⚠️ CONFLICT - Manual Approval Required' : '📨 Equipment Booking Request Received'}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Reference: ${booking.bookingReference}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <p style="font-size: 16px; margin-bottom: 25px;">Hi ${booking.custodian.name},</p>
      
      <p style="font-size: 16px;">Thank you for your equipment booking request! Your request has been received and is currently awaiting approval from the zone equipment manager.</p>

      ${hasConflict ? `
      <!-- CONFLICT ALERT -->
      <div style="background: #f8d7da; border: 3px solid #dc3545; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 20px;">🚨 SCHEDULING CONFLICT DETECTED - MANUAL REVIEW REQUIRED</h3>
        <p style="margin: 0 0 15px 0; color: #721c24; font-size: 15px; font-weight: 600;">
          This booking overlaps with ${conflictingBookings.length} existing ${conflictingBookings.length === 1 ? 'booking' : 'bookings'}. 
          Zone manager must review and approve manually.
        </p>
        <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #721c24;">Conflicting ${conflictingBookings.length === 1 ? 'Booking' : 'Bookings'}:</p>
          ${conflictingBookings.map((conflict: any) => `
          <div style="border-left: 3px solid #dc3545; padding: 8px 12px; margin: 8px 0; background: #fff5f5;">
            <strong>${conflict.clubName}</strong> (${conflict.bookingReference})<br>
            ${conflict.custodianName ? conflict.custodianName + '<br>' : ''}
            ${format(new Date(conflict.pickupDate), 'MMM d')} - ${format(new Date(conflict.returnDate), 'MMM d, yyyy')}
          </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Status Alert -->
      <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 18px;">⏳ Awaiting Approval</h3>
        <p style="margin: 0; color: #856404; font-size: 14px;">
          Your booking request is being reviewed. You will receive a confirmation email once it has been approved. 
          This typically happens within 24-48 hours.
        </p>
      </div>

      <!-- Booking Details -->
      <div style="background: #f8f9fa; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 5px;">
        <h2 style="margin: 0 0 15px 0; color: #f59e0b; font-size: 20px;">📦 Booking Request Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 140px;">Equipment:</td>
            <td style="padding: 8px 0;">${booking.equipmentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Reference:</td>
            <td style="padding: 8px 0;">${booking.bookingReference}</td>
          </tr>
          ${booking.eventName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">For Event:</td>
            <td style="padding: 8px 0;">${booking.eventName}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Requested Period:</td>
            <td style="padding: 8px 0;">${pickupDate} to ${returnDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Duration:</td>
            <td style="padding: 8px 0;">${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'}</td>
          </tr>
        </table>
      </div>

      <!-- Estimated Pricing -->
      <div style="background: #f0f7ff; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">💰 Payment Details</h3>
        <div style="background: white; border-radius: 5px; padding: 15px; margin-bottom: 15px;">
          <div style="font-weight: 700; font-size: 24px; color: #1976d2; margin-bottom: 5px;">Total Hiring Fee: $${booking.pricing.totalCharge.toFixed(2)}</div>
          <div style="font-size: 14px; color: #666;">${booking.pricingType === 'flat_fee' ? 'Flat fee' : `For ${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'} hire period`}</div>
        </div>
      </div>

      ${booking.specialRequirements ? `
      <div style="background: #e8eaf6; border-left: 4px solid #5c6bc0; padding: 15px; margin: 20px 0; border-radius: 3px;">
        <p style="margin: 0; font-weight: 600; color: #3949ab;">Special Requirements:</p>
        <p style="margin: 8px 0 0 0; color: #3949ab;">${booking.specialRequirements}</p>
      </div>
      ` : ''}

      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 25px 0; border-radius: 3px;">
        <p style="margin: 0; font-size: 14px; color: #0d47a1;">
          <strong>📧 Next Steps:</strong><br>
          You will receive a confirmation email with pickup and return details once your booking is approved. 
          If you have any questions or need to modify your request, please contact your zone equipment manager.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        Booking Reference: ${booking.bookingReference}<br>
        Status: Pending Approval<br>
        This is an automated message from MyPonyClub Equipment Management System
      </p>
    </div>

  </div>

</body>
</html>
  `;
}

/**
 * Generate booking received (pending) email plain text version
 */
export function generateBookingReceivedText(booking: EquipmentBooking): string {
  const pickupDate = format(new Date(booking.pickupDate), 'EEEE, MMMM d, yyyy');
  const returnDate = format(new Date(booking.returnDate), 'EEEE, MMMM d, yyyy');
  const hasConflict = (booking as any).conflictDetected === true;
  const conflictingBookings = (booking as any).conflictingBookings || [];

  let text = hasConflict ? `⚠️ CONFLICT - MANUAL APPROVAL REQUIRED\n` : `📨 EQUIPMENT BOOKING REQUEST RECEIVED\n`;
  text += `Reference: ${booking.bookingReference}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Hi ${booking.custodian.name},\n\n`;
  text += `Thank you for your equipment booking request!\n\n`;
  
  if (hasConflict) {
    text += `🚨 SCHEDULING CONFLICT DETECTED - MANUAL REVIEW REQUIRED\n\n`;
    text += `This booking overlaps with ${conflictingBookings.length} existing ${conflictingBookings.length === 1 ? 'booking' : 'bookings'}.\n`;
    text += `Zone manager must review and approve manually.\n\n`;
    text += `Conflicting ${conflictingBookings.length === 1 ? 'Booking' : 'Bookings'}:\n`;
    conflictingBookings.forEach((conflict: any) => {
      text += `  • ${conflict.clubName} (${conflict.bookingReference})\n`;
      if (conflict.custodianName) text += `    ${conflict.custodianName}\n`;
      text += `    ${format(new Date(conflict.pickupDate), 'MMM d')} - ${format(new Date(conflict.returnDate), 'MMM d, yyyy')}\n`;
    });
    text += `\n`;
  }
  
  text += `⏳ STATUS: AWAITING APPROVAL\n\n`;
  text += `Your request has been received and is currently being reviewed by the zone equipment manager.\n`;
  text += `You will receive a confirmation email once it has been approved (typically within 24-48 hours).\n\n`;
  
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Booking Details
  text += `📦 BOOKING REQUEST DETAILS\n\n`;
  text += `Equipment: ${booking.equipmentName}\n`;
  text += `Reference: ${booking.bookingReference}\n`;
  if (booking.eventName) text += `For Event: ${booking.eventName}\n`;
  text += `Requested Period: ${pickupDate} to ${returnDate}\n`;
  text += `Duration: ${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'}\n\n`;
  
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Pricing
  text += `💰 PAYMENT DETAILS\n\n`;
  text += `Total Fee: $${booking.pricing.totalCharge.toFixed(2)}\n`;
  text += `For ${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'} hire period\n\n`;
  
  if (booking.specialRequirements) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Special Requirements:\n${booking.specialRequirements}\n\n`;
  }
  
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `📧 NEXT STEPS:\n\n`;
  text += `You will receive a confirmation email with pickup and return details once approved.\n`;
  text += `Questions? Contact your zone equipment manager.\n\n`;
  text += `Booking Reference: ${booking.bookingReference}\n`;
  text += `Status: Pending Approval\n`;
  text += `This is an automated message from MyPonyClub Equipment Management System\n`;
  
  return text;
}

/**
 * Generate booking approval email HTML (alias for confirmation)
 * Sent when booking is APPROVED by zone manager
 * @param booking The equipment booking
 * @param handover Optional handover details (if not provided, limited details shown)
 * @param zoneBankAccount Optional zone bank account details for payment
 */
export function generateBookingApprovalHTML(booking: EquipmentBooking, handover?: HandoverDetails, zoneBankAccount?: { accountName: string; bsb: string; accountNumber: string }): string {
  // Approval email uses same template as confirmation with text replacements
  return generateBookingConfirmationHTML(booking, handover, zoneBankAccount)
    .replace(/Equipment Booking Confirmed/g, 'Equipment Booking Approved')
    .replace(/booking has been confirmed/g, 'booking has been approved')
    .replace(/has been confirmed/g, 'has been approved');
}

/**
 * Generate booking approval email plain text (alias for confirmation)
 * Sent when booking is APPROVED by zone manager
 * @param booking The equipment booking
 * @param handover Optional handover details (if not provided, limited details shown)
 * @param zoneBankAccount Optional zone bank account details for payment
 */
export function generateBookingApprovalText(booking: EquipmentBooking, handover?: HandoverDetails, zoneBankAccount?: { accountName: string; bsb: string; accountNumber: string }): string {
  // Approval email uses same template as confirmation with text replacements
  return generateBookingConfirmationText(booking, handover, zoneBankAccount)
    .replace(/EQUIPMENT BOOKING CONFIRMED/g, 'EQUIPMENT BOOKING APPROVED')
    .replace(/equipment booking has been confirmed/g, 'equipment booking has been approved')
    .replace(/has been confirmed/g, 'has been approved');
}

/**
 * Generate booking confirmation email HTML
 * Includes detailed pickup and return handover information
 * Sent when booking is APPROVED
 * @param booking The equipment booking
 * @param handover Optional handover details (if not provided, limited details shown)
 * @param zoneBankAccount Optional zone bank account details for payment
 */
export function generateBookingConfirmationHTML(booking: EquipmentBooking, handover?: HandoverDetails, zoneBankAccount?: { accountName: string; bsb: string; accountNumber: string }): string {
  const pickupDate = format(new Date(booking.pickupDate), 'EEEE, MMMM d, yyyy');
  const returnDate = format(new Date(booking.returnDate), 'EEEE, MMMM d, yyyy');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Equipment Booking Confirmed</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  
  <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Equipment Booking Confirmed</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Reference: ${booking.bookingReference}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <p style="font-size: 16px; margin-bottom: 25px;">Hi ${booking.custodian.name},</p>
      
      <p style="font-size: 16px;">Your equipment booking has been confirmed! Below are all the details you need for pickup and return.</p>

      <!-- Booking Details -->
      <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
        <h2 style="margin: 0 0 15px 0; color: #667eea; font-size: 20px;">📦 Booking Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 140px;">Equipment:</td>
            <td style="padding: 8px 0;">${booking.equipmentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Reference:</td>
            <td style="padding: 8px 0;">${booking.bookingReference}</td>
          </tr>
          ${booking.eventName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">For Event:</td>
            <td style="padding: 8px 0;">${booking.eventName}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Duration:</td>
            <td style="padding: 8px 0;">${pickupDate} to ${returnDate}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 2px solid #e0e0e0; margin: 30px 0;"></div>

      <!-- PICKUP SECTION -->
      <div style="margin: 30px 0;">
        <h2 style="color: #28a745; font-size: 22px; margin-bottom: 15px;">🚚 PICKUP INFORMATION</h2>
        
        <div style="background: #e8f5e9; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin-top: 15px;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📅 When:</strong> ${pickupDate}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #2e7d32;"><em>Please coordinate the specific pickup time directly with the contact person below.</em></p>
          
          ${handover?.pickup.previousCustodian ? `
            <!-- Collect from Previous User -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #28a745; margin: 0 0 15px 0; font-size: 18px;">👤 Collect from Previous User</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 120px;">Contact:</td>
                  <td style="padding: 6px 0;">${handover?.pickup.previousCustodian.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Club:</td>
                  <td style="padding: 6px 0;">${handover?.pickup.previousCustodian.clubName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${handover?.pickup.previousCustodian.phone}" style="color: #667eea; text-decoration: none;">${handover?.pickup.previousCustodian.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${handover?.pickup.previousCustodian.email}" style="color: #667eea; text-decoration: none;">${handover?.pickup.previousCustodian.email}</a></td>
                </tr>
                ${handover?.pickup.previousCustodian.eventName ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Their Event:</td>
                  <td style="padding: 6px 0;">${handover?.pickup.previousCustodian.eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Event Ends:</td>
                  <td style="padding: 6px 0;">${format(new Date(handover?.pickup.previousCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}</td>
                </tr>
                ` : ''}
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Pickup Address:</strong><br>
                  ${handover?.pickup.location.address}
                </p>
              </div>

              ${handover?.pickup.location.notes ? `
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #0d47a1;">
                  <strong>📝 Notes:</strong><br>
                  ${handover?.pickup.location.notes}
                </p>
              </div>
              ` : ''}
            </div>
          ` : `
            <!-- Collect from Zone Storage -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #28a745; margin: 0 0 15px 0; font-size: 18px;">🏢 Collect from Zone Storage</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 140px;">Contact Person:</td>
                  <td style="padding: 6px 0;">${handover?.pickup.location.contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Role:</td>
                  <td style="padding: 6px 0;">Zone Manager</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${handover?.pickup.location.contactPhone}" style="color: #667eea; text-decoration: none;">${handover?.pickup.location.contactPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${handover?.pickup.location.contactEmail}" style="color: #667eea; text-decoration: none;">${handover?.pickup.location.contactEmail}</a></td>
                </tr>
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Storage Address:</strong><br>
                  ${handover?.pickup.location.address}
                </p>
              </div>

              ${handover?.pickup.location.notes ? `
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #0d47a1;">
                  <strong>📝 Access Instructions:</strong><br>
                  ${handover?.pickup.location.notes}
                </p>
              </div>
              ` : ''}
            </div>
          `}
        </div>
      </div>

      <div style="border-top: 2px solid #e0e0e0; margin: 30px 0;"></div>

      <!-- RETURN SECTION -->
      <div style="margin: 30px 0;">
        <h2 style="color: #dc3545; font-size: 22px; margin-bottom: 15px;">📤 RETURN INFORMATION</h2>
        
        <div style="background: #fee; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin-top: 15px;">
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📅 When:</strong> ${returnDate}</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #c62828;"><em>Please coordinate the specific return time directly with the contact person below.</em></p>
          
          ${handover?.return.nextCustodian ? `
            <!-- Handover to Next User -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">👤 Handover to Next User</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 120px;">Contact:</td>
                  <td style="padding: 6px 0;">${handover?.return.nextCustodian.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Club:</td>
                  <td style="padding: 6px 0;">${handover?.return.nextCustodian.clubName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${handover?.return.nextCustodian.phone}" style="color: #667eea; text-decoration: none;">${handover?.return.nextCustodian.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${handover?.return.nextCustodian.email}" style="color: #667eea; text-decoration: none;">${handover?.return.nextCustodian.email}</a></td>
                </tr>
                ${handover?.return.nextCustodian.eventName ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Their Event:</td>
                  <td style="padding: 6px 0;">${handover?.return.nextCustodian.eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Starts:</td>
                  <td style="padding: 6px 0;">${format(new Date(handover?.return.nextCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}</td>
                </tr>
                ` : ''}
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Handover Address:</strong><br>
                  ${handover?.return.location.address}
                </p>
              </div>

              <div style="background: #fff4e6; border: 2px solid #ff9800; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #e65100;">
                  <strong>⚠️ IMPORTANT:</strong> Please coordinate handover time with ${handover?.return.nextCustodian.name} before their event starts.
                </p>
              </div>
            </div>
          ` : `
            <!-- Return to Zone Storage -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">🏢 Return to Zone Storage</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 140px;">Contact Person:</td>
                  <td style="padding: 6px 0;">${handover?.return.location.contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Role:</td>
                  <td style="padding: 6px 0;">Zone Manager</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${handover?.return.location.contactPhone}" style="color: #667eea; text-decoration: none;">${handover?.return.location.contactPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${handover?.return.location.contactEmail}" style="color: #667eea; text-decoration: none;">${handover?.return.location.contactEmail}</a></td>
                </tr>
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Return Address:</strong><br>
                  ${handover?.return.location.address}
                </p>
              </div>

              ${handover?.return.location.notes ? `
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #0d47a1;">
                  <strong>📝 Access Instructions:</strong><br>
                  ${handover?.return.location.notes}
                </p>
              </div>
              ` : ''}
            </div>
          `}
        </div>
      </div>

      <div style="border-top: 2px solid #e0e0e0; margin: 30px 0;"></div>

      <!-- Pricing Summary -->
      <div style="background: #f0f7ff; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">💰 Payment Details</h3>
        <div style="background: white; border-radius: 5px; padding: 15px; margin-bottom: 15px;">
          <div style="font-weight: 700; font-size: 24px; color: #1976d2; margin-bottom: 5px;">Total Hiring Fee: $${booking.pricing.totalCharge.toFixed(2)}</div>
          <div style="font-size: 14px; color: #666; margin-bottom: 15px;">${booking.pricingType === 'flat_fee' ? 'Flat fee' : `For ${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'} hire period`}</div>
        </div>
        ${zoneBankAccount ? `
        <div style="background: #e8f5e9; border: 2px solid #4caf50; border-radius: 5px; padding: 15px;">
          <h4 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 16px;">🏦 Payment Instructions</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #2e7d32; width: 140px;">Account Name:</td>
              <td style="padding: 6px 0; color: #1b5e20;">${zoneBankAccount.accountName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #2e7d32;">BSB:</td>
              <td style="padding: 6px 0; color: #1b5e20;">${zoneBankAccount.bsb}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #2e7d32;">Account Number:</td>
              <td style="padding: 6px 0; color: #1b5e20;">${zoneBankAccount.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 600; color: #2e7d32;">Reference:</td>
              <td style="padding: 6px 0; color: #1b5e20;">EQUIP ${booking.clubName}</td>
            </tr>
          </table>
          <div style="background: #fff3cd; border-left: 3px solid #ffc107; padding: 10px; margin-top: 12px; border-radius: 3px;">
            <p style="margin: 0; font-size: 13px; color: #856404;">
              <strong>Important:</strong> Please include the reference <strong>EQUIP ${booking.clubName}</strong> in the payment description.
            </p>
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Checklist -->
      <div style="background: #fff9e6; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 5px;">
        <h3 style="color: #f57c00; margin: 0 0 15px 0;">📋 Important Reminders</h3>
        
        <div style="margin-bottom: 20px;">
          <p style="font-weight: 600; margin: 0 0 10px 0; color: #e65100;">BEFORE COLLECTION:</p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li style="margin: 5px 0;">Check equipment condition with previous user/storage manager</li>
            <li style="margin: 5px 0;">Report any damage immediately to zone manager</li>
            <li style="margin: 5px 0;">Take photos for your records</li>
            <li style="margin: 5px 0;">Confirm all items are present</li>
          </ul>
        </div>

        <div>
          <p style="font-weight: 600; margin: 0 0 10px 0; color: #e65100;">BEFORE RETURN:</p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li style="margin: 5px 0;">Clean equipment thoroughly</li>
            <li style="margin: 5px 0;">Check for any damage</li>
            ${handover?.return.nextCustodian ? `
            <li style="margin: 5px 0;">Coordinate timing with next user (${handover?.return.nextCustodian.name})</li>
            ` : ''}
            <li style="margin: 5px 0;">Return all items</li>
          </ul>
        </div>
      </div>

      ${booking.specialRequirements ? `
      <div style="background: #e8eaf6; border-left: 4px solid #5c6bc0; padding: 15px; margin: 20px 0; border-radius: 3px;">
        <p style="margin: 0; font-weight: 600; color: #3949ab;">Special Requirements:</p>
        <p style="margin: 8px 0 0 0; color: #3949ab;">${booking.specialRequirements}</p>
      </div>
      ` : ''}

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Questions or need to make changes? Contact your zone equipment manager.
      </p>

    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        Booking Reference: ${booking.bookingReference}<br>
        This is an automated message from MyPonyClub Equipment Management System
      </p>
    </div>

  </div>

</body>
</html>
  `;
}

/**
 * Generate booking confirmation email plain text version
 * Sent when booking is APPROVED
 * @param booking The equipment booking
 * @param handover Optional handover details (if not provided, limited details shown)
 * @param zoneBankAccount Optional zone bank account details for payment
 */
export function generateBookingConfirmationText(booking: EquipmentBooking, handover?: HandoverDetails, zoneBankAccount?: { accountName: string; bsb: string; accountNumber: string }): string {
  const pickupDate = format(new Date(booking.pickupDate), 'EEEE, MMMM d, yyyy');
  const returnDate = format(new Date(booking.returnDate), 'EEEE, MMMM d, yyyy');

  let text = `EQUIPMENT BOOKING CONFIRMED\n`;
  text += `Reference: ${booking.bookingReference}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Hi ${booking.custodian.name},\n\n`;
  text += `Your equipment booking has been confirmed!\n\n`;
  
  // Booking Details
  text += `📦 BOOKING DETAILS\n\n`;
  text += `Equipment: ${booking.equipmentName}\n`;
  text += `Booking Reference: ${booking.bookingReference}\n`;
  if (booking.eventName) text += `For Event: ${booking.eventName}\n`;
  text += `Duration: ${pickupDate} to ${returnDate}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Pickup Information
  text += `🚚 PICKUP INFORMATION\n\n`;
  text += `📅 When: ${pickupDate}\n`;
  text += `Please coordinate the specific pickup time directly with the contact person below.\n\n`;
  
  if (handover?.pickup.previousCustodian) {
    text += `👤 Collect from Previous User:\n\n`;
    text += `Contact: ${handover?.pickup.previousCustodian.name}\n`;
    text += `Club: ${handover?.pickup.previousCustodian.clubName}\n`;
    text += `Phone: ${handover?.pickup.previousCustodian.phone}\n`;
    text += `Email: ${handover?.pickup.previousCustodian.email}\n`;
    if (handover?.pickup.previousCustodian.eventName) {
      text += `Their Event: ${handover?.pickup.previousCustodian.eventName}\n`;
      text += `Event Ends: ${format(new Date(handover?.pickup.previousCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}\n`;
    }
    text += `\n📍 Pickup Address:\n${handover?.pickup.location.address}\n`;
    if (handover?.pickup.location.notes) {
      text += `\n📝 Notes: ${handover?.pickup.location.notes}\n`;
    }
  } else {
    text += `🏢 Collect from Zone Storage:\n\n`;
    text += `Contact Person: ${handover?.pickup.location.contactName}\n`;
    text += `Role: Zone Manager\n`;
    text += `Phone: ${handover?.pickup.location.contactPhone}\n`;
    text += `Email: ${handover?.pickup.location.contactEmail}\n`;
    text += `\n📍 Storage Address:\n${handover?.pickup.location.address}\n`;
    if (handover?.pickup.location.notes) {
      text += `\n📝 Access Instructions: ${handover?.pickup.location.notes}\n`;
    }
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Return Information
  text += `📤 RETURN INFORMATION\n\n`;
  text += `📅 When: ${returnDate}\n`;
  text += `Please coordinate the specific return time directly with the contact person below.\n\n`;
  
  if (handover?.return.nextCustodian) {
    text += `👤 Handover to Next User:\n\n`;
    text += `Contact: ${handover?.return.nextCustodian.name}\n`;
    text += `Club: ${handover?.return.nextCustodian.clubName}\n`;
    text += `Phone: ${handover?.return.nextCustodian.phone}\n`;
    text += `Email: ${handover?.return.nextCustodian.email}\n`;
    if (handover?.return.nextCustodian.eventName) {
      text += `Their Event: ${handover?.return.nextCustodian.eventName}\n`;
      text += `Event Starts: ${format(new Date(handover?.return.nextCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}\n`;
    }
    text += `\n📍 Handover Address:\n${handover?.return.location.address}\n`;
    text += `\n⚠️  IMPORTANT: Please coordinate handover time with ${handover?.return.nextCustodian.name} before their event starts.\n`;
  } else {
    text += `🏢 Return to Zone Storage:\n\n`;
    text += `Contact Person: ${handover?.return.location.contactName}\n`;
    text += `Role: Zone Manager\n`;
    text += `Phone: ${handover?.return.location.contactPhone}\n`;
    text += `Email: ${handover?.return.location.contactEmail}\n`;
    text += `\n📍 Return Address:\n${handover?.return.location.address}\n`;
    if (handover?.return.location.notes) {
      text += `\n📝 Access Instructions: ${handover?.return.location.notes}\n`;
    }
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Pricing
  text += `💰 PAYMENT DETAILS\n\n`;
  text += `Total Hiring Fee: $${booking.pricing.totalCharge.toFixed(2)}\n`;
  text += `${booking.pricingType === 'flat_fee' ? 'Flat fee' : `For ${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'} hire period`}\n\n`;
  
  if (zoneBankAccount) {
    text += `🏦 PAYMENT INSTRUCTIONS\n\n`;
    text += `Account Name: ${zoneBankAccount.accountName}\n`;
    text += `BSB: ${zoneBankAccount.bsb}\n`;
    text += `Account Number: ${zoneBankAccount.accountNumber}\n`;
    text += `Reference: EQUIP ${booking.clubName}\n\n`;
    text += `⚠️  IMPORTANT: Please include the reference EQUIP ${booking.clubName} in the payment description.\n\n`;
  }
  
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Reminders
  text += `📋 IMPORTANT REMINDERS\n\n`;
  text += `BEFORE COLLECTION:\n`;
  text += `✓ Check equipment condition with previous user/storage manager\n`;
  text += `✓ Report any damage immediately to zone manager\n`;
  text += `✓ Take photos for your records\n`;
  text += `✓ Confirm all items are present\n\n`;
  text += `BEFORE RETURN:\n`;
  text += `✓ Clean equipment thoroughly\n`;
  text += `✓ Check for any damage\n`;
  if (handover?.return.nextCustodian) {
    text += `✓ Coordinate timing with next user (${handover?.return.nextCustodian.name})\n`;
  }
  text += `✓ Return all items\n\n`;
  
  if (booking.specialRequirements) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Special Requirements:\n${booking.specialRequirements}\n\n`;
  }
  
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Questions or need to make changes? Contact your zone equipment manager.\n\n`;
  text += `Booking Reference: ${booking.bookingReference}\n`;
  text += `This is an automated message from MyPonyClub Equipment Management System\n`;
  
  return text;
}

/**
 * Queue booking received (pending) email
 * Sent when booking is first created and awaiting approval
 */
export async function queueBookingReceivedEmail(
  booking: EquipmentBooking
): Promise<string> {
  const htmlContent = generateBookingReceivedHTML(booking);
  const textContent = generateBookingReceivedText(booking);
  
  // Check if auto-send is enabled for equipment booking requests
  const config = await getEmailQueueConfig();
  const autoSend = config?.autoSendEquipmentBookingRequests ?? false;
  
  const hasConflict = (booking as any).conflictDetected === true;
  const subjectPrefix = hasConflict ? '⚠️ CONFLICT - Manual Approval Required: ' : '';
  
  const emailId = await addEmailToQueue({
    to: [booking.custodian.email],
    cc: booking.requestedByEmail !== booking.custodian.email ? [booking.requestedByEmail] : undefined,
    subject: `${subjectPrefix}Equipment Booking Request Received - ${booking.equipmentName} - Ref: ${booking.bookingReference}`,
    htmlContent,
    textContent,
    type: 'Equipment-Request',
    status: autoSend ? 'pending' : 'draft', // 'pending' = auto-send, 'draft' = requires approval
    priority: 'normal',
    metadata: {
      bookingId: booking.id,
      equipmentId: booking.equipmentId,
      bookingReference: booking.bookingReference,
      emailType: 'booking_received',
    },
  });
  
  return emailId;
}

/**
 * Queue booking confirmation email
 * Sent when booking is APPROVED with full pickup/return details
 */
export async function queueBookingConfirmationEmail(
  booking: EquipmentBooking,
  queue: boolean = true
): Promise<string> {
  // Compute handover details dynamically
  const handover = await computeHandoverDetails(booking);
  
  // Fetch zone data for bank account details
  let zoneBankAccount: { accountName: string; bsb: string; accountNumber: string } | undefined;
  try {
    const zoneDoc = await adminDb.collection('zones').doc(booking.zoneId).get();
    const zoneData = zoneDoc.data();
    zoneBankAccount = zoneData?.bankAccount;
  } catch (error) {
    console.error('Error fetching zone bank account:', error);
  }
  
  const htmlContent = generateBookingConfirmationHTML(booking, handover, zoneBankAccount);
  const textContent = generateBookingConfirmationText(booking, handover, zoneBankAccount);
  
  // Check if auto-send is enabled for equipment booking approvals
  const config = await getEmailQueueConfig();
  const autoSend = config?.autoSendEquipmentBookingApprovals ?? false;
  
  const emailId = await addEmailToQueue({
    to: [booking.custodian.email],
    cc: booking.requestedByEmail !== booking.custodian.email ? [booking.requestedByEmail] : undefined,
    subject: `Equipment Booking Confirmed - ${booking.equipmentName} - Ref: ${booking.bookingReference}`,
    htmlContent,
    textContent,
    type: 'Equipment-Request',
    status: autoSend ? 'pending' : 'draft', // 'pending' = auto-send, 'draft' = requires approval
    priority: 'normal',
    metadata: {
      bookingId: booking.id,
      equipmentId: booking.equipmentId,
      bookingReference: booking.bookingReference,
      emailType: 'booking_confirmed',
    },
  });
  
  return emailId;
}

// =======================================================================
// MULTI-RECIPIENT QUEUING HELPERS (booker, zone manager, super user)
// =======================================================================

async function getZoneManagerEmails(zoneId?: string): Promise<string[]> {
  if (!zoneId) return [];
  try {
    const zoneDoc = await adminDb.collection('zones').doc(zoneId).get();
    const zone = zoneDoc.data();
    const approvers: Array<{ email: string }> = zone?.eventApprovers || zone?.scheduleApprovers || [];
    const emails = approvers.map(a => a.email).filter(Boolean);
    // Fallback: zone secretary email
    if (zone?.secretary?.email) emails.push(zone.secretary.email);
    return Array.from(new Set(emails));
  } catch {
    return [];
  }
}

async function getSuperUserEmails(): Promise<string[]> {
  try {
    // Use email queue config adminNotificationEmails as super users
    const configDoc = await adminDb.collection('emailConfig').doc('default').get();
    const cfg = configDoc.exists ? configDoc.data() : {};
    const emails: string[] = Array.isArray(cfg?.adminNotificationEmails) ? cfg.adminNotificationEmails : [];
    return emails.filter(Boolean);
  } catch {
    return [];
  }
}

function bookingJsonAttachment(booking: EquipmentBooking) {
  const content = JSON.stringify(booking, null, 2);
  return [{
    id: `booking-${booking.id}-json`,
    filename: `booking-${booking.bookingReference}.json`,
    contentType: 'application/json',
    size: Buffer.byteLength(content, 'utf8'),
    content,
    createdAt: new Date()
  }];
}

/**
 * Queue all notifications for a booking status change
 * - Booker
 * - Zone Manager(s)
 * - Super User(s) (with JSON attachment)
 */
export async function queueAllBookingNotifications(
  booking: EquipmentBooking,
  status: 'received' | 'confirmed' | 'approved'
): Promise<{ ids: string[] }> {
  const isApproved = status === 'approved';
  const isConfirmed = status === 'confirmed';
  const needsHandover = isApproved || isConfirmed;
  const hasConflict = (booking as any).conflictDetected === true;
  
  // Compute handover details dynamically for approved/confirmed bookings
  const handover = needsHandover ? await computeHandoverDetails(booking) : undefined;
  
  // Fetch zone data for bank account details
  let zoneBankAccount: { accountName: string; bsb: string; accountNumber: string } | undefined;
  if (needsHandover) {
    try {
      const zoneDoc = await adminDb.collection('zones').doc(booking.zoneId).get();
      const zoneData = zoneDoc.data();
      zoneBankAccount = zoneData?.bankAccount;
    } catch (error) {
      console.error('Error fetching zone bank account:', error);
    }
  }
  
  const htmlContent = needsHandover ? generateBookingApprovalHTML(booking, handover, zoneBankAccount) : generateBookingReceivedHTML(booking);
  const textContent = needsHandover ? generateBookingApprovalText(booking, handover, zoneBankAccount) : generateBookingReceivedText(booking);

  const subjectBase = isApproved ? 'Equipment Booking Approved' : isConfirmed ? 'Equipment Booking Confirmed' : 'Equipment Booking Request Received';
  const conflictPrefix = hasConflict && !needsHandover ? '⚠️ CONFLICT - Manual Approval Required: ' : '';
  const subject = `${conflictPrefix}${subjectBase} - ${booking.equipmentName} - Ref: ${booking.bookingReference}`;
  const emailType = isApproved ? 'Equipment-Approved' : isConfirmed ? 'Equipment-Request' : 'Equipment-Request';
  const metadata = {
    bookingId: booking.id,
    equipmentId: booking.equipmentId,
    bookingReference: booking.bookingReference,
    emailType, // Use consistent type value from above
  };
  
  // Check if auto-send is enabled based on email type
  const config = await getEmailQueueConfig();
  const autoSend = needsHandover 
    ? (config?.autoSendEquipmentBookingApprovals ?? false) 
    : (config?.autoSendEquipmentBookingRequests ?? false);

  const ids: string[] = [];

  // Booker
  ids.push(await addEmailToQueue({
    to: [booking.custodian.email],
    cc: booking.requestedByEmail !== booking.custodian.email ? [booking.requestedByEmail] : undefined,
    subject,
    htmlContent,
    textContent,
    type: emailType,
    status: autoSend ? 'pending' : 'draft', // 'pending' = auto-send, 'draft' = requires approval
    priority: 'normal',
    metadata: { ...metadata, roleTarget: 'booker' }
  }));

  // Zone Managers
  const zoneEmails = await getZoneManagerEmails((booking as any).zoneId);
  if (zoneEmails.length) {
    ids.push(await addEmailToQueue({
      to: zoneEmails,
      subject,
      htmlContent,
      textContent,
      type: emailType,
      status: autoSend ? 'pending' : 'draft', // 'pending' = auto-send, 'draft' = requires approval
      priority: 'normal',
      metadata: { ...metadata, roleTarget: 'zone_manager' }
    }));
  }

  // Super Users with JSON attachment
  const superEmails = await getSuperUserEmails();
  if (superEmails.length) {
    ids.push(await addEmailToQueue({
      to: superEmails,
      subject,
      htmlContent,
      textContent,
      type: emailType,
      status: autoSend ? 'pending' : 'draft', // 'pending' = auto-send, 'draft' = requires approval
      priority: 'high',
      attachments: bookingJsonAttachment(booking),
      metadata: { ...metadata, roleTarget: 'super_user' }
    }));
  }

  return { ids };
}
