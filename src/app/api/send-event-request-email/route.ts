import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateEventRequestPDF } from '@/lib/event-request-pdf';
import { getClubById, getZoneByClubId } from '@/lib/data';
import { addEmailToQueue, getEmailQueueConfig } from '@/lib/email-queue-admin';
import { requiresApproval, getInitialEmailStatus, shouldAutoSend } from '@/lib/email-approval-utils';
import { autoSendQueuedEmail } from '@/lib/auto-send-email';
import { exportEventRequestAsJSON, createJSONAttachment } from '@/lib/event-request-json-export';
import { generateEventRequestEmailHTML, generateEventRequestEmailText } from '@/lib/event-request-email-template';
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

// Super user emails (will receive JSON exports)
const superUserEmails = process.env.SUPER_USER_EMAILS 
  ? process.env.SUPER_USER_EMAILS.split(',').map(email => email.trim())
  : [
      'admin@ponyclub.com.au',
      // Add more super user emails as needed
    ];

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
    console.log('Enhanced Email Notification API called');
    
    const data: EventRequestEmailData = await request.json();
    console.log('Received data:', { hasFormData: !!data.formData, hasPdfData: !!data.pdfData });
    
    const { formData, pdfData } = data;

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

    // Generate reference number
    const referenceNumber = `ER-${Date.now()}`;
    console.log('Generated reference number:', referenceNumber);

    // Generate JSON export for super users
    const jsonExport = await exportEventRequestAsJSON(formData, referenceNumber);
    const jsonAttachment = createJSONAttachment(jsonExport);

    // Get zone approver emails
    const zoneCode = zone.name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 3);
    const approverEmails = zoneApprovers[zoneCode as keyof typeof zoneApprovers] || [];
    
    if (approverEmails.length === 0) {
      console.warn('No zone approver emails configured for zone:', zone.name);
    }

    // Get PDF buffer from provided data or generate new one
    let pdfBuffer: Buffer;
    if (pdfData && pdfData.length > 0) {
      pdfBuffer = Buffer.from(pdfData);
      console.log('Using provided PDF data, size:', pdfBuffer.length);
    } else {
      console.log('Generating new PDF...');
      pdfBuffer = await generateEventRequestPDF({
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
    }

    // Prepare email template data
    const emailTemplateData = {
      requesterName: formData.submittedBy,
      requesterEmail: formData.submittedByEmail,
      requesterPhone: formData.submittedByPhone,
      clubName: club.name,
      zoneName: zone.name,
      submissionDate: new Date().toISOString(),
      referenceNumber,
      events: formData.events.map(event => ({
        priority: event.priority,
        name: event.name,
        eventTypeName: event.eventTypeName || 'Unknown Event Type',
        date: typeof event.date === 'string' ? event.date : event.date.toISOString(),
        location: event.location,
        isQualifier: event.isQualifier,
        isHistoricallyTraditional: event.isHistoricallyTraditional,
        coordinatorName: event.coordinatorName,
        coordinatorContact: event.coordinatorContact,
        notes: event.notes,
      })),
      generalNotes: formData.generalNotes,
    };

    const pdfFilename = `event-request-${formData.submittedByEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Check email queue configuration
    const emailConfig = await getEmailQueueConfig();
    const shouldQueue = requiresApproval('event_request', emailConfig);
    const emailType = 'event_request' as const;
    const initialStatus = getInitialEmailStatus(emailType, emailConfig);

    const emailResults = [];
    const queuedEmails = [];

    // Common email attachments
    const pdfAttachment = {
      filename: pdfFilename,
      content: pdfBuffer.toString('base64'),
      type: 'application/pdf',
    };

    // For queue system - create proper EmailAttachment objects
    const createEmailAttachment = (filename: string, content: string, contentType: string): any => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      filename,
      contentType,
      size: Buffer.from(content, 'base64').length,
      content,
      createdAt: new Date(),
    });

    // 1. Send email to requesting user
    console.log('Preparing email for requesting user:', formData.submittedByEmail);
    
    const requesterEmailData = {
      ...emailTemplateData,
      isForSuperUser: false,
    };

    const requesterEmail = {
      from: 'noreply@ponyclub.com.au',
      to: [formData.submittedByEmail],
      subject: `Event Request Submitted - ${referenceNumber}`,
      html: generateEventRequestEmailHTML(requesterEmailData),
      text: generateEventRequestEmailText(requesterEmailData),
      attachments: [pdfAttachment],
    };

    if (shouldQueue) {
      console.log('Queueing email for requesting user');
      const queuedEmailData = {
        to: requesterEmail.to,
        subject: requesterEmail.subject,
        htmlContent: requesterEmail.html,
        textContent: requesterEmail.text,
        attachments: [createEmailAttachment(pdfFilename, pdfBuffer.toString('base64'), 'application/pdf')],
        status: initialStatus,
        type: emailType,
        metadata: {
          requesterId: formData.submittedByEmail,
          clubId: formData.clubId,
          referenceNumber,
        },
      };
      const emailId = await addEmailToQueue(queuedEmailData);
      console.log('Email queued with ID:', emailId, 'Status:', initialStatus);
      
      // If email doesn't require approval, auto-send it
      if (shouldAutoSend(emailType, emailConfig)) {
        console.log('Auto-sending email (no approval required)');
        try {
          const autoSendResult = await autoSendQueuedEmail(emailId);
          if (autoSendResult.success) {
            console.log('Email auto-sent successfully');
          } else {
            console.error('Auto-send failed:', autoSendResult.error);
          }
        } catch (autoSendError) {
          console.error('Auto-send error:', autoSendError);
        }
      } else {
        console.log('Email requires approval - waiting for manual approval');
      }
      
      queuedEmails.push('requester');
    } else if (resend) {
      try {
        console.log('Sending immediate email to requesting user');
        const result = await resend.emails.send(requesterEmail);
        console.log('Requester email sent:', result);
        emailResults.push({ type: 'requester', success: true, id: result.data?.id });
      } catch (error) {
        console.error('Failed to send requester email:', error);
        emailResults.push({ type: 'requester', success: false, error });
      }
    }

    // 2. Send email to zone approvers
    for (const approverEmail of approverEmails) {
      console.log('Preparing email for zone approver:', approverEmail);
      
      const approverEmailData = {
        ...emailTemplateData,
        isForSuperUser: false,
      };

      const zoneApproverEmail = {
        from: 'noreply@ponyclub.com.au',
        to: [approverEmail],
        subject: `Zone Approval Required - Event Request ${referenceNumber}`,
        html: generateEventRequestEmailHTML(approverEmailData),
        text: generateEventRequestEmailText(approverEmailData),
        attachments: [pdfAttachment],
      };

      if (shouldQueue) {
        console.log('Queueing email for zone approver:', approverEmail);
        const queuedEmailData = {
          to: zoneApproverEmail.to,
          subject: zoneApproverEmail.subject,
          htmlContent: zoneApproverEmail.html,
          textContent: zoneApproverEmail.text,
          attachments: [createEmailAttachment(pdfFilename, pdfBuffer.toString('base64'), 'application/pdf')],
          status: initialStatus,
          type: emailType,
          metadata: {
            requesterId: formData.submittedByEmail,
            clubId: formData.clubId,
            referenceNumber,
            approverEmail,
          },
        };
        const emailId = await addEmailToQueue(queuedEmailData);
        console.log('Zone approver email queued with ID:', emailId, 'Status:', initialStatus);
        
        // If email doesn't require approval, auto-send it
        if (shouldAutoSend(emailType, emailConfig)) {
          console.log('Auto-sending zone approver email (no approval required)');
          try {
            const autoSendResult = await autoSendQueuedEmail(emailId);
            if (autoSendResult.success) {
              console.log('Zone approver email auto-sent successfully');
            } else {
              console.error('Zone approver auto-send failed:', autoSendResult.error);
            }
          } catch (autoSendError) {
            console.error('Zone approver auto-send error:', autoSendError);
          }
        } else {
          console.log('Zone approver email requires approval - waiting for manual approval');
        }
        
        queuedEmails.push(`zone-approver-${approverEmail}`);
      } else if (resend) {
        try {
          console.log('Sending immediate email to zone approver:', approverEmail);
          const result = await resend.emails.send(zoneApproverEmail);
          console.log('Zone approver email sent:', result);
          emailResults.push({ type: 'zone-approver', success: true, id: result.data?.id, recipient: approverEmail });
        } catch (error) {
          console.error('Failed to send zone approver email:', error);
          emailResults.push({ type: 'zone-approver', success: false, error, recipient: approverEmail });
        }
      }
    }

    // 3. Send email with JSON export to super users
    for (const superUserEmail of superUserEmails) {
      console.log('Preparing email for super user:', superUserEmail);
      
      const superUserEmailData = {
        ...emailTemplateData,
        isForSuperUser: true,
      };

      const superUserEmailMessage = {
        from: 'noreply@ponyclub.com.au',
        to: [superUserEmail],
        subject: `Super User Notification - Event Request ${referenceNumber}`,
        html: generateEventRequestEmailHTML(superUserEmailData),
        text: generateEventRequestEmailText(superUserEmailData),
        attachments: [
          pdfAttachment,
          {
            filename: jsonAttachment.filename,
            content: Buffer.from(jsonAttachment.content).toString('base64'),
            type: jsonAttachment.mimeType,
          },
        ],
      };

      if (shouldQueue) {
        console.log('Queueing email for super user:', superUserEmail);
        const queuedEmailData = {
          to: superUserEmailMessage.to,
          subject: superUserEmailMessage.subject,
          htmlContent: superUserEmailMessage.html,
          textContent: superUserEmailMessage.text,
          attachments: [
            createEmailAttachment(pdfFilename, pdfBuffer.toString('base64'), 'application/pdf'),
            createEmailAttachment(jsonAttachment.filename, Buffer.from(jsonAttachment.content).toString('base64'), jsonAttachment.mimeType),
          ],
          status: initialStatus,
          type: emailType,
          metadata: {
            requesterId: formData.submittedByEmail,
            clubId: formData.clubId,
            referenceNumber,
            superUserEmail,
            hasJsonExport: true,
          },
        };
        const emailId = await addEmailToQueue(queuedEmailData);
        console.log('Super user email queued with ID:', emailId, 'Status:', initialStatus);
        
        // If email doesn't require approval, auto-send it
        if (shouldAutoSend(emailType, emailConfig)) {
          console.log('Auto-sending super user email (no approval required)');
          try {
            const autoSendResult = await autoSendQueuedEmail(emailId);
            if (autoSendResult.success) {
              console.log('Super user email auto-sent successfully');
            } else {
              console.error('Super user auto-send failed:', autoSendResult.error);
            }
          } catch (autoSendError) {
            console.error('Super user auto-send error:', autoSendError);
          }
        } else {
          console.log('Super user email requires approval - waiting for manual approval');
        }
        
        queuedEmails.push(`super-user-${superUserEmail}`);
      } else if (resend) {
        try {
          console.log('Sending immediate email to super user:', superUserEmail);
          const result = await resend.emails.send(superUserEmailMessage);
          console.log('Super user email sent:', result);
          emailResults.push({ type: 'super-user', success: true, id: result.data?.id, recipient: superUserEmail });
        } catch (error) {
          console.error('Failed to send super user email:', error);
          emailResults.push({ type: 'super-user', success: false, error, recipient: superUserEmail });
        }
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: 'Event request notifications processed successfully',
      referenceNumber,
      queuedForReview: shouldQueue,
      recipients: {
        requester: formData.submittedByEmail,
        zoneApprovers: approverEmails,
        superUsers: superUserEmails,
      },
      ...(shouldQueue 
        ? { queuedEmails: queuedEmails.length }
        : { 
            emailResults,
            successfulSends: emailResults.filter(r => r.success).length,
            failedSends: emailResults.filter(r => !r.success).length,
          }
      ),
    };

    console.log('Email processing completed:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}