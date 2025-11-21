import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { EmailTemplateVariableData } from '@/lib/types-email-templates';
import { addEmailToQueue } from '@/lib/email-queue-admin';
import { generateEmailFromTemplate } from '@/lib/email-template-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, emailType } = body;

    console.log('Resend email request:', { eventId, emailType });

    if (!eventId || !emailType) {
      console.error('Missing required fields:', { eventId, emailType });
      return NextResponse.json(
        { success: false, error: 'Event ID and email type are required' },
        { status: 400 }
      );
    }

    // Fetch event details from Firestore
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      console.error('Event not found:', eventId);
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as any;
    console.log('Event found:', { 
      id: event.id, 
      name: event.name,
      submittedByEmail: event.submittedByEmail,
      coordinatorContact: event.coordinatorContact 
    });

    // Try to find the original email from the email queue
    let requesterEmail = event.submittedByEmail || '';
    
    if (!requesterEmail || !requesterEmail.includes('@')) {
      // Look for the original event request email in the queue
      const emailQueueSnapshot = await adminDb.collection('emailQueue')
        .where('metadata.eventIds', 'array-contains', eventId)
        .where('type', '==', 'event_request')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!emailQueueSnapshot.empty) {
        const queuedEmail = emailQueueSnapshot.docs[0].data();
        // Extract the requester email from the original email recipient
        if (queuedEmail.to && Array.isArray(queuedEmail.to) && queuedEmail.to.length > 0) {
          requesterEmail = queuedEmail.to[0];
        }
      }
    }

    console.log('Requester email resolved to:', requesterEmail);

    // Fetch club details
    let clubName = 'Unknown Club';
    let zoneIdFromClub = '';
    if (event.clubId) {
      const clubDoc = await adminDb.collection('clubs').doc(event.clubId).get();
      if (clubDoc.exists) {
        const clubData = clubDoc.data();
        clubName = clubData?.name || 'Unknown Club';
        zoneIdFromClub = clubData?.zoneId || '';
        console.log('Club lookup:', { clubId: event.clubId, clubName, zoneId: zoneIdFromClub });
      }
    }

    // Fetch zone details - try event.zoneId first, then fall back to club's zoneId
    const zoneId = event.zoneId || zoneIdFromClub;
    let zoneName = 'Unknown Zone';
    if (zoneId) {
      const zoneDoc = await adminDb.collection('zones').doc(zoneId).get();
      if (zoneDoc.exists) {
        zoneName = zoneDoc.data()?.name || 'Unknown Zone';
      }
      console.log('Zone lookup:', { zoneId, zoneName, exists: zoneDoc.exists });
    } else {
      console.log('No zoneId on event or club');
    }

    // Fetch event type details
    let eventTypeName = 'Unknown Type';
    if (event.eventTypeId) {
      const eventTypeDoc = await adminDb.collection('eventTypes').doc(event.eventTypeId).get();
      if (eventTypeDoc.exists) {
        eventTypeName = eventTypeDoc.data()?.name || 'Unknown Type';
      }
    }

    // Prepare template variables
    const templateVariables: EmailTemplateVariableData = {
      requesterName: event.submittedBy || event.coordinatorName || 'Event Coordinator',
      requesterEmail: requesterEmail,
      requesterPhone: event.submittedByPhone || event.coordinatorPhone || event.submittedByContact || '',
      clubName: clubName,
      clubId: event.clubId || '',
      zoneName: zoneName,
      zoneId: zoneId || '',
      submissionDate: new Date(event.createdAt?.toDate?.() || event.createdAt || new Date()).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      referenceNumber: event.referenceNumber || `ER-${eventId}`,
      events: [{
        priority: 1,
        name: event.name,
        eventTypeName: eventTypeName,
        date: new Date(event.date?.toDate?.() || event.date).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        location: event.location || '',
        coordinatorName: event.coordinatorName || '',
        coordinatorContact: event.coordinatorContact || '',
        isQualifier: event.isQualifier || false,
        isHistoricallyTraditional: event.isHistoricallyTraditional || false,
        notes: event.notes || ''
      }],
      generalNotes: event.notes || '',
      organizationName: 'MyPonyClub Events',
      supportEmail: 'support@myponyclub.events',
      systemUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://myponyclub.events'
    };

    console.log('Template variables prepared:', {
      zoneName: templateVariables.zoneName,
      clubName: templateVariables.clubName,
      referenceNumber: templateVariables.referenceNumber
    });

    let emailContent;
    let recipients: string[] = [];
    let subject = '';

    // Determine email type and recipients
    switch (emailType) {
      case 'event_request':
        // Send to requester (confirmation)
        emailContent = await generateEmailFromTemplate('event-request-requester', templateVariables);
        if (requesterEmail && requesterEmail.includes('@')) {
          recipients = [requesterEmail];
        }
        subject = emailContent.subject;
        break;

      case 'event_approval':
        // Send approval notification to requester
        emailContent = await generateEmailFromTemplate('event-request-requester', templateVariables);
        if (requesterEmail && requesterEmail.includes('@')) {
          recipients = [requesterEmail];
        }
        subject = `Event Approved - ${templateVariables.referenceNumber}`;
        break;

      case 'zone_notification':
        // Send to zone managers
        emailContent = await generateEmailFromTemplate('event-request-zone-manager', templateVariables);
        // Fetch zone managers
        const zoneManagers = await adminDb.collection('users')
          .where('role', '==', 'zone_rep')
          .where('zoneId', '==', event.zoneId)
          .where('isActive', '==', true)
          .get();
        
        recipients = zoneManagers.docs
          .map(doc => doc.data().email)
          .filter((email): email is string => typeof email === 'string' && email.includes('@'));
        subject = emailContent.subject;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid email type' },
          { status: 400 }
        );
    }

    if (recipients.length === 0) {
      console.error('No valid recipients found:', { 
        eventId, 
        emailType, 
        submittedByEmail: event.submittedByEmail,
        coordinatorContact: event.coordinatorContact 
      });
      return NextResponse.json(
        { success: false, error: 'No recipients found for this email type' },
        { status: 400 }
      );
    }

    console.log('Sending email to:', recipients);

    // Create email attachment object for queue
    const createEmailAttachment = (filename: string, content: string, contentType: string): any => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      filename,
      contentType,
      size: Buffer.from(content, 'base64').length,
      content,
      createdAt: new Date(),
    });

    // Queue the email (same as original send-event-request-email does)
    console.log('Queueing email for recipient(s)');
    const queuedEmailData = {
      to: recipients,
      subject: subject,
      htmlContent: emailContent.html,
      textContent: emailContent.text,
      attachments: emailContent.attachments?.map((att: any) => 
        createEmailAttachment(
          att.filename, 
          att.content instanceof Buffer ? att.content.toString('base64') : att.content,
          'application/pdf'
        )
      ) || [],
      status: 'approved' as const, // Auto-approve resent emails
      type: 'event_request' as const,
      metadata: {
        eventId: eventId,
        emailType: emailType,
        resentBy: 'zone-manager',
        resentAt: new Date().toISOString(),
        referenceNumber: templateVariables.referenceNumber,
      },
    };

    const emailId = await addEmailToQueue(queuedEmailData);
    console.log('Email queued with ID:', emailId);

    return NextResponse.json({
      success: true,
      message: 'Email queued successfully',
      recipients: recipients,
      emailType: emailType,
      emailQueueId: emailId
    });

  } catch (error) {
    console.error('Error resending event email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to resend email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
