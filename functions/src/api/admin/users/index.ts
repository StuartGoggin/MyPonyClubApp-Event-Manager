import {Request, Response} from "express";
import {logger} from "firebase-functions/v2";
import {checkAdminAccess} from "../../../lib/auth-middleware";
import {UserService} from "../../../lib/user-service";

// GET: Retrieve users with optional filtering
export async function getUsers(req: Request, res: Response) {
  try {
    // Check admin authentication
    const {authorized, user} = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn("Unauthorized access attempt to admin users endpoint");
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    logger.info("Admin user listing requested", {
      adminUser: user?.email,
      query: req.query,
    });

    const options = {
      clubId: (req.query.clubId as string) || undefined,
      zoneId: (req.query.zoneId as string) || undefined,
      role: (req.query.role as string) || undefined,
      isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const users = await UserService.getUsers(options);

    logger.info("Users retrieved successfully", {
      count: users.length,
      adminUser: user?.email,
    });

    return res.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    logger.error("Get users error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return res.status(500).json({
      error: "Failed to retrieve users",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// POST: Create a new user
export async function createUser(req: Request, res: Response) {
  try {
    // Check admin authentication
    const {authorized, user} = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn("Unauthorized access attempt to admin user creation");
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    logger.info("Admin user creation requested", {
      adminUser: user?.email,
      targetUserData: {...req.body, password: "[REDACTED]"},
    });

    const userData = req.body;

    // Validate user data (excluding ID and timestamps)
    const {id, createdAt, updatedAt, ...userDataToValidate} = userData;

    // Check if Pony Club ID already exists
    const exists = await UserService.ponyClubIdExists(userData.ponyClubId);
    if (exists) {
      logger.warn("Pony Club ID already exists", {
        ponyClubId: userData.ponyClubId,
        adminUser: user?.email,
      });

      return res.status(400).json({
        error: `Pony Club ID ${userData.ponyClubId} already exists`,
      });
    }

    const newUser = await UserService.createUser(userDataToValidate);

    logger.info("User created successfully", {
      newUserId: newUser.id,
      ponyClubId: newUser.ponyClubId,
      adminUser: user?.email,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    logger.error("Create user error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return res.status(500).json({
      error: "Failed to create user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// PUT: Update a user
export async function updateUser(req: Request, res: Response) {
  try {
    // Check admin authentication
    const {authorized, user} = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn("Unauthorized access attempt to admin user update");
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    const userId = req.query.id as string;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    logger.info("Admin user update requested", {
      userId,
      adminUser: user?.email,
      updateData: {...req.body, password: "[REDACTED]"},
    });

    const updateData = req.body;

    // If updating Pony Club ID, check for conflicts
    if (updateData.ponyClubId) {
      const exists = await UserService.ponyClubIdExists(
        updateData.ponyClubId,
        userId,
      );
      if (exists) {
        logger.warn("Pony Club ID conflict during update", {
          ponyClubId: updateData.ponyClubId,
          userId,
          adminUser: user?.email,
        });

        return res.status(400).json({
          error: `Pony Club ID ${updateData.ponyClubId} already exists`,
        });
      }
    }

    const updatedUser = await UserService.updateUser(userId, updateData);

    logger.info("User updated successfully", {
      userId,
      adminUser: user?.email,
    });

    return res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Update user error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.query.id,
    });

    return res.status(500).json({
      error: "Failed to update user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// DELETE: Soft delete a user
export async function deleteUser(req: Request, res: Response) {
  try {
    // Check admin authentication
    const {authorized, user} = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn("Unauthorized access attempt to admin user deletion");
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin access required",
      });
    }

    const userId = req.query.id as string;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

    logger.info("Admin user deletion requested", {
      userId,
      adminUser: user?.email,
    });

    await UserService.deleteUser(userId);

    logger.info("User deleted successfully", {
      userId,
      adminUser: user?.email,
    });

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Delete user error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.query.id,
    });

    return res.status(500).json({
      error: "Failed to delete user",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
