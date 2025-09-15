import { NextRequest, NextResponse } from 'next/server';
import { 
  getQueuedEmails, 
  getQueuedEmailById, 
  updateQueuedEmail, 
  deleteQueuedEmail, 
  bulkUpdateEmails, 
  bulkDeleteEmails,
  getEmailQueueStats 
} from '@/lib/email-queue-admin';
import { EmailStatus } from '@/lib/types';
import { withAdminAuth } from '@/lib/auth-middleware';

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
    const { action, emailIds, updates } = body;

    // Handle bulk operations
    if (action === 'bulk-update' && emailIds && updates) {
      await bulkUpdateEmails(emailIds, updates);
      return NextResponse.json({ success: true, message: 'Emails updated successfully' });
    }

    if (action === 'bulk-delete' && emailIds) {
      await bulkDeleteEmails(emailIds);
      return NextResponse.json({ success: true, message: 'Emails deleted successfully' });
    }

    // Handle single email creation
    if (!action && body.to && body.subject) {
      const { addEmailToQueue } = await import('@/lib/email-queue-admin');
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

    await updateQueuedEmail(emailId, updates);
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