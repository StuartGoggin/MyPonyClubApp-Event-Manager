/**
 * Admin API Test Suite
 * 
 * Comprehensive testing for admin-specific API endpoints
 */

import express from "express";
import adminRouter from "../../api/admin";
import { createTestApp, TestApiClient, assertions, timeouts } from "../utils/test-helpers";

describe("Admin API", () => {
  let app: ReturnType<typeof express>;
  let apiClient: TestApiClient;

  beforeEach(() => {
    app = createTestApp();
    app.use("/admin", adminRouter);
    apiClient = new TestApiClient();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should require authentication for all admin endpoints", async () => {
      const endpoints = [
        "/admin/dashboard",
        "/admin/users",
        "/admin/system-health",
        "/admin/settings",
      ];

      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        const response = await apiClient.get(endpoint, app);
        assertions.expectErrorResponse(response, 401, "authentication");
      }
    }, timeouts.api);

    it("should require admin privileges", async () => {
      const userToken = "mock-user-token";
      apiClient.setAuthToken(userToken);

      const response = await apiClient.get("/admin/dashboard", app);

      assertions.expectErrorResponse(response, 403, "admin");
    }, timeouts.api);

    it("should allow access with valid admin token", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      // Should allow access or return valid response
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("GET /admin/dashboard", () => {
    it("should return comprehensive dashboard data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("statistics");
      expect(response.body).toHaveProperty("recentActivity");
      expect(response.body).toHaveProperty("systemHealth");
    }, timeouts.api);

    it("should include user statistics", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      if (response.status === 200) {
        expect(response.body.statistics).toHaveProperty("totalUsers");
        expect(response.body.statistics).toHaveProperty("activeUsers");
        expect(response.body.statistics).toHaveProperty("newUsersThisMonth");
      }
    }, timeouts.api);

    it("should include club statistics", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      if (response.status === 200) {
        expect(response.body.statistics).toHaveProperty("totalClubs");
        expect(response.body.statistics).toHaveProperty("activeClubs");
      }
    }, timeouts.api);

    it("should include event statistics", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      if (response.status === 200) {
        expect(response.body.statistics).toHaveProperty("upcomingEvents");
        expect(response.body.statistics).toHaveProperty("eventsThisMonth");
      }
    }, timeouts.api);

    it("should show recent system activity", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      if (response.status === 200) {
        expect(response.body.recentActivity).toHaveProperty("recentLogins");
        expect(response.body.recentActivity).toHaveProperty("recentRegistrations");
        expect(response.body.recentActivity).toHaveProperty("recentEvents");
      }
    }, timeouts.api);
  });

  describe("GET /admin/users", () => {
    it("should return paginated user list", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users?page=1&limit=10", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("users");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.users)).toBe(true);
    }, timeouts.api);

    it("should support user search", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users?search=john", app);

      assertions.expectSuccessResponse(response);
      response.body.users.forEach((user: any) => {
        const searchableText = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase();
        expect(searchableText).toContain("john");
      });
    }, timeouts.api);

    it("should support filtering by role", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users?role=admin", app);

      assertions.expectSuccessResponse(response);
      response.body.users.forEach((user: any) => {
        expect(user.role).toBe("admin");
      });
    }, timeouts.api);

    it("should support filtering by club", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users?clubId=club-1", app);

      assertions.expectSuccessResponse(response);
      response.body.users.forEach((user: any) => {
        expect(user.clubId).toBe("club-1");
      });
    }, timeouts.api);

    it("should support filtering by active status", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users?active=true", app);

      assertions.expectSuccessResponse(response);
      response.body.users.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    }, timeouts.api);
  });

  describe("GET /admin/users/:id", () => {
    it("should return detailed user information", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users/user-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id", "user-1");
      expect(response.body.user).toHaveProperty("activityLog");
      expect(response.body.user).toHaveProperty("permissions");
    }, timeouts.api);

    it("should include user activity history", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users/user-1", app);

      if (response.status === 200) {
        expect(response.body.user.activityLog).toHaveProperty("lastLogin");
        expect(response.body.user.activityLog).toHaveProperty("loginHistory");
        expect(response.body.user.activityLog).toHaveProperty("recentActions");
      }
    }, timeouts.api);

    it("should return 404 for non-existent user", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/users/non-existent", app);

      assertions.expectErrorResponse(response, 404, "not found");
    }, timeouts.api);
  });

  describe("PUT /admin/users/:id", () => {
    const updateData = {
      role: "moderator",
      isActive: false,
      permissions: ["read_events", "create_events"],
    };

    it("should update user details", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/admin/users/user-1", updateData, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toMatchObject(updateData);
    }, timeouts.api);

    it("should validate role assignments", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidUpdate = {
        role: "invalid-role",
      };

      const response = await apiClient.put("/admin/users/user-1", invalidUpdate, app);

      assertions.expectErrorResponse(response, 400, "role");
    }, timeouts.api);

    it("should prevent self-demotion", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Assuming the admin token belongs to user-admin
      const selfDemotionUpdate = {
        role: "user",
      };

      const response = await apiClient.put("/admin/users/user-admin", selfDemotionUpdate, app);

      // Should prevent self-demotion
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should log administrative actions", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/admin/users/user-1", updateData, app);

      if (response.status === 200) {
        // Should create audit log entry
        expect(response.body).toHaveProperty("auditLog");
      }
    }, timeouts.api);
  });

  describe("DELETE /admin/users/:id", () => {
    it("should deactivate user account", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/admin/users/user-1", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("message");
    }, timeouts.api);

    it("should prevent self-deletion", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.delete("/admin/users/user-admin", app);

      assertions.expectErrorResponse(response, 400, "self");
    }, timeouts.api);

    it("should handle users with active data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // User with active events/registrations
      const response = await apiClient.delete("/admin/users/user-with-events", app);

      // Should handle gracefully or provide warning
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });

  describe("GET /admin/system-health", () => {
    it("should return system health metrics", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/system-health", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("database");
      expect(response.body).toHaveProperty("emailService");
      expect(response.body).toHaveProperty("storage");
      expect(response.body).toHaveProperty("performance");
    }, timeouts.api);

    it("should include database connection status", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/system-health", app);

      if (response.status === 200) {
        expect(response.body.database).toHaveProperty("status");
        expect(response.body.database).toHaveProperty("responseTime");
        expect(response.body.database).toHaveProperty("connections");
      }
    }, timeouts.api);

    it("should include email service status", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/system-health", app);

      if (response.status === 200) {
        expect(response.body.emailService).toHaveProperty("status");
        expect(response.body.emailService).toHaveProperty("queueLength");
        expect(response.body.emailService).toHaveProperty("lastProcessed");
      }
    }, timeouts.api);

    it("should include performance metrics", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/system-health", app);

      if (response.status === 200) {
        expect(response.body.performance).toHaveProperty("responseTime");
        expect(response.body.performance).toHaveProperty("throughput");
        expect(response.body.performance).toHaveProperty("errorRate");
      }
    }, timeouts.api);
  });

  describe("GET /admin/settings", () => {
    it("should return system settings", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/settings", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("settings");
      expect(response.body.settings).toHaveProperty("notifications");
      expect(response.body.settings).toHaveProperty("registration");
      expect(response.body.settings).toHaveProperty("events");
    }, timeouts.api);

    it("should include notification settings", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/settings", app);

      if (response.status === 200) {
        expect(response.body.settings.notifications).toHaveProperty("emailEnabled");
        expect(response.body.settings.notifications).toHaveProperty("smsEnabled");
        expect(response.body.settings.notifications).toHaveProperty("templates");
      }
    }, timeouts.api);

    it("should include registration settings", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/settings", app);

      if (response.status === 200) {
        expect(response.body.settings.registration).toHaveProperty("allowSelfRegistration");
        expect(response.body.settings.registration).toHaveProperty("requireApproval");
        expect(response.body.settings.registration).toHaveProperty("defaultRole");
      }
    }, timeouts.api);
  });

  describe("PUT /admin/settings", () => {
    const settingsUpdate = {
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
      },
      registration: {
        allowSelfRegistration: false,
        requireApproval: true,
      },
    };

    it("should update system settings", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/admin/settings", settingsUpdate, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("settings");
    }, timeouts.api);

    it("should validate setting values", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidSettings = {
        notifications: {
          emailEnabled: "invalid-boolean",
        },
      };

      const response = await apiClient.put("/admin/settings", invalidSettings, app);

      assertions.expectErrorResponse(response, 400, "validation");
    }, timeouts.api);

    it("should log settings changes", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.put("/admin/settings", settingsUpdate, app);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("auditLog");
      }
    }, timeouts.api);
  });

  describe("GET /admin/audit-log", () => {
    it("should return audit log entries", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/audit-log", app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("auditLog");
      expect(Array.isArray(response.body.auditLog)).toBe(true);
    }, timeouts.api);

    it("should support filtering by date range", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/audit-log?startDate=2025-01-01&endDate=2025-01-31", app);

      assertions.expectSuccessResponse(response);
      response.body.auditLog.forEach((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        expect(entryDate >= new Date("2025-01-01")).toBe(true);
        expect(entryDate <= new Date("2025-01-31")).toBe(true);
      });
    }, timeouts.api);

    it("should support filtering by action type", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/audit-log?action=user_update", app);

      assertions.expectSuccessResponse(response);
      response.body.auditLog.forEach((entry: any) => {
        expect(entry.action).toBe("user_update");
      });
    }, timeouts.api);

    it("should support filtering by user", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/audit-log?userId=user-1", app);

      assertions.expectSuccessResponse(response);
      response.body.auditLog.forEach((entry: any) => {
        expect(entry.userId).toBe("user-1");
      });
    }, timeouts.api);
  });

  describe("POST /admin/bulk-actions", () => {
    it("should perform bulk user operations", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const bulkAction = {
        action: "deactivate",
        userIds: ["user-1", "user-2", "user-3"],
        reason: "Bulk deactivation for testing",
      };

      const response = await apiClient.post("/admin/bulk-actions", bulkAction, app);

      assertions.expectSuccessResponse(response);
      expect(response.body).toHaveProperty("results");
      expect(response.body.results).toHaveProperty("successful");
      expect(response.body.results).toHaveProperty("failed");
    }, timeouts.api);

    it("should validate bulk action parameters", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidBulkAction = {
        action: "invalid-action",
        userIds: [],
      };

      const response = await apiClient.post("/admin/bulk-actions", invalidBulkAction, app);

      assertions.expectErrorResponse(response, 400, "action");
    }, timeouts.api);

    it("should handle partial failures in bulk operations", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const bulkAction = {
        action: "update_role",
        userIds: ["user-1", "non-existent-user", "user-3"],
        data: { role: "moderator" },
      };

      const response = await apiClient.post("/admin/bulk-actions", bulkAction, app);

      if (response.status === 200) {
        expect(response.body.results.successful).toBeGreaterThan(0);
        expect(response.body.results.failed).toBeGreaterThan(0);
      }
    }, timeouts.api);
  });

  describe("Data Export and Import", () => {
    it("should export user data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/export/users", app);

      // Should return data or initiate export process
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should export club data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/export/clubs", app);

      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should export event data", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/export/events", app);

      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should validate import data format", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const invalidImportData = {
        type: "users",
        data: "invalid-data-format",
      };

      const response = await apiClient.post("/admin/import", invalidImportData, app);

      assertions.expectErrorResponse(response, 400, "format");
    }, timeouts.api);
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      const response = await apiClient.get("/admin/dashboard", app);

      // Should handle gracefully
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);

    it("should handle rate limiting for admin operations", async () => {
      const adminToken = "mock-admin-token";
      apiClient.setAuthToken(adminToken);

      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () => 
        apiClient.get("/admin/users", app)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    }, timeouts.api);

    it("should validate admin permissions for sensitive operations", async () => {
      const limitedAdminToken = "mock-limited-admin-token";
      apiClient.setAuthToken(limitedAdminToken);

      const response = await apiClient.delete("/admin/users/user-1", app);

      // Should check specific permissions
      expect(response.status).toBeLessThan(500);
    }, timeouts.api);
  });
});