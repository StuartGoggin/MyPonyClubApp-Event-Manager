import { sendBackupEmail } from '@/lib/backup-email-service';

/**
 * Test function to verify backup email system
 * Run this in the browser console or admin panel
 */
export async function testBackupEmailSystem() {
  try {
    console.log('=== TESTING BACKUP EMAIL SYSTEM ===');
    
    // Create a small test backup
    const testData = {
      metadata: {
        testRun: true,
        createdAt: new Date().toISOString(),
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
    console.log('📧 Sending test backup email...');
    await sendBackupEmail(
      ['test@example.com'], // Change to your email for testing
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

    console.log('✅ Test backup email system completed successfully!');
    return { success: true, message: 'Test backup email sent successfully' };

  } catch (error) {
    console.error('❌ Test backup email system failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Export for use in admin console
if (typeof window !== 'undefined') {
  (window as any).testBackupEmailSystem = testBackupEmailSystem;
}