import express from "express";
import {logger} from "firebase-functions/v2";
import {getEmailLogs} from "../../lib/email-queue-admin";
import {requireAdminAuth} from "../../lib/auth-middleware";

const router = express.Router();

/**
 * GET /email-queue/logs
 * Retrieve email logs with optional filtering
 * Query parameters:
 * - limit: Maximum number of logs to return (default: 100)
 * - status: Filter by log status ("success", "error", "retry", "pending")
 */
router.get("/", requireAdminAuth, async (req, res) => {
  try {
    const {limit, status} = req.query;
    const parsedLimit = parseInt((limit as string) || "100");

    logger.info("Email Queue Logs API: GET request", {
      limit: parsedLimit,
      status,
      userEmail: (req as any).user?.email,
    });

    const logs = await getEmailLogs(parsedLimit, status as any);

    logger.info("Email Queue Logs API: Logs retrieved successfully", {
      count: logs.length,
      limit: parsedLimit,
      status,
    });

    return res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    logger.error("Email Queue Logs API: Error fetching email logs", {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: "Failed to fetch email logs",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
