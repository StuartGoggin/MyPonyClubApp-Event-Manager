import { Request, Response } from "express";
import { logger } from "firebase-functions/v2";
import {
  generateEventRequestPDF,
  generateReferenceNumber,
  type EventRequestFormData,
} from "../../../lib/event-request-pdf";
import { getAllClubs, getAllEventTypes } from "../../../lib/server-data";

/**
 * Generate Event Request PDF
 * POST /api/pdf/event-request
 * Generates a professional PDF document from event request form submission data
 */
export async function generateEventRequestPdfHandler(
  req: Request,
  res: Response,
) {
  try {
    logger.info("Event Request PDF generation started", {
      userAgent: req.get("User-Agent"),
    });

    const formData: EventRequestFormData = req.body;

    // Validate required fields
    if (
      !formData.submittedBy ||
      !formData.events ||
      formData.events.length === 0
    ) {
      logger.warn("Event Request PDF: Missing required form data", {
        hasSubmittedBy: !!formData.submittedBy,
        eventsCount: formData.events?.length || 0,
      });

      res.status(400).json({
        error: "Missing required form data",
      });
      return;
    }

    // Enrich the form data with additional information
    let clubs: any[] = [];
    let eventTypes: any[] = [];

    try {
      [clubs, eventTypes] = await Promise.all([
        getAllClubs(),
        getAllEventTypes(),
      ]);

      logger.info("Event Request PDF: Data enrichment successful", {
        clubsCount: clubs.length,
        eventTypesCount: eventTypes.length,
      });
    } catch (error) {
      logger.warn("Event Request PDF: Failed to load clubs or event types", {
        error: error instanceof Error ? error.message : error,
      });
      // Continue without enrichment - PDF will use provided data only
    }

    // Enrich club information
    const club = clubs.find((c) => c.id === formData.clubId);
    if (club) {
      formData.clubName = club.name;
      logger.info("Event Request PDF: Club data enriched", {
        clubId: formData.clubId,
        clubName: club.name,
      });
    }

    // Enrich event type information for each event
    formData.events = formData.events.map((event) => {
      const eventType = eventTypes.find((et) => et.id === event.eventTypeId);
      return {
        ...event,
        eventTypeName: eventType?.name || "Unknown Event Type",
      };
    });

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    logger.info("Event Request PDF: Starting PDF generation", {
      referenceNumber,
      eventsCount: formData.events.length,
    });

    // Generate PDF (async)
    const pdfBuffer = await generateEventRequestPDF({
      formData,
      title: "Pony Club Event Request Form",
      submissionDate: new Date(),
      referenceNumber,
    });

    // Create filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `Event-Request-${timestamp}.pdf`;

    logger.info("Event Request PDF: Generation successful", {
      filename,
      bufferSize: pdfBuffer.length,
      referenceNumber,
    });

    // Return PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Reference-Number", referenceNumber);

    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    logger.error("Event Request PDF generation error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      error: "Failed to generate PDF",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Health check for Event Request PDF API
 * GET /api/pdf/event-request
 * Returns API status and endpoint information
 */
export async function getEventRequestPdfInfo(req: Request, res: Response) {
  try {
    logger.info("Event Request PDF: Health check requested");

    res.json({
      message: "Event Request PDF API is operational",
      endpoint: "/api/pdf/event-request",
      method: "POST",
      description: "Generate PDF document from event request form data",
      version: "1.0.0",
      features: [
        "Professional PDF generation with jsPDF and pdf-lib",
        "Reference number generation",
        "Data enrichment with club and event type information",
        "Process.pdf policy page integration",
        "Comprehensive error handling and logging",
      ],
    });
  } catch (error) {
    logger.error("Event Request PDF info error", {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      error: "Failed to get API info",
    });
  }
}
