import { Request, Response } from "express";
import { logger } from "firebase-functions/v2";
import { checkAdminAccess } from "../../../lib/auth-middleware";
import { UserService } from "../../../lib/user-service";

// PATCH: Update user role
export async function updateUserRole(req: Request, res: Response) {
  try {
    // Check admin authentication
    const { authorized, user } = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn("Unauthorized access attempt to admin user role update");
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        error: "User ID and role are required",
      });
    }

    // Validate role
    const validRoles = ["standard", "zone_rep", "super_user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Must be one of: standard, zone_rep, super_user",
      });
    }

    logger.info("Admin user role update requested", {
      userId,
      newRole: role,
      adminUser: user?.email,
    });

    const updatedUser = await UserService.updateUser(userId, { role });

    logger.info("User role updated successfully", {
      userId,
      newRole: role,
      adminUser: user?.email,
    });

    return res.json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Update user role error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.body?.userId,
      role: req.body?.role,
    });

    return res.status(500).json({
      error: "Failed to update user role",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
