import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getQueuedEmailById, markEmailAsSent, markEmailAsFailed } from '@/lib/email-queue';
import { withAdminAuth } from '@/lib/auth-middleware';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { emailId } = body;
    const sentById = user.email || user.ponyClubId;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Get the email from the queue
    const email = await getQueuedEmailById(emailId);
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    if (email.status !== 'pending') {
      return NextResponse.json(
        { error: 'Email is not in pending status' },
        { status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY || !resend) {
      console.log('RESEND_API_KEY not configured, simulating email send:');
      console.log('Subject:', email.subject);
      console.log('To:', email.to.join(', '));
      if (email.cc) console.log('CC:', email.cc.join(', '));
      
      // Mark as sent in simulation mode
      await markEmailAsSent(emailId, sentById, 'simulated-email-id');
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully (simulation mode)',
        emailId: 'simulated-email-id'
      });
    }

    try {
      // Prepare attachments for Resend
      const attachments = email.attachments?.map(attachment => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.content || '', 'base64'),
      })) || [];

      // Send email using Resend
      const result = await resend.emails.send({
        from: 'MyPonyClub Event Manager <noreply@myponyclub.com>',
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        html: email.htmlContent,
        text: email.textContent,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      // Mark email as sent
      await markEmailAsSent(emailId, sentById, result.data?.id);

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

      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: errorMessage
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in send email API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process send request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});