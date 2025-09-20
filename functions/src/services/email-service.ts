/**
 * Email Service
 * Handles email sending functionality
 */

export class EmailService {
  async sendEmail(emailData: any): Promise<any> {
    return {success: true, messageId: "mock-email-id"};
  }

  async sendBulkEmail(emails: any[]): Promise<any> {
    return {success: true, messageIds: emails.map((_, i) => `mock-bulk-${i}`)};
  }
}
