/**
 * SMS Service
 * Handles SMS sending functionality
 */

export class SMSService {
  async sendSMS(smsData: any): Promise<any> {
    return { success: true, messageId: "mock-sms-id" };
  }

  async sendBulkSMS(messages: any[]): Promise<any> {
    return { success: true, messageIds: messages.map((_, i) => `mock-sms-${i}`) };
  }
}