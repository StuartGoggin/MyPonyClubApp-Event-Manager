import jsPDF from 'jspdf';

export interface ZoneCalendarPDFOptions {
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
  zones?: Array<{
    id: string;
    name: string;
    state?: string;
  }>;
  clubs?: Array<{
    id: string;
    name: string;
    zoneId: string;
    state?: string;
  }>;
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

export function generateZoneFormatCalendarPDF(options: ZoneCalendarPDFOptions): Buffer {
  try {
    // Create a new jsPDF instance - Portrait orientation
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15; // Left margin
    const marginRight = 15; // Right margin
    const marginTop = 15; // Top margin
    const marginBottom = 15; // Bottom margin
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Modern color palette
    const colors = {
      primary: [59, 130, 246] as const,           // Blue-500
      headerBg: [248, 250, 252] as const,         // Slate-50
      text: [15, 23, 42] as const,                // Slate-900
      textLight: [71, 85, 105] as const,          // Slate-600
      border: [203, 213, 225] as const,           // Slate-300
      borderDark: [148, 163, 184] as const,       // Slate-400
      approved: [34, 197, 94] as const,           // Green-500 for approved badge
      // Event type colors - softer, more professional
      stateCouncil: [241, 245, 249] as const,     // Slate-100
      smzMeeting: [187, 247, 208] as const,       // Green-200
      stateEvent: [254, 249, 195] as const,       // Yellow-100
      zoneCompetition: [255, 255, 255] as const,  // White
      stateQualifier: [224, 242, 254] as const,   // Sky-100
      stateClubEvent: [254, 240, 138] as const,   // Yellow-200
      freshmansCamp: [187, 247, 208] as const,    // Green-200
      certificateAssessment: [254, 215, 170] as const, // Orange-200
      schoolHolidays: [207, 250, 254] as const,   // Cyan-100
      freshmansSeries: [220, 252, 231] as const,  // Green-100
    };

    // Function to get event background color based on event type or name
    const getEventBackgroundColor = (event: any): readonly [number, number, number] => {
      const eventNameLower = event.name.toLowerCase();
      const eventTypeLower = (event.eventType || '').toLowerCase();
      
      if (eventNameLower.includes('state council') || eventTypeLower.includes('state council')) {
        return colors.stateCouncil;
      }
      if (eventNameLower.includes('smz meeting') || eventTypeLower.includes('smz meeting')) {
        return colors.smzMeeting;
      }
      if (eventNameLower.includes('state event') || eventTypeLower.includes('state')) {
        return colors.stateEvent;
      }
      if (eventNameLower.includes('qualifier') || eventTypeLower.includes('qualifier')) {
        return colors.stateQualifier;
      }
      if (eventNameLower.includes('freshman') || eventNameLower.includes('clinic') || eventNameLower.includes('camp')) {
        return colors.freshmansSeries;
      }
      if (eventNameLower.includes('certificate') || eventNameLower.includes('assessment') || eventNameLower.includes('training')) {
        return colors.certificateAssessment;
      }
      if (eventNameLower.includes('school holiday') || eventNameLower.includes('holiday')) {
        return colors.schoolHolidays;
      }
      
      return colors.zoneCompetition; // Default white background
    };

    let yPosition = marginTop;

    // Get the current year from the events or use current year
    let calendarYear = new Date().getFullYear();
    if (options.events && options.events.length > 0) {
      const eventYears = options.events.map(event => new Date(event.date).getFullYear());
      calendarYear = Math.max(...eventYears);
    }

    // Main Title - exactly like the reference "SMZ EVENT CALENDAR 2026"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...colors.primary);
    const title = `SMZ EVENT CALENDAR ${calendarYear}`;
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    
    // Decorative underline
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    const lineStart = (pageWidth - titleWidth) / 2;
    const lineEnd = lineStart + titleWidth;
    doc.line(lineStart, yPosition + 2, lineEnd, yPosition + 2);
    
    yPosition += 18;

    // Welcome Message Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    const welcomeTitle = 'Welcome to the Southern Metropolitan Zone Event Calendar';
    const welcomeTitleWidth = doc.getTextWidth(welcomeTitle);
    doc.text(welcomeTitle, (pageWidth - welcomeTitleWidth) / 2, yPosition);
    yPosition += 10;

    // Description paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...colors.textLight);
    
    const descriptionText = `Dear Clubs, Riders and Families - Welcome to our ${calendarYear} SMZ Event Calendar! This calendar showcases the exciting competitions and activities that our Southern Metropolitan Zone clubs have organized for you this year. Please share this with your members and riding friends to help promote our local Pony Club events.

The Southern Metropolitan Zone operates a qualifier series where official Pony Club riders and horses earn points throughout the year. Points are calculated at year-end, with totals typically running from 1st January until 17th December ${calendarYear}. Look for the light blue highlighted events on the calendar - these are your SMZ Series qualifying events!

The more competitions you enter, the more points you collect toward end-of-year prizes. These qualifiers also provide pathways for riders to compete at state level events. We encourage you to support the clubs hosting these competitions and represent your club with pride.

This calendar may be updated throughout the year. For the latest information, visit our website at https://sites.google.com/view/southernmetropolitanzone/home or follow our SMZ Facebook page. Check JustGo and other online event platforms for detailed event information and bookings.`;

    // Split text into lines and display
    const descriptionLines = doc.splitTextToSize(descriptionText, contentWidth - 10);
    let lineHeight = 4.5;
    
    descriptionLines.forEach((line: string) => {
      doc.text(line, marginLeft + 5, yPosition);
      yPosition += lineHeight;
    });
    
    yPosition += 12;

    // Create Legend Table (matching the reference format)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    
    // Legend header
    const legendStartY = yPosition;
    const legendWidth = 160; // Width for the legend table
    const legendX = (pageWidth - legendWidth) / 2;
    
    // Draw legend title
    doc.text('Legend', legendX, yPosition);
    yPosition += 6;
    
    // Legend items with improved styling
    const legendItems = [
      { color: colors.stateCouncil, text: 'STATE Council meeting - every 1st Tuesday per month except (Nov – 2nd Tuesday)' },
      { color: colors.smzMeeting, text: 'SMZ Meeting date' },
      { color: colors.stateEvent, text: 'State event' },
      { color: colors.zoneCompetition, text: 'Zone Competition (non Qualifier)' },
      { color: colors.stateQualifier, text: 'STATE SMZ Qualifier' },
      { color: colors.stateClubEvent, text: 'STATE club event' },
      { color: colors.freshmansCamp, text: 'Freshmans, Clinic or Camp' },
      { color: colors.certificateAssessment, text: 'Certificate Assessment/or Training days' },
      { color: colors.schoolHolidays, text: 'School Holidays' },
      { color: [255, 255, 255], text: 'Events marked with "✓ Approved" have been confirmed by the Zone Representative', badge: true }
    ];

    legendItems.forEach(item => {
      // Special handling for badge legend item
      if (item.badge) {
        // Show green checkmark badge instead of color box
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setFillColor(colors.approved[0], colors.approved[1], colors.approved[2]);
        doc.setTextColor(255, 255, 255);
        
        // Draw rounded rectangle badge
        const badgeWidth = 18;
        const badgeHeight = 4.5;
        const radius = 1.5;
        const badgeY = yPosition - 3.5;
        
        // Rounded rectangle background
        doc.roundedRect(legendX, badgeY, badgeWidth, badgeHeight, radius, radius, 'F');
        
        // Checkmark and text
        const checkmark = '✓ Approved';
        const checkWidth = doc.getTextWidth(checkmark);
        doc.text(checkmark, legendX + (badgeWidth - checkWidth) / 2, badgeY + 3.2);
        
        // Reset text color for description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.textLight);
        const textLines = doc.splitTextToSize(item.text, legendWidth - 22);
        doc.text(textLines, legendX + 20, yPosition);
        yPosition += Math.max(6, textLines.length * 4);
      } else {
        // Color box with border
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.rect(legendX, yPosition - 3.5, 18, 5, 'FD');
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.rect(legendX, yPosition - 3.5, 18, 5);
        
        // Text with better spacing
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.textLight);
        const textLines = doc.splitTextToSize(item.text, legendWidth - 22);
        doc.text(textLines, legendX + 20, yPosition);
        yPosition += Math.max(6, textLines.length * 4);
      }
    });

    yPosition += 10;

    // Main Calendar Table - 4 columns with optimized widths
    const columnWidths = {
      date: 42,      // Date column - wider for full date with ordinals
      qualifier: 20, // SMZ Qualifier column - compact for checkmarks
      club: 48,      // Club column - wider for better readability
      event: 60      // Event column - remaining space for event descriptions
    };

    // Table headers with improved formatting
    const drawTableHeader = () => {
      const startX = marginLeft;
      let currentX = startX;
      const headerHeight = 11;
      
      // Header background with modern color
      doc.setFillColor(...colors.headerBg);
      doc.rect(startX, yPosition - 4, contentWidth, headerHeight, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      
      // Enhanced borders
      doc.setDrawColor(...colors.borderDark);
      doc.setLineWidth(0.5);
      
      // Date column header
      doc.rect(currentX, yPosition - 4, columnWidths.date, headerHeight);
      doc.text('Date', currentX + columnWidths.date/2 - doc.getTextWidth('Date')/2, yPosition + 2);
      currentX += columnWidths.date;
      
      // SMZ Qualifier column header  
      doc.rect(currentX, yPosition - 4, columnWidths.qualifier, headerHeight);
      doc.setFontSize(8);
      const smzWidth = doc.getTextWidth('SMZ');
      const qualWidth = doc.getTextWidth('Qualifier');
      doc.text('SMZ', currentX + columnWidths.qualifier/2 - smzWidth/2, yPosition);
      doc.text('Qualifier', currentX + columnWidths.qualifier/2 - qualWidth/2, yPosition + 4);
      doc.setFontSize(10);
      currentX += columnWidths.qualifier;
      
      // Club column header
      doc.rect(currentX, yPosition - 4, columnWidths.club, headerHeight);
      doc.text('Club', currentX + columnWidths.club/2 - doc.getTextWidth('Club')/2, yPosition + 2);
      currentX += columnWidths.club;
      
      // Event column header
      doc.rect(currentX, yPosition - 4, columnWidths.event, headerHeight);
      doc.text('Event', currentX + columnWidths.event/2 - doc.getTextWidth('Event')/2, yPosition + 2);
      
      yPosition += headerHeight;
    };

    // Group events by month and add holiday periods
    const eventsByMonth: { [key: string]: typeof options.events } = {};
    
    options.events.forEach(event => {
      const eventDate = new Date(event.date);
      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      if (!eventsByMonth[monthKey]) {
        eventsByMonth[monthKey] = [];
      }
      eventsByMonth[monthKey].push(event);
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(eventsByMonth).sort();

    // Draw table header
    drawTableHeader();

    // Process each month
    sortedMonths.forEach((monthKey) => {
      const [year, month] = monthKey.split('-');
      const monthEvents = eventsByMonth[monthKey];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = marginTop + 20;
        drawTableHeader();
      }

      // Add school holidays row for January (example)
      if (month === '01') {
        const startX = marginLeft;
        const holidayRowHeight = 10;
        
        // School holidays row spanning all columns with improved formatting
        doc.setFillColor(colors.schoolHolidays[0], colors.schoolHolidays[1], colors.schoolHolidays[2]);
        doc.rect(startX, yPosition - 1.5, contentWidth, holidayRowHeight, 'F');
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.rect(startX, yPosition - 1.5, contentWidth, holidayRowHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        const holidayY = yPosition + (holidayRowHeight / 2) + 1;
        doc.text(`1st to 28th January – public school holidays`, startX + 4, holidayY);
        yPosition += holidayRowHeight;
      }
      
      // Sort events by date within the month
      monthEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Event rows with improved formatting
      monthEvents.forEach((event, index) => {
        const startX = marginLeft;
        let currentX = startX;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = marginTop + 20;
          drawTableHeader();
        }
        
        const eventDate = new Date(event.date);
        const eventBgColor = getEventBackgroundColor(event);
        
        // Calculate row height based on text content
        const clubText = event.club || '';
        const clubLines = doc.splitTextToSize(clubText, columnWidths.club - 5);
        
        // Add "Approved" badge to event name if status is approved
        let eventNameText = event.name;
        const isApproved = event.status === 'approved';
        
        const eventLines = doc.splitTextToSize(eventNameText, columnWidths.event - 5);
        const maxLines = Math.max(clubLines.length, eventLines.length, 1);
        const baseRowHeight = Math.max(9, maxLines * 4.5 + 3);
        // Add extra space if approved badge is present
        const rowHeight = isApproved ? baseRowHeight + 5 : baseRowHeight;
        
        // Row background color
        doc.setFillColor(eventBgColor[0], eventBgColor[1], eventBgColor[2]);
        doc.rect(startX, yPosition - 1.5, contentWidth, rowHeight, 'F');
        
        // Cell borders with subtle color
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.25);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        
        // Date cell with better alignment
        doc.rect(currentX, yPosition - 1.5, columnWidths.date, rowHeight);
        const dateStr = eventDate.getDate() + getOrdinalSuffix(eventDate.getDate()) + ' ' + getMonthName(eventDate.getMonth() + 1);
        const dateY = yPosition + (rowHeight / 2) + 1.5;
        doc.text(dateStr, currentX + 3, dateY);
        currentX += columnWidths.date;
        
        // SMZ Qualifier cell with centered checkmark
        doc.rect(currentX, yPosition - 1.5, columnWidths.qualifier, rowHeight);
        const isQualifier = event.name.toLowerCase().includes('qualifier') || event.eventType?.toLowerCase().includes('qualifier');
        if (isQualifier) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(...colors.primary);
          const checkY = yPosition + (rowHeight / 2) + 2.5;
          const checkmark = '✓';
          const checkWidth = doc.getTextWidth(checkmark);
          doc.text(checkmark, currentX + (columnWidths.qualifier - checkWidth) / 2, checkY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...colors.text);
        }
        currentX += columnWidths.qualifier;
        
        // Club cell with proper text wrapping and vertical centering
        doc.rect(currentX, yPosition - 1.5, columnWidths.club, rowHeight);
        if (clubText) {
          const clubStartY = yPosition + (rowHeight - (clubLines.length * 4)) / 2 + 3;
          clubLines.forEach((line: string, i: number) => {
            doc.text(line, currentX + 2.5, clubStartY + (i * 4));
          });
        }
        currentX += columnWidths.club;
        
        // Event cell with proper text wrapping and vertical centering
        doc.rect(currentX, yPosition - 1.5, columnWidths.event, rowHeight);
        
        // Draw event name
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        const eventStartY = yPosition + (rowHeight - (eventLines.length * 4) - (isApproved ? 5 : 0)) / 2 + 3;
        eventLines.forEach((line: string, i: number) => {
          doc.text(line, currentX + 2.5, eventStartY + (i * 4));
        });
        
        // Add "Approved" badge if event is approved
        if (isApproved) {
          const badgeY = eventStartY + (eventLines.length * 4) + 2;
          const badgeWidth = 18;
          const badgeHeight = 3.5;
          const radius = 1;
          
          // Green badge background
          doc.setFillColor(colors.approved[0], colors.approved[1], colors.approved[2]);
          doc.roundedRect(currentX + 2.5, badgeY - 2.5, badgeWidth, badgeHeight, radius, radius, 'F');
          
          // White checkmark and "Approved" text
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(255, 255, 255);
          const badgeText = '✓ Approved';
          const badgeTextWidth = doc.getTextWidth(badgeText);
          doc.text(badgeText, currentX + 2.5 + (badgeWidth - badgeTextWidth) / 2, badgeY);
          
          // Reset font
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(...colors.text);
        }
        
        yPosition += rowHeight;
      });
    });
    
    // Footer with descriptive information
    const totalPages = doc.getNumberOfPages();
    const today = new Date();
    
    // Format date as DDmmmYYYY (e.g., 11nov2025)
    const day = today.getDate().toString().padStart(2, '0');
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthName = monthNames[today.getMonth()];
    const yearNum = today.getFullYear();
    const asOfDate = `${day}${monthName}${yearNum}`;
    
    // Extract calendar year from the months array or use calendarYear from above
    const footerYear = options.months.length > 0 ? options.months[0].year : calendarYear;
    
    // Get zone/club name from title, or default to "PonyClub Events"
    const titleText = options.title || 'PonyClub Events Calendar';
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.textLight);
      
      const footerY = pageHeight - 12;
      
      // Left side: Generated date
      const leftFooter = `Generated: ${asOfDate}`;
      doc.text(leftFooter, marginLeft, footerY);
      
      // Right side: Calendar description (e.g., "Southern Metro Zone Calendar 2026")
      const rightFooter = `${titleText} ${footerYear}`;
      const rightFooterWidth = doc.getTextWidth(rightFooter);
      doc.text(rightFooter, pageWidth - marginRight - rightFooterWidth, footerY);
    }

    return Buffer.from(doc.output('arraybuffer'));
    
  } catch (error) {
    console.error('Zone format PDF generation error:', error);
    
    // Fallback PDF
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('SMZ Event Calendar', 20, 30);
    doc.setFontSize(10);
    doc.text('Unable to generate calendar PDF at this time.', 20, 50);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
}