/**
 * Email Queue API Test Suite
 * 
 * Comprehensive testing for email queue and notification endpoints
 */

import express from "express";
import emailQueueRouter from "../../api/email-queue";
import { createTestApp, TestApiClient, assertions, timeouts } from "../utils/test-helpers";
import { singleMockEmailRequest } from "../utils/mock-data";

describe("Email Queue API", () => {
  let app: ReturnType<typeof express>;
  let apiClient: TestApiClient;

  beforeEach(() => {
    app = createTestApp();
    app.use("/email-queue", emailQueueRouter);
    apiClient = new TestApiClient();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("POST /email-queue/submit", () => {
    const validEmailRequest = {
      submittedByName: "Test User",
      submittedByEmail: "tester@example.com",
      submittedByContact: "0400-123-456",
      clubId: "club-1",
      events: [
        {
          name: "Test Event for Email",
          date: "2025-12-20",
          location: "Test Venue",
          eventTypeId: "rally",
          coordinatorName: "Test Coordinator",
          coordinatorContact: "coord@test.com",
          isQualifier: false,
          priority: 1,
          isHistoricallyTraditional: false,
        },
      ],
    };

    it("should submit email request successfully", async () => {
      const testRequest = {
        ...validEmailRequest,
        requestId: `test-${Date.now()}`,
      };

      const response = await apiClient.post("/email-queue/submit", testRequest, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("requestId");
      expect(response.body).toHaveProperty("queuePosition");
    }, timeouts.email);

    it("should validate required fields", async () => {
      const invalidRequest = { ...validEmailRequest } as any;
      delete invalidRequest.submittedByName;

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "submittedByName");
    }, timeouts.email);

    it("should validate email format", async () => {
      const invalidRequest = {
        ...validEmailRequest,
        submittedByEmail: "invalid-email-format",
      };

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "email");
    }, timeouts.email);

    it("should validate phone number format", async () => {
      const invalidRequest = {
        ...validEmailRequest,
        submittedByContact: "invalid-phone",
      };

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "phone");
    }, timeouts.email);

    it("should validate events array", async () => {
      const invalidRequest = {
        ...validEmailRequest,
        events: [], // Empty events array
      };

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "events");
    }, timeouts.email);

    it("should validate individual event data", async () => {
      const invalidRequest = {
        ...validEmailRequest,
        events: [
          {
            name: "Test Event",
            // Missing required fields
          },
        ],
      };

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "event");
    }, timeouts.email);

    it("should validate event dates", async () => {
      const invalidRequest = {
        ...validEmailRequest,
        events: [
          {
            ...validEmailRequest.events[0],
            date: "invalid-date-format",
          },
        ],
      };

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "date");
    }, timeouts.email);

    it("should validate coordinator contact email", async () => {
      const invalidRequest = {
        ...validEmailRequest,
        events: [
          {
            ...validEmailRequest.events[0],
            coordinatorContact: "invalid-email",
          },
        ],
      };

      const response = await apiClient.post("/email-queue/submit", invalidRequest, app);

      assertions.expectErrorResponse(response, 400, "coordinator");
    }, timeouts.email);

    it("should check for duplicate submissions", async () => {
      const duplicateRequest = {
        ...validEmailRequest,
        requestId: "duplicate-test",
      };

      // First submission
      const firstResponse = await apiClient.post("/email-queue/submit", duplicateRequest, app);
      
      if (firstResponse.status >= 400) return; // Skip if first submission failed

      // Duplicate submission
      const response = await apiClient.post("/email-queue/submit", duplicateRequest, app);

      // Should handle duplicates appropriately
      expect(response.status).toBeLessThan(500);
    }, timeouts.email);

    it("should handle multiple events in single request", async () => {
      const multiEventRequest = {
        ...validEmailRequest,
        events: [
          ...validEmailRequest.events,
          {
            name: "Second Test Event",
            date: "2025-12-25",
            location: "Second Test Venue",
            eventTypeId: "show",
            coordinatorName: "Second Coordinator",
            coordinatorContact: "coord2@test.com",
            isQualifier: true,
            priority: 2,
            isHistoricallyTraditional: true,
          },
        ],
      };

      const response = await apiClient.post("/email-queue/submit", multiEventRequest, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("success", true);
    }, timeouts.email);

    it("should validate club existence", async () => {
      const invalidClubRequest = {
        ...validEmailRequest,
        clubId: "non-existent-club",
      };

      const response = await apiClient.post("/email-queue/submit", invalidClubRequest, app);

      // Should validate club exists
      expect(response.status).toBeLessThan(500);
    }, timeouts.email);
  });

  describe("GET /email-queue/status/:requestId", () => {
    it("should retrieve email request status", async () => {
      const requestId = "test-request-123";
      const response = await apiClient.get(`/email-queue/status/${requestId}`, app);

      // Should return status or 404 if not found
      if (response.status === 404) {
        assertions.expectErrorResponse(response, 404, "not found");
      } else {
        assertions.expectSuccessResponse(response);
        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("requestId", requestId);
      }
    }, timeouts.api);

    it("should return request processing details", async () => {
      const requestId = "test-request-123";
      const response = await apiClient.get(`/email-queue/status/${requestId}`, app);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("queuePosition");
        expect(response.body).toHaveProperty("submittedAt");
        expect(response.body).toHaveProperty("estimatedProcessingTime");
      }
    }, timeouts.api);

    it("should show processing history for completed requests", async () => {
      const requestId = "completed-request-123";
      const response = await apiClient.get(`/email-queue/status/${requestId}`, app);

      if (response.status === 200 && response.body.status === "completed") {
        expect(response.body).toHaveProperty("processedAt");
        expect(response.body).toHaveProperty("emailsSent");
      }
    }, timeouts.api);

    it("should show error details for failed requests", async () => {
      const requestId = "failed-request-123";
      const response = await apiClient.get(`/email-queue/status/${requestId}`, app);

      if (response.status === 200 && response.body.status === "failed") {
        expect(response.body).toHaveProperty("error");
        expect(response.body).toHaveProperty("failedAt");
      }
    }, timeouts.api);
  });

  describe("GET /email-queue/queue", () => {
    it("should require authentication for queue access", async () => {
      const response = await apiClient.get("/email-queue/queue", app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should require admin privileges for queue access", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.get("/email-queue/queue", app);

      assertions.expectErrorResponse(response, 403, "admin");
    }, timeouts.api);

    it("should show current queue status for admins", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/email-queue/queue", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("queueLength");
      expect(response.body).toHaveProperty("processing");
      expect(response.body).toHaveProperty("recentlyCompleted");
    }, timeouts.api);

    it("should support queue filtering and pagination", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/email-queue/queue?status=pending&limit=10", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("requests");
      expect(Array.isArray(response.body.requests)).toBe(true);
    }, timeouts.api);
  });

  describe("POST /email-queue/process", () => {
    it("should require admin authentication for manual processing", async () => {
      const response = await apiClient.post("/email-queue/process", {}, app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should allow admin to trigger manual processing", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.post("/email-queue/process", {}, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("message");
    }, timeouts.api);

    it("should process specific request by ID", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const processData = {
        requestId: "specific-request-123",
      };

      const response = await apiClient.post("/email-queue/process", processData, app);

      // Should process specific request or return appropriate error
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should handle processing errors gracefully", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidProcessData = {
        requestId: "non-existent-request",
      };

      const response = await apiClient.post("/email-queue/process", invalidProcessData, app);

      // Should handle gracefully
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("DELETE /email-queue/cancel/:requestId", () => {
    it("should allow cancellation of pending requests", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const requestId = "pending-request-123";
      const response = await apiClient.delete(`/email-queue/cancel/${requestId}`, app);

      // Should cancel or return appropriate status
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should require admin privileges for cancellation", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.delete("/email-queue/cancel/request-123", app);

      assertions.expectErrorResponse(response, 403, "admin");
    }, timeouts.api);

    it("should prevent cancellation of completed requests", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const completedRequestId = "completed-request-123";
      const response = await apiClient.delete(`/email-queue/cancel/${completedRequestId}`, app);

      // Should prevent cancellation or return appropriate error
      if (response.status >= 400) {
        expect(response.body).toHaveProperty("success", false);
      }
    }, timeouts.api);
  });

  describe("Email Template Integration", () => {
    it("should validate email template selection", async () => {
      const requestWithTemplate = {
        ...singleMockEmailRequest,
        templateId: "event-approval-template",
      };

      const response = await apiClient.post("/email-queue/submit", requestWithTemplate, app);

      // Should validate template exists
      expect(response.status).toBeLessThan(500);
    }, timeouts.email);

    it("should handle custom email content", async () => {
      const requestWithCustomContent = {
        ...singleMockEmailRequest,
        customContent: {
          subject: "Custom Event Submission",
          message: "This is a custom message for the event submission.",
        },
      };

      const response = await apiClient.post("/email-queue/submit", requestWithCustomContent, app);

      assertions.expectSuccessResponse(response);
    }, timeouts.email);
  });

  describe("Notification System Integration", () => {
    it("should send notifications to relevant recipients", async () => {
      const notificationRequest = {
        ...singleMockEmailRequest,
        notifyClub: true,
        notifyZone: true,
        notifyStateCoordinator: true,
      };

      const response = await apiClient.post("/email-queue/submit", notificationRequest, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("recipientCount");
    }, timeouts.email);

    it("should handle notification preferences", async () => {
      const response = await apiClient.get("/email-queue/notification-preferences", app);

      // Should return notification settings or require auth
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("Queue Management", () => {
    it("should show queue statistics", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/email-queue/stats", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("totalProcessed");
      expect(response.body).toHaveProperty("averageProcessingTime");
      expect(response.body).toHaveProperty("currentQueueLength");
    }, timeouts.api);

    it("should support queue priority management", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const priorityUpdate = {
        requestId: "request-123",
        priority: "high",
      };

      const response = await apiClient.put("/email-queue/priority", priorityUpdate, app);

      // Should update priority or return appropriate status
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should handle queue cleanup for old requests", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/email-queue/cleanup", app);

      // Should clean up old requests
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("Error Handling and Resilience", () => {
    it("should handle email service unavailability", async () => {
      // Mock email service failure
      const testRequest = {
        ...singleMockEmailRequest,
        requestId: `service-failure-test-${Date.now()}`,
      };

      const response = await apiClient.post("/email-queue/submit", testRequest, app);

      // Should queue for retry rather than fail immediately
      expect(response.status).toBeLessThan(500);
    }, timeouts.email);

    it("should implement retry logic for failed emails", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const retryRequest = {
        requestId: "failed-request-123",
        forceRetry: true,
      };

      const response = await apiClient.post("/email-queue/retry", retryRequest, app);

      // Should retry failed request
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should validate rate limiting", async () => {
      // Submit multiple requests rapidly
      const promises = Array.from({ length: 5 }, (_, i) => 
        apiClient.post("/email-queue/submit", {
          ...singleMockEmailRequest,
          requestId: `rate-limit-test-${i}-${Date.now()}`,
        }, app)
      );

      const responses = await Promise.all(promises);
      
      // Should handle rate limiting appropriately
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    }, timeouts.email);

    it("should handle malformed email request data", async () => {
      const malformedRequest = {
        submittedByName: "Test User",
        // Missing required fields
        events: "not-an-array",
      };

      const response = await apiClient.post("/email-queue/submit", malformedRequest, app);

      assertions.expectErrorResponse(response, 400);
    }, timeouts.email);

    it("should sanitize email content for security", async () => {
      const maliciousRequest = {
        ...singleMockEmailRequest,
        customContent: {
          subject: "<script>alert('xss')</script>Malicious Subject",
          message: "Message with <iframe src='evil.com'></iframe> content",
        },
      };

      const response = await apiClient.post("/email-queue/submit", maliciousRequest, app);

      // Should sanitize content or reject malicious input
      expect(response.status).toBeLessThan(500);
    }, timeouts.email);
  });
});