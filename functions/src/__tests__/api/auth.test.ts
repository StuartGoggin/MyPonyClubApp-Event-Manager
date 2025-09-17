import express, { Express } from "express";
import request from "supertest";
import authRouter from "../../api/auth";
import { UserService } from "../../lib/user-service";
import { User, UserRole } from "../../lib/types";
import { jwtVerify, SignJWT } from "jose";

// Mock dependencies
jest.mock("../../lib/user-service");
jest.mock("firebase-functions/v2", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Firebase Admin
jest.mock("../../lib/firebase-admin", () => ({
  adminDb: {},
}));

const MockedUserService = UserService as jest.Mocked<typeof UserService>;

describe("Authentication API", () => {
  let app: Express;
  const JWT_SECRET = new TextEncoder().encode("test-secret-key");

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/auth", authRouter);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("POST /auth/login", () => {
    const validCredentials = {
      ponyClubId: "PC123456",
      mobileNumber: "+61412345678",
    };

    const mockUser: User = {
      id: "user-1",
      ponyClubId: "PC123456",
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      role: "standard" as UserRole,
      clubId: "club-1",
      zoneId: "zone-1",
      isActive: true,
      mobileNumber: "+61412345678",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should authenticate user with valid credentials", async () => {
      MockedUserService.getUserByCredentials.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/auth/login")
        .send(validCredentials)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Authentication successful",
        user: expect.objectContaining({
          id: "user-1",
          ponyClubId: "PC123456",
          firstName: "John",
          lastName: "Smith",
          role: "standard",
        }),
        token: expect.any(String),
      });

      // Verify user response doesn"t include sensitive data
      expect(response.body.user).not.toHaveProperty("mobileNumber");

      // Verify UserService was called correctly
      expect(MockedUserService.getUserByCredentials).toHaveBeenCalledWith(
        "PC123456",
        "+61412345678",
      );
    });

    it("should reject login with missing credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: "Invalid input",
        details: expect.stringContaining("Pony Club ID is required"),
      });

      expect(MockedUserService.getUserByCredentials).not.toHaveBeenCalled();
    });

    it("should reject login with invalid credentials", async () => {
      MockedUserService.getUserByCredentials.mockResolvedValue(null);

      const response = await request(app)
        .post("/auth/login")
        .send(validCredentials)
        .expect(401);

      expect(response.body).toEqual({
        error: "Invalid credentials",
        message: "Pony Club ID and mobile number combination not found",
      });
    });

    it("should reject login for disabled account", async () => {
      const disabledUser = { ...mockUser, isActive: false };
      MockedUserService.getUserByCredentials.mockResolvedValue(disabledUser);

      const response = await request(app)
        .post("/auth/login")
        .send(validCredentials)
        .expect(403);

      expect(response.body).toEqual({
        error: "Account disabled",
        message:
          "Your account has been disabled. Please contact an administrator.",
      });
    });

    it("should handle service errors gracefully", async () => {
      MockedUserService.getUserByCredentials.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app)
        .post("/auth/login")
        .send(validCredentials)
        .expect(500);

      expect(response.body).toEqual({
        error: "Authentication failed",
        details: "Database connection failed",
      });
    });

    it("should validate JWT token structure", async () => {
      MockedUserService.getUserByCredentials.mockResolvedValue(mockUser);

      const response = await request(app)
        .post("/auth/login")
        .send(validCredentials)
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();

      // Verify token can be decoded
      const { payload } = await jwtVerify(token, JWT_SECRET);
      expect(payload).toMatchObject({
        userId: "user-1",
        ponyClubId: "PC123456",
        role: "standard",
        clubId: "club-1",
        zoneId: "zone-1",
      });
    });
  });

  describe("GET /auth/verify", () => {
    const mockUser: User = {
      id: "user-1",
      ponyClubId: "PC123456",
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      role: "standard" as UserRole,
      clubId: "club-1",
      zoneId: "zone-1",
      isActive: true,
      mobileNumber: "+61412345678",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should verify valid token and return user data", async () => {
      MockedUserService.getUserById.mockResolvedValue(mockUser);

      // Create a valid token
      const token = await new SignJWT({
        userId: "user-1",
        ponyClubId: "PC123456",
        role: "standard",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: expect.objectContaining({
          id: "user-1",
          ponyClubId: "PC123456",
          firstName: "John",
          lastName: "Smith",
        }),
        tokenPayload: expect.objectContaining({
          userId: "user-1",
          ponyClubId: "PC123456",
          role: "standard",
        }),
      });

      // Verify user response doesn"t include sensitive data
      expect(response.body.user).not.toHaveProperty("mobileNumber");

      expect(MockedUserService.getUserById).toHaveBeenCalledWith("user-1");
    });

    it("should reject request without authorization header", async () => {
      const response = await request(app).get("/auth/verify").expect(401);

      expect(response.body).toEqual({
        error: "No token provided",
      });

      expect(MockedUserService.getUserById).not.toHaveBeenCalled();
    });

    it("should reject request with malformed authorization header", async () => {
      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", "InvalidHeader")
        .expect(401);

      expect(response.body).toEqual({
        error: "No token provided",
      });
    });

    it("should reject invalid or expired token", async () => {
      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toEqual({
        error: "Invalid or expired token",
      });
    });

    it("should reject token for non-existent user", async () => {
      MockedUserService.getUserById.mockResolvedValue(null);

      const token = await new SignJWT({
        userId: "non-existent-user",
        ponyClubId: "PC123456",
        role: "standard",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Invalid or expired token",
      });
    });

    it("should reject token for disabled user", async () => {
      const disabledUser = { ...mockUser, isActive: false };
      MockedUserService.getUserById.mockResolvedValue(disabledUser);

      const token = await new SignJWT({
        userId: "user-1",
        ponyClubId: "PC123456",
        role: "standard",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);

      expect(response.body).toEqual({
        error: "Invalid or expired token",
      });
    });
  });

  describe("POST /auth/logout", () => {
    it("should successfully logout with valid token", async () => {
      const token = await new SignJWT({
        userId: "user-1",
        ponyClubId: "PC123456",
        role: "standard",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);

      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Logged out successfully",
      });
    });

    it("should successfully logout without token", async () => {
      const response = await request(app).post("/auth/logout").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Logged out successfully",
      });
    });

    it("should handle logout with invalid token", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", "Bearer invalid-token")
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Logged out successfully",
      });
    });
  });

  describe("Authentication Flow Integration", () => {
    const mockUser: User = {
      id: "user-1",
      ponyClubId: "PC123456",
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      role: "standard" as UserRole,
      clubId: "club-1",
      zoneId: "zone-1",
      isActive: true,
      mobileNumber: "+61412345678",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    it("should complete full login -> verify -> logout flow", async () => {
      MockedUserService.getUserByCredentials.mockResolvedValue(mockUser);
      MockedUserService.getUserById.mockResolvedValue(mockUser);

      // Step 1: Login
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          ponyClubId: "PC123456",
          mobileNumber: "+61412345678",
        })
        .expect(200);

      const token = loginResponse.body.token;
      expect(token).toBeDefined();

      // Step 2: Verify token
      const verifyResponse = await request(app)
        .get("/auth/verify")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.user.id).toBe("user-1");

      // Step 3: Logout
      const logoutResponse = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);
    });
  });
});
