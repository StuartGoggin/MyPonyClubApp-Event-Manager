import jsPDF from 'jspdf';

export interface CalendarPDFOptions {
  title?: string;
  months: Array<{ year: number; month: number }>;
  events: Array<{
    name: string;
    date: string;
    status: string;
  }>;
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

export function generateCalendarPDF(options: CalendarPDFOptions): Buffer {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Generate a page for each month
    let isFirstPage = true;
    
    for (const { year, month } of options.months) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235); // Blue color
      const title = options.title || 'PonyClub Events Calendar';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, margin + 10);

      // Month/Year subtitle
      doc.setFontSize(16);
      doc.setTextColor(34, 34, 34); // Dark gray
      const monthYear = `${year} - ${getMonthName(month)}`;
      const monthYearWidth = doc.getTextWidth(monthYear);
      doc.text(monthYear, (pageWidth - monthYearWidth) / 2, margin + 25);

      // Calendar grid
      const startY = margin + 45;
      const cellWidth = contentWidth / 7;
      const cellHeight = 25;
      
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Draw day headers
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      for (let i = 0; i < 7; i++) {
        const x = margin + i * cellWidth;
        doc.rect(x, startY, cellWidth, cellHeight / 2);
        doc.text(daysOfWeek[i], x + 3, startY + 8);
      }

      // Calculate calendar layout
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay();

      let currentY = startY + cellHeight / 2;
      let dayCounter = 1;
      
      // Draw calendar grid
      for (let week = 0; week < 6 && dayCounter <= daysInMonth; week++) {
        for (let day = 0; day < 7; day++) {
          const x = margin + day * cellWidth;
          
          if (week === 0 && day < startDayOfWeek) {
            // Empty cell before month starts
            doc.rect(x, currentY, cellWidth, cellHeight);
          } else if (dayCounter <= daysInMonth) {
            // Day cell
            doc.rect(x, currentY, cellWidth, cellHeight);
            doc.setFontSize(10);
            doc.text(dayCounter.toString(), x + 3, currentY + 12);
            
            // Check for events on this day
            const dayEvents = options.events.filter(event => {
              const eventDate = new Date(event.date);
              return eventDate.getFullYear() === year && 
                     eventDate.getMonth() + 1 === month && 
                     eventDate.getDate() === dayCounter;
            });

            // Draw events
            if (dayEvents.length > 0) {
              doc.setFontSize(7);
              let eventY = currentY + 16;
              for (let i = 0; i < Math.min(dayEvents.length, 2); i++) {
                const event = dayEvents[i];
                doc.setTextColor(37, 99, 235); // Blue for events
                doc.text(event.name.substring(0, 12), x + 2, eventY, { maxWidth: cellWidth - 4 });
                eventY += 6;
              }
              if (dayEvents.length > 2) {
                doc.text(`+${dayEvents.length - 2} more`, x + 2, eventY);
              }
              doc.setTextColor(0, 0, 0); // Reset to black
            }
            
            dayCounter++;
          } else {
            // Empty cell after month ends
            doc.rect(x, currentY, cellWidth, cellHeight);
          }
        }
        currentY += cellHeight;
      }

      // Event list below calendar
      const eventListY = currentY + 20;
      const monthEvents = options.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month;
      });

      if (monthEvents.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Events this month:', margin, eventListY);
        
        doc.setFontSize(10);
        let listY = eventListY + 10;
        for (const event of monthEvents) {
          const eventDate = new Date(event.date);
          const dateStr = eventDate.getDate().toString().padStart(2, '0');
          doc.text(`${dateStr}: ${event.name}`, margin + 5, listY);
          listY += 6;
          
          if (listY > pageHeight - margin - 20) break; // Prevent overflow
        }
      }
    }

    // Return the PDF as a Buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
    
  } catch (error) {
    console.error('jsPDF generation error:', error);
    
    // Return a simple error PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PDF Generation Error', 20, 30);
    doc.setFontSize(12);
    doc.text('Unable to generate calendar PDF at this time.', 20, 50);
    doc.text('Please try again later or contact support.', 20, 65);
    
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }
}
