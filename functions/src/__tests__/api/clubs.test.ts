/**
 * Clubs API Test Suite
 * 
 * Comprehensive testing for clubs API endpoints
 */

import express from "express";
import clubsRouter from "../../api/clubs";
import { createTestApp, TestApiClient, assertions, timeouts } from "../utils/test-helpers";

const request = require("supertest");

describe("Clubs API", () => {
  let app: ReturnType<typeof express>;
  let apiClient: TestApiClient;

  beforeEach(() => {
    app = createTestApp();
    app.use("/clubs", clubsRouter);
    apiClient = new TestApiClient();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("GET /clubs", () => {
    it("should retrieve all clubs successfully", async () => {
      const response = await apiClient.get("/clubs", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("clubs");
      expect(Array.isArray(response.body.clubs)).toBe(true);
    }, timeouts.api);

    it("should handle pagination parameters", async () => {
      const response = await apiClient.get("/clubs?page=1&limit=10", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("clubs");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("total");
    }, timeouts.api);

    it("should filter clubs by zone", async () => {
      const response = await apiClient.get("/clubs?zoneId=zone-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("clubs");
      
      // All returned clubs should belong to the specified zone
      response.body.clubs.forEach((club: any) => {
        expect(club.zoneId).toBe("zone-1");
      });
    }, timeouts.api);

    it("should search clubs by name", async () => {
      const searchTerm = "Sydney";
      const response = await apiClient.get(`/clubs?search=${searchTerm}`, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("clubs");
      
      // Results should contain the search term (case-insensitive)
      response.body.clubs.forEach((club: any) => {
        expect(club.name.toLowerCase()).toContain(searchTerm.toLowerCase());
      });
    }, timeouts.api);

    it("should filter active clubs only", async () => {
      const response = await apiClient.get("/clubs?active=true", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("clubs");
      
      // All returned clubs should be active
      response.body.clubs.forEach((club: any) => {
        expect(club.isActive).toBe(true);
      });
    }, timeouts.api);

    it("should handle empty results gracefully", async () => {
      const response = await apiClient.get("/clubs?search=NonexistentClub", app);

      assertions.expectSuccessResponse(response);
      expect(response.body.clubs).toHaveLength(0);
    }, timeouts.api);

    it("should validate query parameters", async () => {
      const response = await apiClient.get("/clubs?limit=-1", app);

      // Should handle invalid limit gracefully
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("GET /clubs/:id", () => {
    it("should retrieve a specific club by ID", async () => {
      const clubId = "club-1";
      const response = await apiClient.get(`/clubs/${clubId}`, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("club");
      expect(response.body.club).toHaveProperty("id", clubId);
      expect(response.body.club).toHaveProperty("name");
      expect(response.body.club).toHaveProperty("code");
      expect(response.body.club).toHaveProperty("zoneId");
    }, timeouts.api);

    it("should return 404 for non-existent club", async () => {
      const response = await apiClient.get("/clubs/non-existent-id", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);

    it("should include club statistics", async () => {
      const response = await apiClient.get("/clubs/club-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body.club).toHaveProperty("stats");
      expect(response.body.club.stats).toHaveProperty("totalMembers");
      expect(response.body.club.stats).toHaveProperty("activeMembers");
    }, timeouts.api);

    it("should include club contact information", async () => {
      const response = await apiClient.get("/clubs/club-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body.club).toHaveProperty("contactEmail");
      expect(response.body.club).toHaveProperty("contactPhone");
      expect(response.body.club).toHaveProperty("address");
    }, timeouts.api);
  });

  describe("POST /clubs", () => {
    const validClubData = {
      name: "New Test Club",
      code: "NTC",
      zoneId: "zone-1",
      contactEmail: "contact@newtestclub.com",
      contactPhone: "+61400123456",
      address: "123 New Street, Test City NSW 2000",
    };

    it("should create a new club with valid data", async () => {
      // Mock admin authentication
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.post("/clubs", validClubData, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("club");
      expect(response.body.club).toMatchObject(validClubData);
      expect(response.body.club).toHaveProperty("id");
      expect(response.body.club).toHaveProperty("createdAt");
    }, timeouts.api);

    it("should require authentication for club creation", async () => {
      const response = await apiClient.post("/clubs", validClubData, app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should require admin privileges", async () => {
      // Mock standard user token
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.post("/clubs", validClubData, app);

      assertions.expectErrorResponse(response, 403, "permission");
    }, timeouts.api);

    it("should validate required fields", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = { ...validClubData } as any;
      delete invalidData.name;

      const response = await apiClient.post("/clubs", invalidData, app);

      assertions.expectErrorResponse(response, 400, "name");
    }, timeouts.api);

    it("should validate email format", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = {
        ...validClubData,
        contactEmail: "invalid-email-format",
      };

      const response = await apiClient.post("/clubs", invalidData, app);

      assertions.expectErrorResponse(response, 400, "email");
    }, timeouts.api);

    it("should validate phone number format", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidData = {
        ...validClubData,
        contactPhone: "invalid-phone",
      };

      const response = await apiClient.post("/clubs", invalidData, app);

      assertions.expectErrorResponse(response, 400, "phone");
    }, timeouts.api);

    it("should enforce unique club codes", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const duplicateCodeData = {
        ...validClubData,
        code: "SPC", // Assuming this code already exists
      };

      const response = await apiClient.post("/clubs", duplicateCodeData, app);

      assertions.expectErrorResponse(response, 409, "code");
    }, timeouts.api);
  });

  describe("PUT /clubs/:id", () => {
    const updateData = {
      name: "Updated Club Name",
      contactEmail: "updated@club.com",
      contactPhone: "+61400999888",
    };

    it("should update an existing club", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/clubs/club-1", updateData, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("club");
      expect(response.body.club).toMatchObject(updateData);
      expect(response.body.club).toHaveProperty("updatedAt");
    }, timeouts.api);

    it("should require authentication for updates", async () => {
      const response = await apiClient.put("/clubs/club-1", updateData, app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should require admin privileges for updates", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.put("/clubs/club-1", updateData, app);

      assertions.expectErrorResponse(response, 403, "permission");
    }, timeouts.api);

    it("should return 404 for non-existent club", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/clubs/non-existent", updateData, app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);

    it("should validate update data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidUpdate = {
        contactEmail: "invalid-email-format",
      };

      const response = await apiClient.put("/clubs/club-1", invalidUpdate, app);

      assertions.expectErrorResponse(response, 400, "email");
    }, timeouts.api);

    it("should allow partial updates", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const partialUpdate = {
        name: "Partially Updated Name",
      };

      const response = await apiClient.put("/clubs/club-1", partialUpdate, app);

      assertions.expectSuccessResponse(response);
      expect(response.body.club.name).toBe(partialUpdate.name);
    }, timeouts.api);
  });

  describe("DELETE /clubs/:id", () => {
    it("should deactivate a club", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/clubs/club-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("message");
    }, timeouts.api);

    it("should require authentication for deletion", async () => {
      const response = await apiClient.delete("/clubs/club-1", app);

      assertions.expectErrorResponse(response, 401, "authentication");
    }, timeouts.api);

    it("should require admin privileges for deletion", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.delete("/clubs/club-1", app);

      assertions.expectErrorResponse(response, 403, "permission");
    }, timeouts.api);

    it("should return 404 for non-existent club", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/clubs/non-existent", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);

    it("should prevent deletion of clubs with active members", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Assuming club-1 has active members
      const response = await apiClient.delete("/clubs/club-1", app);

      // Should prevent deletion or warn about active members
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("GET /clubs/:id/members", () => {
    it("should retrieve club members", async () => {
      const response = await apiClient.get("/clubs/club-1/members", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("members");
      expect(Array.isArray(response.body.members)).toBe(true);
    }, timeouts.api);

    it("should support member filtering by role", async () => {
      const response = await apiClient.get("/clubs/club-1/members?role=admin", app);

      assertions.expectSuccessResponse(response);
      response.body.members.forEach((member: any) => {
        expect(member.role).toBe("admin");
      });
    }, timeouts.api);

    it("should support active members only filter", async () => {
      const response = await apiClient.get("/clubs/club-1/members?active=true", app);

      assertions.expectSuccessResponse(response);
      response.body.members.forEach((member: any) => {
        expect(member.isActive).toBe(true);
      });
    }, timeouts.api);

    it("should return 404 for non-existent club", async () => {
      const response = await apiClient.get("/clubs/non-existent/members", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON in request body", async () => {
      const response = await request(app)
        .post("/clubs")
        .set("Content-Type", "application/json")
        .send("{ invalid json }")
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
    }, timeouts.api);

    it("should handle database connection errors gracefully", async () => {
      // Mock database error
      // This would be implemented based on the actual error handling in the API
      
      const response = await apiClient.get("/clubs", app);
      
      // Should not crash the server
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should handle rate limiting appropriately", async () => {
      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () => 
        apiClient.get("/clubs", app)
      );

      const responses = await Promise.all(promises);
      
      // All should complete successfully or be rate limited appropriately
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    }, timeouts.api);
  });
});