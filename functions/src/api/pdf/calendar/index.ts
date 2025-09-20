import {Request, Response} from "express";
import {logger} from "firebase-functions/v2";
import {generateCalendarPDF} from "../../../lib/calendar-pdf";
import {
  getAllEvents,
  getAllClubs,
  getAllEventTypes,
  getAllZones,
} from "../../../lib/server-data";

/**
 * Generate Calendar PDF
 * GET /api/pdf/calendar
 * Generates a professional PDF calendar with filtering and customization options
 */
export async function generateCalendarPdfHandler(req: Request, res: Response) {
  try {
    logger.info("Calendar PDF generation started", {
      query: req.query,
      userAgent: req.get("User-Agent"),
    });

    const {
      scope = "month",
      year = new Date().getFullYear().toString(),
      month = (new Date().getMonth() + 1).toString(),
      startDate,
      endDate,
      filterScope = "all",
      zoneId,
      clubId,
    } = req.query;

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    logger.info("Calendar PDF: Request parameters", {
      scope,
      year: yearNum,
      month: monthNum,
      startDate,
      endDate,
      filterScope,
      zoneId,
      clubId,
    });

    // Fetch all required data
    const [events, clubs, eventTypes, zones] = await Promise.all([
      getAllEvents(),
      getAllClubs(),
      getAllEventTypes(),
      getAllZones(),
    ]);

    logger.info("Calendar PDF: Data loaded", {
      eventsCount: events.length,
      clubsCount: clubs.length,
      eventTypesCount: eventTypes.length,
      zonesCount: zones.length,
    });

    // Filter events for the requested date range
    let filteredEvents = events;

    if (scope === "month") {
      // Filter events for the specific month
      filteredEvents = events.filter((event: any) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getFullYear() === yearNum &&
          eventDate.getMonth() + 1 === monthNum
        );
      });
    } else if (scope === "year") {
      // Filter events for the specific year
      filteredEvents = events.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === yearNum;
      });
    } else if (scope === "custom" && startDate && endDate) {
      // Filter events for custom date range
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filteredEvents = events.filter((event: any) => {
        const eventDate = new Date(event.date);
        return eventDate >= start && eventDate <= end;
      });
    }

    // Apply scope filtering (all events, zone events, or club events)
    if (filterScope === "zone" && zoneId) {
      // Filter events for specific zone
      const zoneClubs = clubs.filter((club: any) => club.zoneId === zoneId);
      const zoneClubIds = zoneClubs.map((club: any) => club.id);
      filteredEvents = filteredEvents.filter(
        (event: any) => event.clubId && zoneClubIds.includes(event.clubId),
      );
    } else if (filterScope === "club" && clubId) {
      // Filter events for specific club
      filteredEvents = filteredEvents.filter(
        (event: any) => event.clubId === clubId,
      );
    }
    // If filterScope === "all", no additional filtering needed

    logger.info("Calendar PDF: Events filtered", {
      originalCount: events.length,
      filteredCount: filteredEvents.length,
      scope,
      filterScope,
    });

    // Enhance events with additional information
    const enhancedEvents = filteredEvents.map((event: any) => {
      const club = clubs.find((c: any) => c.id === event.clubId);
      const eventType = eventTypes.find(
        (et: any) => et.id === event.eventTypeId,
      );

      return {
        name: event.name || eventType?.name || "Event",
        date: event.date.toISOString().split("T")[0], // Convert Date to YYYY-MM-DD string
        status: event.status || "pending",
        club: club?.name,
        eventType: eventType?.name,
        location:
          event.location || club?.physicalAddress || club?.postalAddress,
        contact: event.coordinatorContact || club?.email || club?.phone,
        coordinator: event.coordinatorName,
      };
    });

    // Prepare months array for PDF utility
    const months = [];
    if (scope === "month") {
      months.push({year: yearNum, month: monthNum});
    } else if (scope === "year") {
      for (let m = 1; m <= 12; m++) months.push({year: yearNum, month: m});
    } else if (scope === "custom" && startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      let y = start.getFullYear();
      let m = start.getMonth() + 1;
      const endY = end.getFullYear();
      const endM = end.getMonth() + 1;
      while (y < endY || (y === endY && m <= endM)) {
        months.push({year: y, month: m});
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
    }

    // Generate dynamic title based on filter scope
    let calendarTitle = "PonyClub Events Calendar";
    if (filterScope === "zone" && zoneId) {
      const zone = zones.find((z: any) => z.id === zoneId);
      if (zone) {
        calendarTitle = `${zone.name} Zone Events Calendar`;
      }
    } else if (filterScope === "club" && clubId) {
      const club = clubs.find((c: any) => c.id === clubId);
      if (club) {
        calendarTitle = `${club.name} Events Calendar`;
      }
    }

    logger.info("Calendar PDF: Starting PDF generation", {
      title: calendarTitle,
      monthsCount: months.length,
      eventsCount: enhancedEvents.length,
    });

    // Generate PDF
    const pdfBuffer = generateCalendarPDF({
      months,
      events: enhancedEvents,
      title: calendarTitle,
    });

    const filename =
      scope === "month" ?
        `calendar_month_${yearNum}_${monthNum.toString().padStart(2, "0")}.pdf` :
        scope === "year" ?
          `calendar_year_${yearNum}.pdf` :
          `calendar_custom_${startDate}_to_${endDate}.pdf`;

    logger.info("Calendar PDF: Generation successful", {
      filename,
      bufferSize: pdfBuffer.length,
    });

    // Return PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length.toString());
    res.setHeader("Cache-Control", "no-cache");

    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Calendar PDF generation error", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      error: "PDF generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Health check for Calendar PDF API
 * POST /api/pdf/calendar (for complex filtering options)
 * Alternative endpoint for calendar PDF generation with body parameters
 */
export async function postCalendarPdfHandler(req: Request, res: Response) {
  try {
    logger.info("Calendar PDF POST generation started", {body: req.body});

    // Extract parameters from body instead of query
    const {
      scope = "month",
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1,
      startDate,
      endDate,
      filterScope = "all",
      zoneId,
      clubId,
    } = req.body;

    // Create query object and delegate to GET handler
    req.query = {
      scope: scope.toString(),
      year: year.toString(),
      month: month.toString(),
      startDate,
      endDate,
      filterScope,
      zoneId,
      clubId,
    };

    // Delegate to GET handler
    return generateCalendarPdfHandler(req, res);
  } catch (error) {
    logger.error("Calendar PDF POST generation error", {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      error: "PDF generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * API information for Calendar PDF endpoint
 * GET /api/pdf/calendar (without parameters for info)
 */
export async function getCalendarPdfInfo(req: Request, res: Response) {
  try {
    // If no query parameters, return API info
    if (Object.keys(req.query).length === 0) {
      logger.info("Calendar PDF: API info requested");

      res.json({
        message: "Calendar PDF API is operational",
        endpoint: "/api/pdf/calendar",
        methods: ["GET", "POST"],
        description:
          "Generate professional PDF calendar with filtering and customization options",
        version: "1.0.0",
        parameters: {
          scope: "Calendar scope: month, year, or custom (default: month)",
          year: "Year for calendar generation (default: current year)",
          month: "Month for calendar generation (default: current month)",
          startDate: "Start date for custom scope (YYYY-MM-DD)",
          endDate: "End date for custom scope (YYYY-MM-DD)",
          filterScope: "Filter scope: all, zone, or club (default: all)",
          zoneId: "Zone ID for zone filtering",
          clubId: "Club ID for club filtering",
        },
        features: [
          "Month, year, and custom date range support",
          "Zone and club filtering",
          "Professional PDF layout with jsPDF",
          "Event highlighting and listing",
          "Dynamic title generation",
          "Comprehensive error handling and logging",
        ],
      });
      return;
    }

    // If query parameters exist, generate PDF
    return generateCalendarPdfHandler(req, res);
  } catch (error) {
    logger.error("Calendar PDF info error", {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      error: "Failed to get API info",
    });
  }
}
