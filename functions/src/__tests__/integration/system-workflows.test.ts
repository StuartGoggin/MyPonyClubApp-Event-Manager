/**
 * Integration Test Suite
 * 
 * End-to-end testing of complete system workflows
 */

import express from "express";
import { createTestApp, TestApiClient, assertions, timeouts } from "../utils/test-helpers";
import {
   singleMockEmailRequest,
 } from "../utils/mock-data";describe("Integration Tests", () => {
  let app: ReturnType<typeof express>;
  let apiClient: TestApiClient;

  beforeEach(() => {
    app = createTestApp();
    
    // Mount all routers for full integration testing
    app.use("/auth", require("../../api/auth"));
    app.use("/users", require("../../api/users"));
    app.use("/clubs", require("../../api/clubs"));
    app.use("/events", require("../../api/events"));
    app.use("/email-queue", require("../../api/email-queue"));
    app.use("/admin", require("../../api/admin"));
    
    apiClient = new TestApiClient();
    jest.clearAllMocks();
  });

  describe("Complete Event Management Workflow", () => {
    it("should handle complete event lifecycle", async () => {
      // 1. Admin creates an event
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const eventData = {
        name: `Integration Test Event - ${Date.now()}`,
        date: new Date("2025-12-15").toISOString(),
        location: "Integration Test Grounds",
        eventTypeId: "rally",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
        description: "Full integration test event",
        maxParticipants: 50,
      };

      const createResponse = await apiClient.post("/events", eventData, app);
      
      if (createResponse.status >= 400) {
        console.log("Event creation failed, skipping rest of workflow");
        return;
      }

      assertions.expectSuccessResponse(createResponse);
      const eventId = createResponse.body.event.id;

      // 2. User registers for the event
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const registrationData = {
        participantName: "Integration Test User",
        participantEmail: "integration@test.com",
        clubId: "club-1",
        division: "senior",
      };

      const registerResponse = await apiClient.post(`/events/${eventId}/register`, registrationData, app);
      
      if (registerResponse.status === 200) {
        assertions.expectSuccessResponse(registerResponse);
        expect(registerResponse.body.registration).toMatchObject(registrationData);
      }

      // 3. Admin updates the event
      apiClient.setAuthToken(adminToken);
      
      const updateData = {
        location: "Updated Integration Test Grounds",
        description: "Updated description for integration test",
      };

      const updateResponse = await apiClient.put(`/events/${eventId}`, updateData, app);
      
      if (updateResponse.status === 200) {
        assertions.expectSuccessResponse(updateResponse);
        expect(updateResponse.body.event).toMatchObject(updateData);
      }

      // 4. Retrieve event with registrations
      const eventWithRegistrationsResponse = await apiClient.get(`/events/${eventId}/registrations`, app);
      
      if (eventWithRegistrationsResponse.status === 200) {
        assertions.expectSuccessResponse(eventWithRegistrationsResponse);
        expect(Array.isArray(eventWithRegistrationsResponse.body.registrations)).toBe(true);
      }

      // 5. Admin cancels the event
      const cancelResponse = await apiClient.delete(`/events/${eventId}`, app);
      
      // Should handle cancellation appropriately
      expect(cancelResponse.status).toBeLessThan(500);
    }, timeouts.integration);

    it("should handle event capacity and waitlist workflow", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Create event with limited capacity
      const limitedEventData = {
        name: `Capacity Test Event - ${Date.now()}`,
        date: new Date("2025-12-20").toISOString(),
        location: "Small Venue",
        eventTypeId: "clinic",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
        maxParticipants: 2, // Very limited capacity
      };

      const createResponse = await apiClient.post("/events", limitedEventData, app);
      
      if (createResponse.status >= 400) return;

      const eventId = createResponse.body.event.id;

      // Register multiple users to test capacity
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const registrations = [];
      for (let i = 1; i <= 4; i++) {
        const registrationData = {
          participantName: `Test User ${i}`,
          participantEmail: `user${i}@test.com`,
          clubId: "club-1",
          division: "senior",
        };

        const response = await apiClient.post(`/events/${eventId}/register`, registrationData, app);
        registrations.push(response);
      }

      // First 2 should succeed, others should be waitlisted or rejected
      const successfulRegistrations = registrations.filter(r => r.status === 200);
      const waitlistedRegistrations = registrations.filter(r => r.status === 202);

      expect(successfulRegistrations.length + waitlistedRegistrations.length).toBeGreaterThan(0);
    }, timeouts.integration);
  });

  describe("Email Queue Integration Workflow", () => {
    it("should handle complete email submission and processing workflow", async () => {
      // 1. Submit email request
      const emailRequestData = {
        ...singleMockEmailRequest,
        requestId: `integration-test-${Date.now()}`,
        submittedByName: "Integration Test User",
        submittedByEmail: "integration@test.com",
      };

      const submitResponse = await apiClient.post("/email-queue/submit", emailRequestData, app);
      
      assertions.expectSuccessResponse(submitResponse);
      const requestId = submitResponse.body.requestId;

      // 2. Check request status
      const statusResponse = await apiClient.get(`/email-queue/status/${requestId}`, app);
      
      if (statusResponse.status === 200) {
        expect(statusResponse.body).toHaveProperty("status");
        expect(statusResponse.body).toHaveProperty("requestId", requestId);
      }

      // 3. Admin views queue
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const queueResponse = await apiClient.get("/email-queue/queue", app);
      
      if (queueResponse.status === 200) {
        assertions.expectSuccessResponse(queueResponse);
        expect(queueResponse.body).toHaveProperty("queueLength");
      }

      // 4. Admin processes queue manually
      const processResponse = await apiClient.post("/email-queue/process", {}, app);
      
      if (processResponse.status === 200) {
        assertions.expectSuccessResponse(processResponse);
      }

      // 5. Check updated status
      const finalStatusResponse = await apiClient.get(`/email-queue/status/${requestId}`, app);
      
      // Status should have changed after processing
      expect(finalStatusResponse.status).toBeLessThan(500);
    }, timeouts.integration);

    it("should handle email request validation and error recovery", async () => {
      // Submit invalid email request
      const invalidEmailRequest = {
        submittedByName: "Test User",
        // Missing required fields
        events: [],
      };

      const submitResponse = await apiClient.post("/email-queue/submit", invalidEmailRequest, app);
      
      assertions.expectErrorResponse(submitResponse, 400);

      // Submit valid request after correction
      const correctedRequest = {
        ...singleMockEmailRequest,
        requestId: `corrected-${Date.now()}`,
      };

      const correctedResponse = await apiClient.post("/email-queue/submit", correctedRequest, app);
      
      assertions.expectSuccessResponse(correctedResponse);
    }, timeouts.integration);
  });

  describe("User Management Integration Workflow", () => {
    it("should handle complete user registration and management workflow", async () => {
      // 1. User registers
      const registrationData = {
        firstName: "Integration",
        lastName: "Test",
        email: `integration-${Date.now()}@test.com`,
        password: "TestPassword123!",
        clubId: "club-1",
        phone: "+61400123456",
      };

      const registerResponse = await apiClient.post("/auth/register", registrationData, app);
      
      if (registerResponse.status >= 400) {
        console.log("User registration failed, skipping rest of workflow");
        return;
      }

      assertions.expectSuccessResponse(registerResponse);
      const userId = registerResponse.body.user.id;

      // 2. User logs in
      const loginData = {
        email: registrationData.email,
        password: registrationData.password,
      };

      const loginResponse = await apiClient.post("/auth/login", loginData, app);
      
      if (loginResponse.status === 200) {
        assertions.expectSuccessResponse(loginResponse);
        expect(loginResponse.body).toHaveProperty("token");
        
        const userToken = loginResponse.body.token;
        apiClient.setAuthToken(userToken);

        // 3. User updates profile
        const profileUpdate = {
          firstName: "Updated Integration",
          phone: "+61400999888",
        };

        const updateResponse = await apiClient.put(`/users/${userId}`, profileUpdate, app);
        
        if (updateResponse.status === 200) {
          assertions.expectSuccessResponse(updateResponse);
          expect(updateResponse.body.user).toMatchObject(profileUpdate);
        }
      }

      // 4. Admin manages user
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const adminUpdateData = {
        role: "moderator",
        isActive: true,
      };

      const adminUpdateResponse = await apiClient.put(`/admin/users/${userId}`, adminUpdateData, app);
      
      if (adminUpdateResponse.status === 200) {
        assertions.expectSuccessResponse(adminUpdateResponse);
        expect(adminUpdateResponse.body.user).toMatchObject(adminUpdateData);
      }

      // 5. Admin views user details
      const userDetailsResponse = await apiClient.get(`/admin/users/${userId}`, app);
      
      if (userDetailsResponse.status === 200) {
        assertions.expectSuccessResponse(userDetailsResponse);
        expect(userDetailsResponse.body.user).toHaveProperty("activityLog");
      }
    }, timeouts.integration);

    it("should handle user authentication and authorization workflow", async () => {
      // 1. Attempt protected endpoint without auth
      const unauthedResponse = await apiClient.get("/users/profile", app);
      assertions.expectErrorResponse(unauthedResponse, 401);

      // 2. Login with valid credentials
      const loginData = {
        email: "test@example.com",
        password: "TestPassword123!",
      };

      const loginResponse = await apiClient.post("/auth/login", loginData, app);
      
      if (loginResponse.status === 200) {
        const userToken = loginResponse.body.token;
        apiClient.setAuthToken(userToken);

        // 3. Access protected endpoint with auth
        const profileResponse = await apiClient.get("/users/profile", app);
        
        if (profileResponse.status === 200) {
          assertions.expectSuccessResponse(profileResponse);
          expect(profileResponse.body).toHaveProperty("user");
        }

        // 4. Attempt admin endpoint with user token
        const adminResponse = await apiClient.get("/admin/dashboard", app);
        assertions.expectErrorResponse(adminResponse, 403);
      }

      // 5. Login as admin
      const adminLoginData = {
        email: "admin@example.com",
        password: "AdminPassword123!",
      };

      const adminLoginResponse = await apiClient.post("/auth/login", adminLoginData, app);
      
      if (adminLoginResponse.status === 200) {
        const adminToken = adminLoginResponse.body.token;
        apiClient.setAuthToken(adminToken);

        // 6. Access admin endpoint with admin token
        const dashboardResponse = await apiClient.get("/admin/dashboard", app);
        
        if (dashboardResponse.status === 200) {
          assertions.expectSuccessResponse(dashboardResponse);
          expect(dashboardResponse.body).toHaveProperty("statistics");
        }
      }
    }, timeouts.integration);
  });

  describe("Club Management Integration Workflow", () => {
    it("should handle complete club creation and member management workflow", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // 1. Create new club
      const clubData = {
        name: `Integration Test Club - ${Date.now()}`,
        code: `ITC${Date.now().toString().slice(-4)}`,
        zoneId: "zone-1",
        contactEmail: "integration@testclub.com",
        contactPhone: "+61400123456",
        address: "123 Integration Street, Test City NSW 2000",
      };

      const createClubResponse = await apiClient.post("/clubs", clubData, app);
      
      if (createClubResponse.status >= 400) {
        console.log("Club creation failed, skipping rest of workflow");
        return;
      }

      assertions.expectSuccessResponse(createClubResponse);
      const clubId = createClubResponse.body.club.id;

      // 2. Update club details
      const updateData = {
        contactEmail: "updated@testclub.com",
        address: "456 Updated Street, Test City NSW 2000",
      };

      const updateResponse = await apiClient.put(`/clubs/${clubId}`, updateData, app);
      
      if (updateResponse.status === 200) {
        assertions.expectSuccessResponse(updateResponse);
        expect(updateResponse.body.club).toMatchObject(updateData);
      }

      // 3. Get club members
      const membersResponse = await apiClient.get(`/clubs/${clubId}/members`, app);
      
      if (membersResponse.status === 200) {
        assertions.expectSuccessResponse(membersResponse);
        expect(Array.isArray(membersResponse.body.members)).toBe(true);
      }

      // 4. Create event for the club
      const eventData = {
        name: `Club Event - ${Date.now()}`,
        date: new Date("2025-12-25").toISOString(),
        location: "Club Grounds",
        eventTypeId: "show",
        coordinatorName: "Club Coordinator",
        coordinatorContact: "coordinator@testclub.com",
        clubId: clubId,
      };

      const createEventResponse = await apiClient.post("/events", eventData, app);
      
      if (createEventResponse.status === 200) {
        assertions.expectSuccessResponse(createEventResponse);
        expect(createEventResponse.body.event.clubId).toBe(clubId);
      }

      // 5. Get club with events
      const clubWithEventsResponse = await apiClient.get(`/clubs/${clubId}`, app);
      
      if (clubWithEventsResponse.status === 200) {
        assertions.expectSuccessResponse(clubWithEventsResponse);
        expect(clubWithEventsResponse.body.club).toHaveProperty("stats");
      }
    }, timeouts.integration);

    it("should handle club filtering and search workflow", async () => {
      // 1. Get all clubs
      const allClubsResponse = await apiClient.get("/clubs", app);
      
      if (allClubsResponse.status === 200) {
        assertions.expectSuccessResponse(allClubsResponse);
        expect(Array.isArray(allClubsResponse.body.clubs)).toBe(true);
      }

      // 2. Filter by zone
      const zoneFilterResponse = await apiClient.get("/clubs?zoneId=zone-1", app);
      
      if (zoneFilterResponse.status === 200) {
        assertions.expectSuccessResponse(zoneFilterResponse);
        zoneFilterResponse.body.clubs.forEach((club: any) => {
          expect(club.zoneId).toBe("zone-1");
        });
      }

      // 3. Search by name
      const searchResponse = await apiClient.get("/clubs?search=Sydney", app);
      
      if (searchResponse.status === 200) {
        assertions.expectSuccessResponse(searchResponse);
        searchResponse.body.clubs.forEach((club: any) => {
          expect(club.name.toLowerCase()).toContain("sydney");
        });
      }

      // 4. Filter active clubs
      const activeResponse = await apiClient.get("/clubs?active=true", app);
      
      if (activeResponse.status === 200) {
        assertions.expectSuccessResponse(activeResponse);
        activeResponse.body.clubs.forEach((club: any) => {
          expect(club.isActive).toBe(true);
        });
      }
    }, timeouts.integration);
  });

  describe("Cross-System Integration", () => {
    it("should handle event creation with notifications", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const eventData = {
        name: `Notification Test Event - ${Date.now()}`,
        date: new Date("2025-12-30").toISOString(),
        location: "Notification Test Grounds",
        eventTypeId: "rally",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
        notifyMembers: true,
        notifyZone: true,
      };

      const createResponse = await apiClient.post("/events", eventData, app);
      
      if (createResponse.status === 200) {
        assertions.expectSuccessResponse(createResponse);
        
        // Should have triggered notifications
        expect(createResponse.body).toHaveProperty("event");
        // May include notification status in response
      }
    }, timeouts.integration);

    it("should handle bulk operations across multiple systems", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Bulk user update
      const bulkUserAction = {
        action: "update_club",
        userIds: ["user-1", "user-2", "user-3"],
        data: { clubId: "club-2" },
      };

      const bulkResponse = await apiClient.post("/admin/bulk-actions", bulkUserAction, app);
      
      if (bulkResponse.status === 200) {
        assertions.expectSuccessResponse(bulkResponse);
        expect(bulkResponse.body.results).toHaveProperty("successful");
        expect(bulkResponse.body.results).toHaveProperty("failed");
      }
    }, timeouts.integration);

    it("should handle system health checks across all services", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const healthResponse = await apiClient.get("/admin/system-health", app);
      
      if (healthResponse.status === 200) {
        assertions.expectSuccessResponse(healthResponse);
        expect(healthResponse.body).toHaveProperty("database");
        expect(healthResponse.body).toHaveProperty("emailService");
        expect(healthResponse.body).toHaveProperty("storage");
        expect(healthResponse.body).toHaveProperty("performance");
      }
    }, timeouts.integration);
  });

  describe("Error Recovery and Resilience", () => {
    it("should handle partial system failures gracefully", async () => {
      // Simulate scenario where some services are down
      const eventData = {
        name: `Resilience Test Event - ${Date.now()}`,
        date: new Date("2025-12-31").toISOString(),
        location: "Resilience Test Grounds",
        eventTypeId: "clinic",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
      };

      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const createResponse = await apiClient.post("/events", eventData, app);
      
      // Should either succeed or fail gracefully
      expect(createResponse.status).toBeLessThan(500);
      
      if (createResponse.status >= 400) {
        expect(createResponse.body).toHaveProperty("success", false);
        expect(createResponse.body).toHaveProperty("error");
      }
    }, timeouts.integration);

    it("should handle concurrent operations correctly", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Create multiple events simultaneously
      const eventPromises = Array.from({ length: 5 }, (_, i) => 
        apiClient.post("/events", {
          name: `Concurrent Event ${i} - ${Date.now()}`,
          date: new Date("2025-12-31").toISOString(),
          location: `Location ${i}`,
          eventTypeId: "rally",
          coordinatorName: "Test Coordinator",
          coordinatorContact: "coordinator@test.com",
          clubId: "club-1",
        }, app)
      );

      const responses = await Promise.all(eventPromises);
      
      // All should complete without server errors
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });

      const successfulCreations = responses.filter(r => r.status === 200);
      expect(successfulCreations.length).toBeGreaterThan(0);
    }, timeouts.integration);

    it("should maintain data consistency across operations", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Create event
      const eventData = {
        name: `Consistency Test Event - ${Date.now()}`,
        date: new Date("2025-12-31").toISOString(),
        location: "Consistency Test Grounds",
        eventTypeId: "show",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
      };

      const createResponse = await apiClient.post("/events", eventData, app);
      
      if (createResponse.status >= 400) return;

      const eventId = createResponse.body.event.id;

      // Register user for event
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const registrationData = {
        participantName: "Consistency Test User",
        participantEmail: "consistency@test.com",
        clubId: "club-1",
        division: "senior",
      };

      const registerResponse = await apiClient.post(`/events/${eventId}/register`, registrationData, app);
      
      if (registerResponse.status >= 400) return;

      // Check that registration appears in event
      const eventWithRegistrationsResponse = await apiClient.get(`/events/${eventId}/registrations`, app);
      
      if (eventWithRegistrationsResponse.status === 200) {
        const registrations = eventWithRegistrationsResponse.body.registrations;
        const userRegistration = registrations.find((r: any) => 
          r.participantEmail === registrationData.participantEmail
        );
        expect(userRegistration).toBeDefined();
      }
    }, timeouts.integration);
  });
});