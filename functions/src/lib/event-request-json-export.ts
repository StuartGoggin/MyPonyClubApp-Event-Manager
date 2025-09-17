import {
  getClubById,
  getEventTypeById,
  getZoneByClubId,
} from "./data-functions";

// Define the API request type to match what"s used in the email API
interface EventRequestFormData {
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
}

export interface EventRequestExport {
  metadata: {
    exportedAt: string;
    referenceNumber: string;
    exportVersion: string;
  };
  submissionDetails: {
    submittedBy: string;
    submittedByEmail: string;
    submittedByPhone: string;
    submissionDate: string;
    clubId: string;
    clubName: string;
    zoneName: string;
  };
  events: Array<{
    priority: number;
    name: string;
    eventTypeId: string;
    eventTypeName: string;
    date: string;
    location: string;
    isQualifier: boolean;
    isHistoricallyTraditional: boolean;
    description?: string;
    coordinatorName?: string;
    coordinatorContact?: string;
    notes?: string;
  }>;
  generalNotes?: string;
  attachments: {
    pdfGenerated: boolean;
    pdfFilename?: string;
  };
}

export async function exportEventRequestAsJSON(
  formData: EventRequestFormData,
  referenceNumber?: string,
): Promise<EventRequestExport> {
  try {
    // Get additional data from database
    const club = await getClubById(formData.clubId);
    const zone = club ? await getZoneByClubId(formData.clubId) : null;

    // Prepare events with full type information
    const eventsWithDetails = await Promise.all(
      formData.events.map(async (event) => {
        const eventType = await getEventTypeById(event.eventTypeId);

        // Ensure date is converted to string consistently
        const dateString =
          typeof event.date === "string"
            ? event.date
            : event.date.toISOString();

        return {
          priority: event.priority,
          name: event.name,
          eventTypeId: event.eventTypeId,
          eventTypeName: eventType?.name || "Unknown Event Type",
          date: dateString,
          location: event.location,
          isQualifier: event.isQualifier,
          isHistoricallyTraditional: event.isHistoricallyTraditional,
          description: event.description,
          coordinatorName: event.coordinatorName,
          coordinatorContact: event.coordinatorContact,
          notes: event.notes,
        };
      }),
    );

    const exportData: EventRequestExport = {
      metadata: {
        exportedAt: new Date().toISOString(),
        referenceNumber: referenceNumber || `ER-${Date.now()}`,
        exportVersion: "1.0.0",
      },
      submissionDetails: {
        submittedBy: formData.submittedBy,
        submittedByEmail: formData.submittedByEmail,
        submittedByPhone: formData.submittedByPhone,
        submissionDate: new Date().toISOString(),
        clubId: formData.clubId,
        clubName: club?.name || "Unknown Club",
        zoneName: zone?.name || "Unknown Zone",
      },
      events: eventsWithDetails,
      generalNotes: formData.generalNotes,
      attachments: {
        pdfGenerated: true,
        pdfFilename: `event-request-${formData.submittedByEmail.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.pdf`,
      },
    };

    return exportData;
  } catch (error) {
    console.error("Error exporting event request as JSON:", error);
    throw new Error("Failed to export event request data");
  }
}

export function createJSONAttachment(exportData: EventRequestExport): {
  filename: string;
  content: string;
  mimeType: string;
} {
  const filename = `event-request-${exportData.submissionDetails.submittedByEmail.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.json`;

  return {
    filename,
    content: JSON.stringify(exportData, null, 2),
    mimeType: "application/json",
  };
}
