import express, {Request, Response} from "express";
import {logger} from "firebase-functions/v2";
import {
  getQueuedEmails,
  updateQueuedEmail,
  deleteQueuedEmail,
  bulkUpdateEmails,
  bulkDeleteEmails,
  getEmailQueueStats,
  addEmailToQueue,
  duplicateEmail,
} from "../../lib/email-queue-admin";
import {EmailStatus} from "../../lib/types";
import {withAdminAuth, requireAdminAuth} from "../../lib/auth-middleware";

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
}

const router = express.Router();

/**
 * GET /email-queue
 * Retrieves emails from the queue with optional filtering
 * Query parameters:
 * - status: Filter by email status
 * - limit: Maximum number of emails to return
 * - offset: Number of emails to skip
 * - includeStats: Include queue statistics
 */
router.get("/", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const {status, includeStats} = req.query;

    // Get queue statistics if requested
    if (includeStats === "true") {
      const stats = await getEmailQueueStats();
      logger.info("Retrieved email queue statistics", {
        stats,
        userId: (req as any).user?.id,
      });
      res.json({success: true, data: stats});
      return;
    }

    // Get queued emails with filtering
    const emails = await getQueuedEmails(status as EmailStatus);

    logger.info("Retrieved queued emails", {
      count: emails.length,
      status,
      userId: (req as any).user?.id,
    });

    res.json({success: true, data: emails});
  } catch (error) {
    logger.error("Error retrieving queued emails", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: (req as any).user?.id,
    });
    res.status(500).json({
      error: "Failed to retrieve emails",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /email-queue
 * Add new email to queue or perform bulk actions
 * Request body can contain:
 * - action: "bulk-update", "bulk-delete", "duplicate"
 * - Individual email data for creating new emails
 */
router.post(
  "/",
  withAdminAuth(async (req: Request, res: Response, user: User) => {
    try {
      const {action, emailIds, updates, emailId, resetStatus} = req.body;

      // Handle bulk update action
      if (action === "bulk-update") {
        if (!emailIds || !Array.isArray(emailIds)) {
          res.status(400).json({
            error: "Invalid request",
            message: "emailIds array is required for bulk update",
          });
          return;
        }

        await bulkUpdateEmails(emailIds, updates || {});
        logger.info("Bulk updated emails", {
          emailIds,
          updates,
          userId: user.id,
        });
        res.json({success: true, message: "Emails updated successfully"});
        return;
      }

      // Handle bulk delete action
      if (action === "bulk-delete") {
        if (!emailIds || !Array.isArray(emailIds)) {
          res.status(400).json({
            error: "Invalid request",
            message: "emailIds array is required for bulk delete",
          });
          return;
        }

        await bulkDeleteEmails(emailIds);
        logger.info("Bulk deleted emails", {
          emailIds,
          userId: user.id,
        });
        res.json({success: true, message: "Emails deleted successfully"});
        return;
      }

      // Handle duplicate action
      if (action === "duplicate") {
        if (!emailId) {
          res.status(400).json({
            error: "Invalid request",
            message: "emailId is required for duplicate action",
          });
          return;
        }

        const newEmailId = await duplicateEmail(emailId);
        logger.info("Duplicated email", {
          originalEmailId: emailId,
          newEmailId,
          resetStatus,
          userId: user.id,
        });
        res.json({
          success: true,
          id: newEmailId,
          message: "Email duplicated successfully",
        });
        return;
      }

      // Handle regular email creation
      const emailData = {...req.body};
      delete emailData.action; // Remove action field if present

      const newEmailId = await addEmailToQueue(emailData);
      logger.info("Added email to queue", {
        emailId: newEmailId,
        to: emailData.to,
        subject: emailData.subject,
        userId: user.id,
      });
      res.json({
        success: true,
        id: newEmailId,
        message: "Email added to queue successfully",
      });
    } catch (error) {
      logger.error("Error processing email queue request", {
        error: error instanceof Error ? error.message : "Unknown error",
        action: req.body?.action,
        userId: user.id,
      });
      res.status(400).json({
        error: "Invalid request",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

/**
 * PUT /email-queue
 * Update a single email in the queue
 */
router.put(
  "/",
  withAdminAuth(async (req: Request, res: Response, user: User) => {
    try {
      const {id, ...updates} = req.body;

      if (!id) {
        res.status(400).json({
          error: "Invalid request",
          message: "Email ID is required",
        });
        return;
      }

      await updateQueuedEmail(id, updates);
      logger.info("Updated queued email", {
        emailId: id,
        updates,
        userId: user.id,
      });

      res.json({success: true, message: "Email updated successfully"});
    } catch (error) {
      logger.error("Error updating queued email", {
        error: error instanceof Error ? error.message : "Unknown error",
        emailId: req.body?.id,
        userId: user.id,
      });
      res.status(500).json({
        error: "Failed to update email",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

/**
 * DELETE /email-queue
 * Delete a single email from the queue
 */
router.delete(
  "/",
  withAdminAuth(async (req: Request, res: Response, user: User) => {
    try {
      const {id} = req.body;

      if (!id) {
        res.status(400).json({
          error: "Invalid request",
          message: "Email ID is required",
        });
        return;
      }

      await deleteQueuedEmail(id);
      logger.info("Deleted queued email", {
        emailId: id,
        userId: user.id,
      });

      res.json({success: true, message: "Email deleted successfully"});
    } catch (error) {
      logger.error("Error deleting queued email", {
        error: error instanceof Error ? error.message : "Unknown error",
        emailId: req.body?.id,
        userId: user.id,
      });
      res.status(500).json({
        error: "Failed to delete email",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

export default router;
