import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getQueuedEmailById, markEmailAsSent, markEmailAsFailed, addEmailLog } from '@/lib/email-queue-admin';
import { withAdminAuth } from '@/lib/auth-middleware';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    console.log('=== EMAIL SEND API CALLED ===');
    const body = await request.json();
    const { emailId } = body;
    const sentById = user.email || user.ponyClubId;
    
    console.log('Request body:', { emailId, sentById });

    if (!emailId) {
      console.log('ERROR: No email ID provided');
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Get the email from the queue
    console.log('Fetching email from queue...');
    const email = await getQueuedEmailById(emailId);
    console.log('Email retrieved:', email ? { id: email.id, status: email.status, subject: email.subject } : null);
    
    if (!email) {
      console.log('ERROR: Email not found in database');
      await addEmailLog({
        emailId: emailId,
        subject: 'Unknown',
        recipients: [],
        status: 'error',
        message: 'Email not found in database',
        errorDetails: `Email ID: ${emailId}`
      });
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    if (email.status !== 'pending') {
      console.log(`ERROR: Email status is '${email.status}', expected 'pending'`);
      // Log the issue
      await addEmailLog({
        emailId: emailId,
        subject: email.subject,
        recipients: email.to,
        status: 'error',
        message: `Cannot send email - current status is '${email.status}', expected 'pending'`,
        errorDetails: `Email status: ${email.status || 'undefined/null'}`
      });
      
      return NextResponse.json(
        { error: 'Email is not in pending status' },
        { status: 400 }
      );
    }

    console.log('Email status check passed - proceeding to send');

    // Check if Resend API key is configured
    console.log('Checking Resend API configuration...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('Resend instance:', !!resend);
    
    if (!process.env.RESEND_API_KEY || !resend) {
      console.log('RESEND_API_KEY not configured, simulating email send:');
      console.log('Subject:', email.subject);
      console.log('To:', email.to.join(', '));
      if (email.cc) console.log('CC:', email.cc.join(', '));
      
      // Mark as sent in simulation mode
      await markEmailAsSent(emailId, new Date());
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully (simulation mode)',
        emailId: 'simulated-email-id'
      });
    }

    try {
      console.log('Preparing email for Resend API...');
      // Prepare attachments for Resend
      const attachments = email.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content || '', 'base64'),
      })) || [];

      // Send email using Resend
      const emailData: any = {
        from: 'MyPonyClub Event Manager <onboarding@resend.dev>',
        to: email.to,
        subject: email.subject,
      };

      // Add optional fields if they exist
      if (email.cc && email.cc.length > 0) emailData.cc = email.cc;
      if (email.bcc && email.bcc.length > 0) emailData.bcc = email.bcc;
      if (email.htmlContent) emailData.html = email.htmlContent;
      if (email.textContent) emailData.text = email.textContent;
      if (attachments.length > 0) emailData.attachments = attachments;

      // Ensure we have at least text or html content
      if (!emailData.html && !emailData.text) {
        emailData.text = email.subject; // Fallback to subject as text content
      }

      console.log('Email data prepared:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        hasHtml: !!emailData.html,
        hasText: !!emailData.text,
        attachmentCount: attachments.length
      });

      console.log('Calling Resend API...');
      const result = await resend.emails.send(emailData);
      console.log('Resend API result:', result);

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      // Mark email as sent
      console.log('Marking email as sent...');
      await markEmailAsSent(emailId, new Date());
      
      // Log success
      await addEmailLog({
        emailId: emailId,
        subject: email.subject,
        recipients: email.to,
        status: 'success',
        message: 'Email sent successfully',
        errorDetails: `Resend ID: ${result.data?.id}`
      });

      console.log('Email sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailId: result.data?.id
      });

    } catch (sendError) {
      console.error('Error sending email:', sendError);
      
      // Mark email as failed
      const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown send error';
      await markEmailAsFailed(emailId, errorMessage);
      
      // Log the error
      await addEmailLog({
        emailId: emailId,
        subject: email.subject,
        recipients: email.to,
        status: 'error',
        message: 'Failed to send email',
        errorDetails: errorMessage
      });

      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: errorMessage
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('CRITICAL ERROR in send email API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process send request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});