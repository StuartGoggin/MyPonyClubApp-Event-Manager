import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateEventRequestPDF } from '@/lib/event-request-pdf';
import { getClubById, getZoneByClubId } from '@/lib/data';
import { addEmailToQueue, getEmailQueueConfig } from '@/lib/email-queue-admin';
import { QueuedEmail } from '@/lib/types';

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Zone approver email configuration
const zoneApprovers = {
  'smz': ['smzsecretary@gmail.com'],
  // Add other zones as needed
  // 'emz': ['emzsecretary@example.com'],
  // 'wmz': ['wmzsecretary@example.com'],
};

interface EventRequestEmailData {
  formData: {
    clubId: string;
    clubName?: string;
    submittedBy: string;
    submittedByEmail: string;
    submittedByPhone: string;
    events: Array<{
      priority: number;
      name: string;
      eventTypeId: string;
      date: Date | string;
      location: string;
      isQualifier: boolean;
      isHistoricallyTraditional: boolean;
      eventTypeName?: string;
      description?: string;
      coordinatorName?: string;
      coordinatorContact?: string;
      notes?: string;
    }>;
    generalNotes?: string;
  };
  pdfData: number[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('Email API called');
    
    const data: EventRequestEmailData = await request.json();
    console.log('Received data:', { hasFormData: !!data.formData, hasPdfData: !!data.pdfData });
    
    const { formData } = data;

    // Validate required data
    if (!formData) {
      console.error('No form data provided');
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    // Get club and zone information
    console.log('Getting club info for:', formData.clubId);
    const club = await getClubById(formData.clubId);
    if (!club) {
      console.error('Club not found:', formData.clubId);
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    const zone = await getZoneByClubId(formData.clubId);
    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found for this club' },
        { status: 404 }
      );
    }

    // Get zone approver emails
    // Generate a zone identifier for email prefix
    const zoneCode = zone.name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    const approverEmails = zoneApprovers[zoneCode as keyof typeof zoneApprovers];
    
    if (!approverEmails || approverEmails.length === 0) {
      return NextResponse.json(
        { error: 'No zone approver emails configured for this zone' },
        { status: 404 }
      );
    }

    // Generate PDF attachment
    const pdfBuffer = await generateEventRequestPDF({
      formData: {
        ...formData,
        clubName: club.name,
        events: formData.events.map(event => ({
          ...event,
          date: typeof event.date === 'string' ? new Date(event.date) : event.date,
          coordinatorName: event.coordinatorName || '',
          coordinatorContact: event.coordinatorContact || ''
        }))
      }
    });

    // Format submission date
    const submissionDate = new Date().toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format events list for email
    const eventsList = formData.events
      .sort((a, b) => a.priority - b.priority)
      .map(event => {
        const eventDate = new Date(event.date).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        return `${event.priority}${getOrdinalSuffix(event.priority)} Priority: ${event.name}
   Date: ${eventDate}
   Location: ${event.location}
   Qualifier: ${event.isQualifier ? 'Yes' : 'No'}
   Traditional: ${event.isHistoricallyTraditional ? 'Yes' : 'No'}`;
      })
      .join('\n\n');

    // Create email subject
    const subject = `Event Request Submission - ${club.name} (${formData.events.length} events)`;

    // Create email HTML content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          Event Calendar Request Submission
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Submission Details</h3>
          <p><strong>Submitted:</strong> ${submissionDate}</p>
          <p><strong>Club:</strong> ${club.name} (${zone.name})</p>
          <p><strong>Submitted by:</strong> ${formData.submittedBy}</p>
          <p><strong>Contact Email:</strong> ${formData.submittedByEmail}</p>
          <p><strong>Contact Phone:</strong> ${formData.submittedByPhone}</p>
        </div>

        <h3 style="color: #374151;">Requested Events (${formData.events.length})</h3>
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <pre style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${eventsList}</pre>
        </div>

        ${formData.generalNotes ? `
        <h3 style="color: #374151;">Additional Notes</h3>
        <div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px;">
          <p style="margin: 0;">${formData.generalNotes}</p>
        </div>
        ` : ''}

        <div style="margin: 30px 0; padding: 20px; background-color: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please review this event request submission and respond to ${formData.submittedByEmail} with approval status.</p>
        </div>

        <div style="margin: 30px 0; padding: 15px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">This email was automatically generated by the MyPonyClub Event Manager system. The attached PDF contains the complete form for your records.</p>
        </div>
      </div>
    `;

    // Create text content for the email
    const emailText = `
Event Calendar Request Submission

Submission Details:
- Submitted: ${submissionDate}
- Club: ${club.name} (${zone.name})
- Submitted by: ${formData.submittedBy}
- Contact Email: ${formData.submittedByEmail}
- Contact Phone: ${formData.submittedByPhone}

Requested Events (${formData.events.length}):
${eventsList}

${formData.generalNotes ? `Additional Notes:
${formData.generalNotes}` : ''}

Action Required: Please review this event request submission and respond to ${formData.submittedByEmail} with approval status.

This email was automatically generated by the MyPonyClub Event Manager system.
    `.trim();

    // Check email queue configuration to determine if we should queue or send immediately
    const config = await getEmailQueueConfig();
    const shouldQueue = config?.requireApprovalForEventRequests ?? true;

    if (shouldQueue) {
      // Queue the email for admin review
      console.log('Queueing email for admin review');

      const queuedEmail: Omit<QueuedEmail, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'event_request',
        status: 'draft',
        to: approverEmails,
        cc: [formData.submittedByEmail],
        subject,
        htmlContent: emailHtml,
        textContent: emailText,
        attachments: [
          {
            id: `pdf-${Date.now()}`,
            filename: `event-request-${club.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`,
            contentType: 'application/pdf',
            size: pdfBuffer.length,
            content: pdfBuffer.toString('base64'),
            createdAt: new Date(),
          }
        ],
        createdBy: `${formData.submittedBy} (${formData.submittedByEmail})`,
        relatedClubId: formData.clubId,
        relatedZoneId: zone.id,
        requiresApproval: true,
        isPriority: false,
      };

      const emailId = await addEmailToQueue(queuedEmail);

      return NextResponse.json({
        success: true,
        message: 'Email queued for admin review',
        emailId,
        queuedForReview: true,
        recipients: approverEmails,
        submitterCc: formData.submittedByEmail
      });
    }

    // Send immediately (original logic)
    console.log('Sending email immediately');

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      console.log('RESEND_API_KEY not configured, logging email instead of sending:');
      console.log('Subject:', subject);
      console.log('To:', approverEmails.join(', '));
      console.log('CC:', formData.submittedByEmail);
      console.log('PDF attachment size:', pdfBuffer.length, 'bytes');
      console.log('Email HTML preview:', emailHtml.substring(0, 200) + '...');
      
      return NextResponse.json({
        success: true,
        message: 'Email simulation successful (no API key configured)',
        recipients: approverEmails,
        submitterCc: formData.submittedByEmail,
        queuedForReview: false
      });
    }

    // Send email to all zone approvers
    const emailPromises = approverEmails.map(email => 
      resend.emails.send({
        from: 'MyPonyClub Event Manager <noreply@myponyclub.com>',
        to: [email],
        cc: [formData.submittedByEmail], // CC the submitter
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: `event-request-${club.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
          },
        ],
      })
    );

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Email sent successfully to ${approverEmails.length} zone approver(s)`,
      recipients: approverEmails,
      queuedForReview: false
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return 'st';
  }
  if (j === 2 && k !== 12) {
    return 'nd';
  }
  if (j === 3 && k !== 13) {
    return 'rd';
  }
  return 'th';
}