import {Request, Response, NextFunction} from "express";
import {logger} from "firebase-functions/v2";

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
}

// TODO: Replace this with your actual user authentication logic
// This is a placeholder implementation for Firebase Functions
async function getCurrentUser(req: Request): Promise<User | null> {
  // In a real implementation, you would:
  // 1. Extract the session token from cookies or headers
  // 2. Verify the token with your authentication system
  // 3. Fetch the user from your database
  // 4. Return the user object or null if not authenticated

  // For now, return a mock admin user for development purposes
  // Remove this and implement real authentication
  const authHeader = req.headers.authorization;

  if (
    authHeader === "Bearer admin-token" ||
    authHeader === "Bearer dev-admin-token"
  ) {
    return {
      id: "admin-user-1",
      email: "admin@example.com",
      displayName: "Admin User",
      role: "super_user",
    };
  }

  return null;
}

export async function checkAdminAccess(req: Request): Promise<{
  authorized: boolean;
  user?: User;
}> {
  try {
    const user = await getCurrentUser(req);

    if (!user) {
      return {
        authorized: false,
      };
    }

    // Check if user has admin/super_user role
    if (!user.role || !["admin", "super_user"].includes(user.role)) {
      logger.warn("Access denied - insufficient privileges", {
        userId: user.id,
        role: user.role,
      });
      return {
        authorized: false,
      };
    }

    return {
      authorized: true,
      user,
    };
  } catch (error) {
    logger.error("Error checking admin access", error);
    return {
      authorized: false,
    };
  }
}

/**
 * Express middleware for admin authentication
 */
export function withAdminAuth(
  handler: (req: Request, res: Response, user: User) => Promise<void>,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authResult = await checkAdminAccess(req);

    if (!authResult.authorized) {
      res.status(401).json({
        error: "Authentication required",
        message: "Admin access required for this operation",
      });
      return;
    }

    if (!authResult.user) {
      res.status(401).json({
        error: "Authentication failed",
        message: "Unable to verify user credentials",
      });
      return;
    }

    try {
      await handler(req, res, authResult.user);
    } catch (error) {
      logger.error("Error in authenticated handler", error);
      res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Simple admin authentication middleware without user parameter
 */
export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  checkAdminAccess(req)
    .then((authResult) => {
      if (!authResult.authorized) {
        res.status(401).json({
          error: "Authentication required",
          message: "Admin access required for this operation",
        });
        return;
      }

      // Attach user to request for downstream handlers
      (req as any).user = authResult.user;
      next();
    })
    .catch((error) => {
      logger.error("Error in admin auth middleware", error);
      res.status(500).json({
        error: "Authentication error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    });
}
