import { NextRequest, NextResponse } from 'next/server';
import { getQueuedEmailById } from '@/lib/email-queue-admin';
import { withAdminAuth } from '@/lib/auth-middleware';

export const GET = withAdminAuth(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    // In Next.js 15+, params is a Promise that needs to be awaited
    const params = await context.params;
    const emailId = params.id;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    const email = await getQueuedEmailById(emailId);

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: email });
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
