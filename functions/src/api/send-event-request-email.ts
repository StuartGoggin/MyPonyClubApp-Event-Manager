import {Router} from "express";
import {Resend} from "resend";
import {generateEventRequestPDF} from "../lib/event-request-pdf";
import {getClubById, getZoneByClubId} from "../lib/data-functions";
import {addEmailToQueue, getEmailQueueConfig} from "../lib/email-queue-admin";
import {
  exportEventRequestAsJSON,
  createJSONAttachment,
} from "../lib/event-request-json-export";
import {
  generateEventRequestEmailHTML,
  generateEventRequestEmailText,
} from "../lib/event-request-email-template";
import {QueuedEmail} from "../lib/types";
import {logger} from "firebase-functions/v2";

const router = Router();

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ?
  new Resend(process.env.RESEND_API_KEY) :
  null;

// Zone approver email configuration
const zoneApprovers = {
  smz: ["smzsecretary@gmail.com"],
  // Add other zones as needed
  // "emz": ["emzsecretary@example.com"],
  // "wmz": ["wmzsecretary@example.com"],
};

// Super user emails (will receive JSON exports)
const superUserEmails = process.env.SUPER_USER_EMAILS ?
  process.env.SUPER_USER_EMAILS.split(",").map((email) => email.trim()) :
  [
    "admin@ponyclub.com.au",
    // Add more super user emails as needed
  ];

interface EventRequestEmailData {
  formData: {
    clubId: string;
    clubName?: string;
    submittedBy: string;
    submittedByEmail: string;
    submittedByPhone: string;
    events: Array<{
      priority: number;
      name: string;
      eventTypeId: string;
      date: Date | string;
      location: string;
      isQualifier: boolean;
      isHistoricallyTraditional: boolean;
      eventTypeName?: string;
      description?: string;
      coordinatorName?: string;
      coordinatorContact?: string;
      notes?: string;
    }>;
    generalNotes?: string;
  };
  pdfData: number[];
}

/**
 * POST /send-event-request-email
 * Sends event request notifications to multiple recipients with PDF attachments
 * Supports both immediate sending and email queue system
 */
router.post("/", async (req, res) => {
  try {
    logger.info("Enhanced Email Notification API called");

    const data: EventRequestEmailData = req.body;
    logger.info("Received data", {
      hasFormData: !!data.formData,
      hasPdfData: !!data.pdfData,
    });

    const {formData, pdfData} = data;

    // Validate required data
    if (!formData) {
      logger.error("No form data provided");
      return res.status(400).json({
        error: "Form data is required",
      });
    }

    // Get club and zone information
    logger.info("Getting club info", {clubId: formData.clubId});
    const club = await getClubById(formData.clubId);
    if (!club) {
      logger.error("Club not found", {clubId: formData.clubId});
      return res.status(404).json({
        error: "Club not found",
      });
    }

    const zone = await getZoneByClubId(formData.clubId);
    if (!zone) {
      logger.error("Zone not found for club", {clubId: formData.clubId});
      return res.status(404).json({
        error: "Zone not found for this club",
      });
    }

    // Generate reference number
    const referenceNumber = `ER-${Date.now()}`;
    logger.info("Generated reference number", {referenceNumber});

    // Generate JSON export for super users
    const jsonExport = await exportEventRequestAsJSON(
      formData,
      referenceNumber,
    );
    const jsonAttachment = createJSONAttachment(jsonExport);

    // Get zone approver emails
    const zoneCode = zone.name
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .substring(0, 3);
    const approverEmails =
      zoneApprovers[zoneCode as keyof typeof zoneApprovers] || [];

    if (approverEmails.length === 0) {
      logger.warn("No zone approver emails configured", {
        zoneName: zone.name,
        zoneCode,
      });
    }

    // Get PDF buffer from provided data or generate new one
    let pdfBuffer: Buffer;
    if (pdfData && pdfData.length > 0) {
      pdfBuffer = Buffer.from(pdfData);
      logger.info("Using provided PDF data", {size: pdfBuffer.length});
    } else {
      logger.info("Generating new PDF...");
      pdfBuffer = await generateEventRequestPDF({
        formData: {
          ...formData,
          clubName: club.name,
          events: formData.events.map((event) => ({
            ...event,
            date:
              typeof event.date === "string" ?
                new Date(event.date) :
                event.date,
            coordinatorName: event.coordinatorName || "",
            coordinatorContact: event.coordinatorContact || "",
          })),
        },
      });
    }

    // Prepare email template data
    const emailTemplateData = {
      requesterName: formData.submittedBy,
      requesterEmail: formData.submittedByEmail,
      requesterPhone: formData.submittedByPhone,
      clubName: club.name,
      zoneName: zone.name,
      submissionDate: new Date().toISOString(),
      referenceNumber,
      events: formData.events.map((event) => ({
        priority: event.priority,
        name: event.name,
        eventTypeName: event.eventTypeName || "Unknown Event Type",
        date:
          typeof event.date === "string" ?
            event.date :
            event.date.toISOString(),
        location: event.location,
        isQualifier: event.isQualifier,
        isHistoricallyTraditional: event.isHistoricallyTraditional,
        coordinatorName: event.coordinatorName,
        coordinatorContact: event.coordinatorContact,
        notes: event.notes,
      })),
      generalNotes: formData.generalNotes,
    };

    const pdfFilename = `event-request-${formData.submittedByEmail.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.pdf`;

    // Check email queue configuration
    const emailConfig = await getEmailQueueConfig();
    const shouldQueue = emailConfig.requireApproval;

    const emailResults = [];
    const queuedEmails = [];

    // Common email attachments
    const pdfAttachment = {
      filename: pdfFilename,
      content: pdfBuffer.toString("base64"),
      type: "application/pdf",
    };

    // For queue system - create proper EmailAttachment objects
    const createEmailAttachment = (
      filename: string,
      content: string,
      contentType: string,
    ): any => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      filename,
      contentType,
      size: Buffer.from(content, "base64").length,
      content,
      createdAt: new Date(),
    });

    // 1. Send email to requesting user
    logger.info("Preparing email for requesting user", {
      email: formData.submittedByEmail,
    });

    const requesterEmailData = {
      ...emailTemplateData,
      isForSuperUser: false,
    };

    const requesterEmail = {
      from: "noreply@ponyclub.com.au",
      to: [formData.submittedByEmail],
      subject: `Event Request Submitted - ${referenceNumber}`,
      html: generateEventRequestEmailHTML(requesterEmailData),
      text: generateEventRequestEmailText(requesterEmailData),
      attachments: [pdfAttachment],
    };

    if (shouldQueue) {
      logger.info("Queueing email for requesting user");
      const queuedEmailData: Omit<
        QueuedEmail,
        "id" | "createdAt" | "updatedAt"
      > = {
        to: requesterEmail.to,
        subject: requesterEmail.subject,
        htmlContent: requesterEmail.html,
        textContent: requesterEmail.text,
        attachments: [
          createEmailAttachment(
            pdfFilename,
            pdfBuffer.toString("base64"),
            "application/pdf",
          ),
        ],
        status: "pending" as const,
        type: "event_request" as const,
        metadata: {
          requesterId: formData.submittedByEmail,
          clubId: formData.clubId,
          referenceNumber,
        },
      };
      const emailId = await addEmailToQueue(queuedEmailData);
      logger.info("Email queued for requesting user", {emailId});
      queuedEmails.push("requester");
    } else if (resend) {
      try {
        logger.info("Sending immediate email to requesting user");
        const result = await resend.emails.send(requesterEmail);
        logger.info("Requester email sent successfully", {
          id: result.data?.id,
        });
        emailResults.push({
          type: "requester",
          success: true,
          id: result.data?.id,
        });
      } catch (error) {
        logger.error("Failed to send requester email", {error});
        emailResults.push({type: "requester", success: false, error});
      }
    }

    // 2. Send email to zone approvers
    for (const approverEmail of approverEmails) {
      logger.info("Preparing email for zone approver", {
        email: approverEmail,
      });

      const approverEmailData = {
        ...emailTemplateData,
        isForSuperUser: false,
      };

      const zoneApproverEmail = {
        from: "noreply@ponyclub.com.au",
        to: [approverEmail],
        subject: `Zone Approval Required - Event Request ${referenceNumber}`,
        html: generateEventRequestEmailHTML(approverEmailData),
        text: generateEventRequestEmailText(approverEmailData),
        attachments: [pdfAttachment],
      };

      if (shouldQueue) {
        logger.info("Queueing email for zone approver", {
          email: approverEmail,
        });
        const queuedEmailData = {
          to: zoneApproverEmail.to,
          subject: zoneApproverEmail.subject,
          htmlContent: zoneApproverEmail.html,
          textContent: zoneApproverEmail.text,
          attachments: [
            createEmailAttachment(
              pdfFilename,
              pdfBuffer.toString("base64"),
              "application/pdf",
            ),
          ],
          status: "pending" as const,
          type: "event_request" as const,
          metadata: {
            requesterId: formData.submittedByEmail,
            clubId: formData.clubId,
            referenceNumber,
            approverEmail,
          },
        };
        const emailId = await addEmailToQueue(queuedEmailData);
        logger.info("Zone approver email queued", {emailId, approverEmail});
        queuedEmails.push(`zone-approver-${approverEmail}`);
      } else if (resend) {
        try {
          logger.info("Sending immediate email to zone approver", {
            email: approverEmail,
          });
          const result = await resend.emails.send(zoneApproverEmail);
          logger.info("Zone approver email sent successfully", {
            id: result.data?.id,
            approverEmail,
          });
          emailResults.push({
            type: "zone-approver",
            success: true,
            id: result.data?.id,
            recipient: approverEmail,
          });
        } catch (error) {
          logger.error("Failed to send zone approver email", {
            error,
            approverEmail,
          });
          emailResults.push({
            type: "zone-approver",
            success: false,
            error,
            recipient: approverEmail,
          });
        }
      }
    }

    // 3. Send email with JSON export to super users
    for (const superUserEmail of superUserEmails) {
      logger.info("Preparing email for super user", {email: superUserEmail});

      const superUserEmailData = {
        ...emailTemplateData,
        isForSuperUser: true,
      };

      const superUserEmailMessage = {
        from: "noreply@ponyclub.com.au",
        to: [superUserEmail],
        subject: `Super User Notification - Event Request ${referenceNumber}`,
        html: generateEventRequestEmailHTML(superUserEmailData),
        text: generateEventRequestEmailText(superUserEmailData),
        attachments: [
          pdfAttachment,
          {
            filename: jsonAttachment.filename,
            content: Buffer.from(jsonAttachment.content).toString("base64"),
            type: jsonAttachment.mimeType,
          },
        ],
      };

      if (shouldQueue) {
        logger.info("Queueing email for super user", {email: superUserEmail});
        const queuedEmailData = {
          to: superUserEmailMessage.to,
          subject: superUserEmailMessage.subject,
          htmlContent: superUserEmailMessage.html,
          textContent: superUserEmailMessage.text,
          attachments: [
            createEmailAttachment(
              pdfFilename,
              pdfBuffer.toString("base64"),
              "application/pdf",
            ),
            createEmailAttachment(
              jsonAttachment.filename,
              Buffer.from(jsonAttachment.content).toString("base64"),
              jsonAttachment.mimeType,
            ),
          ],
          status: "pending" as const,
          type: "event_request" as const,
          metadata: {
            requesterId: formData.submittedByEmail,
            clubId: formData.clubId,
            referenceNumber,
            superUserEmail,
            hasJsonExport: true,
          },
        };
        const emailId = await addEmailToQueue(queuedEmailData);
        logger.info("Super user email queued", {emailId, superUserEmail});
        queuedEmails.push(`super-user-${superUserEmail}`);
      } else if (resend) {
        try {
          logger.info("Sending immediate email to super user", {
            email: superUserEmail,
          });
          const result = await resend.emails.send(superUserEmailMessage);
          logger.info("Super user email sent successfully", {
            id: result.data?.id,
            superUserEmail,
          });
          emailResults.push({
            type: "super-user",
            success: true,
            id: result.data?.id,
            recipient: superUserEmail,
          });
        } catch (error) {
          logger.error("Failed to send super user email", {
            error,
            superUserEmail,
          });
          emailResults.push({
            type: "super-user",
            success: false,
            error,
            recipient: superUserEmail,
          });
        }
      }
    }

    // Prepare response
    const response = {
      success: true,
      message: "Event request notifications processed successfully",
      referenceNumber,
      queuedForReview: shouldQueue,
      recipients: {
        requester: formData.submittedByEmail,
        zoneApprovers: approverEmails,
        superUsers: superUserEmails,
      },
      ...(shouldQueue ?
        {queuedEmails: queuedEmails.length} :
        {
          emailResults,
          successfulSends: emailResults.filter((r) => r.success).length,
          failedSends: emailResults.filter((r) => !r.success).length,
        }),
    };

    logger.info("Email processing completed", {
      referenceNumber,
      shouldQueue,
      totalEmails: shouldQueue ? queuedEmails.length : emailResults.length,
    });

    return res.json(response);
  } catch (error) {
    logger.error("Email sending error", {
      error: error instanceof Error ? error.message : error,
    });
    return res.status(500).json({
      error: "Failed to send email notifications",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
