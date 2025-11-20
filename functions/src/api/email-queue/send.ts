import express, {Request, Response} from "express";
import {logger} from "firebase-functions/v2";
import {Resend} from "resend";
import {
  getQueuedEmailById,
  markEmailAsSent,
  markEmailAsFailed,
  addEmailLog,
} from "../../lib/email-queue-admin";
import {withAdminAuth} from "../../lib/auth-middleware";

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
}

const router = express.Router();

// Initialize Resend with environment variable
const resend = process.env.RESEND_API_KEY ?
  new Resend(process.env.RESEND_API_KEY) :
  null;

/**
 * POST /email-queue/send
 * Send a queued email by ID
 * Body: { emailId: string }
 */
router.post(
  "/",
  withAdminAuth(async (req: Request, res: Response, user: User) => {
    try {
      logger.info("Email Queue Send API: POST request started", {
        userEmail: user.email,
      });

      const {emailId} = req.body;
      const sentById = user.email || user.id;

      logger.info("Email Queue Send API: Request details", {
        emailId,
        sentById,
      });

      if (!emailId) {
        logger.warn("Email Queue Send API: No email ID provided");
        res.status(400).json({
          error: "Email ID is required",
        });
        return;
      }

      // Get the email from the queue
      logger.info("Email Queue Send API: Fetching email from queue", {
        emailId,
      });
      const email = await getQueuedEmailById(emailId);

      logger.info("Email Queue Send API: Email retrieved", {
        found: !!email,
        status: email?.status,
        subject: email?.subject?.substring(0, 50) + "...",
      });

      if (!email) {
        logger.warn("Email Queue Send API: Email not found", {emailId});
        await addEmailLog({
          emailId: emailId,
          subject: "Unknown",
          recipients: [],
          status: "error",
          message: "Email not found in database",
          errorDetails: `Email ID: ${emailId}`,
        });
        res.status(404).json({
          error: "Email not found",
        });
        return;
      }

      if (email.status !== "pending") {
        logger.warn("Email Queue Send API: Invalid email status", {
          emailId,
          currentStatus: email.status,
          expectedStatus: "pending",
        });

        // Log the issue
        await addEmailLog({
          emailId: emailId,
          subject: email.subject,
          recipients: email.to,
          status: "error",
          message: `Cannot send email - current status is "${email.status}", expected "pending"`,
          errorDetails: `Email status: ${email.status || "undefined/null"}`,
        });

        res.status(400).json({
          error: "Email is not in pending status",
        });
        return;
      }

      logger.info(
        "Email Queue Send API: Email status check passed - proceeding to send",
      );

      // Check if Resend API key is configured
      logger.info("Email Queue Send API: Checking Resend configuration", {
        hasApiKey: !!process.env.RESEND_API_KEY,
        hasResendInstance: !!resend,
      });

      if (!process.env.RESEND_API_KEY || !resend) {
        logger.info(
          "Email Queue Send API: RESEND_API_KEY not configured, simulating email send",
          {
            subject: email.subject,
            toCount: email.to.length,
            ccCount: email.cc?.length || 0,
          },
        );

        // Mark as sent in simulation mode
        await markEmailAsSent(emailId, new Date());

        // Log the simulation
        await addEmailLog({
          emailId: emailId,
          subject: email.subject,
          recipients: email.to,
          status: "success",
          message: "Email sent successfully (simulation mode)",
          errorDetails: "RESEND_API_KEY not configured - simulated send",
        });

        res.json({
          success: true,
          message: "Email sent successfully (simulation mode)",
          emailId: "simulated-email-id",
        });
        return;
      }

      try {
        logger.info("Email Queue Send API: Preparing email for Resend API");

        // Prepare attachments for Resend
        const attachments =
          email.attachments?.map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.content || "", "base64"),
          })) || [];

        // Send email using Resend
        const emailData: any = {
          from: "MyPonyClub Event Manager <noreply@myponyclub.events>",
          to: email.to,
          subject: email.subject,
        };

        // Add optional fields if they exist
        if (email.cc && email.cc.length > 0) emailData.cc = email.cc;
        if (email.bcc && email.bcc.length > 0) emailData.bcc = email.bcc;
        if (email.htmlContent) emailData.html = email.htmlContent;
        if (email.textContent) emailData.text = email.textContent;
        if (attachments.length > 0) emailData.attachments = attachments;

        // Ensure we have at least text or html content
        if (!emailData.html && !emailData.text) {
          emailData.text = email.subject; // Fallback to subject as text content
        }

        logger.info("Email Queue Send API: Email data prepared", {
          from: emailData.from,
          toCount: emailData.to.length,
          subject: emailData.subject,
          hasHtml: !!emailData.html,
          hasText: !!emailData.text,
          attachmentCount: attachments.length,
        });

        logger.info("Email Queue Send API: Calling Resend API");
        const result = await resend.emails.send(emailData);

        logger.info("Email Queue Send API: Resend API response", {
          success: !result.error,
          resultId: result.data?.id,
          hasError: !!result.error,
        });

        if (result.error) {
          throw new Error(`Resend API error: ${result.error.message}`);
        }

        // Mark email as sent
        logger.info("Email Queue Send API: Marking email as sent");
        await markEmailAsSent(emailId, new Date());

        // Log success
        await addEmailLog({
          emailId: emailId,
          subject: email.subject,
          recipients: email.to,
          status: "success",
          message: "Email sent successfully",
          errorDetails: `Resend ID: ${result.data?.id}`,
        });

        logger.info("Email Queue Send API: Email sent successfully", {
          emailId,
          resendId: result.data?.id,
        });

        res.json({
          success: true,
          message: "Email sent successfully",
          emailId: result.data?.id,
        });
        return;
      } catch (sendError) {
        logger.error("Email Queue Send API: Error sending email", {
          error:
            sendError instanceof Error ?
              sendError.message :
              "Unknown send error",
          emailId,
        });

        // Mark email as failed
        const errorMessage =
          sendError instanceof Error ? sendError.message : "Unknown send error";
        await markEmailAsFailed(emailId, errorMessage);

        // Log the error
        await addEmailLog({
          emailId: emailId,
          subject: email.subject,
          recipients: email.to,
          status: "error",
          message: "Failed to send email",
          errorDetails: errorMessage,
        });

        res.status(500).json({
          error: "Failed to send email",
          details: errorMessage,
        });
        return;
      }
    } catch (error: any) {
      logger.error("Email Queue Send API: Critical error", {
        error: error.message,
        stack: error.stack,
        userEmail: user.email,
      });

      res.status(500).json({
        error: "Failed to process send request",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);

export default router;
