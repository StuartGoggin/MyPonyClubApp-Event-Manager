import {Request, Response, Router} from "express";
import {logger} from "firebase-functions/v2";
import {SignJWT, jwtVerify} from "jose";
import {UserService} from "../../lib/user-service";
import {validateLoginCredentials} from "../../lib/user-validation";

const router = Router();

// JWT Secret for token signing and verification
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
);

/**
 * POST /auth/login
 * Authenticate user with Pony Club ID and mobile number
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const credentials = req.body;

    // Basic validation
    const validation = validateLoginCredentials(
      credentials.ponyClubId,
      credentials.mobileNumber,
    );

    if (!validation.isValid) {
      logger.warn("Invalid login credentials format", {
        errors: validation.errors,
        ponyClubId: credentials.ponyClubId,
      });
      res.status(400).json({
        error: "Invalid input",
        details: validation.errors.join(", "),
      });
      return;
    }

    // Authenticate user
    const user = await UserService.getUserByCredentials(
      credentials.ponyClubId.trim().toUpperCase(),
      credentials.mobileNumber.trim(),
    );

    if (!user) {
      logger.warn("Authentication failed - user not found", {
        ponyClubId: credentials.ponyClubId,
      });
      res.status(401).json({
        error: "Invalid credentials",
        message: "Pony Club ID and mobile number combination not found",
      });
      return;
    }

    if (!user.isActive) {
      logger.warn("Authentication failed - account disabled", {
        userId: user.id,
        ponyClubId: user.ponyClubId,
      });
      res.status(403).json({
        error: "Account disabled",
        message:
          "Your account has been disabled. Please contact an administrator.",
      });
      return;
    }

    // Generate JWT token
    const token = await new SignJWT({
      userId: user.id,
      ponyClubId: user.ponyClubId,
      role: user.role,
      clubId: user.clubId,
      zoneId: user.zoneId,
    })
      .setProtectedHeader({alg: "HS256"})
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    // Remove sensitive fields from user object
    const {mobileNumber, ...userResponse} = user;

    logger.info("User authenticated successfully", {
      userId: user.id,
      ponyClubId: user.ponyClubId,
      role: user.role,
    });

    res.json({
      success: true,
      message: "Authentication successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    logger.error("Authentication error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      ponyClubId: req.body?.ponyClubId,
    });

    res.status(500).json({
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /auth/verify
 * Verify token and get current user
 */
router.get("/verify", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const {payload} = await jwtVerify(token, JWT_SECRET);

    // Get current user data
    const user = await UserService.getUserById(payload.userId as string);

    if (!user || !user.isActive) {
      logger.warn("Token verification failed - user not found or inactive", {
        userId: payload.userId,
      });
      res.status(401).json({
        error: "Invalid or expired token",
      });
      return;
    }

    // Remove sensitive fields
    const {mobileNumber, ...userResponse} = user;

    logger.info("Token verified successfully", {
      userId: user.id,
      ponyClubId: user.ponyClubId,
    });

    res.json({
      success: true,
      user: userResponse,
      tokenPayload: payload,
    });
  } catch (error) {
    logger.warn("Token verification error", {
      error: error instanceof Error ? error.message : "Unknown error",
      authHeader: req.headers.authorization ? "present" : "missing",
    });

    res.status(401).json({
      error: "Invalid or expired token",
    });
  }
});

/**
 * POST /auth/logout
 * Logout user (client-side token removal)
 */
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // For JWT-based auth, logout is mainly client-side token removal
    // We can log the logout event for audit purposes
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const {payload} = await jwtVerify(token, JWT_SECRET);
        logger.info("User logged out", {
          userId: payload.userId,
          ponyClubId: payload.ponyClubId,
        });
      } catch (error) {
        // Token might be expired or invalid, but still process logout
        logger.info("Logout attempt with invalid token");
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    res.status(500).json({
      error: "Logout failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
