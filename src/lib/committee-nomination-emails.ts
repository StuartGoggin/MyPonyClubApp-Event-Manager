import { addEmailToQueue } from './email-queue-admin';
import { CommitteeNomination } from '@/types/committee-nomination';

/**
 * Email notification helpers for committee nomination workflow
 */

/**
 * Send notification to zone rep when committee nomination is submitted
 */
export async function sendCommitteeNominationSubmittedEmail(
  nomination: CommitteeNomination
): Promise<string> {
  // Skip sending email if no zone representative is assigned
  if (!nomination.zoneRepresentative || !nomination.zoneRepresentative.email) {
    console.log('No zone representative assigned, skipping email notification');
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
        .footer { margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Committee Nomination Submitted</h1>
        </div>
        <div class="content">
          <p>Dear ${nomination.zoneRepresentative.name},</p>
          
          <p>A new committee nomination has been submitted for your review:</p>

          <div class="section">
            <div><span class="label">Club:</span><span class="value">${nomination.clubName}</span></div>
            <div><span class="label">AGM Date:</span><span class="value">${new Date(nomination.agmDate).toLocaleDateString()}</span></div>
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
            ${nomination.secretary ? `<div><span class="label">Secretary:</span><span class="value">${nomination.secretary.name}</span></div>` : ''}
            ${nomination.treasurer ? `<div><span class="label">Treasurer:</span><span class="value">${nomination.treasurer.name}</span></div>` : ''}
            ${nomination.president ? `<div><span class="label">President:</span><span class="value">${nomination.president.name}</span></div>` : ''}
            ${nomination.vicePresident ? `<div><span class="label">Vice President:</span><span class="value">${nomination.vicePresident.name}</span></div>` : ''}
            ${nomination.additionalCommittee.map((member: any) => 
              `<div><span class="label">${member.position}:</span><span class="value">${member.name}</span></div>`
            ).join('')}
          </div>

          <p><strong>Action Required:</strong> Please review the committee nomination and approve or reject the District Commissioner.</p>

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
New Committee Nomination Submitted

Dear ${nomination.zoneRepresentative.name},

A new committee nomination has been submitted for your review:

Club: ${nomination.clubName}
AGM Date: ${new Date(nomination.agmDate).toLocaleDateString()}

Nominated District Commissioner:
- Name: ${nomination.districtCommissioner.name}
- Email: ${nomination.districtCommissioner.email}
- Mobile: ${nomination.districtCommissioner.mobile}
- Pony Club ID: ${nomination.districtCommissioner.ponyClubId}

Other Committee Members:
${nomination.secretary ? `- Secretary: ${nomination.secretary.name}` : ''}
${nomination.treasurer ? `- Treasurer: ${nomination.treasurer.name}` : ''}
${nomination.president ? `- President: ${nomination.president.name}` : ''}
${nomination.vicePresident ? `- Vice President: ${nomination.vicePresident.name}` : ''}
${nomination.additionalCommittee.map((member: any) => `- ${member.position}: ${member.name}`).join('\n')}

Action Required: Please review the committee nomination and approve or reject the District Commissioner.

Review at: ${process.env.NEXT_PUBLIC_APP_URL}/zone-manager
  `.trim();

  const emailId = await addEmailToQueue({
    to: [nomination.zoneRepresentative.email],
    subject: `Committee Nomination - ${nomination.clubName}`,
    htmlContent,
    textContent,
    status: 'pending',
    type: 'notification',
    metadata: {
      nominationId: nomination.id!,
      clubId: nomination.clubId,
      clubName: nomination.clubName,
      type: 'committee_nomination_submitted',
    },
  });

  return emailId;
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
