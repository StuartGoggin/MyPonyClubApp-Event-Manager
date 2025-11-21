import { addEmailToQueue } from './email-queue-admin';
import { CommitteeNomination } from '@/types/committee-nomination';

/**
 * Email notification helpers for committee nomination workflow
 */

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  content: string; // Base64 encoded
  createdAt: Date;
}

/**
 * Create email attachment object from PDF buffer
 */
function createPDFAttachment(filename: string, pdfBuffer: Buffer): EmailAttachment {
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2)}`,
    filename,
    contentType: 'application/pdf',
    size: pdfBuffer.length,
    content: pdfBuffer.toString('base64'),
    createdAt: new Date(),
  };
}

/**
 * Send confirmation email to submitter with PDF attachment
 */
export async function sendCommitteeNominationConfirmationEmail(
  nomination: CommitteeNomination,
  pdfBuffer: Buffer,
  referenceNumber: string
): Promise<string> {
  const submitterData = nomination.submittedBy;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .success-badge { display: inline-block; background-color: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1f2937; }
        .value { color: #4b5563; margin-left: 10px; }
        .info-box { background-color: #ecfdf5; border-left: 4px solid: #10b981; padding: 15px; margin: 20px 0; line-height: 1.8; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Committee Nomination Submitted Successfully</h1>
        </div>
        <div class="content">
          <div class="success-badge">SUBMITTED</div>
          
          <p>Dear ${submitterData.name},</p>
          
          <p>Your committee nomination for <strong>${nomination.clubName}</strong> has been successfully submitted.</p>

          <div class="section">
            <div><span class="label">Reference Number:</span><span class="value">${referenceNumber}</span></div>
            <div><span class="label">Submission Date:</span><span class="value">${new Date(nomination.submittedAt).toLocaleString('en-AU')}</span></div>
            <div><span class="label">AGM Date:</span><span class="value">${new Date(nomination.agmDate).toLocaleDateString('en-AU')}</span></div>
          </div>

          <div class="info-box">
            <strong>What happens next:</strong><br>
            • Your zone manager will review the District Commissioner nomination<br>
            • You will be notified once the review is complete<br>
            • The complete nomination form is attached to this email for your records
          </div>

          <div class="section">
            <h3>Nominated Committee</h3>
            <div><span class="label">District Commissioner:</span><span class="value">${nomination.districtCommissioner.name}</span></div>
            ${nomination.president ? `<div><span class="label">President:</span><span class="value">${nomination.president.name}</span></div>` : ''}
            ${nomination.vicePresident ? `<div><span class="label">Vice President:</span><span class="value">${nomination.vicePresident.name}</span></div>` : ''}
            ${nomination.secretary ? `<div><span class="label">Secretary:</span><span class="value">${nomination.secretary.name}</span></div>` : ''}
            ${nomination.treasurer ? `<div><span class="label">Treasurer:</span><span class="value">${nomination.treasurer.name}</span></div>` : ''}
          </div>

          <p>If you have any questions, please contact your zone manager or email <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@ponyclub.com.au'}">${process.env.SUPPORT_EMAIL || 'support@ponyclub.com.au'}</a>.</p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation from the Pony Club Event Manager.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Committee Nomination Submitted Successfully

Dear ${submitterData.name},

Your committee nomination for ${nomination.clubName} has been successfully submitted.

Reference Number: ${referenceNumber}
Submission Date: ${new Date(nomination.submittedAt).toLocaleString('en-AU')}
AGM Date: ${new Date(nomination.agmDate).toLocaleDateString('en-AU')}

WHAT HAPPENS NEXT:
• Your zone manager will review the District Commissioner nomination
• You will be notified once the review is complete
• The complete nomination form is attached to this email for your records

NOMINATED COMMITTEE:
- District Commissioner: ${nomination.districtCommissioner.name}
${nomination.president ? `- President: ${nomination.president.name}` : ''}
${nomination.vicePresident ? `- Vice President: ${nomination.vicePresident.name}` : ''}
${nomination.secretary ? `- Secretary: ${nomination.secretary.name}` : ''}
${nomination.treasurer ? `- Treasurer: ${nomination.treasurer.name}` : ''}

If you have any questions, please contact your zone manager or email ${process.env.SUPPORT_EMAIL || 'support@ponyclub.com.au'}.
  `.trim();

  const pdfFilename = `committee-nomination-${nomination.clubName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

  const emailId = await addEmailToQueue({
    to: [submitterData.email],
    subject: `Committee Nomination Confirmation - ${nomination.clubName}`,
    htmlContent,
    textContent,
    attachments: [createPDFAttachment(pdfFilename, pdfBuffer)],
    status: 'pending',
    type: 'notification',
    metadata: {
      nominationId: nomination.id!,
      clubId: nomination.clubId,
      clubName: nomination.clubName,
      type: 'committee_nomination_confirmation',
      referenceNumber,
    },
  });

  return emailId;
}

/**
 * Send notification to zone manager when committee nomination is submitted
 */
export async function sendCommitteeNominationZoneManagerEmail(
  nomination: CommitteeNomination,
  pdfBuffer: Buffer,
  referenceNumber: string
): Promise<string> {
  // Skip sending email if no zone representative is assigned
  if (!nomination.zoneRepresentative || !nomination.zoneRepresentative.email) {
    console.log('No zone representative assigned, skipping zone manager email notification');
    return 'skipped';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1f2937; }
        .value { color: #4b5563; margin-left: 10px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .action-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Committee Nomination - Review Required</h1>
        </div>
        <div class="content">
          <p>Dear ${nomination.zoneRepresentative.name},</p>
          
          <p>A new committee nomination has been submitted for your review:</p>

          <div class="section">
            <div><span class="label">Reference Number:</span><span class="value">${referenceNumber}</span></div>
            <div><span class="label">Club:</span><span class="value">${nomination.clubName}</span></div>
            <div><span class="label">Zone:</span><span class="value">${nomination.zoneName}</span></div>
            <div><span class="label">AGM Date:</span><span class="value">${new Date(nomination.agmDate).toLocaleDateString('en-AU')}</span></div>
            <div><span class="label">Submitted:</span><span class="value">${new Date(nomination.submittedAt).toLocaleString('en-AU')}</span></div>
          </div>

          <div class="section">
            <h3>Nominated District Commissioner</h3>
            <div><span class="label">Name:</span><span class="value">${nomination.districtCommissioner.name}</span></div>
            <div><span class="label">Email:</span><span class="value">${nomination.districtCommissioner.email}</span></div>
            <div><span class="label">Mobile:</span><span class="value">${nomination.districtCommissioner.mobile}</span></div>
            <div><span class="label">Pony Club ID:</span><span class="value">${nomination.districtCommissioner.ponyClubId}</span></div>
          </div>

          <div class="section">
            <h3>Other Committee Members</h3>
            ${nomination.president ? `<div><span class="label">President:</span><span class="value">${nomination.president.name}</span></div>` : ''}
            ${nomination.vicePresident ? `<div><span class="label">Vice President:</span><span class="value">${nomination.vicePresident.name}</span></div>` : ''}
            ${nomination.secretary ? `<div><span class="label">Secretary:</span><span class="value">${nomination.secretary.name}</span></div>` : ''}
            ${nomination.treasurer ? `<div><span class="label">Treasurer:</span><span class="value">${nomination.treasurer.name}</span></div>` : ''}
            ${((nomination as any).additionalCommittee || []).map((member: any) => 
              `<div><span class="label">${member.position}:</span><span class="value">${member.name}</span></div>`
            ).join('')}
          </div>

          <div class="action-box">
            <strong>Action Required:</strong> Please review the committee nomination and approve or reject the District Commissioner nomination. The complete nomination form is attached for your reference.
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/zone-manager" class="button">Review Nomination</a>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Pony Club Event Manager.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
New Committee Nomination - Review Required

Dear ${nomination.zoneRepresentative.name},

A new committee nomination has been submitted for your review:

Reference Number: ${referenceNumber}
Club: ${nomination.clubName}
Zone: ${nomination.zoneName}
AGM Date: ${new Date(nomination.agmDate).toLocaleDateString('en-AU')}
Submitted: ${new Date(nomination.submittedAt).toLocaleString('en-AU')}

NOMINATED DISTRICT COMMISSIONER:
- Name: ${nomination.districtCommissioner.name}
- Email: ${nomination.districtCommissioner.email}
- Mobile: ${nomination.districtCommissioner.mobile}
- Pony Club ID: ${nomination.districtCommissioner.ponyClubId}

OTHER COMMITTEE MEMBERS:
${nomination.president ? `- President: ${nomination.president.name}` : ''}
${nomination.vicePresident ? `- Vice President: ${nomination.vicePresident.name}` : ''}
${nomination.secretary ? `- Secretary: ${nomination.secretary.name}` : ''}
${nomination.treasurer ? `- Treasurer: ${nomination.treasurer.name}` : ''}
${((nomination as any).additionalCommittee || []).map((member: any) => `- ${member.position}: ${member.name}`).join('\n')}

ACTION REQUIRED: Please review the committee nomination and approve or reject the District Commissioner nomination. The complete nomination form is attached for your reference.

Review at: ${process.env.NEXT_PUBLIC_APP_URL}/zone-manager
  `.trim();

  const pdfFilename = `committee-nomination-${nomination.clubName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

  const emailId = await addEmailToQueue({
    to: [nomination.zoneRepresentative.email],
    subject: `Committee Nomination Review Required - ${nomination.clubName}`,
    htmlContent,
    textContent,
    attachments: [createPDFAttachment(pdfFilename, pdfBuffer)],
    status: 'pending',
    type: 'notification',
    metadata: {
      nominationId: nomination.id!,
      clubId: nomination.clubId,
      clubName: nomination.clubName,
      type: 'committee_nomination_zone_review',
      referenceNumber,
    },
  });

  return emailId;
}

/**
 * Send notification to super users with PDF attachment
 */
export async function sendCommitteeNominationSuperUserEmail(
  nomination: CommitteeNomination,
  pdfBuffer: Buffer,
  referenceNumber: string,
  superUserEmails: string[]
): Promise<string[]> {
  if (superUserEmails.length === 0) {
    console.log('No super user emails provided, skipping super user notifications');
    return [];
  }

  const emailIds: string[] = [];

  for (const superUserEmail of superUserEmails) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .admin-badge { display: inline-block; background-color: #ede9fe; color: #5b21b6; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #1f2937; }
          .value { color: #4b5563; margin-left: 10px; }
          .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Committee Nomination - Admin Copy</h1>
          </div>
          <div class="content">
            <div class="admin-badge">SUPER USER NOTIFICATION</div>
            
            <p>A new committee nomination has been submitted:</p>

            <div class="section">
              <div><span class="label">Reference Number:</span><span class="value">${referenceNumber}</span></div>
              <div><span class="label">Club:</span><span class="value">${nomination.clubName}</span></div>
              <div><span class="label">Zone:</span><span class="value">${nomination.zoneName}</span></div>
              <div><span class="label">AGM Date:</span><span class="value">${new Date(nomination.agmDate).toLocaleDateString('en-AU')}</span></div>
              <div><span class="label">Submitted:</span><span class="value">${new Date(nomination.submittedAt).toLocaleString('en-AU')}</span></div>
            </div>

            <div class="section">
              <h3>Submitted By</h3>
              <div><span class="label">Name:</span><span class="value">${nomination.submittedBy.name}</span></div>
              <div><span class="label">Email:</span><span class="value">${nomination.submittedBy.email}</span></div>
              <div><span class="label">Phone:</span><span class="value">${nomination.submittedBy.phone}</span></div>
            </div>

            <div class="section">
              <h3>District Commissioner</h3>
              <div><span class="label">Name:</span><span class="value">${nomination.districtCommissioner.name}</span></div>
              <div><span class="label">Email:</span><span class="value">${nomination.districtCommissioner.email}</span></div>
              <div><span class="label">Pony Club ID:</span><span class="value">${nomination.districtCommissioner.ponyClubId}</span></div>
            </div>

            <div class="section">
              <h3>Committee Summary</h3>
              ${nomination.president ? `<div><span class="label">President:</span><span class="value">${nomination.president.name}</span></div>` : '<div style="color: #999;">President: Not nominated</div>'}
              ${nomination.vicePresident ? `<div><span class="label">Vice President:</span><span class="value">${nomination.vicePresident.name}</span></div>` : '<div style="color: #999;">Vice President: Not nominated</div>'}
              ${nomination.secretary ? `<div><span class="label">Secretary:</span><span class="value">${nomination.secretary.name}</span></div>` : '<div style="color: #999;">Secretary: Not nominated</div>'}
              ${nomination.treasurer ? `<div><span class="label">Treasurer:</span><span class="value">${nomination.treasurer.name}</span></div>` : '<div style="color: #999;">Treasurer: Not nominated</div>'}
              ${((nomination as any).additionalCommittee && (nomination as any).additionalCommittee.length > 0) ? `<div><span class="label">Additional Members:</span><span class="value">${(nomination as any).additionalCommittee.length}</span></div>` : ''}
            </div>

            <p>The complete nomination form is attached to this email for your records.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Pony Club Event Manager.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Committee Nomination - Admin Copy

SUPER USER NOTIFICATION

A new committee nomination has been submitted:

Reference Number: ${referenceNumber}
Club: ${nomination.clubName}
Zone: ${nomination.zoneName}
AGM Date: ${new Date(nomination.agmDate).toLocaleDateString('en-AU')}
Submitted: ${new Date(nomination.submittedAt).toLocaleString('en-AU')}

SUBMITTED BY:
- Name: ${nomination.submittedBy.name}
- Email: ${nomination.submittedBy.email}
- Phone: ${nomination.submittedBy.phone}

DISTRICT COMMISSIONER:
- Name: ${nomination.districtCommissioner.name}
- Email: ${nomination.districtCommissioner.email}
- Pony Club ID: ${nomination.districtCommissioner.ponyClubId}

COMMITTEE SUMMARY:
${nomination.president ? `- President: ${nomination.president.name}` : '- President: Not nominated'}
${nomination.vicePresident ? `- Vice President: ${nomination.vicePresident.name}` : '- Vice President: Not nominated'}
${nomination.secretary ? `- Secretary: ${nomination.secretary.name}` : '- Secretary: Not nominated'}
${nomination.treasurer ? `- Treasurer: ${nomination.treasurer.name}` : '- Treasurer: Not nominated'}
${((nomination as any).additionalCommittee && (nomination as any).additionalCommittee.length > 0) ? `- Additional Members: ${(nomination as any).additionalCommittee.length}` : ''}

The complete nomination form is attached to this email for your records.
    `.trim();

    const pdfFilename = `committee-nomination-${nomination.clubName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

    const emailId = await addEmailToQueue({
      to: [superUserEmail],
      subject: `Committee Nomination Submitted - ${nomination.clubName} (Admin Copy)`,
      htmlContent,
      textContent,
      attachments: [createPDFAttachment(pdfFilename, pdfBuffer)],
      status: 'pending',
      type: 'notification',
      metadata: {
        nominationId: nomination.id!,
        clubId: nomination.clubId,
        clubName: nomination.clubName,
        type: 'committee_nomination_super_user',
        referenceNumber,
      },
    });

    emailIds.push(emailId);
  }

  return emailIds;
}

/**
 * Send notification to club when DC is approved
 */
export async function sendDCApprovedEmail(
  nomination: CommitteeNomination
): Promise<string> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .success-badge { display: inline-block; background-color: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1f2937; }
        .value { color: #4b5563; margin-left: 10px; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ District Commissioner Approved</h1>
        </div>
        <div class="content">
          <div class="success-badge">APPROVED</div>
          
          <p>Dear ${nomination.clubName} Committee,</p>
          
          <p>Your District Commissioner nomination has been approved.</p>

          <div class="section">
            <h3>Approved District Commissioner</h3>
            <div><span class="label">Name:</span><span class="value">${nomination.districtCommissioner.name}</span></div>
            <div><span class="label">Email:</span><span class="value">${nomination.districtCommissioner.email}</span></div>
            <div><span class="label">Mobile:</span><span class="value">${nomination.districtCommissioner.mobile}</span></div>
            <div><span class="label">Pony Club ID:</span><span class="value">${nomination.districtCommissioner.ponyClubId}</span></div>
          </div>

          <div class="section">
            <div><span class="label">Approved Date:</span><span class="value">${nomination.districtCommissioner.approvedAt ? new Date(nomination.districtCommissioner.approvedAt).toLocaleDateString() : 'N/A'}</span></div>
          </div>

          <p>Your committee is now officially registered in the system.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from the Pony Club Event Manager.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
District Commissioner Approved

Dear ${nomination.clubName} Committee,

Your District Commissioner nomination has been approved.

Approved District Commissioner:
- Name: ${nomination.districtCommissioner.name}
- Email: ${nomination.districtCommissioner.email}
- Mobile: ${nomination.districtCommissioner.mobile}
- Pony Club ID: ${nomination.districtCommissioner.ponyClubId}

Approved Date: ${nomination.districtCommissioner.approvedAt ? new Date(nomination.districtCommissioner.approvedAt).toLocaleDateString() : 'N/A'}

Your committee is now officially registered in the system.
  `.trim();

  // Send to DC and any other committee members with emails
  const recipients = [
    nomination.districtCommissioner.email,
    nomination.secretary?.email,
    nomination.treasurer?.email,
  ].filter(Boolean) as string[];

  const emailId = await addEmailToQueue({
    to: recipients,
    subject: `DC Nomination Approved - ${nomination.clubName}`,
    htmlContent,
    textContent,
    status: 'pending',
    type: 'notification',
    metadata: {
      nominationId: nomination.id!,
      clubId: nomination.clubId,
      clubName: nomination.clubName,
      type: 'dc_approved',
    },
  });

  return emailId;
}

/**
 * Send notification to club when DC is rejected
 */
export async function sendDCRejectedEmail(
  nomination: CommitteeNomination
): Promise<string> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .warning-badge { display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .label { font-weight: bold; color: #1f2937; }
        .value { color: #4b5563; margin-left: 10px; }
        .reason-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>District Commissioner Nomination Not Approved</h1>
        </div>
        <div class="content">
          <div class="warning-badge">REQUIRES RESUBMISSION</div>
          
          <p>Dear ${nomination.clubName} Committee,</p>
          
          <p>Your District Commissioner nomination was not approved.</p>

          <div class="reason-box">
            <strong>Reason:</strong><br>
            ${nomination.districtCommissioner.rejectionReason || 'No reason provided'}
          </div>

          <div class="section">
            <h3>Nominated District Commissioner</h3>
            <div><span class="label">Name:</span><span class="value">${nomination.districtCommissioner.name}</span></div>
            <div><span class="label">Email:</span><span class="value">${nomination.districtCommissioner.email}</span></div>
          </div>

          <p><strong>Next Steps:</strong> Please review the feedback and submit a new committee nomination addressing the concerns raised.</p>

        </div>
        <div class="footer">
          <p>This is an automated notification from the Pony Club Event Manager.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
District Commissioner Nomination Not Approved

Dear ${nomination.clubName} Committee,

Your District Commissioner nomination was not approved.

Reason:
${nomination.districtCommissioner.rejectionReason || 'No reason provided'}

Nominated District Commissioner:
- Name: ${nomination.districtCommissioner.name}
- Email: ${nomination.districtCommissioner.email}

Next Steps: Please review the feedback and submit a new committee nomination addressing the concerns raised.

Submit new nomination at: ${process.env.NEXT_PUBLIC_APP_URL}/club-manager
  `.trim();

  // Send to DC and any other committee members with emails
  const recipients = [
    nomination.districtCommissioner.email,
    nomination.secretary?.email,
    nomination.treasurer?.email,
  ].filter(Boolean) as string[];

  const emailId = await addEmailToQueue({
    to: recipients,
    subject: `DC Nomination Requires Resubmission - ${nomination.clubName}`,
    htmlContent,
    textContent,
    status: 'pending',
    type: 'notification',
    metadata: {
      nominationId: nomination.id!,
      clubId: nomination.clubId,
      clubName: nomination.clubName,
      type: 'dc_rejected',
    },
  });

  return emailId;
}

/**
 * Send reminder to zone rep about pending nominations
 */
export async function sendPendingNominationsReminderEmail(
  zoneRepEmail: string,
  zoneRepName: string,
  pendingCount: number,
  nominations: CommitteeNomination[]
): Promise<string> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .badge { display: inline-block; background-color: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-bottom: 20px; }
        .nomination-list { list-style: none; padding: 0; }
        .nomination-item { background-color: white; padding: 15px; margin-bottom: 10px; border-left: 4px solid #f59e0b; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pending Committee Nominations</h1>
        </div>
        <div class="content">
          <div class="badge">${pendingCount} PENDING</div>
          
          <p>Dear ${zoneRepName},</p>
          
          <p>You have ${pendingCount} committee nomination${pendingCount > 1 ? 's' : ''} awaiting your review:</p>

          <ul class="nomination-list">
            ${nominations.map(nom => `
              <li class="nomination-item">
                <strong>${nom.clubName}</strong><br>
                DC: ${nom.districtCommissioner.name}<br>
                Submitted: ${new Date(nom.submittedAt).toLocaleDateString()}
              </li>
            `).join('')}
          </ul>

          <p>Please review these nominations at your earliest convenience.</p>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/zone-manager" class="button">Review Nominations</a>
        </div>
        <div class="footer">
          <p>This is an automated reminder from the Pony Club Event Manager.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Pending Committee Nominations

Dear ${zoneRepName},

You have ${pendingCount} committee nomination${pendingCount > 1 ? 's' : ''} awaiting your review:

${nominations.map(nom => `
- ${nom.clubName}
  DC: ${nom.districtCommissioner.name}
  Submitted: ${new Date(nom.submittedAt).toLocaleDateString()}
`).join('\n')}

Please review these nominations at your earliest convenience.

Review at: ${process.env.NEXT_PUBLIC_APP_URL}/zone-manager
  `.trim();

  const emailId = await addEmailToQueue({
    to: [zoneRepEmail],
    subject: `Reminder: ${pendingCount} Pending Committee Nomination${pendingCount > 1 ? 's' : ''}`,
    htmlContent,
    textContent,
    status: 'pending',
    type: 'reminder',
    metadata: {
      zoneRepEmail,
      pendingCount,
      type: 'pending_nominations_reminder',
    },
  });

  return emailId;
}
