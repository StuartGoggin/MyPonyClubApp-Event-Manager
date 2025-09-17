/**
 * Notification System Test Suite
 * 
 * Comprehensive testing for notification services and workflows
 */

import { NotificationService } from "../../services/notification-service";
import { EmailService } from "../../services/email-service";
import { SMSService } from "../../services/sms-service";
import { timeouts } from "../utils/test-helpers";
import { NotificationService } from "../../services/notification-service";

// Mock the external services
jest.mock("../../services/email-service");
jest.mock("../../services/sms-service");

const MockedEmailService = EmailService as any;
const MockedSMSService = SMSService as any;

describe("Notification System", () => {
  let notificationService: NotificationService;
  let mockEmailService: any;
  let mockSMSService: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock service instances
    mockEmailService = new MockedEmailService() as any;
    mockSMSService = new MockedSMSService() as any;

    // Create notification service with mocked dependencies
    notificationService = new NotificationService(mockEmailService, mockSMSService);

    // Setup default mock responses
    mockEmailService.sendEmail.mockResolvedValue({ success: true, messageId: "test-message-id" });
    mockSMSService.sendSMS.mockResolvedValue({ success: true, messageId: "test-sms-id" });
  });

  describe("Event Notifications", () => {
    it("should send event creation notifications", async () => {
      const eventData = {
        id: "event-1",
        name: "Test Rally",
        date: "2025-12-15",
        location: "Test Grounds",
        clubId: "club-1",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
      };

      const notificationData = {
        type: "event_created",
        event: eventData,
        recipients: ["admin@club.com", "zone@ponyclub.com"],
      };

      const result = await notificationService.sendEventNotification(notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.arrayContaining(notificationData.recipients),
          subject: expect.stringContaining("Test Rally"),
          template: "event_created",
          data: expect.objectContaining(eventData),
        })
      );
    }, timeouts.notification);

    it("should send event update notifications", async () => {
      const eventData = {
        id: "event-1",
        name: "Updated Rally",
        date: "2025-12-20",
        originalDate: "2025-12-15",
        changes: ["date", "location"],
      };

      const notificationData = {
        type: "event_updated",
        event: eventData,
        recipients: ["participant@email.com"],
      };

      const result = await notificationService.sendEventNotification(notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "event_updated",
          data: expect.objectContaining({
            changes: eventData.changes,
          }),
        })
      );
    }, timeouts.notification);

    it("should send event cancellation notifications", async () => {
      const eventData = {
        id: "event-1",
        name: "Cancelled Rally",
        date: "2025-12-15",
        cancellationReason: "Weather conditions",
      };

      const notificationData = {
        type: "event_cancelled",
        event: eventData,
        recipients: ["participant1@email.com", "participant2@email.com"],
      };

      const result = await notificationService.sendEventNotification(notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "event_cancelled",
          data: expect.objectContaining({
            cancellationReason: eventData.cancellationReason,
          }),
        })
      );
    }, timeouts.notification);

    it("should send event reminder notifications", async () => {
      const eventData = {
        id: "event-1",
        name: "Upcoming Rally",
        date: "2025-12-15",
        daysUntilEvent: 7,
      };

      const notificationData = {
        type: "event_reminder",
        event: eventData,
        recipients: ["participant@email.com"],
        reminderType: "7_days",
      };

      const result = await notificationService.sendEventNotification(notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "event_reminder",
          data: expect.objectContaining({
            daysUntilEvent: 7,
          }),
        })
      );
    }, timeouts.notification);

    it("should handle different reminder intervals", async () => {
      const reminderTypes = ["30_days", "14_days", "7_days", "1_day"];

      for (let i = 0; i < reminderTypes.length; i++) {
        const reminderType = reminderTypes[i];
        const notificationData = {
          type: "event_reminder",
          event: { id: "event-1", name: "Test Event" },
          recipients: ["test@email.com"],
          reminderType,
        };

        const result = await notificationService.sendEventNotification(notificationData);
        expect(result.success).toBe(true);
      }

      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(reminderTypes.length);
    }, timeouts.notification);
  });

  describe("Registration Notifications", () => {
    it("should send registration confirmation", async () => {
      const registrationData = {
        id: "reg-1",
        eventId: "event-1",
        eventName: "Test Rally",
        participantName: "John Doe",
        participantEmail: "john@email.com",
        clubName: "Sydney Pony Club",
      };

      const result = await notificationService.sendRegistrationConfirmation(registrationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [registrationData.participantEmail],
          template: "registration_confirmation",
          data: expect.objectContaining(registrationData),
        })
      );
    }, timeouts.notification);

    it("should send registration cancellation", async () => {
      const cancellationData = {
        registrationId: "reg-1",
        eventName: "Test Rally",
        participantName: "John Doe",
        participantEmail: "john@email.com",
        cancellationReason: "Personal reasons",
      };

      const result = await notificationService.sendRegistrationCancellation(cancellationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [cancellationData.participantEmail],
          template: "registration_cancelled",
          data: expect.objectContaining(cancellationData),
        })
      );
    }, timeouts.notification);

    it("should notify coordinators of new registrations", async () => {
      const registrationData = {
        eventId: "event-1",
        eventName: "Test Rally",
        participantName: "John Doe",
        coordinatorEmail: "coordinator@club.com",
        registrationCount: 15,
        maxCapacity: 50,
      };

      const result = await notificationService.notifyCoordinatorOfRegistration(registrationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [registrationData.coordinatorEmail],
          template: "new_registration_notification",
          data: expect.objectContaining({
            registrationCount: 15,
            maxCapacity: 50,
          }),
        })
      );
    }, timeouts.notification);

    it("should send waitlist notifications", async () => {
      const waitlistData = {
        eventId: "event-1",
        eventName: "Test Rally",
        participantName: "John Doe",
        participantEmail: "john@email.com",
        waitlistPosition: 3,
      };

      const result = await notificationService.sendWaitlistNotification(waitlistData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "waitlist_notification",
          data: expect.objectContaining({
            waitlistPosition: 3,
          }),
        })
      );
    }, timeouts.notification);
  });

  describe("Administrative Notifications", () => {
    it("should send new user registration notifications to admins", async () => {
      const userData = {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        email: "john@email.com",
        clubId: "club-1",
        clubName: "Sydney Pony Club",
      };

      const adminEmails = ["admin1@ponyclub.com", "admin2@ponyclub.com"];

      const result = await notificationService.notifyAdminsOfNewUser(userData, adminEmails);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: adminEmails,
          template: "new_user_notification",
          data: expect.objectContaining(userData),
        })
      );
    }, timeouts.notification);

    it("should send system alert notifications", async () => {
      const alertData = {
        type: "system_error",
        severity: "high",
        message: "Database connection failure",
        timestamp: new Date().toISOString(),
        affectedServices: ["events", "registrations"],
      };

      const adminEmails = ["admin@ponyclub.com"];

      const result = await notificationService.sendSystemAlert(alertData, adminEmails);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: adminEmails,
          template: "system_alert",
          data: expect.objectContaining(alertData),
        })
      );
    }, timeouts.notification);

    it("should send bulk email completion notifications", async () => {
      const bulkEmailData = {
        campaignId: "campaign-1",
        campaignName: "Monthly Newsletter",
        totalRecipients: 500,
        successfulSends: 495,
        failedSends: 5,
        completedAt: new Date().toISOString(),
      };

      const adminEmails = ["admin@ponyclub.com"];

      const result = await notificationService.notifyBulkEmailCompletion(bulkEmailData, adminEmails);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "bulk_email_completion",
          data: expect.objectContaining({
            successfulSends: 495,
            failedSends: 5,
          }),
        })
      );
    }, timeouts.notification);
  });

  describe("SMS Notifications", () => {
    it("should send SMS event reminders", async () => {
      const smsData = {
        to: "+61400123456",
        eventName: "Test Rally",
        date: "2025-12-15",
        location: "Test Grounds",
        reminderType: "24_hours",
      };

      const result = await notificationService.sendSMSReminder(smsData);

      expect(result.success).toBe(true);
      expect(mockSMSService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: smsData.to,
          message: expect.stringContaining("Test Rally"),
        })
      );
    }, timeouts.notification);

    it("should send SMS for urgent notifications", async () => {
      const urgentData = {
        to: "+61400123456",
        type: "event_cancelled",
        eventName: "Test Rally",
        urgentReason: "Weather emergency",
      };

      const result = await notificationService.sendUrgentSMS(urgentData);

      expect(result.success).toBe(true);
      expect(mockSMSService.sendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: urgentData.to,
          message: expect.stringContaining("URGENT"),
        })
      );
    }, timeouts.notification);

    it("should validate phone numbers before sending SMS", async () => {
      const invalidSMSData = {
        to: "invalid-phone-number",
        message: "Test message",
      };

      const result = await notificationService.sendSMSReminder(invalidSMSData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/phone/i);
      expect(mockSMSService.sendSMS).not.toHaveBeenCalled();
    }, timeouts.notification);
  });

  describe("Notification Preferences", () => {
    it("should respect user email preferences", async () => {
      const userData = {
        id: "user-1",
        email: "user@email.com",
        preferences: {
          emailNotifications: false,
          smsNotifications: true,
        },
      };

      const notificationData = {
        userId: "user-1",
        type: "event_reminder",
        message: "Event reminder",
      };

      const result = await notificationService.sendPersonalizedNotification(userData, notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
      expect(mockSMSService.sendSMS).toHaveBeenCalled();
    }, timeouts.notification);

    it("should respect user SMS preferences", async () => {
      const userData = {
        id: "user-1",
        email: "user@email.com",
        phone: "+61400123456",
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
        },
      };

      const notificationData = {
        userId: "user-1",
        type: "event_reminder",
        message: "Event reminder",
      };

      const result = await notificationService.sendPersonalizedNotification(userData, notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      expect(mockSMSService.sendSMS).not.toHaveBeenCalled();
    }, timeouts.notification);

    it("should handle notification frequency preferences", async () => {
      const userData = {
        id: "user-1",
        email: "user@email.com",
        preferences: {
          emailNotifications: true,
          frequency: "weekly_digest",
        },
      };

      const notificationData = {
        userId: "user-1",
        type: "event_update",
        urgency: "low",
      };

      const result = await notificationService.sendPersonalizedNotification(userData, notificationData);

      // Should queue for weekly digest instead of immediate send
      expect(result.success).toBe(true);
      expect(result.queued).toBe(true);
    }, timeouts.notification);
  });

  describe("Notification Templates", () => {
    it("should use correct template for event types", async () => {
      const eventTypes = [
        { type: "rally", template: "rally_notification" },
        { type: "show", template: "show_notification" },
        { type: "clinic", template: "clinic_notification" },
      ];

      for (let i = 0; i < eventTypes.length; i++) {
        const { type } = eventTypes[i];
        const notificationData = {
          type: "event_created",
          event: { eventTypeId: type, name: `Test ${type}` },
          recipients: ["test@email.com"],
        };

        await notificationService.sendEventNotification(notificationData);

        expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            template: expect.stringContaining(type),
          })
        );
      }
    }, timeouts.notification);

    it("should personalize templates with user data", async () => {
      const templateData = {
        userName: "John Doe",
        clubName: "Sydney Pony Club",
        eventName: "Summer Rally",
        customMessage: "Looking forward to seeing you there!",
      };

      const notificationData = {
        type: "personalized_invite",
        template: "event_invitation",
        data: templateData,
        recipients: ["john@email.com"],
      };

      const result = await notificationService.sendTemplatedNotification(notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          template: "event_invitation",
          data: expect.objectContaining(templateData),
        })
      );
    }, timeouts.notification);

    it("should handle template rendering errors", async () => {
      const invalidTemplateData = {
        type: "test_notification",
        template: "non_existent_template",
        data: {},
        recipients: ["test@email.com"],
      };

      const result = await notificationService.sendTemplatedNotification(invalidTemplateData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/template/i);
    }, timeouts.notification);
  });

  describe("Error Handling and Resilience", () => {
    it("should handle email service failures gracefully", async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error("Email service unavailable"));

      const notificationData = {
        type: "event_created",
        event: { name: "Test Event" },
        recipients: ["test@email.com"],
      };

      const result = await notificationService.sendEventNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/email service/i);
      expect(result.retry).toBe(true);
    }, timeouts.notification);

    it("should implement retry logic for failed notifications", async () => {
      mockEmailService.sendEmail
        .mockRejectedValueOnce(new Error("Temporary failure"))
        .mockResolvedValueOnce({ success: true, messageId: "retry-success" });

      const notificationData = {
        type: "event_created",
        event: { name: "Test Event" },
        recipients: ["test@email.com"],
        retryOptions: { maxRetries: 2, backoff: "exponential" },
      };

      const result = await notificationService.sendEventNotificationWithRetry(notificationData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2);
    }, timeouts.notification);

    it("should queue notifications when services are down", async () => {
      mockEmailService.sendEmail.mockRejectedValue(new Error("Service down"));

      const notificationData = {
        type: "event_reminder",
        event: { name: "Test Event" },
        recipients: ["test@email.com"],
      };

      const result = await notificationService.sendEventNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.queued).toBe(true);
      expect(result.queueId).toBeDefined();
    }, timeouts.notification);

    it("should validate recipient email addresses", async () => {
      const invalidNotificationData = {
        type: "event_created",
        event: { name: "Test Event" },
        recipients: ["invalid-email", "valid@email.com"],
      };

      const result = await notificationService.sendEventNotification(invalidNotificationData);

      expect(result.success).toBe(true);
      expect(result.invalidRecipients).toEqual(["invalid-email"]);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["valid@email.com"],
        })
      );
    }, timeouts.notification);

    it("should handle rate limiting", async () => {
      const rateLimitError = new Error("Rate limit exceeded") as any;
      rateLimitError.code = "RATE_LIMIT_EXCEEDED";
      
      mockEmailService.sendEmail.mockRejectedValue(rateLimitError);

      const notificationData = {
        type: "bulk_notification",
        recipients: Array.from({ length: 100 }, (_, i) => `user${i}@email.com`),
      };

      const result = await notificationService.sendBulkNotification(notificationData);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/rate limit/i);
      expect(result.retryAfter).toBeDefined();
    }, timeouts.notification);
  });

  describe("Batch and Bulk Operations", () => {
    it("should process batch notifications efficiently", async () => {
      const batchData = {
        type: "weekly_digest",
        recipients: Array.from({ length: 50 }, (_, i) => `user${i}@email.com`),
        template: "weekly_digest",
        data: { weekStart: "2025-01-06", weekEnd: "2025-01-12" },
      };

      const result = await notificationService.sendBatchNotifications(batchData);

      expect(result.success).toBe(true);
      expect(result.totalSent).toBe(50);
      expect(result.batchCount).toBeGreaterThan(1); // Should batch into smaller groups
    }, timeouts.notification);

    it("should handle partial failures in batch operations", async () => {
      mockEmailService.sendEmail
        .mockResolvedValueOnce({ success: true, messageId: "1" })
        .mockRejectedValueOnce(new Error("Failure"))
        .mockResolvedValueOnce({ success: true, messageId: "3" });

      const batchData = {
        type: "event_update",
        recipients: ["user1@email.com", "user2@email.com", "user3@email.com"],
      };

      const result = await notificationService.sendBatchNotifications(batchData);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.failedRecipients).toEqual(["user2@email.com"]);
    }, timeouts.notification);

    it("should optimize bulk operations for performance", async () => {
      const startTime = Date.now();
      
      const bulkData = {
        type: "monthly_newsletter",
        recipients: Array.from({ length: 200 }, (_, i) => `user${i}@email.com`),
        template: "newsletter",
        data: { month: "January 2025" },
      };

      const result = await notificationService.sendBulkNotification(bulkData);

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.averageProcessingTime).toBeLessThan(100); // Per email should be < 100ms
    }, timeouts.notification);
  });
});