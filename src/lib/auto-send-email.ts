import { Resend } from 'resend';
import { getQueuedEmailById, markEmailAsSent, markEmailAsFailed, addEmailLog } from './email-queue-admin';
import { QueuedEmail } from './types';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Automatically send an email from the queue
 * @param emailId - The ID of the email to send
 * @returns Promise with send result
 */
export async function autoSendQueuedEmail(emailId: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log('Auto-sending email:', emailId);

    // Get the email from the queue
    const email = await getQueuedEmailById(emailId);
    
    if (!email) {
      console.error('Email not found for auto-send:', emailId);
      return { success: false, error: 'Email not found' };
    }

    if (email.status !== 'pending') {
      console.error(`Email status is '${email.status}', expected 'pending' for auto-send:`, emailId);
      return { success: false, error: `Invalid email status: ${email.status}` };
    }

    // Check if we have a resend instance
    if (!resend) {
      console.warn('No Resend API key available, simulating email send for:', emailId);
      
      // Mark as sent with simulation flag
      await markEmailAsSent(emailId, new Date());
      
      // Log the simulated send
      await addEmailLog({
        emailId: emailId,
        subject: email.subject,
        recipients: email.to,
        status: 'success',
        message: 'Email sent automatically (simulation mode)',
      });

      return { 
        success: true, 
        messageId: `sim-${Date.now()}`,
      };
    }

    // Prepare email content
    const emailContent: any = {
      from: 'noreply@ponyclub.com.au',
      to: email.to,
      subject: email.subject,
      html: email.htmlContent || email.html,
      text: email.textContent,
    };

    // Add CC if present
    if (email.cc && email.cc.length > 0) {
      emailContent.cc = email.cc;
    }

    // Add BCC if present
    if (email.bcc && email.bcc.length > 0) {
      emailContent.bcc = email.bcc;
    }

    // Add attachments if present
    if (email.attachments && email.attachments.length > 0) {
      emailContent.attachments = email.attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        type: attachment.contentType,
      }));
    }

    console.log('Sending email via Resend...', {
      emailId,
      to: emailContent.to,
      subject: emailContent.subject,
      hasAttachments: !!(emailContent.attachments?.length)
    });

    // Send the email
    const result = await resend.emails.send(emailContent);

    if (result.error) {
      console.error('Resend API error for auto-send:', result.error);
      
      // Mark as failed
      await markEmailAsFailed(emailId, result.error.message || 'Unknown error');
      
      // Log the failure
      await addEmailLog({
        emailId: emailId,
        subject: email.subject,
        recipients: email.to,
        status: 'error',
        message: 'Auto-send failed',
        errorDetails: result.error.message || 'Unknown error',
      });

      return { 
        success: false, 
        error: result.error.message || 'Unknown error'
      };
    }

    console.log('Email auto-sent successfully:', {
      emailId,
      messageId: result.data?.id,
      recipients: email.to
    });

    // Mark as sent
    await markEmailAsSent(emailId, new Date());

    // Log the successful send
    await addEmailLog({
      emailId: emailId,
      subject: email.subject,
      recipients: email.to,
      status: 'success',
      message: 'Email sent automatically',
    });

    return { 
      success: true, 
      messageId: result.data?.id 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in auto-send email:', errorMessage, error);

    // Try to mark as failed if we have the email ID
    try {
      await markEmailAsFailed(emailId, errorMessage);
      
      // Log the failure
      await addEmailLog({
        emailId: emailId,
        subject: 'Unknown',
        recipients: [],
        status: 'error',
        message: 'Auto-send failed with exception',
        errorDetails: errorMessage,
      });
    } catch (logError) {
      console.error('Failed to log auto-send error:', logError);
    }

    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Process a queued email for automatic sending if approval is not required
 * @param email - The queued email to process
 * @returns Promise with processing result
 */
export async function processEmailForAutoSend(email: QueuedEmail): Promise<{
  sent: boolean;
  queued: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // If email is already pending (doesn't require approval), send it immediately
    if (email.status === 'pending') {
      console.log('Email is pending, attempting auto-send:', email.id);
      const result = await autoSendQueuedEmail(email.id);
      
      return {
        sent: result.success,
        queued: false,
        messageId: result.messageId,
        error: result.error
      };
    }

    // If email is draft (requires approval), just queue it
    if (email.status === 'draft') {
      console.log('Email requires approval, queued for review:', email.id);
      return {
        sent: false,
        queued: true
      };
    }

    // Other statuses shouldn't be processed
    return {
      sent: false,
      queued: false,
      error: `Email has invalid status for processing: ${email.status}`
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing email for auto-send:', errorMessage);
    
    return {
      sent: false,
      queued: false,
      error: errorMessage
    };
  }
}
