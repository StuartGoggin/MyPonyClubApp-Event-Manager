/**
 * Email Service Utilities Test Suite
 * 
 * Testing email template processing, validation, and delivery utilities
 */

import { EmailTemplateProcessor } from "../../utils/email-template-processor";
import { EmailValidator } from "../../utils/email-validator";
import { EmailDeliveryService } from "../../utils/email-delivery-service";
import { timeouts } from "../utils/test-helpers";

describe("Email Service Utilities", () => {
  describe("Email Template Processor", () => {
    let templateProcessor: EmailTemplateProcessor;

    beforeEach(() => {
      templateProcessor = new EmailTemplateProcessor();
    });

    it("should process event creation template", async () => {
      const templateData = {
        eventName: "Summer Rally",
        eventDate: "2025-12-15",
        eventLocation: "Sydney Pony Club Grounds",
        coordinatorName: "Jane Smith",
        coordinatorContact: "jane@sydneypc.com",
        clubName: "Sydney Pony Club",
        recipientName: "John Doe",
      };

      const result = await templateProcessor.processTemplate("event_created", templateData);

      expect(result.success).toBe(true);
      expect(result.subject).toContain("Summer Rally");
      expect(result.htmlBody).toContain("Summer Rally");
      expect(result.htmlBody).toContain("December 15, 2025");
      expect(result.htmlBody).toContain("Sydney Pony Club Grounds");
      expect(result.htmlBody).toContain("John Doe");
      expect(result.textBody).toBeDefined();
    }, timeouts.template);

    it("should process event update template", async () => {
      const templateData = {
        eventName: "Summer Rally",
        originalDate: "2025-12-15",
        newDate: "2025-12-20",
        changes: ["date", "location"],
        newLocation: "New Venue",
        originalLocation: "Old Venue",
        recipientName: "John Doe",
      };

      const result = await templateProcessor.processTemplate("event_updated", templateData);

      expect(result.success).toBe(true);
      expect(result.subject).toContain("Updated");
      expect(result.htmlBody).toContain("December 15");
      expect(result.htmlBody).toContain("December 20");
      expect(result.htmlBody).toContain("New Venue");
    }, timeouts.template);

    it("should process event reminder template", async () => {
      const templateData = {
        eventName: "Summer Rally",
        eventDate: "2025-12-15",
        eventLocation: "Sydney Pony Club Grounds",
        daysUntilEvent: 7,
        reminderType: "7_days",
        recipientName: "John Doe",
        registrationDetails: {
          division: "Senior",
          confirmationNumber: "REG123456",
        },
      };

      const result = await templateProcessor.processTemplate("event_reminder", templateData);

      expect(result.success).toBe(true);
      expect(result.subject).toContain("Reminder");
      expect(result.htmlBody).toContain("7 days");
      expect(result.htmlBody).toContain("REG123456");
      expect(result.htmlBody).toContain("Senior");
    }, timeouts.template);

    it("should process registration confirmation template", async () => {
      const templateData = {
        participantName: "Sarah Johnson",
        eventName: "Summer Rally",
        eventDate: "2025-12-15",
        eventLocation: "Sydney Pony Club Grounds",
        clubName: "Sydney Pony Club",
        division: "Junior",
        confirmationNumber: "REG789012",
        coordinatorName: "Jane Smith",
        coordinatorContact: "jane@sydneypc.com",
      };

      const result = await templateProcessor.processTemplate("registration_confirmation", templateData);

      expect(result.success).toBe(true);
      expect(result.subject).toContain("Registration Confirmed");
      expect(result.htmlBody).toContain("Sarah Johnson");
      expect(result.htmlBody).toContain("REG789012");
      expect(result.htmlBody).toContain("Junior");
      expect(result.htmlBody).toContain("jane@sydneypc.com");
    }, timeouts.template);

    it("should handle custom templates", async () => {
      const customTemplateData = {
        subject: "Custom Event Notification",
        message: "This is a custom message for our special event.",
        eventName: "Special Club Day",
        recipientName: "Club Member",
      };

      const result = await templateProcessor.processCustomTemplate(customTemplateData);

      expect(result.success).toBe(true);
      expect(result.subject).toBe("Custom Event Notification");
      expect(result.htmlBody).toContain("This is a custom message");
      expect(result.htmlBody).toContain("Club Member");
    }, timeouts.template);

    it("should sanitize template content for security", async () => {
      const maliciousTemplateData = {
        eventName: "<script>alert('xss')</script>Malicious Event",
        recipientName: "<iframe src='evil.com'></iframe>User",
        customMessage: "Click here: <a href='javascript:void(0)'>Link</a>",
      };

      const result = await templateProcessor.processTemplate("event_created", maliciousTemplateData);

      expect(result.success).toBe(true);
      expect(result.htmlBody).not.toContain("<script>");
      expect(result.htmlBody).not.toContain("<iframe>");
      expect(result.htmlBody).not.toContain("javascript:");
      expect(result.htmlBody).toContain("Malicious Event"); // Content should be preserved
    }, timeouts.template);

    it("should handle missing template data gracefully", async () => {
      const incompleteData = {
        eventName: "Test Event",
        // Missing required fields
      };

      const result = await templateProcessor.processTemplate("event_created", incompleteData);

      expect(result.success).toBe(true);
      expect(result.htmlBody).toContain("Test Event");
      // Should use default values for missing fields
      expect(result.htmlBody).toContain("TBD"); // Default for missing date
    }, timeouts.template);

    it("should support template inheritance and layouts", async () => {
      const templateData = {
        eventName: "Rally Event",
        recipientName: "Test User",
        clubName: "Test Club",
      };

      const result = await templateProcessor.processTemplate("event_created", templateData, {
        layout: "club_branded",
        theme: "default",
      });

      expect(result.success).toBe(true);
      expect(result.htmlBody).toContain("Test Club"); // Club branding
      expect(result.htmlBody).toContain("<!DOCTYPE html"); // Full HTML layout
    }, timeouts.template);

    it("should handle template localization", async () => {
      const templateData = {
        eventName: "Rally Event",
        recipientName: "Test User",
        locale: "en-AU",
      };

      const result = await templateProcessor.processTemplate("event_created", templateData);

      expect(result.success).toBe(true);
      // Should use Australian date format and terminology
      expect(result.htmlBody).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // DD/MM/YYYY format
    }, timeouts.template);
  });

  describe("Email Validator", () => {
    let emailValidator: EmailValidator;

    beforeEach(() => {
      emailValidator = new EmailValidator();
    });

    it("should validate correct email addresses", () => {
      const validEmails = [
        "user@example.com",
        "test.email@domain.com.au",
        "coordinator+events@ponyclub.org",
        "admin123@test-domain.net",
      ];

      validEmails.forEach(email => {
        const result = emailValidator.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.email).toBe(email.toLowerCase());
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "not-an-email",
        "@domain.com",
        "user@",
        "user..test@domain.com",
        "user@domain",
        "",
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        const result = emailValidator.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it("should validate email lists", () => {
      const emailList = [
        "valid1@example.com",
        "invalid-email",
        "valid2@domain.com",
        "another-invalid",
        "valid3@test.org",
      ];

      const result = emailValidator.validateEmailList(emailList);

      expect(result.validEmails).toHaveLength(3);
      expect(result.invalidEmails).toHaveLength(2);
      expect(result.validEmails).toContain("valid1@example.com");
      expect(result.invalidEmails).toContain("invalid-email");
    });

    it("should check for disposable email addresses", () => {
      const disposableEmails = [
        "test@10minutemail.com",
        "user@tempmail.org",
        "fake@guerrillamail.com",
      ];

      disposableEmails.forEach(email => {
        const result = emailValidator.validateEmail(email, { checkDisposable: true });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("disposable");
      });
    });

    it("should validate domain MX records", async () => {
      const emailsToCheck = [
        "user@gmail.com", // Should have MX record
        "user@nonexistentdomain12345.com", // Should not have MX record
      ];

      const gmailResult = await emailValidator.validateEmailWithMX(emailsToCheck[0]);
      expect(gmailResult.isValid).toBe(true);
      expect(gmailResult.mxExists).toBe(true);

      const invalidResult = await emailValidator.validateEmailWithMX(emailsToCheck[1]);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.mxExists).toBe(false);
    }, timeouts.validation);

    it("should normalize email addresses", () => {
      const emailVariations = [
        "User@Example.Com",
        "  user@example.com  ",
        "USER@EXAMPLE.COM",
      ];

      emailVariations.forEach(email => {
        const result = emailValidator.normalizeEmail(email);
        expect(result).toBe("user@example.com");
      });
    });

    it("should detect role-based email addresses", () => {
      const roleEmails = [
        "admin@example.com",
        "support@domain.com",
        "noreply@company.org",
        "info@business.net",
      ];

      roleEmails.forEach(email => {
        const result = emailValidator.validateEmail(email, { allowRoleEmails: false });
        expect(result.isValid).toBe(false);
        expect(result.error).toContain("role-based");
      });
    });
  });

  describe("Email Delivery Service", () => {
    let deliveryService: EmailDeliveryService;

    beforeEach(() => {
      deliveryService = new EmailDeliveryService({
        provider: "test",
        apiKey: "test-key",
        fromEmail: "noreply@ponyclub.com",
        fromName: "Pony Club Australia",
      });
    });

    it("should prepare email for delivery", async () => {
      const emailData = {
        to: ["recipient@example.com"],
        subject: "Test Email",
        htmlBody: "<h1>Test Email</h1><p>This is a test.</p>",
        textBody: "Test Email\n\nThis is a test.",
        templateData: {
          eventName: "Test Event",
          recipientName: "Test User",
        },
      };

      const result = await deliveryService.prepareEmail(emailData);

      expect(result.success).toBe(true);
      expect(result.email).toHaveProperty("to", ["recipient@example.com"]);
      expect(result.email).toHaveProperty("from");
      expect(result.email).toHaveProperty("subject", "Test Email");
      expect(result.email).toHaveProperty("messageId");
    }, timeouts.delivery);

    it("should handle batch email preparation", async () => {
      const batchData = {
        recipients: [
          { email: "user1@example.com", name: "User One" },
          { email: "user2@example.com", name: "User Two" },
          { email: "user3@example.com", name: "User Three" },
        ],
        template: "event_reminder",
        templateData: {
          eventName: "Summer Rally",
          eventDate: "2025-12-15",
        },
      };

      const result = await deliveryService.prepareBatchEmails(batchData);

      expect(result.success).toBe(true);
      expect(result.emails).toHaveLength(3);
      expect(result.batchId).toBeDefined();

      result.emails.forEach((email: any, index: any) => {
        expect(email.to).toEqual([batchData.recipients[index].email]);
        expect(email.personalizations.recipientName).toBe(batchData.recipients[index].name);
      });
    }, timeouts.delivery);

    it("should validate email size limits", async () => {
      const largeEmailData = {
        to: ["recipient@example.com"],
        subject: "Large Email Test",
        htmlBody: "A".repeat(10 * 1024 * 1024), // 10MB content
        attachments: [
          {
            filename: "large-file.pdf",
            content: Buffer.alloc(15 * 1024 * 1024), // 15MB attachment
          },
        ],
      };

      const result = await deliveryService.prepareEmail(largeEmailData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("size limit");
    }, timeouts.delivery);

    it("should handle email attachments", async () => {
      const emailWithAttachments = {
        to: ["recipient@example.com"],
        subject: "Email with Attachments",
        htmlBody: "<p>Please find attached files.</p>",
        attachments: [
          {
            filename: "event-details.pdf",
            content: Buffer.from("PDF content"),
            contentType: "application/pdf",
          },
          {
            filename: "map.jpg",
            content: Buffer.from("JPEG content"),
            contentType: "image/jpeg",
          },
        ],
      };

      const result = await deliveryService.prepareEmail(emailWithAttachments);

      expect(result.success).toBe(true);
      expect(result.email.attachments).toHaveLength(2);
      expect(result.email.attachments[0]).toMatchObject({
        filename: "event-details.pdf",
        contentType: "application/pdf",
      });
    }, timeouts.delivery);

    it("should implement delivery retry logic", async () => {
      const emailData = {
        to: ["recipient@example.com"],
        subject: "Retry Test Email",
        htmlBody: "<p>Test retry functionality</p>",
      };

      // Mock initial failure then success  
      const mockDelivery = jest.fn(() => Promise.reject(new Error("Temporary failure")));

      deliveryService.setDeliveryProvider(mockDelivery);

      const result = await deliveryService.deliverWithRetry(emailData, {
        maxRetries: 3,
        backoffMultiplier: 1.5,
        initialDelay: 100,
      });

      expect(result.success).toBe(true);
      expect(result.deliveryAttempts).toBe(3);
      expect(mockDelivery).toHaveBeenCalledTimes(3);
    }, timeouts.delivery);

    it("should track delivery statistics", async () => {
      const emailData = {
        to: ["recipient@example.com"],
        subject: "Statistics Test",
        htmlBody: "<p>Track delivery stats</p>",
      };

      const result = await deliveryService.prepareEmail(emailData);
      
      if (result.success) {
        await deliveryService.recordDeliveryAttempt(result.email.messageId, "sent");
        await deliveryService.recordDeliveryEvent(result.email.messageId, "delivered");
        
        const stats = await deliveryService.getDeliveryStats(result.email.messageId);
        
        expect(stats).toHaveProperty("messageId", result.email.messageId);
        expect(stats).toHaveProperty("status", "delivered");
        expect(stats).toHaveProperty("sentAt");
        expect(stats).toHaveProperty("deliveredAt");
      }
    }, timeouts.delivery);

    it("should handle bounce and complaint tracking", async () => {
      const messageId = "test-message-123";
      
      // Record bounce
      await deliveryService.recordBounce(messageId, {
        bounceType: "permanent",
        bounceSubType: "general",
        bouncedRecipients: ["invalid@example.com"],
        timestamp: new Date().toISOString(),
      });

      // Record complaint
      await deliveryService.recordComplaint(messageId, {
        complainedRecipients: ["complainer@example.com"],
        complaintFeedbackType: "abuse",
        timestamp: new Date().toISOString(),
      });

      const stats = await deliveryService.getDeliveryStats(messageId);
      
      expect(stats.bounces).toHaveLength(1);
      expect(stats.complaints).toHaveLength(1);
      expect(stats.bounces[0].bounceType).toBe("permanent");
      expect(stats.complaints[0].complaintFeedbackType).toBe("abuse");
    }, timeouts.delivery);

    it("should implement rate limiting", async () => {
      const emails = Array.from({ length: 10 }, (_, i) => ({
        to: [`user${i}@example.com`],
        subject: `Rate Limit Test ${i}`,
        htmlBody: "<p>Testing rate limits</p>",
      }));

      const startTime = Date.now();
      
      const results = await deliveryService.deliverBatch(emails, {
        rateLimit: 5, // 5 emails per second
        batchSize: 3,
      });

      const duration = Date.now() - startTime;
      
      expect(results.success).toBe(true);
      expect(results.delivered).toBe(10);
      expect(duration).toBeGreaterThan(1000); // Should take at least 1 second due to rate limiting
    }, timeouts.delivery);
  });

  describe("Email Service Integration", () => {
    it("should handle complete email workflow", async () => {
      const templateProcessor = new EmailTemplateProcessor();
      const emailValidator = new EmailValidator();
      const deliveryService = new EmailDeliveryService({
        provider: "test",
        apiKey: "test-key",
      });

      // 1. Validate recipients
      const recipients = ["valid@example.com", "invalid-email", "another@test.com"];
      const validation = emailValidator.validateEmailList(recipients);

      expect(validation.validEmails).toHaveLength(2);

      // 2. Process template
      const templateData = {
        eventName: "Integration Test Event",
        recipientName: "Test User",
        eventDate: "2025-12-15",
      };

      const template = await templateProcessor.processTemplate("event_created", templateData);
      expect(template.success).toBe(true);

      // 3. Prepare email
      const emailData = {
        to: validation.validEmails,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
      };

      const prepared = await deliveryService.prepareEmail(emailData);
      expect(prepared.success).toBe(true);

      // 4. Mock delivery
      const delivered = await deliveryService.mockDelivery(prepared.email);
      expect(delivered.success).toBe(true);
    }, timeouts.integration);

    it("should handle bulk email campaign workflow", async () => {
      const deliveryService = new EmailDeliveryService({
        provider: "test",
        apiKey: "test-key",
      });

      const campaignData = {
        templateId: "monthly_newsletter",
        recipients: Array.from({ length: 100 }, (_, i) => ({
          email: `user${i}@example.com`,
          name: `User ${i}`,
        })),
        templateData: {
          month: "December 2025",
          clubName: "Test Pony Club",
        },
      };

      // Process campaign
      const campaign = await deliveryService.createEmailCampaign(campaignData);
      expect(campaign.success).toBe(true);
      expect(campaign.campaignId).toBeDefined();

      // Track progress
      const progress = await deliveryService.getCampaignProgress(campaign.campaignId);
      expect(progress).toHaveProperty("totalEmails", 100);
      expect(progress).toHaveProperty("processed");
      expect(progress).toHaveProperty("delivered");
      expect(progress).toHaveProperty("failed");
    }, timeouts.integration);
  });
});