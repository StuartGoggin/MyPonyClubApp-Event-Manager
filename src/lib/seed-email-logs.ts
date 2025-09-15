import { addEmailLog } from './email-queue-admin';

async function seedEmailLogs() {
  try {
    console.log('Seeding email logs...');

    // Add some sample logs
    const sampleLogs = [
      {
        emailId: 'email-001',
        subject: 'Welcome to Pony Club Event Manager',
        recipients: ['member1@example.com', 'member2@example.com'],
        status: 'success' as const,
        message: 'Email sent successfully',
        processingTimeMs: 1250
      },
      {
        emailId: 'email-002',
        subject: 'Event Request Approved',
        recipients: ['organizer@example.com'],
        status: 'success' as const,
        message: 'Email sent successfully',
        processingTimeMs: 890
      },
      {
        emailId: 'email-003',
        subject: 'Event Reminder - Cross Country Training',
        recipients: ['member3@example.com', 'member4@example.com', 'member5@example.com'],
        status: 'error' as const,
        message: 'SMTP server connection failed',
        errorDetails: 'Connection timeout after 30 seconds',
        retryAttempt: 1
      },
      {
        emailId: 'email-004',
        subject: 'Weekly Newsletter',
        recipients: ['newsletter@example.com'],
        status: 'retry' as const,
        message: 'Temporary failure, retrying',
        processingTimeMs: 2100,
        retryAttempt: 2
      },
      {
        emailId: 'email-005',
        subject: 'Event Registration Confirmation',
        recipients: ['participant@example.com'],
        status: 'success' as const,
        message: 'Email sent successfully',
        processingTimeMs: 1050
      },
      {
        emailId: 'email-006',
        subject: 'Payment Due Reminder',
        recipients: ['finance@example.com'],
        status: 'error' as const,
        message: 'Invalid recipient email address',
        errorDetails: 'Email address format validation failed',
        retryAttempt: 0
      }
    ];

    for (const log of sampleLogs) {
      await addEmailLog(log);
      console.log(`Added log for: ${log.subject}`);
    }

    console.log('Email logs seeded successfully!');
    return { success: true, message: "Email logs seeded successfully." };
  } catch (error) {
    console.error("Error seeding email logs: ", error);
    return { success: false, message: "Error seeding email logs." };
  }
}

seedEmailLogs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed email logs:", error);
    process.exit(1);
  });