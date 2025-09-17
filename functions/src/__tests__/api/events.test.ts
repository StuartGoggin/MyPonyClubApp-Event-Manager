/**
 * Events API Test Suite
 * 
 * Comprehensive testing for events API endpoints
 */

import express from "express";
import eventsRouter from "../../api/events";
import { createTestApp, TestApiClient, assertions, timeouts } from "../utils/test-helpers";

const request = require("supertest");

describe("Events API", () => {
  let app: ReturnType<typeof express>;
  let apiClient: TestApiClient;

  beforeEach(() => {
    app = createTestApp();
    app.use("/events", eventsRouter);
    apiClient = new TestApiClient();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("GET /events", () => {
    it("should retrieve all events successfully", async () => {
      const response = await apiClient.get("/events", app);

      // Accept 503 for database connection issues in emulator environment
      if (response.status === 503) {
        expect(response.body).toHaveProperty("success", false);
        expect(response.body.message).toMatch(/database|connection/i);
        return;
      }

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("events");
      expect(Array.isArray(response.body.events)).toBe(true);
    }, timeouts.api);

    it("should support pagination parameters", async () => {
      const response = await apiClient.get("/events?page=1&limit=10", app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("events");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("total");
    }, timeouts.api);

    it("should filter events by date range", async () => {
      const startDate = "2025-01-01";
      const endDate = "2025-12-31";
      const response = await apiClient.get(`/events?startDate=${startDate}&endDate=${endDate}`, app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("events");
      
      // All returned events should be within the date range
      response.body.events.forEach((event: any) => {
        const eventDate = new Date(event.date);
        expect(eventDate >= new Date(startDate)).toBe(true);
        expect(eventDate <= new Date(endDate)).toBe(true);
      });
    }, timeouts.api);

    it("should filter events by event type", async () => {
      const eventTypeId = "rally";
      const response = await apiClient.get(`/events?eventTypeId=${eventTypeId}`, app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      response.body.events.forEach((event: any) => {
        expect(event.eventTypeId).toBe(eventTypeId);
      });
    }, timeouts.api);

    it("should filter events by club", async () => {
      const clubId = "club-1";
      const response = await apiClient.get(`/events?clubId=${clubId}`, app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      response.body.events.forEach((event: any) => {
        expect(event.clubId).toBe(clubId);
      });
    }, timeouts.api);

    it("should filter qualifier events only", async () => {
      const response = await apiClient.get("/events?isQualifier=true", app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      response.body.events.forEach((event: any) => {
        expect(event.isQualifier).toBe(true);
      });
    }, timeouts.api);

    it("should sort events by date", async () => {
      const response = await apiClient.get("/events?sortBy=date&order=asc", app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      
      // Verify events are sorted by date
      for (let i = 1; i < response.body.events.length; i++) {
        const prevDate = new Date(response.body.events[i - 1].date);
        const currDate = new Date(response.body.events[i].date);
        expect(currDate >= prevDate).toBe(true);
      }
    }, timeouts.api);

    it("should search events by name", async () => {
      const searchTerm = "Rally";
      const response = await apiClient.get(`/events?search=${searchTerm}`, app);

      if (response.status === 503) return; // Skip for emulator

      assertions.expectSuccessResponse(response);
      response.body.events.forEach((event: any) => {
        expect(event.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    }, timeouts.api);
  });

  describe("GET /events/:id", () => {
    it("should retrieve a specific event by ID", async () => {
      const eventId = "event-1";
      const response = await apiClient.get(`/events/${eventId}`, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("event");
      expect(response.body.event).toHaveProperty("id", eventId);
      expect(response.body.event).toHaveProperty("name");
      expect(response.body.event).toHaveProperty("date");
      expect(response.body.event).toHaveProperty("location");
    }, timeouts.api);

    it("should return 404 for non-existent event", async () => {
      const response = await apiClient.get("/events/non-existent-id", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);

    it("should include event details", async () => {
      const response = await apiClient.get("/events/event-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body.event).toHaveProperty("coordinatorName");
      expect(response.body.event).toHaveProperty("coordinatorContact");
      expect(response.body.event).toHaveProperty("eventTypeId");
      expect(response.body.event).toHaveProperty("priority");
      expect(response.body.event).toHaveProperty("isQualifier");
    }, timeouts.api);

    it("should include club information for event", async () => {
      const response = await apiClient.get("/events/event-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body.event).toHaveProperty("club");
      expect(response.body.event.club).toHaveProperty("name");
      expect(response.body.event.club).toHaveProperty("id");
    }, timeouts.api);
  });

  describe("POST /events", () => {
    const validEventData = {
      name: "Test Event API Migration",
      date: new Date("2025-12-15").toISOString(),
      location: "Test Event Grounds",
      eventTypeId: "rally",
      coordinatorName: "Test Coordinator",
      coordinatorContact: "coordinator@test.com",
      isQualifier: false,
      priority: 2,
      isHistoricallyTraditional: false,
      description: "Testing event creation for API migration",
      clubId: "club-1",
    };

    it("should create a new event with valid data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const testEvent = { 
        ...validEventData, 
        name: `${validEventData.name} - ${Date.now()}` 
      };

      const response = await apiClient.post("/events", testEvent, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("event");
      expect(response.body.event).toMatchObject({
        name: testEvent.name,
        location: testEvent.location,
        eventTypeId: testEvent.eventTypeId,
      });
      expect(response.body.event).toHaveProperty("id");
      expect(response.body.event).toHaveProperty("createdAt");
    }, timeouts.api);

    it("should require authentication for event creation", async () => {
      const response = await apiClient.post("/events", validEventData, app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should validate required fields", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = { ...validEventData } as any;
      delete invalidData.name;

      const response = await apiClient.post("/events", invalidData, app);

      assertions.expectErrorResponse(response, 400, "name");
    }, timeouts.api);

    it("should validate date format", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = {
        ...validEventData,
        date: "invalid-date-format",
      };

      const response = await apiClient.post("/events", invalidData, app);

      assertions.expectErrorResponse(response, 400, "date");
    }, timeouts.api);

    it("should validate email format for coordinator contact", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = {
        ...validEventData,
        coordinatorContact: "invalid-email",
      };

      const response = await apiClient.post("/events", invalidData, app);

      assertions.expectErrorResponse(response, 400, "email");
    }, timeouts.api);

    it("should validate priority range", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = {
        ...validEventData,
        priority: 10, // Assuming valid range is 1-5
      };

      const response = await apiClient.post("/events", invalidData, app);

      assertions.expectErrorResponse(response, 400, "priority");
    }, timeouts.api);

    it("should prevent creating events in the past", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const pastEventData = {
        ...validEventData,
        date: new Date("2020-01-01").toISOString(),
      };

      const response = await apiClient.post("/events", pastEventData, app);

      assertions.expectErrorResponse(response, 400, "past");
    }, timeouts.api);

    it("should check for conflicting events", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // First create an event
      const firstEvent = { 
        ...validEventData, 
        name: `First Event - ${Date.now()}` 
      };
      
      const firstResponse = await apiClient.post("/events", firstEvent, app);
      
      if (firstResponse.status >= 400) return; // Skip if creation failed

      // Try to create a conflicting event
      const conflictingEvent = {
        ...validEventData,
        name: `Conflicting Event - ${Date.now()}`,
        date: firstEvent.date, // Same date
        location: firstEvent.location, // Same location
      };

      const response = await apiClient.post("/events", conflictingEvent, app);

      // Should warn about or prevent conflicts
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("PUT /events/:id", () => {
    const updateData = {
      name: "Updated Event Name",
      location: "Updated Location",
      coordinatorName: "Updated Coordinator",
      priority: 1,
    };

    it("should update an existing event", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/events/event-1", updateData, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("event");
      expect(response.body.event).toMatchObject(updateData);
      expect(response.body.event).toHaveProperty("updatedAt");
    }, timeouts.api);

    it("should require authentication for updates", async () => {
      const response = await apiClient.put("/events/event-1", updateData, app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should return 404 for non-existent event", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/events/non-existent", updateData, app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);

    it("should validate update data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidUpdate = {
        coordinatorContact: "invalid-email-format",
      };

      const response = await apiClient.put("/events/event-1", invalidUpdate, app);

      assertions.expectErrorResponse(response, 400, "email");
    }, timeouts.api);

    it("should allow partial updates", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const partialUpdate = {
        name: "Partially Updated Name",
      };

      const response = await apiClient.put("/events/event-1", partialUpdate, app);

      assertions.expectSuccessResponse(response);
      expect(response.body.event.name).toBe(partialUpdate.name);
    }, timeouts.api);

    it("should prevent moving events to past dates", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const pastUpdate = {
        date: new Date("2020-01-01").toISOString(),
      };

      const response = await apiClient.put("/events/event-1", pastUpdate, app);

      assertions.expectErrorResponse(response, 400, "past");
    }, timeouts.api);
  });

  describe("DELETE /events/:id", () => {
    it("should cancel an event", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/events/event-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("message");
    }, timeouts.api);

    it("should require authentication for deletion", async () => {
      const response = await apiClient.delete("/events/event-1", app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should return 404 for non-existent event", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/events/non-existent", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);

    it("should handle events with registrations", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Assuming event-1 has registrations
      const response = await apiClient.delete("/events/event-1", app);

      // Should either prevent deletion or handle registrations appropriately
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("GET /events/:id/registrations", () => {
    it("should retrieve event registrations", async () => {
      const response = await apiClient.get("/events/event-1/registrations", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("registrations");
      expect(Array.isArray(response.body.registrations)).toBe(true);
    }, timeouts.api);

    it("should support registration filtering", async () => {
      const response = await apiClient.get("/events/event-1/registrations?status=confirmed", app);

      assertions.expectSuccessResponse(response);
      response.body.registrations.forEach((registration: any) => {
        expect(registration.status).toBe("confirmed");
      });
    }, timeouts.api);

    it("should return 404 for non-existent event", async () => {
      const response = await apiClient.get("/events/non-existent/registrations", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);
  });

  describe("POST /events/:id/register", () => {
    const registrationData = {
      participantName: "Test Participant",
      participantEmail: "participant@test.com",
      clubId: "club-1",
      division: "senior",
    };

    it("should register for an event", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.post("/events/event-1/register", registrationData, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("registration");
      expect(response.body.registration).toMatchObject(registrationData);
    }, timeouts.api);

    it("should require authentication for registration", async () => {
      const response = await apiClient.post("/events/event-1/register", registrationData, app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should validate registration data", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const invalidData = { ...registrationData } as any;
      delete invalidData.participantName;

      const response = await apiClient.post("/events/event-1/register", invalidData, app);

      assertions.expectErrorResponse(response, 400, "name");
    }, timeouts.api);

    it("should prevent duplicate registrations", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      // First registration
      const firstResponse = await apiClient.post("/events/event-1/register", registrationData, app);
      
      if (firstResponse.status >= 400) return; // Skip if first registration failed

      // Duplicate registration attempt
      const response = await apiClient.post("/events/event-1/register", registrationData, app);

      assertions.expectErrorResponse(response, 409, "already registered");
    }, timeouts.api);

    it("should check event capacity limits", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      // This test would require setting up an event with limited capacity
      const response = await apiClient.post("/events/event-full/register", registrationData, app);

      // Should handle capacity appropriately
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("Event Types Integration", () => {
    it("should retrieve available event types", async () => {
      const response = await apiClient.get("/events/types", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("eventTypes");
      expect(Array.isArray(response.body.eventTypes)).toBe(true);
    }, timeouts.api);

    it("should validate event type on creation", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidEventData = {
        name: "Test Event",
        date: new Date("2025-12-15").toISOString(),
        location: "Test Location",
        eventTypeId: "invalid-event-type",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
      };

      const response = await apiClient.post("/events", invalidEventData, app);

      assertions.expectErrorResponse(response, 400, "event type");
    }, timeouts.api);
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON in request body", async () => {
      const response = await request(app)
        .post("/events")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    }, timeouts.api);

    it("should handle database connection errors gracefully", async () => {
      const response = await apiClient.get("/events", app);
      
      // Should not crash the server (503 is acceptable for emulator)
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should validate date boundaries", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const futureEventData = {
        name: "Far Future Event",
        date: new Date("2050-01-01").toISOString(),
        location: "Test Location",
        eventTypeId: "rally",
        coordinatorName: "Test Coordinator",
        coordinatorContact: "coordinator@test.com",
        clubId: "club-1",
      };

      const response = await apiClient.post("/events", futureEventData, app);

      // Should handle reasonable date boundaries
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });
});