import jsPDF from "jspdf";

export interface CalendarPDFOptions {
  title?: string;
  months: Array<{ year: number; month: number }>;
  events: Array<{
    name: string;
    date: string;
    status: string;
    club?: string;
    eventType?: string;
    location?: string;
    contact?: string;
    coordinator?: string;
  }>;
}

function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1] || "Unknown";
}

export function generateCalendarPDF(options: CalendarPDFOptions): Buffer {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Generate a page for each month
    let isFirstPage = true;

    for (const {year, month} of options.months) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue color
      const title = options.title || "PonyClub Events Calendar";
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, margin + 10);

      // Month/Year subtitle
      doc.setFontSize(16);
      doc.setTextColor(75, 85, 99); // Dark gray
      const monthYearText = `${getMonthName(month)} ${year}`;
      const monthYearWidth = doc.getTextWidth(monthYearText);
      doc.text(monthYearText, (pageWidth - monthYearWidth) / 2, margin + 25);

      // Calendar grid
      let currentY = margin + 40;
      const cellWidth = contentWidth / 7;
      const cellHeight = 15;

      // Day headers
      const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");

      for (let i = 0; i < 7; i++) {
        const x = margin + i * cellWidth;
        doc.rect(x, currentY, cellWidth, cellHeight);
        doc.text(dayHeaders[i], x + cellWidth / 2, currentY + 10, {
          align: "center",
        });
      }

      currentY += cellHeight;

      // Calendar days
      doc.setFont("helvetica", "normal");
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const startDayOfWeek = firstDay.getDay();
      const daysInMonth = lastDay.getDate();

      let day = 1;
      let row = 0;

      while (day <= daysInMonth) {
        for (let col = 0; col < 7; col++) {
          const x = margin + col * cellWidth;
          const y = currentY + row * cellHeight;

          // Skip empty cells at the beginning
          if (row === 0 && col < startDayOfWeek) {
            doc.rect(x, y, cellWidth, cellHeight);
            continue;
          }

          if (day > daysInMonth) {
            doc.rect(x, y, cellWidth, cellHeight);
            continue;
          }

          // Check if this day has events
          const dayDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
          const dayEvents = options.events.filter(
            (event) => event.date === dayDate,
          );

          // Highlight weekend days with light gray background
          if (col === 0 || col === 6) {
            doc.setFillColor(245, 245, 245);
            doc.rect(x, y, cellWidth, cellHeight, "F");
          }

          // Highlight days with events
          if (dayEvents.length > 0) {
            doc.setFillColor(147, 197, 253); // Light blue for event days
            doc.rect(x, y, cellWidth, cellHeight, "F");
          }

          // Draw cell border
          doc.rect(x, y, cellWidth, cellHeight);

          // Day number
          doc.setTextColor(0, 0, 0);
          doc.text(day.toString(), x + 2, y + 8);

          // Event indicator
          if (dayEvents.length > 0) {
            doc.setFontSize(6);
            doc.setTextColor(59, 130, 246);
            doc.text(
              `${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}`,
              x + 2,
              y + 12,
            );
            doc.setFontSize(10);
          }

          day++;
        }
        row++;
      }

      // Event list for this month
      const monthEvents = options.events.filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month
        );
      });

      if (monthEvents.length > 0) {
        const eventListY = currentY + (row + 1) * cellHeight + 10;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Events this month:", margin, eventListY);

        doc.setFontSize(10);
        let listY = eventListY + 10;
        for (const event of monthEvents) {
          const eventDate = new Date(event.date);
          const dateStr = eventDate.getDate().toString().padStart(2, "0");
          doc.text(`${dateStr}: ${event.name}`, margin + 5, listY);
          listY += 6;

          if (listY > pageHeight - margin - 20) break; // Prevent overflow
        }
      }
    }

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);

      const footer = `Generated on ${new Date().toLocaleDateString()} | PonyClub Event Manager | Page ${i} of ${totalPages}`;
      const footerWidth = doc.getTextWidth(footer);
      doc.text(footer, (pageWidth - footerWidth) / 2, pageHeight - 10);
    }

    // Return the PDF as a Buffer
    const pdfOutput = doc.output("arraybuffer");
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error("jsPDF generation error:", error);

    // Return a simple error PDF
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("PDF Generation Error", 20, 30);
    doc.setFontSize(12);
    doc.text("Unable to generate calendar PDF at this time.", 20, 50);
    doc.text("Please try again later or contact support.", 20, 65);

    const pdfOutput = doc.output("arraybuffer");
    return Buffer.from(pdfOutput);
  }
}
