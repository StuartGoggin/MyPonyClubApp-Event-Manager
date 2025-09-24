import { NextRequest, NextResponse } from 'next/server';
import { sendBackupEmail } from '@/lib/backup-email-service';
import { withAdminAuth } from '@/lib/auth-middleware';

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    console.log('=== BACKUP EMAIL TEST API ===');
    const body = await request.json();
    const { recipients } = body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required' },
        { status: 400 }
      );
    }

    console.log(`Testing backup email to: ${recipients.join(', ')}`);

    // Create a small test backup
    const testData = {
      metadata: {
        testRun: true,
        createdAt: new Date().toISOString(),
        createdBy: user.email || user.ponyClubId,
      },
      summary: {
        totalClubs: 5,
        totalEvents: 12,
        totalUsers: 25,
      },
      sampleData: {
        clubs: ['Test Club 1', 'Test Club 2'],
        events: ['Test Event 1', 'Test Event 2'],
      }
    };

    const testBuffer = Buffer.from(JSON.stringify(testData, null, 2), 'utf-8');
    const subject = `Test Backup Email - ${new Date().toISOString().split('T')[0]}`;

    // Send test backup email
    await sendBackupEmail(
      recipients,
      subject,
      'Test Backup Schedule',
      testBuffer,
      testBuffer.length / (1024 * 1024), // Size in MB
      {
        includeClubs: true,
        includeEvents: true,
        includeUsers: true,
        includeEventTypes: false,
        includeZones: false
      }
    );

    console.log('✅ Test backup email sent successfully');

    return NextResponse.json({
      success: true,
      message: 'Test backup email sent successfully',
      recipients: recipients,
      testDataSize: `${(testBuffer.length / 1024).toFixed(2)} KB`
    });

  } catch (error) {
    console.error('❌ Error sending test backup email:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send test backup email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});