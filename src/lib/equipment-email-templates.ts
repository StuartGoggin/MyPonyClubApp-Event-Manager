/**
 * Equipment Rental Email Templates
 * 
 * This file contains email templates for equipment booking notifications,
 * handover coordination, and location changes. Uses the existing email queue system.
 */

import { EquipmentBooking } from '@/types/equipment';
import { format } from 'date-fns';
import { addEmailToQueue } from '@/lib/email-queue-admin';
import { adminDb } from '@/lib/firebase-admin';

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
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">📨 Equipment Booking Request Received</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Reference: ${booking.bookingReference}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <p style="font-size: 16px; margin-bottom: 25px;">Hi ${booking.custodian.name},</p>
      
      <p style="font-size: 16px;">Thank you for your equipment booking request! Your request has been received and is currently awaiting approval from the zone equipment manager.</p>

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
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">💰 Estimated Pricing</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Daily Rate:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.baseRate.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Subtotal:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Deposit:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.deposit.toFixed(2)}</td>
          </tr>
          ${booking.pricing.bond ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Bond:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.bond.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #2196f3;">
            <td style="padding: 12px 0 0 0; font-weight: 700; font-size: 18px; color: #1976d2;">Estimated Total:</td>
            <td style="padding: 12px 0 0 0; text-align: right; font-weight: 700; font-size: 18px; color: #1976d2;">$${booking.pricing.totalCharge.toFixed(2)}</td>
          </tr>
        </table>
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

  let text = `📨 EQUIPMENT BOOKING REQUEST RECEIVED\n`;
  text += `Reference: ${booking.bookingReference}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Hi ${booking.custodian.name},\n\n`;
  text += `Thank you for your equipment booking request!\n\n`;
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
  text += `💰 ESTIMATED PRICING\n\n`;
  text += `Daily Rate: $${booking.pricing.baseRate.toFixed(2)}\n`;
  text += `Subtotal: $${booking.pricing.subtotal.toFixed(2)}\n`;
  text += `Deposit: $${booking.pricing.deposit.toFixed(2)}\n`;
  if (booking.pricing.bond) text += `Bond: $${booking.pricing.bond.toFixed(2)}\n`;
  text += `Estimated Total: $${booking.pricing.totalCharge.toFixed(2)}\n\n`;
  
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
 * Generate booking confirmation email HTML
 * Includes detailed pickup and return handover information
 * Sent when booking is APPROVED
 */
export function generateBookingConfirmationHTML(booking: EquipmentBooking): string {
  const pickupDate = format(new Date(booking.pickupDate), 'EEEE, MMMM d, yyyy');
  const returnDate = format(new Date(booking.returnDate), 'EEEE, MMMM d, yyyy');
  const pickupTime = booking.handover.pickup.scheduledTime || '10:00 AM - 12:00 PM';
  const returnTime = booking.handover.return.scheduledTime || '10:00 AM - 12:00 PM';

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
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📅 When:</strong> ${pickupDate} at ${pickupTime}</p>
          
          ${booking.handover.pickup.previousCustodian ? `
            <!-- Collect from Previous User -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #28a745; margin: 0 0 15px 0; font-size: 18px;">👤 Collect from Previous User</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 120px;">Contact:</td>
                  <td style="padding: 6px 0;">${booking.handover.pickup.previousCustodian.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Club:</td>
                  <td style="padding: 6px 0;">${booking.handover.pickup.previousCustodian.clubName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${booking.handover.pickup.previousCustodian.phone}" style="color: #667eea; text-decoration: none;">${booking.handover.pickup.previousCustodian.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${booking.handover.pickup.previousCustodian.email}" style="color: #667eea; text-decoration: none;">${booking.handover.pickup.previousCustodian.email}</a></td>
                </tr>
                ${booking.handover.pickup.previousCustodian.eventName ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Their Event:</td>
                  <td style="padding: 6px 0;">${booking.handover.pickup.previousCustodian.eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Event Ends:</td>
                  <td style="padding: 6px 0;">${format(new Date(booking.handover.pickup.previousCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}</td>
                </tr>
                ` : ''}
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Pickup Address:</strong><br>
                  ${booking.handover.pickup.location.address}
                </p>
              </div>

              ${booking.handover.pickup.location.notes ? `
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #0d47a1;">
                  <strong>📝 Notes:</strong><br>
                  ${booking.handover.pickup.location.notes}
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
                  <td style="padding: 6px 0; font-weight: 600; width: 120px;">Contact:</td>
                  <td style="padding: 6px 0;">${booking.handover.pickup.location.contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${booking.handover.pickup.location.contactPhone}" style="color: #667eea; text-decoration: none;">${booking.handover.pickup.location.contactPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${booking.handover.pickup.location.contactEmail}" style="color: #667eea; text-decoration: none;">${booking.handover.pickup.location.contactEmail}</a></td>
                </tr>
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Storage Address:</strong><br>
                  ${booking.handover.pickup.location.address}
                </p>
              </div>

              ${booking.handover.pickup.location.notes ? `
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #0d47a1;">
                  <strong>📝 Access Instructions:</strong><br>
                  ${booking.handover.pickup.location.notes}
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
          <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📅 When:</strong> ${returnDate} at ${returnTime}</p>
          
          ${booking.handover.return.nextCustodian ? `
            <!-- Handover to Next User -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">👤 Handover to Next User</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 120px;">Contact:</td>
                  <td style="padding: 6px 0;">${booking.handover.return.nextCustodian.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Club:</td>
                  <td style="padding: 6px 0;">${booking.handover.return.nextCustodian.clubName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${booking.handover.return.nextCustodian.phone}" style="color: #667eea; text-decoration: none;">${booking.handover.return.nextCustodian.phone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${booking.handover.return.nextCustodian.email}" style="color: #667eea; text-decoration: none;">${booking.handover.return.nextCustodian.email}</a></td>
                </tr>
                ${booking.handover.return.nextCustodian.eventName ? `
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Their Event:</td>
                  <td style="padding: 6px 0;">${booking.handover.return.nextCustodian.eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Starts:</td>
                  <td style="padding: 6px 0;">${format(new Date(booking.handover.return.nextCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}</td>
                </tr>
                ` : ''}
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Handover Address:</strong><br>
                  ${booking.handover.return.location.address}
                </p>
              </div>

              <div style="background: #fff4e6; border: 2px solid #ff9800; padding: 12px; margin-top: 10px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #e65100;">
                  <strong>⚠️ IMPORTANT:</strong> Please coordinate handover time with ${booking.handover.return.nextCustodian.name} before their event starts.
                </p>
              </div>
            </div>
          ` : `
            <!-- Return to Zone Storage -->
            <div style="background: white; border-radius: 5px; padding: 15px; margin-top: 15px;">
              <h3 style="color: #dc3545; margin: 0 0 15px 0; font-size: 18px;">🏢 Return to Zone Storage</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; width: 120px;">Contact:</td>
                  <td style="padding: 6px 0;">${booking.handover.return.location.contactName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${booking.handover.return.location.contactPhone}" style="color: #667eea; text-decoration: none;">${booking.handover.return.location.contactPhone}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${booking.handover.return.location.contactEmail}" style="color: #667eea; text-decoration: none;">${booking.handover.return.location.contactEmail}</a></td>
                </tr>
              </table>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 15px; border-radius: 3px;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>📍 Return Address:</strong><br>
                  ${booking.handover.return.location.address}
                </p>
              </div>
            </div>
          `}
        </div>
      </div>

      <div style="border-top: 2px solid #e0e0e0; margin: 30px 0;"></div>

      <!-- Pricing Summary -->
      <div style="background: #f0f7ff; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1976d2; margin: 0 0 15px 0; font-size: 18px;">💰 Pricing Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Rental Duration:</td>
            <td style="padding: 8px 0; text-align: right;">${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Daily Rate:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.baseRate.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Subtotal:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Deposit:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.deposit.toFixed(2)}</td>
          </tr>
          ${booking.pricing.bond ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Bond:</td>
            <td style="padding: 8px 0; text-align: right;">$${booking.pricing.bond.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #2196f3;">
            <td style="padding: 12px 0 0 0; font-weight: 700; font-size: 18px; color: #1976d2;">Total Charge:</td>
            <td style="padding: 12px 0 0 0; text-align: right; font-weight: 700; font-size: 18px; color: #1976d2;">$${booking.pricing.totalCharge.toFixed(2)}</td>
          </tr>
        </table>
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
            ${booking.handover.return.nextCustodian ? `
            <li style="margin: 5px 0;">Coordinate timing with next user (${booking.handover.return.nextCustodian.name})</li>
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
 */
export function generateBookingConfirmationText(booking: EquipmentBooking): string {
  const pickupDate = format(new Date(booking.pickupDate), 'EEEE, MMMM d, yyyy');
  const returnDate = format(new Date(booking.returnDate), 'EEEE, MMMM d, yyyy');
  const pickupTime = booking.handover.pickup.scheduledTime || '10:00 AM - 12:00 PM';
  const returnTime = booking.handover.return.scheduledTime || '10:00 AM - 12:00 PM';

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
  text += `📅 When: ${pickupDate} at ${pickupTime}\n\n`;
  
  if (booking.handover.pickup.previousCustodian) {
    text += `👤 Collect from Previous User:\n\n`;
    text += `Contact: ${booking.handover.pickup.previousCustodian.name}\n`;
    text += `Club: ${booking.handover.pickup.previousCustodian.clubName}\n`;
    text += `Phone: ${booking.handover.pickup.previousCustodian.phone}\n`;
    text += `Email: ${booking.handover.pickup.previousCustodian.email}\n`;
    if (booking.handover.pickup.previousCustodian.eventName) {
      text += `Their Event: ${booking.handover.pickup.previousCustodian.eventName}\n`;
      text += `Event Ends: ${format(new Date(booking.handover.pickup.previousCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}\n`;
    }
    text += `\n📍 Pickup Address:\n${booking.handover.pickup.location.address}\n`;
    if (booking.handover.pickup.location.notes) {
      text += `\n📝 Notes: ${booking.handover.pickup.location.notes}\n`;
    }
  } else {
    text += `🏢 Collect from Zone Storage:\n\n`;
    text += `Contact: ${booking.handover.pickup.location.contactName}\n`;
    text += `Phone: ${booking.handover.pickup.location.contactPhone}\n`;
    text += `Email: ${booking.handover.pickup.location.contactEmail}\n`;
    text += `\n📍 Storage Address:\n${booking.handover.pickup.location.address}\n`;
    if (booking.handover.pickup.location.notes) {
      text += `\n📝 Access Instructions: ${booking.handover.pickup.location.notes}\n`;
    }
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Return Information
  text += `📤 RETURN INFORMATION\n\n`;
  text += `📅 When: ${returnDate} at ${returnTime}\n\n`;
  
  if (booking.handover.return.nextCustodian) {
    text += `👤 Handover to Next User:\n\n`;
    text += `Contact: ${booking.handover.return.nextCustodian.name}\n`;
    text += `Club: ${booking.handover.return.nextCustodian.clubName}\n`;
    text += `Phone: ${booking.handover.return.nextCustodian.phone}\n`;
    text += `Email: ${booking.handover.return.nextCustodian.email}\n`;
    if (booking.handover.return.nextCustodian.eventName) {
      text += `Their Event: ${booking.handover.return.nextCustodian.eventName}\n`;
      text += `Event Starts: ${format(new Date(booking.handover.return.nextCustodian.scheduledDate!), 'EEEE, MMMM d, yyyy')}\n`;
    }
    text += `\n📍 Handover Address:\n${booking.handover.return.location.address}\n`;
    text += `\n⚠️  IMPORTANT: Please coordinate handover time with ${booking.handover.return.nextCustodian.name} before their event starts.\n`;
  } else {
    text += `🏢 Return to Zone Storage:\n\n`;
    text += `Contact: ${booking.handover.return.location.contactName}\n`;
    text += `Phone: ${booking.handover.return.location.contactPhone}\n`;
    text += `Email: ${booking.handover.return.location.contactEmail}\n`;
    text += `\n📍 Return Address:\n${booking.handover.return.location.address}\n`;
  }
  
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Pricing
  text += `💰 PRICING SUMMARY\n\n`;
  text += `Rental Duration: ${booking.durationDays} ${booking.durationDays === 1 ? 'day' : 'days'}\n`;
  text += `Daily Rate: $${booking.pricing.baseRate.toFixed(2)}\n`;
  text += `Subtotal: $${booking.pricing.subtotal.toFixed(2)}\n`;
  text += `Deposit: $${booking.pricing.deposit.toFixed(2)}\n`;
  if (booking.pricing.bond) text += `Bond: $${booking.pricing.bond.toFixed(2)}\n`;
  text += `Total Charge: $${booking.pricing.totalCharge.toFixed(2)}\n\n`;
  
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
  if (booking.handover.return.nextCustodian) {
    text += `✓ Coordinate timing with next user (${booking.handover.return.nextCustodian.name})\n`;
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
  
  const emailId = await addEmailToQueue({
    to: [booking.custodian.email],
    cc: booking.requestedByEmail !== booking.custodian.email ? [booking.requestedByEmail] : undefined,
    subject: `Equipment Booking Request Received - ${booking.equipmentName} - Ref: ${booking.bookingReference}`,
    htmlContent,
    textContent,
    type: 'Equipment-Request',
    status: 'pending',
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
  const htmlContent = generateBookingConfirmationHTML(booking);
  const textContent = generateBookingConfirmationText(booking);
  
  const emailId = await addEmailToQueue({
    to: [booking.custodian.email],
    cc: booking.requestedByEmail !== booking.custodian.email ? [booking.requestedByEmail] : undefined,
    subject: `Equipment Booking Confirmed - ${booking.equipmentName} - Ref: ${booking.bookingReference}`,
    htmlContent,
    textContent,
    type: 'Equipment-Request',
    status: 'pending',
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
    content
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
  status: 'received' | 'confirmed'
): Promise<{ ids: string[] }> {
  const isConfirmed = status === 'confirmed';
  const htmlContent = isConfirmed ? generateBookingConfirmationHTML(booking) : generateBookingReceivedHTML(booking);
  const textContent = isConfirmed ? generateBookingConfirmationText(booking) : generateBookingReceivedText(booking);

  const subjectBase = isConfirmed ? 'Equipment Booking Confirmed' : 'Equipment Booking Request Received';
  const subject = `${subjectBase} - ${booking.equipmentName} - Ref: ${booking.bookingReference}`;
  const metadata = {
    bookingId: booking.id,
    equipmentId: booking.equipmentId,
    bookingReference: booking.bookingReference,
    emailType: isConfirmed ? 'booking_confirmed' : 'booking_received',
  };

  const ids: string[] = [];

  // Booker
  ids.push(await addEmailToQueue({
    to: [booking.custodian.email],
    cc: booking.requestedByEmail !== booking.custodian.email ? [booking.requestedByEmail] : undefined,
    subject,
    htmlContent,
    textContent,
    type: 'Equipment-Request',
    status: 'pending',
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
      type: 'Equipment-Request',
      status: 'pending',
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
      type: 'Equipment-Request',
      status: 'pending',
      priority: 'high',
      attachments: bookingJsonAttachment(booking),
      metadata: { ...metadata, roleTarget: 'super_user' }
    }));
  }

  return { ids };
}
