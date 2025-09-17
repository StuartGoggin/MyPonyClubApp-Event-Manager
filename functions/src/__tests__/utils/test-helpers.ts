/**
 * Test Utilities and Helpers
 * 
 * Shared utilities for consistent testing across all test suites
 */

import express from "express";
const request = require("supertest");

/**
 * Create a test Express app with common middleware
 */
export function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

/**
 * Test API client for consistent request handling
 */
export class TestApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async get(path: string, app?: any) {
    const req = app ? request(app) : request(this.baseUrl);
    let apiRequest = req.get(path);
    
    if (this.authToken) {
      apiRequest = apiRequest.set("Authorization", `Bearer ${this.authToken}`);
    }
    
    return apiRequest;
  }

  async post(path: string, data: any, app?: any) {
    const req = app ? request(app) : request(this.baseUrl);
    let apiRequest = req.post(path).send(data);
    
    if (this.authToken) {
      apiRequest = apiRequest.set("Authorization", `Bearer ${this.authToken}`);
    }
    
    return apiRequest;
  }

  async put(path: string, data: any, app?: any) {
    const req = app ? request(app) : request(this.baseUrl);
    let apiRequest = req.put(path).send(data);
    
    if (this.authToken) {
      apiRequest = apiRequest.set("Authorization", `Bearer ${this.authToken}`);
    }
    
    return apiRequest;
  }

  async delete(path: string, app?: any) {
    const req = app ? request(app) : request(this.baseUrl);
    let apiRequest = req.delete(path);
    
    if (this.authToken) {
      apiRequest = apiRequest.set("Authorization", `Bearer ${this.authToken}`);
    }
    
    return apiRequest;
  }
}

/**
 * Generate JWT token for testing
 */
export async function generateTestJWT(payload: any): Promise<string> {
  const { SignJWT } = await import("jose");
  const secret = new (global as any).TextEncoder().encode("test-secret-key");
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);
}

/**
 * Test assertion helpers
 */
export const assertions = {
  /**
   * Assert successful API response structure
   */
  expectSuccessResponse(response: any, expectedData?: any) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    
    if (expectedData) {
      expect(response.body).toMatchObject(expectedData);
    }
  },

  /**
   * Assert error response structure
   */
  expectErrorResponse(response: any, expectedStatus: number, expectedMessage?: string) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty("success", false);
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  },

  /**
   * Assert paginated response structure
   */
  expectPaginatedResponse(response: any, expectedLength?: number) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("results");
    expect(response.body).toHaveProperty("count");
    expect(response.body).toHaveProperty("totalUsers");
    
    if (expectedLength !== undefined) {
      expect(response.body.results).toHaveLength(expectedLength);
    }
  }
};

/**
 * Environment configuration for tests
 */
export const testConfig = {
  local: {
    functions: "http://localhost:5001/ponyclub-events/australia-southeast1/api",
    firestore: "http://localhost:8080"
  },
  // Add production config when needed
};

/**
 * Common test timeouts
 */
export const timeouts = {
  api: 5000,
  integration: 10000,
  long: 30000,
  notification: 5000,
  email: 8000,
  template: 3000,
  validation: 2000,
  delivery: 10000,
};

/**
 * Test data cleanup helper
 */
export async function cleanupTestData() {
  // Add any cleanup logic here
  // This could clean up test data from Firebase emulator
  console.log("🧹 Cleaning up test data...");
}

/**
 * Setup test environment
 */
export async function setupTestEnvironment() {
  // Add any setup logic here
  console.log("🚀 Setting up test environment...");
}