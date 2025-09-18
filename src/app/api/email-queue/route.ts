import { NextRequest, NextResponse } from 'next/server';
import { 
  getQueuedEmails, 
  getQueuedEmailById, 
  updateQueuedEmail, 
  deleteQueuedEmail, 
  bulkUpdateEmails, 
  bulkDeleteEmails,
  getEmailQueueStats,
  addEmailToQueue,
  duplicateEmail
} from '@/lib/email-queue-admin';
import { EmailStatus } from '@/lib/types';
import { withAdminAuth } from '@/lib/auth-middleware';
import { autoSendQueuedEmail } from '@/lib/auto-send-email';

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as EmailStatus | 'all' | null;
    const type = searchParams.get('type');
    const action = searchParams.get('action');

    if (action === 'stats') {
      const stats = await getEmailQueueStats();
      return NextResponse.json({ success: true, data: stats });
    }

    const emails = await getQueuedEmails(
      status && status !== 'all' ? status : undefined,
      type && type !== 'all' ? type : undefined
    );

    return NextResponse.json({ success: true, data: emails });
  } catch (error) {
    console.error('Error fetching queued emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action, emailIds, updates, emailId, resetStatus } = body;

    // Handle bulk operations
    if (action === 'bulk-update' && emailIds && updates) {
      await bulkUpdateEmails(emailIds, updates);
      return NextResponse.json({ success: true, message: 'Emails updated successfully' });
    }

    if (action === 'bulk-delete' && emailIds) {
      await bulkDeleteEmails(emailIds);
      return NextResponse.json({ success: true, message: 'Emails deleted successfully' });
    }

    // Handle email duplication (for resend functionality)
    if (action === 'duplicate' && emailId) {
      const newEmailId = await duplicateEmail(emailId, updates, resetStatus);
      
      // If the duplicated email has pending status, try to auto-send it
      if (resetStatus) {
        try {
          // Get the duplicated email to check if it should auto-send
          const duplicatedEmail = await getQueuedEmailById(newEmailId);
          if (duplicatedEmail && duplicatedEmail.status === 'pending') {
            console.log('Duplicated email has pending status, attempting auto-send:', newEmailId);
            const autoSendResult = await autoSendQueuedEmail(newEmailId);
            if (autoSendResult.success) {
              console.log('Duplicated email auto-sent successfully:', newEmailId);
            } else {
              console.error('Duplicated email auto-send failed:', autoSendResult.error);
            }
          }
        } catch (autoSendError) {
          console.error('Auto-send error for duplicated email:', autoSendError);
          // Don't fail the duplication if auto-send fails
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        id: newEmailId, 
        message: 'Email duplicated successfully' 
      });
    }

    // Handle single email creation
    if (!action && body.to && body.subject) {
      const emailId = await addEmailToQueue(body);
      return NextResponse.json({ success: true, id: emailId, message: 'Email added to queue successfully' });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { emailId, updates } = body;

    if (!emailId || !updates) {
      return NextResponse.json(
        { error: 'Email ID and updates are required' },
        { status: 400 }
      );
    }

    // Get the current email before updating
    const currentEmail = await getQueuedEmailById(emailId);
    if (!currentEmail) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Update the email
    await updateQueuedEmail(emailId, updates);
    
    // If the email status was changed to 'pending' (approved), try to auto-send it
    if (updates.status === 'pending' && currentEmail.status !== 'pending') {
      console.log('Email approved and status changed to pending, attempting auto-send:', emailId);
      try {
        const autoSendResult = await autoSendQueuedEmail(emailId);
        if (autoSendResult.success) {
          console.log('Email auto-sent successfully after approval:', emailId);
        } else {
          console.error('Auto-send failed after approval:', autoSendResult.error);
        }
      } catch (autoSendError) {
        console.error('Auto-send error after approval:', autoSendError);
        // Don't fail the approval process if auto-send fails
      }
    }
    
    return NextResponse.json({ success: true, message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    await deleteQueuedEmail(emailId);
    return NextResponse.json({ success: true, message: 'Email deleted successfully' });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});