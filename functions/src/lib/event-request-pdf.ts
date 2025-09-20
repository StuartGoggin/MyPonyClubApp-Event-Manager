import jsPDF from "jspdf";
import {PDFDocument} from "pdf-lib";
import fs from "fs";
import path from "path";

export interface EventRequestFormData {
  // Organizer Information
  submittedBy: string;
  submittedByEmail: string;
  submittedByPhone: string;
  clubId: string;
  clubName?: string;

  // General Information
  generalNotes?: string;

  // Event Details
  events: Array<{
    name: string;
    date: Date | string;
    priority: number;
    eventTypeId: string;
    eventTypeName?: string;
    location: string;
    isQualifier: boolean;
    isHistoricallyTraditional: boolean;
    description?: string;
    coordinatorName: string;
    coordinatorContact: string;
    notes?: string;
  }>;
}

export interface EventRequestPDFOptions {
  formData: EventRequestFormData;
  title?: string;
  submissionDate?: Date;
  referenceNumber?: string;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateEventRequestPDF(
  options: EventRequestPDFOptions,
): Promise<Buffer> {
  try {
    const {formData} = options;

    // Load the original Process.pdf file
    const processPdfPath = path.join(process.cwd(), "docs", "Process.pdf");
    const processPdfBytes = fs.readFileSync(processPdfPath);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Load the original Process.pdf
    const originalPdf = await PDFDocument.load(processPdfBytes);

    // Copy the first page (policy page) from the original PDF
    const [firstPage] = await pdfDoc.copyPages(originalPdf, [0]);
    pdfDoc.addPage(firstPage);

    // Now create the form page using jsPDF and then merge it
    const formPdf = generateFormPage(formData);
    const formPdfDoc = await PDFDocument.load(formPdf);
    const [formPage] = await pdfDoc.copyPages(formPdfDoc, [0]);
    pdfDoc.addPage(formPage);

    // Serialize the final PDF
    const finalPdfBytes = await pdfDoc.save();
    return Buffer.from(finalPdfBytes);
  } catch (error) {
    console.error("Event Request PDF generation error:", error);

    // Fallback to original generation method if file loading fails
    return generateFallbackPDF(options);
  }
}

function generateFormPage(formData: EventRequestFormData): Buffer {
  try {
    // Create a new jsPDF instance for just the form page
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Event Calendar section (start directly with form content)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Event Calendar", margin, yPosition);
    yPosition += 8; // Reduced from 10

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Intro text
    const line1 =
      "The SMZ creates a calendar of events for the next calendar year according to the policy and procedures.";
    const line2 =
      "Please submit your events for the following calendar year prior to the August Zone meeting/AGM.";
    const line3 =
      "Events submitted via the MyPonyClub - Event Manager, Request Event will be submitted directly to the";
    const line4 = "smzsecretary@gmail.com. The form is for your records.";

    doc.text(line1, margin, yPosition);
    yPosition += 3.5; // Reduced from 4
    doc.text(line2, margin, yPosition);
    yPosition += 3.5; // Reduced from 4
    doc.text(line3, margin, yPosition);
    yPosition += 3.5; // Reduced from 4

    // Email line with highlighting
    doc.setTextColor(255, 0, 0);
    doc.text(line4, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 5; // Reduced from 6

    // Determine the year from events (use first event"s year, or current year + 1 if no events)
    let targetYear = new Date().getFullYear() + 1; // Default to next year
    if (formData.events && formData.events.length > 0) {
      const firstEventDate = new Date(formData.events[0].date);
      if (!isNaN(firstEventDate.getTime())) {
        targetYear = firstEventDate.getFullYear();
      }
    }

    // Date range title - centered and larger
    const titleText = `Events requested between 1st January to 31st December ${targetYear}`;
    doc.setTextColor(255, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    // Center the text
    const textWidth = doc.getTextWidth(titleText);
    const centerX = (pageWidth - textWidth) / 2;
    doc.text(titleText, centerX, yPosition);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPosition += 12; // Reduced from 15

    // Form fields

    // Club Name field
    doc.setFont("helvetica", "bold");
    doc.text("Club Name:", margin, yPosition);
    doc.setFont("helvetica", "normal");

    // Draw underline for club name
    const clubNameStart = margin + 25;
    const clubNameEnd = margin + 80;
    doc.line(clubNameStart, yPosition + 1, clubNameEnd, yPosition + 1);
    if (formData.clubName) {
      doc.text(formData.clubName, clubNameStart + 2, yPosition - 1);
    }

    // Club Event Co-ordinator field (on same line)
    const coordinatorLabelStart = margin + 90;
    doc.setFont("helvetica", "bold");
    doc.text("Club Event Co coordinator", coordinatorLabelStart, yPosition);
    doc.setFont("helvetica", "normal");

    const coordinatorFieldStart = coordinatorLabelStart + 45;
    const coordinatorFieldEnd = pageWidth - margin;
    doc.line(
      coordinatorFieldStart,
      yPosition + 1,
      coordinatorFieldEnd,
      yPosition + 1,
    );
    if (formData.submittedBy) {
      doc.text(formData.submittedBy, coordinatorFieldStart + 2, yPosition - 1);
    }
    yPosition += 12;

    // Contact field
    doc.setFont("helvetica", "bold");
    doc.text("and Contact no:", margin, yPosition);
    doc.setFont("helvetica", "normal");

    const contactStart = margin + 30;
    const contactEnd = margin + 75;
    doc.line(contactStart, yPosition + 1, contactEnd, yPosition + 1);
    if (formData.submittedByPhone) {
      doc.text(formData.submittedByPhone, contactStart + 2, yPosition - 1);
    }

    // Preference instruction (on same line)
    doc.setFont("helvetica", "bold");
    doc.text("**Place events in order of preference", margin + 85, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 15;

    // Table header with improved styling
    const colWidths = [22, 85, 32, 35]; // Adjusted widths for better proportions
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const tableX = margin;

    // Header row with enhanced styling
    doc.setFillColor(70, 130, 180); // Steel blue background
    doc.rect(tableX, yPosition, tableWidth, 14, "F"); // Increased height
    doc.setLineWidth(0.8);
    doc.setDrawColor(0, 0, 0);
    doc.rect(tableX, yPosition, tableWidth, 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10); // Increased font size
    doc.setTextColor(255, 255, 255); // White text

    let currentX = tableX;

    // Preference column
    doc.rect(currentX, yPosition, colWidths[0], 14);
    doc.text("Preference", currentX + colWidths[0] / 2, yPosition + 9, {
      align: "center",
    });
    currentX += colWidths[0];

    // Type of Event column
    doc.rect(currentX, yPosition, colWidths[1], 14);
    doc.text("Type of Event", currentX + colWidths[1] / 2, yPosition + 9, {
      align: "center",
    });
    currentX += colWidths[1];

    // Qualifier column
    doc.rect(currentX, yPosition, colWidths[2], 14);
    doc.setFontSize(9);
    doc.text("Will this be a", currentX + colWidths[2] / 2, yPosition + 6, {
      align: "center",
    });
    doc.text("SMZ Qualifier", currentX + colWidths[2] / 2, yPosition + 11, {
      align: "center",
    });
    doc.setFontSize(10);
    currentX += colWidths[2];

    // Event Date column
    doc.rect(currentX, yPosition, colWidths[3], 14);
    doc.text("Event Date", currentX + colWidths[3] / 2, yPosition + 9, {
      align: "center",
    });

    yPosition += 14;
    doc.setTextColor(0, 0, 0); // Reset to black

    // Data rows with enhanced formatting
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10); // Increased font size
    const maxEvents = 4;

    for (let i = 0; i < maxEvents; i++) {
      const event = formData.events[i];
      const rowHeight = 20; // Increased for better readability

      // Row background (alternating with better colors)
      if (i % 2 === 1) {
        doc.setFillColor(248, 248, 255); // Very light blue
        doc.rect(tableX, yPosition, tableWidth, rowHeight, "F");
      }

      // Draw all cell borders
      currentX = tableX;
      for (let j = 0; j < colWidths.length; j++) {
        doc.rect(currentX, yPosition, colWidths[j], rowHeight);
        currentX += colWidths[j];
      }

      currentX = tableX;

      // Preference column - centered
      if (event) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11); // Slightly larger for emphasis
        doc.text(
          `${event.priority}${getOrdinalSuffix(event.priority)}`,
          currentX + colWidths[0] / 2,
          yPosition + 13,
          {align: "center"},
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(
          `${i + 1}${getOrdinalSuffix(i + 1)}`,
          currentX + colWidths[0] / 2,
          yPosition + 13,
          {align: "center"},
        );
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      currentX += colWidths[0];

      // Type of Event column - left aligned with padding
      if (event) {
        const eventName = event.name || "";
        const eventType = event.eventTypeName || "";

        // Better text wrapping and positioning
        const maxWidth = colWidths[1] - 6; // More padding
        const eventNameLines = doc.splitTextToSize(eventName, maxWidth);
        const displayLines = eventNameLines.slice(0, 2); // Max 2 lines

        displayLines.forEach((line: string, index: number) => {
          doc.text(line, currentX + 3, yPosition + 8 + index * 5); // Better line spacing
        });

        if (eventType && eventType !== eventName && displayLines.length === 1) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100); // Gray color for event type
          doc.text(eventType, currentX + 3, yPosition + 15);
          doc.setTextColor(0, 0, 0); // Reset to black
          doc.setFontSize(10);
        }
      }
      currentX += colWidths[1];

      // Qualifier column - centered with better styling
      if (event) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        const qualifierText = event.isQualifier ? "YES" : "NO";
        if (event.isQualifier) {
          doc.setTextColor(0, 150, 0); // Green for YES
        } else {
          doc.setTextColor(200, 0, 0); // Red for NO
        }
        doc.text(qualifierText, currentX + colWidths[2] / 2, yPosition + 13, {
          align: "center",
        });
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      currentX += colWidths[2];

      // Event Date column - centered
      if (event) {
        const dateStr = formatDate(event.date);
        doc.setFontSize(9); // Slightly smaller for dates
        // Better date wrapping
        const dateLines = doc.splitTextToSize(dateStr, colWidths[3] - 4);
        dateLines.slice(0, 2).forEach((line: string, index: number) => {
          doc.text(
            line,
            currentX + colWidths[3] / 2,
            yPosition + 9 + index * 4,
            {align: "center"},
          );
        });
        doc.setFontSize(10);
      }

      yPosition += rowHeight;
    }

    yPosition += 6; // Reduced from 10

    // Additional instructions with better spacing
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const instructionItems = [
      "• Include all training, open days, camps and other events you will be providing during the year.",
      "• If you decide to change, cancel or alter your events, advise the SMZ secretary in writing as soon as possible for zone approval.",
      "• Event schedules must be received by the Zone Rep for approval at least 3 months prior to holding your event.",
    ];

    instructionItems.forEach((item, itemIndex) => {
      // Use splitTextToSize to handle wrapping properly
      const wrappedLines = doc.splitTextToSize(item, contentWidth - 12);

      wrappedLines.forEach((wrappedLine: string, lineIndex: number) => {
        if (lineIndex === 0) {
          // First line with bullet
          doc.setFont("helvetica", "bold");
          doc.text("•", margin + 2, yPosition);
          doc.setFont("helvetica", "normal");
          doc.text(wrappedLine.substring(1), margin + 8, yPosition);
        } else {
          // Subsequent lines indented
          doc.text(wrappedLine, margin + 8, yPosition);
        }
        yPosition += 3; // More compact line spacing - reduced from 3.5
      });

      // Minimal space between items
      if (itemIndex < instructionItems.length - 1) {
        yPosition += 0.5; // Very minimal - reduced from 1
      } else {
        yPosition += 3; // Reduced from 4
      }
    });

    yPosition += 4; // Reduced spacing

    // Notes section with guaranteed space - always ensure it appears
    doc.setFont("helvetica", "bold");
    doc.text("Any other notes please add below:", margin, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 3; // Reduced from 4

    // Calculate available space more conservatively
    const fixedFooterHeight = 20; // Space reserved for club footer at bottom
    const whoFilledSectionHeight = 15; // Space needed for "Who filled in" section
    const availableSpaceForNotes =
      pageHeight - yPosition - fixedFooterHeight - whoFilledSectionHeight;
    const notesHeight = Math.max(15, Math.min(35, availableSpaceForNotes)); // Reduced max and min further

    // Create notes area
    doc.rect(margin, yPosition, contentWidth, notesHeight);

    // Add the actual notes content if it exists
    if (formData.generalNotes) {
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(
        formData.generalNotes,
        contentWidth - 4,
      );
      const lineHeight = 3.5;
      const maxLines = Math.floor((notesHeight - 4) / lineHeight);

      noteLines.slice(0, maxLines).forEach((line: string, index: number) => {
        doc.text(line, margin + 2, yPosition + 4 + index * lineHeight);
      });
      doc.setFontSize(10);
    }

    yPosition += notesHeight + 6; // Increased spacing after notes

    // "Who filled in this form" section - completely separate from notes with better positioning
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Who filled in this form", margin, yPosition);
    // Position "contact number" with more space
    doc.text("contact number", pageWidth - margin - 60, yPosition);
    doc.setFont("helvetica", "normal");
    yPosition += 7; // Increased for better spacing

    // Lines for signatures with better positioning and more space
    const leftLineEnd = margin + 100; // Longer line for name
    doc.line(margin, yPosition, leftLineEnd, yPosition);
    if (formData.submittedBy) {
      doc.text(formData.submittedBy, margin + 2, yPosition - 2);
    }

    // Right side line for contact number with more space
    const rightLineStart = pageWidth - margin - 70;
    const rightLineEnd = pageWidth - margin - 10;
    doc.line(rightLineStart, yPosition, rightLineEnd, yPosition);
    if (formData.submittedByPhone) {
      doc.text(formData.submittedByPhone, rightLineStart + 2, yPosition - 2);
    }
    yPosition += 8; // More space before footer

    // Club footer - always position at the bottom of the page
    doc.setFontSize(7);
    doc.setTextColor(255, 0, 0);
    const clubsText1 =
      "CLUBS: BALNARRING – CHELSEA – DANDENONG RANGES – DOONGALA – HASTINGS – LANGWARRIN – MACCLESFIELD – MAIN RIDGE – MENTONE –";
    const clubsText2 =
      "MERRICKS – MONASH – MONBULK – MORNINGTON PENINSULA – MOUNTAIN DISTRICT – PEARCEDALE";

    // Position at absolute bottom of page
    const footerY1 = pageHeight - 15; // 15mm from bottom
    const footerY2 = pageHeight - 10; // 10mm from bottom

    // Center the text at the bottom
    doc.text(clubsText1, pageWidth / 2, footerY1, {align: "center"});
    doc.text(clubsText2, pageWidth / 2, footerY2, {align: "center"});
    doc.setTextColor(0, 0, 0); // Reset text color

    // Generate PDF buffer
    const pdfOutput = doc.output("arraybuffer");
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error("Form page generation error:", error);

    // Create error PDF
    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("PDF Generation Error", 105, 50, {align: "center"});

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Unable to generate event request PDF at this time.", 105, 70, {
      align: "center",
    });
    doc.text("Please contact support if this issue persists.", 105, 85, {
      align: "center",
    });

    const errorOutput = doc.output("arraybuffer");
    return Buffer.from(errorOutput);
  }
}

function generateFallbackPDF(options: EventRequestPDFOptions): Buffer {
  try {
    // Simple fallback PDF if original PDF loading fails
    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("Event Request Form", 105, 50, {align: "center"});

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.text("Unable to load original policy document.", 105, 70, {
      align: "center",
    });
    doc.text("Please contact support for assistance.", 105, 85, {
      align: "center",
    });

    const pdfOutput = doc.output("arraybuffer");
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error("Fallback PDF generation error:", error);
    const doc = new jsPDF();
    doc.text("PDF Error", 20, 20);
    const pdfOutput = doc.output("arraybuffer");
    return Buffer.from(pdfOutput);
  }
}

function getOrdinalSuffix(num: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = num % 100;
  return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
}

// Helper function to generate a reference number
export function generateReferenceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `EVT-${year}${month}${day}-${random}`;
}
