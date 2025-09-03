import jsPDF from 'jspdf';

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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

export function generateCalendarPDF(options: CalendarPDFOptions): Buffer {
  try {
    // Create a new jsPDF instance with better defaults
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Enhanced color palette for modern calendar design
    const colors = {
      primary: [59, 130, 246] as const,      // Blue-500
      primaryLight: [147, 197, 253] as const, // Blue-300
      secondary: [99, 102, 241] as const,     // Indigo-500
      accent: [16, 185, 129] as const,        // Emerald-500
      dark: [31, 41, 55] as const,            // Gray-800
      darkMedium: [55, 65, 81] as const,      // Gray-700
      light: [249, 250, 251] as const,        // Gray-50
      medium: [107, 114, 128] as const,       // Gray-500
      white: [255, 255, 255] as const,
      eventApproved: [34, 197, 94] as const,  // Green-500
      eventPending: [245, 158, 11] as const,  // Amber-500
      weekend: [248, 250, 252] as const,      // Blue-50 (lighter)
      border: [229, 231, 235] as const,       // Gray-200
      shadow: [0, 0, 0, 0.1] as const         // Light shadow
    };

    // Generate a page for each month
    let isFirstPage = true;
    
    for (const { year, month } of options.months) {
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;

      // Modern header design with gradient effect
      // Header section with modern styling
      const titleHeaderHeight = 30;
      
      // Main header background with gradient simulation
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, margin, contentWidth, titleHeaderHeight, 4, 4, 'F');
      
      // Subtle inner shadow effect
      doc.setFillColor(...colors.primaryLight);
      doc.roundedRect(margin + 1, margin + 1, contentWidth - 2, titleHeaderHeight - 2, 3, 3, 'F');
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, margin, contentWidth, titleHeaderHeight, 4, 4, 'F');

      // Title with enhanced typography
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      const title = options.title || 'PonyClub Events Calendar';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, margin + 12);

      // Month/Year subtitle with better positioning
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      const monthYear = `${getMonthName(month)} ${year}`;
      const monthYearWidth = doc.getTextWidth(monthYear);
      doc.text(monthYear, (pageWidth - monthYearWidth) / 2, margin + 24);

      // Compressed calendar grid - half page design
      const startY = margin + 45;
      const cellWidth = contentWidth / 7;
      const cellHeight = 15; // More compressed for half-page layout
      
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayAbbrev = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      
      // Compact day headers for compressed layout
      const dayHeaderHeight = 10;
      for (let i = 0; i < 7; i++) {
        const x = margin + i * cellWidth;
        
        // Header background with subtle gradient
        if (i === 0 || i === 6) {
          doc.setFillColor(...colors.weekend);
        } else {
          doc.setFillColor(...colors.light);
        }
        
        doc.roundedRect(x, startY, cellWidth, dayHeaderHeight, 1, 1, 'F');
        
        // Modern border styling
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, startY, cellWidth, dayHeaderHeight, 1, 1, 'S');
        
        // Enhanced day header text - compact
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.darkMedium);
        const dayText = dayAbbrev[i];
        const dayTextWidth = doc.getTextWidth(dayText);
        doc.text(dayText, x + (cellWidth - dayTextWidth) / 2, startY + 7);
      }

      // Calculate calendar layout
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay();

      let currentY = startY + dayHeaderHeight; // Use new day header height
      let dayCounter = 1;
      
      // Draw enhanced calendar grid with modern styling
      for (let week = 0; week < 6 && dayCounter <= daysInMonth; week++) {
        for (let day = 0; day < 7; day++) {
          const x = margin + day * cellWidth;
          
          if (week === 0 && day < startDayOfWeek) {
            // Empty cell before month starts - subtle styling
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(x, currentY, cellWidth, cellHeight, 1, 1, 'F');
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.2);
            doc.roundedRect(x, currentY, cellWidth, cellHeight, 1, 1, 'S');
          } else if (dayCounter <= daysInMonth) {
            // Check for events on this day
            const dayEvents = options.events.filter(event => {
              const eventDate = new Date(event.date);
              return eventDate.getFullYear() === year && 
                     eventDate.getMonth() + 1 === month && 
                     eventDate.getDate() === dayCounter;
            });

            // Enhanced day cell with modern design
            const isWeekend = day === 0 || day === 6;
            const hasEvents = dayEvents.length > 0;
            
            // Modern cell background with gradient simulation
            if (hasEvents) {
              // Event day - elegant highlight
              doc.setFillColor(240, 248, 255); // Soft blue tint
            } else if (isWeekend) {
              doc.setFillColor(252, 252, 252); // Light weekend background
            } else {
              doc.setFillColor(255, 255, 255); // Pure white for weekdays
            }
            
            doc.roundedRect(x, currentY, cellWidth, cellHeight, 1.5, 1.5, 'F');
            
            // Professional border with event highlighting
            if (hasEvents) {
              doc.setDrawColor(...colors.primary);
              doc.setLineWidth(0.6);
              doc.roundedRect(x, currentY, cellWidth, cellHeight, 1.5, 1.5, 'S');
              
              // Inner glow effect for event days
              doc.setDrawColor(...colors.primaryLight);
              doc.setLineWidth(0.3);
              doc.roundedRect(x + 0.5, currentY + 0.5, cellWidth - 1, cellHeight - 1, 1, 1, 'S');
            } else {
              doc.setDrawColor(...colors.border);
              doc.setLineWidth(0.25);
              doc.roundedRect(x, currentY, cellWidth, cellHeight, 1.5, 1.5, 'S');
            }
            
            // Subtle shadow effect
            doc.setDrawColor(235, 235, 235);
            doc.setLineWidth(0.1);
            doc.line(x + cellWidth, currentY + 1, x + cellWidth, currentY + cellHeight);
            doc.line(x + 1, currentY + cellHeight, x + cellWidth, currentY + cellHeight);
            
            // Day number with compact typography - moved up
            doc.setFont('helvetica', hasEvents ? 'bold' : 'normal');
            doc.setFontSize(8); // Smaller for compact layout
            if (hasEvents) {
              doc.setTextColor(...colors.primary);
            } else {
              doc.setTextColor(...colors.dark);
            }
            const dayText = dayCounter.toString();
            const dayTextWidth = doc.getTextWidth(dayText);
            doc.text(dayText, x + (cellWidth - dayTextWidth) / 2, currentY + 4); // Moved up from 6 to 4

            // Enhanced event display with more text
            if (hasEvents) {
              doc.setFontSize(5); // Slightly smaller for more text
              let eventY = currentY + 8; // Adjusted spacing from moved day number
              const maxEventsToShow = Math.min(dayEvents.length, 4); // Show up to 4 events before rollup
              
              if (dayEvents.length <= 4) {
                // Show individual events (up to 4)
                for (let i = 0; i < maxEventsToShow; i++) {
                  const event = dayEvents[i];
                  doc.setTextColor(...colors.darkMedium);
                  let eventText = event.name || `${event.eventType} Event`;
                  
                  // Much more generous character limits
                  const maxEventChars = dayEvents.length === 1 ? 25 : 20; // Significantly increased limits
                  if (eventText.length > maxEventChars) {
                    eventText = eventText.substring(0, maxEventChars - 1) + '…';
                  }
                  
                  const eventTextX = x + 1; // Minimal padding
                  doc.text(eventText, eventTextX, eventY);
                  eventY += 2; // Tight spacing between multiple events
                }
              } else {
                // Show count only when more than 4 events
                doc.setFontSize(5.5);
                doc.setTextColor(...colors.medium);
                const countText = `${dayEvents.length} events`;
                const eventTextX = x + 1;
                doc.text(countText, eventTextX, eventY);
              }
            }
            
            dayCounter++;
          } else {
            // Empty cell after month ends - subtle styling
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(x, currentY, cellWidth, cellHeight, 1, 1, 'F');
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.2);
            doc.roundedRect(x, currentY, cellWidth, cellHeight, 1, 1, 'S');
          }
        }
        currentY += cellHeight; // Consistent spacing
      }

      // Enhanced event list section with detailed information
      const eventListY = currentY + 10; // Reduced spacing
      const monthEvents = options.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month;
      });

      if (monthEvents.length > 0) {
        // Events section header with background
        doc.setFillColor(...colors.light);
        doc.roundedRect(margin, eventListY - 5, contentWidth, 12, 2, 2, 'F'); // Smaller header
        doc.setDrawColor(...colors.medium);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, eventListY - 5, contentWidth, 12, 2, 2, 'S');
        
        // Fixed events header text
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.dark);
        doc.text('Events This Month', margin + 5, eventListY + 2);
        
        // Sort events by date
        const sortedEvents = monthEvents.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        doc.setFontSize(8); // Smaller font for more content
        let listY = eventListY + 15;
        
        for (const event of sortedEvents) {
          if (listY > pageHeight - margin - 15) break; // Prevent overflow
          
          const eventDate = new Date(event.date);
          const dateStr = eventDate.toLocaleDateString('en-AU', { 
            day: '2-digit', 
            month: 'short' 
          });
          const isApproved = event.status === 'approved';
          
          // Status indicator dot
          const statusColor = isApproved ? colors.eventApproved : colors.eventPending;
          doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
          doc.circle(margin + 5, listY - 1, 1.2, 'F');
          
          // Date (bold)
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colors.dark);
          doc.text(dateStr, margin + 10, listY);
          
          // Event name (bold)
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          const eventNameX = margin + 30;
          doc.text(event.name, eventNameX, listY);
          
          // Club and location details (normal text, same line)
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colors.medium);
          const eventNameWidth = doc.getTextWidth(event.name);
          let detailsX = eventNameX + eventNameWidth + 5;
          
          // Add club name if available
          if (event.club) {
            doc.text(`at ${event.club}`, detailsX, listY);
            const clubWidth = doc.getTextWidth(`at ${event.club}`);
            detailsX += clubWidth + 3;
          }
          
          // Add location if available and different from club
          if (event.location && event.location !== event.club) {
            const locationText = event.location.length > 20 ? event.location.substring(0, 20) + '...' : event.location;
            doc.text(`- ${locationText}`, detailsX, listY);
            const locationWidth = doc.getTextWidth(`- ${locationText}`);
            detailsX += locationWidth + 3;
          }
          
          // Add contact info if available
          if (event.contact && detailsX < contentWidth - 30) {
            doc.setFontSize(7);
            doc.text(`Contact: ${event.contact}`, detailsX, listY);
          }
          
          // Status on the right side
          const statusText = isApproved ? 'Approved' : 'Pending';
          doc.setFontSize(7);
          doc.setTextColor(...colors.medium);
          const statusWidth = doc.getTextWidth(statusText);
          doc.text(statusText, contentWidth + margin - statusWidth, listY);
          
          listY += 6; // Compact spacing
          doc.setFontSize(8); // Reset font size
        }
        
        // Add contact information note if events exist
        if (sortedEvents.length > 0) {
          listY += 5;
          doc.setFontSize(7);
          doc.setTextColor(...colors.medium);
          doc.setFont('helvetica', 'italic');
          doc.text('For event contact details and registration, please visit the club or contact the event organizer.', margin, listY);
        }
      }

      // Add footer with generation info
      doc.setFontSize(7);
      doc.setTextColor(...colors.medium);
      doc.setFont('helvetica', 'normal');
      const footer = `Generated on ${new Date().toLocaleDateString()} | PonyClub Event Manager`;
      const footerWidth = doc.getTextWidth(footer);
      doc.text(footer, (pageWidth - footerWidth) / 2, pageHeight - 10);
    }

    // Return the PDF as a Buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
    
  } catch (error) {
    console.error('jsPDF generation error:', error);
    
    // Return a beautifully styled error PDF
    const doc = new jsPDF();
    
    // Error page styling
    doc.setFillColor(220, 38, 38); // Red background
    doc.roundedRect(20, 20, 170, 40, 5, 5, 'F');
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('PDF Generation Error', 105, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Unable to generate calendar PDF at this time.', 105, 50, { align: 'center' });
    
    // Error details
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(20, 80, 170, 60, 3, 3, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    doc.roundedRect(20, 80, 170, 60, 3, 3, 'S');
    
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text('What to do:', 30, 95);
    doc.text('• Refresh the page and try again', 35, 105);
    doc.text('• Contact your system administrator if the problem persists', 35, 115);
    doc.text('• Check that all event data is properly formatted', 35, 125);
    
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`Error occurred: ${new Date().toLocaleString()}`, 105, 155, { align: 'center' });
    
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }
}
