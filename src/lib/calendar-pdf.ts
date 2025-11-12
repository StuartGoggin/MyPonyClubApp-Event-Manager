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
    zone?: string;
    state?: string;
  }>;
  format?: 'standard' | 'zone';
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || 'Unknown';
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th';
  }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function generateCalendarPDF(options: CalendarPDFOptions): Buffer {
  try {
    // Check if this is zone format and delegate to zone format generator
    if (options.format === 'zone') {
      return generateZoneFormatPDF(options);
    }

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

// Zone format PDF generator - Tabular format with Zone and State columns
function generateZoneFormatPDF(options: CalendarPDFOptions): Buffer {
  try {
    // Create a new jsPDF instance in landscape for better table display
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 15;
    const marginBottom = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    console.log('Zone PDF Margins:', { marginLeft, marginRight, marginTop, marginBottom, pageWidth, pageHeight, contentWidth });

    // Colors
    const colors = {
      header: [0, 0, 0] as const,
      headerBg: [230, 230, 230] as const,
      text: [0, 0, 0] as const,
      border: [0, 0, 0] as const,
      altRow: [248, 248, 248] as const,
    };

    let yPosition = marginTop;
    let pageNumber = 1;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...colors.header);
    const title = options.title || 'Pony Club Events Calendar';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 10;

    // Year info
    if (options.months && options.months.length > 0) {
      const years = [...new Set(options.months.map(m => m.year))];
      const yearText = years.length === 1 ? `${years[0]}` : `${Math.min(...years)} - ${Math.max(...years)}`;
      
      doc.setFontSize(12);
      doc.setTextColor(...colors.header);
      const yearWidth = doc.getTextWidth(yearText);
      doc.text(yearText, (pageWidth - yearWidth) / 2, yPosition);
      yPosition += 15;
    }

    // Introduction paragraph for Zone Format
    const introText = [
      "Dear Clubs, Riders and Families,",
      "",
      "Please find the current Zone Event Calendar for promoting our local Pony Club events. Feel free to share with your members and other riding friends. We hope you enjoy being part of the competitions that your Zone clubs have put together for you this year.",
      "",
      "Our Zone runs a qualifier series where each time you enter and ride as an official Pony Club rider, you and your horse gain points during the year. These are calculated as end-of-year totals (look for the light blue highlighted events on the calendar).",
      "",
      "Zone Series Points are typically collected between series runs from 1st January until 17th December each year, unless specified otherwise by the Zone. The more you enter, the more points you collect, and higher placings will add up towards the end-of-year prizes!",
      "",
      "Start representing your club and enjoying competitions with your Pony Club friends. These qualifiers also assist riders who are able to qualify to ride at State level, so support the clubs running qualifying competitions and represent yourself and your horse to compete at State events.",
      "",
      "The Event Calendar may change during the year. Updates will be located on the Zone website or Facebook page. Check JustGo or other online event organisers for detailed event information and booking details for events that interest you.",
      "",
      "Enjoy your Pony Club journey!"
    ];

    // Add introduction with nice formatting
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.text);
    
    const introStartY = yPosition;
    const maxLineWidth = contentWidth - 20; // Leave some margin for readability
    let currentY = yPosition;
    
    introText.forEach(paragraph => {
      if (paragraph === "") {
        currentY += 3; // Smaller spacing for empty lines
        return;
      }
      
      // Split long paragraphs into multiple lines
      const words = paragraph.split(' ');
      let currentLine = '';
      
      words.forEach((word, index) => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const lineWidth = doc.getTextWidth(testLine);
        
        if (lineWidth > maxLineWidth && currentLine !== '') {
          // Line is too long, print current line and start new one
          doc.text(currentLine, marginLeft + 10, currentY);
          currentY += 4;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
        
        // If this is the last word, print the line
        if (index === words.length - 1) {
          doc.text(currentLine, marginLeft + 10, currentY);
          currentY += 5; // Spacing after paragraph
        }
      });
    });
    
    yPosition = currentY + 5; // Extra space before the table

    // Modern color palette for event type badges
    const eventTypeColors = {
      'Zone Qualifier': { bg: [59, 130, 246] as const, text: [255, 255, 255] as const }, // Blue
      'Zone Meeting': { bg: [16, 185, 129] as const, text: [255, 255, 255] as const }, // Green
      'State Event': { bg: [245, 158, 11] as const, text: [255, 255, 255] as const }, // Amber
      'Zone Certificate': { bg: [139, 92, 246] as const, text: [255, 255, 255] as const }, // Purple
      'Public Holiday': { bg: [239, 68, 68] as const, text: [255, 255, 255] as const }, // Red
    };

    // Draw legend with beautiful badges
    const drawLegend = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...colors.text);
      doc.text('Event Types', marginLeft, yPosition);
      yPosition += 8;

      const legendItems = Object.entries(eventTypeColors);
      const badgeHeight = 6;
      const badgeSpacing = 3;
      let currentX = marginLeft;

      legendItems.forEach(([label, colorScheme], index) => {
        // Calculate badge width based on text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        const textWidth = doc.getTextWidth(label);
        const badgeWidth = textWidth + 6; // Padding

        // Check if we need to wrap to next line
        if (currentX + badgeWidth > pageWidth - marginRight && index > 0) {
          currentX = marginLeft;
          yPosition += badgeHeight + badgeSpacing;
        }

        // Draw rounded rectangle badge
        doc.setFillColor(colorScheme.bg[0], colorScheme.bg[1], colorScheme.bg[2]);
        doc.roundedRect(currentX, yPosition - 4, badgeWidth, badgeHeight, 1.5, 1.5, 'F');

        // Draw badge text
        doc.setTextColor(colorScheme.text[0], colorScheme.text[1], colorScheme.text[2]);
        doc.text(label, currentX + 3, yPosition);

        currentX += badgeWidth + 8; // Move to next badge position
      });

      yPosition += badgeHeight + 10;
    };

    // Draw the legend
    drawLegend();

    // Column definitions - 3 columns: Date, Club, Event
    const columns = [
      { header: 'Date', width: 35, align: 'left' as const },
      { header: 'Club', width: 50, align: 'left' as const },
      { header: 'Event', width: 182, align: 'left' as const }
    ];

    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    console.log('Table width:', tableWidth, 'Content width:', contentWidth);
    const startX = marginLeft; // Start table at left margin, not centered

    // Group events by month
    const eventsByMonth: { [key: string]: typeof options.events } = {};
    options.events.forEach(event => {
      const eventDate = new Date(event.date);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      if (!eventsByMonth[monthKey]) {
        eventsByMonth[monthKey] = [];
      }
      eventsByMonth[monthKey].push(event);
    });

    // Sort events by date within each month
    Object.keys(eventsByMonth).forEach(monthKey => {
      eventsByMonth[monthKey].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    // Function to draw table header
    const drawTableHeader = () => {
      let currentX = startX;
      
      // Header background
      doc.setFillColor(...colors.headerBg);
      doc.rect(startX, yPosition - 2, tableWidth, 8, 'F');
      
      // Header borders and text
      doc.setDrawColor(...colors.border);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.header);
      
      columns.forEach((col) => {
        // Draw cell border
        doc.rect(currentX, yPosition - 2, col.width, 8);
        
        // Draw header text (all left-aligned for simplicity)
        doc.text(col.header, currentX + 2, yPosition + 3);
        
        currentX += col.width;
      });
      
      yPosition += 8;
    };

    // Process each month
    const sortedMonths = options.months.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    sortedMonths.forEach((monthData, monthIndex) => {
      const { year, month } = monthData;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const monthEvents = eventsByMonth[monthKey] || [];

      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        pageNumber++;
        yPosition = marginTop;
      }

      // Month header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.header);
      const monthText = `${getMonthName(month)} ${year}`;
      doc.text(monthText, startX, yPosition);
      yPosition += 8;

      // Draw table header
      drawTableHeader();

      // Generate all Saturdays and Sundays for this month, plus any days with events
      const daysInMonth = new Date(year, month, 0).getDate();
      const allDaysToShow: Array<{ date: Date; events: typeof monthEvents; isWeekend: boolean }> = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay();
        const dayDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = monthEvents.filter(e => e.date === dayDateStr);
        
        // Include Saturdays (6), Sundays (0), OR any day with events
        if (dayOfWeek === 0 || dayOfWeek === 6 || dayEvents.length > 0) {
          allDaysToShow.push({ date: currentDate, events: dayEvents, isWeekend: dayOfWeek === 0 || dayOfWeek === 6 });
        }
      }

      // Event rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      if (allDaysToShow.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('No weekends in this month', startX + 10, yPosition);
        yPosition += 8;
      } else {
        allDaysToShow.forEach((dayData, dayIndex) => {
          const { date, events: dayEvents } = dayData;
          
          // Check if we need a new page
          if (yPosition > pageHeight - 15) {
            doc.addPage();
            pageNumber++;
            yPosition = marginTop;
            drawTableHeader();
          }

          if (dayEvents.length === 0) {
            // Show empty row for weekend with no events
            let currentX = startX;
            const rowHeight = 8;

            // Alternating row background
            if (dayIndex % 2 === 1) {
              doc.setFillColor(...colors.altRow);
              doc.rect(startX, yPosition - 1, tableWidth, rowHeight, 'F');
            }

            // Draw borders
            doc.setDrawColor(...colors.border);
            
            // Date column
            doc.rect(currentX, yPosition - 1, columns[0].width, rowHeight);
            const dateStr = date.getDate() + getOrdinalSuffix(date.getDate()) + ' ' + 
                           date.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...colors.text);
            doc.text(dateStr, currentX + 2, yPosition + 4);
            currentX += columns[0].width;
            
            // Club column (empty)
            doc.rect(currentX, yPosition - 1, columns[1].width, rowHeight);
            currentX += columns[1].width;
            
            // Event column (empty)
            doc.rect(currentX, yPosition - 1, columns[2].width, rowHeight);
            
            yPosition += rowHeight;
          } else {
            // Show events for this day
            dayEvents.forEach((event, eventIndex) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 15) {
            doc.addPage();
            pageNumber++;
            yPosition = marginTop;
            drawTableHeader();
          }

          let currentX = startX;
          const rowHeight = 8;

          // Alternating row background
          if (eventIndex % 2 === 1) {
            doc.setFillColor(...colors.altRow);
            doc.rect(startX, yPosition - 1, tableWidth, rowHeight, 'F');
          }

          doc.setTextColor(...colors.text);
          
          // Determine event type for badge
          const eventName = event.name?.toLowerCase() || '';
          const eventType = event.eventType?.toLowerCase() || '';
          const eventStatus = (event as any).status?.toLowerCase() || '';
          let eventTypeBadge = '';
          let badgeColor: { bg: readonly [number, number, number]; text: readonly [number, number, number] } = eventTypeColors['Zone Qualifier']; // Default
          
          // Check if it's a public holiday (by status or name)
          if (eventStatus === 'public_holiday' || eventName.includes('holiday') || eventName.includes('public holiday')) {
            eventTypeBadge = 'Public Holiday';
            badgeColor = eventTypeColors['Public Holiday'];
          } else if ((event as any).isQualifier === true) {
            // Check the isQualifier field from Firestore
            eventTypeBadge = 'Zone Qualifier';
            badgeColor = eventTypeColors['Zone Qualifier'];
          } else if (eventType.includes('meeting') || eventName.includes('meeting')) {
            eventTypeBadge = 'Zone Meeting';
            badgeColor = eventTypeColors['Zone Meeting'];
          } else if (eventType.includes('state') || eventName.includes('state')) {
            eventTypeBadge = 'State Event';
            badgeColor = eventTypeColors['State Event'];
          } else if (eventType.includes('certificate') || eventType.includes('assessment') || eventName.includes('certificate') || eventName.includes('assessment')) {
            eventTypeBadge = 'Zone Certificate';
            badgeColor = eventTypeColors['Zone Certificate'];
          }
          
          // Draw row borders and content
          columns.forEach((col, colIndex) => {
            // Draw cell border
            doc.setDrawColor(...colors.border);
            doc.rect(currentX, yPosition - 1, col.width, rowHeight);
            
            let cellText = '';
            switch (colIndex) {
              case 0: // Date
                const eventDate = new Date(event.date);
                const dateText = eventDate.getDate() + getOrdinalSuffix(eventDate.getDate()) + ' ' + 
                                eventDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(...colors.text);
                doc.text(dateText, currentX + 2, yPosition + 4);
                break;
                
              case 1: // Club
                cellText = event.club || '';
                const maxClubChars = Math.floor(col.width / 2.2);
                if (cellText.length > maxClubChars) {
                  cellText = cellText.substring(0, maxClubChars - 3) + '...';
                }
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text(cellText, currentX + 2, yPosition + 4);
                break;
                
              case 2: // Event with badge
                const eventText = event.name || 'Unnamed Event';
                
                // Draw badge if event type is identified
                let badgeX = currentX + 2;
                if (eventTypeBadge) {
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(7);
                  const badgeTextWidth = doc.getTextWidth(eventTypeBadge);
                  const badgeWidth = badgeTextWidth + 4;
                  const badgeHeight = 4;
                  
                  // Draw rounded badge
                  doc.setFillColor(badgeColor.bg[0], badgeColor.bg[1], badgeColor.bg[2]);
                  doc.roundedRect(badgeX, yPosition + 0.5, badgeWidth, badgeHeight, 1, 1, 'F');
                  
                  // Draw badge text
                  doc.setTextColor(badgeColor.text[0], badgeColor.text[1], badgeColor.text[2]);
                  doc.text(eventTypeBadge, badgeX + 2, yPosition + 3.5);
                  
                  badgeX += badgeWidth + 3;
                }
                
                // Draw event name
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(...colors.text);
                const remainingWidth = col.width - (badgeX - currentX) - 2;
                const maxEventChars = Math.floor(remainingWidth / 2.2);
                let displayText = eventText;
                if (displayText.length > maxEventChars) {
                  displayText = displayText.substring(0, maxEventChars - 3) + '...';
                }
                doc.text(displayText, badgeX, yPosition + 4);
                break;
            }
            
            currentX += col.width;
          });
          
          yPosition += rowHeight;
            });
          }
        });
      }
      
      yPosition += 8; // Space between months
    });

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    
    // Format date as DDmmmYYYY (e.g., 11nov2025)
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                             'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthName = monthNamesShort[today.getMonth()];
    const yearNum = today.getFullYear();
    const asOfDate = `${day}${monthName}${yearNum}`;
    
    // Extract calendar year from the months array
    const calendarYear = options.months.length > 0 ? options.months[0].year : yearNum;
    const titleText = options.title || 'PonyClub Events Calendar';
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      const footerY = pageHeight - 8;
      const generatedText = `Generated: ${asOfDate}`;
      const pageText = `Page ${i} of ${totalPages}`;
      const formatText = `${titleText} ${calendarYear}`;
      
      doc.text(generatedText, marginLeft, footerY);
      doc.text(pageText, pageWidth / 2 - doc.getTextWidth(pageText) / 2, footerY);
      doc.text(formatText, pageWidth - marginRight - doc.getTextWidth(formatText), footerY);
    }

    return Buffer.from(doc.output('arraybuffer'));
    
  } catch (error) {
    console.error('Zone format PDF generation error:', error);
    
    // Fallback PDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Zone Format Calendar', 20, 30);
    doc.setFontSize(10);
    doc.text('Unable to generate zone format calendar PDF at this time.', 20, 50);
    doc.text('Please try again or use the standard format.', 20, 60);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
}
