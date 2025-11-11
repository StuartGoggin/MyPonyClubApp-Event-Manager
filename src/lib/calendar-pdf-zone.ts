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
    // Create a new jsPDF instance - Portrait orientation to match the reference
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

    // Colors matching the reference document
    const colors = {
      header: [0, 0, 0] as const,          // Black for headers
      text: [0, 0, 0] as const,            // Black for text
      border: [0, 0, 0] as const,          // Black borders
      // Event type colors from the HTML reference
      stateCouncil: [234, 235, 222] as const,     // #EAEBDE
      smzMeeting: [170, 199, 172] as const,       // #AAC7AC  
      stateEvent: [253, 246, 153] as const,       // #FDF699
      zoneCompetition: [255, 255, 255] as const,  // White
      stateQualifier: [237, 244, 247] as const,   // #EDF4F7
      stateClubEvent: [255, 255, 0] as const,     // Yellow
      freshmansCamp: [135, 240, 56] as const,     // #87F038
      certificateAssessment: [255, 192, 0] as const, // #FFC000
      schoolHolidays: [172, 239, 252] as const,   // #ACEFFC
      freshmansSeries: [146, 208, 80] as const,   // #92D050
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

    let yPosition = margin;

    // Get the current year from the events or use current year
    let calendarYear = new Date().getFullYear();
    if (options.events && options.events.length > 0) {
      const eventYears = options.events.map(event => new Date(event.date).getFullYear());
      calendarYear = Math.max(...eventYears);
    }

    // Main Title - exactly like the reference "SMZ EVENT CALENDAR 2026"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const title = `SMZ EVENT CALENDAR ${calendarYear}`;
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 20;

    // Welcome Message Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const welcomeTitle = 'Welcome to the Southern Metropolitan Zone Event Calendar';
    const welcomeTitleWidth = doc.getTextWidth(welcomeTitle);
    doc.text(welcomeTitle, (pageWidth - welcomeTitleWidth) / 2, yPosition);
    yPosition += 8;

    // Description paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    
    const descriptionText = `Dear Clubs, Riders and Families - Welcome to our ${calendarYear} SMZ Event Calendar! This calendar showcases the exciting competitions and activities that our Southern Metropolitan Zone clubs have organized for you this year. Please share this with your members and riding friends to help promote our local Pony Club events.

The Southern Metropolitan Zone operates a qualifier series where official Pony Club riders and horses earn points throughout the year. Points are calculated at year-end, with totals typically running from 1st January until 17th December ${calendarYear}. Look for the light blue highlighted events on the calendar - these are your SMZ Series qualifying events!

The more competitions you enter, the more points you collect toward end-of-year prizes. These qualifiers also provide pathways for riders to compete at state level events. We encourage you to support the clubs hosting these competitions and represent your club with pride.

This calendar may be updated throughout the year. For the latest information, visit our website at https://sites.google.com/view/southernmetropolitanzone/home or follow our SMZ Facebook page. Check JustGo and other online event platforms for detailed event information and bookings.`;

    // Split text into lines and display
    const descriptionLines = doc.splitTextToSize(descriptionText, contentWidth - 10);
    let lineHeight = 4;
    
    descriptionLines.forEach((line: string) => {
      doc.text(line, margin + 5, yPosition);
      yPosition += lineHeight;
    });
    
    yPosition += 10;

    // Create Legend Table (matching the reference format)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Legend header
    const legendStartY = yPosition;
    const legendWidth = 150; // Width for the legend table
    const legendX = (pageWidth - legendWidth) / 2;
    
    // Draw legend title
    doc.setFillColor(255, 255, 255);
    doc.rect(legendX, yPosition - 3, 20, 6, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(legendX, yPosition - 3, 20, 6);
    doc.text('Legend', legendX + 2, yPosition + 1);
    yPosition += 6;
    
    // Legend items
    const legendItems = [
      { color: colors.stateCouncil, text: 'STATE Council meeting- every 1st Tuesday per month except (Nov – 2nd Tuesday)' },
      { color: colors.smzMeeting, text: 'SMZ Meeting date' },
      { color: colors.stateEvent, text: 'State event' },
      { color: colors.zoneCompetition, text: 'Zone Competition (non Qualifier)' },
      { color: colors.stateQualifier, text: 'STATE SMZ Qualifier' },
      { color: colors.stateClubEvent, text: 'STATE club event' },
      { color: colors.freshmansCamp, text: 'Freshmans, Clinic or Camp' },
      { color: colors.certificateAssessment, text: 'Certificate Assessment/or Training days' },
      { color: colors.schoolHolidays, text: 'School Holidays' }
    ];

    legendItems.forEach(item => {
      // Color box
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.rect(legendX, yPosition - 3, 20, 6, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(legendX, yPosition - 3, 20, 6);
      
      // Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const textLines = doc.splitTextToSize(item.text, legendWidth - 25);
      doc.text(textLines, legendX + 22, yPosition + 1);
      yPosition += Math.max(6, textLines.length * 4);
    });

    yPosition += 10;

    // Main Calendar Table - 4 columns with optimized widths
    const columnWidths = {
      date: 45,      // Date column - wider for full date with ordinals
      qualifier: 22, // SMZ Qualifier column - compact for checkmarks
      club: 40,      // Club column - adequate for club names
      event: 73      // Event column - remaining space for event descriptions
    };

    // Table headers with improved formatting
    const drawTableHeader = () => {
      const startX = margin;
      let currentX = startX;
      const headerHeight = 12;
      
      // Header background
      doc.setFillColor(240, 240, 240); // Light gray header background
      doc.rect(startX, yPosition - 5, contentWidth, headerHeight, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Enhanced borders
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      
      // Date column header
      doc.rect(currentX, yPosition - 5, columnWidths.date, headerHeight);
      doc.text('Date', currentX + columnWidths.date/2 - doc.getTextWidth('Date')/2, yPosition + 2);
      currentX += columnWidths.date;
      
      // SMZ Qualifier column header  
      doc.rect(currentX, yPosition - 5, columnWidths.qualifier, headerHeight);
      doc.setFontSize(8);
      doc.text('SMZ', currentX + columnWidths.qualifier/2 - doc.getTextWidth('SMZ')/2, yPosition);
      doc.text('Qualifier', currentX + columnWidths.qualifier/2 - doc.getTextWidth('Qualifier')/2, yPosition + 4);
      doc.setFontSize(10);
      currentX += columnWidths.qualifier;
      
      // Club column header
      doc.rect(currentX, yPosition - 5, columnWidths.club, headerHeight);
      doc.text('Club', currentX + columnWidths.club/2 - doc.getTextWidth('Club')/2, yPosition + 2);
      currentX += columnWidths.club;
      
      // Event column header
      doc.rect(currentX, yPosition - 5, columnWidths.event, headerHeight);
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
        yPosition = margin + 20;
        drawTableHeader();
      }

      // Add school holidays row for January (example)
      if (month === '01') {
        const startX = margin;
        const holidayRowHeight = 12;
        
        // School holidays row spanning all columns with improved formatting
        doc.setFillColor(colors.schoolHolidays[0], colors.schoolHolidays[1], colors.schoolHolidays[2]);
        doc.rect(startX, yPosition - 2, contentWidth, holidayRowHeight, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(startX, yPosition - 2, contentWidth, holidayRowHeight);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const holidayY = yPosition + (holidayRowHeight / 2) + 1;
        doc.text(`1st to 28th January – public school holidays`, startX + 5, holidayY);
        yPosition += holidayRowHeight;
      }
      
      // Sort events by date within the month
      monthEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Event rows with improved formatting
      monthEvents.forEach((event, index) => {
        const startX = margin;
        let currentX = startX;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 25) {
          doc.addPage();
          yPosition = margin + 20;
          drawTableHeader();
        }
        
        const eventDate = new Date(event.date);
        const eventBgColor = getEventBackgroundColor(event);
        
        // Calculate row height based on text content
        const clubText = event.club || '';
        const clubLines = doc.splitTextToSize(clubText, columnWidths.club - 6);
        const eventLines = doc.splitTextToSize(event.name, columnWidths.event - 6);
        const maxLines = Math.max(clubLines.length, eventLines.length, 1);
        const rowHeight = Math.max(10, maxLines * 4 + 2);
        
        // Row background color with improved opacity
        doc.setFillColor(eventBgColor[0], eventBgColor[1], eventBgColor[2]);
        doc.rect(startX, yPosition - 2, contentWidth, rowHeight, 'F');
        
        // Cell borders with consistent line width
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        
        // Date cell with better alignment
        doc.rect(currentX, yPosition - 2, columnWidths.date, rowHeight);
        const dateStr = eventDate.getDate() + getOrdinalSuffix(eventDate.getDate()) + ' ' + getMonthName(eventDate.getMonth() + 1);
        const dateY = yPosition + (rowHeight / 2) + 1;
        doc.text(dateStr, currentX + 3, dateY);
        currentX += columnWidths.date;
        
        // SMZ Qualifier cell with centered checkmark
        doc.rect(currentX, yPosition - 2, columnWidths.qualifier, rowHeight);
        const isQualifier = event.name.toLowerCase().includes('qualifier') || event.eventType?.toLowerCase().includes('qualifier');
        if (isQualifier) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          const checkY = yPosition + (rowHeight / 2) + 2;
          doc.text('✓', currentX + columnWidths.qualifier/2 - 2, checkY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
        }
        currentX += columnWidths.qualifier;
        
        // Club cell with proper text wrapping and vertical centering
        doc.rect(currentX, yPosition - 2, columnWidths.club, rowHeight);
        if (clubText) {
          const clubStartY = yPosition + (rowHeight - (clubLines.length * 4)) / 2 + 3;
          clubLines.forEach((line: string, i: number) => {
            doc.text(line, currentX + 3, clubStartY + (i * 4));
          });
        }
        currentX += columnWidths.club;
        
        // Event cell with proper text wrapping and vertical centering
        doc.rect(currentX, yPosition - 2, columnWidths.event, rowHeight);
        const eventStartY = yPosition + (rowHeight - (eventLines.length * 4)) / 2 + 3;
        eventLines.forEach((line: string, i: number) => {
          doc.text(line, currentX + 3, eventStartY + (i * 4));
        });
        
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
      doc.setTextColor(128, 128, 128);
      
      const footerY = pageHeight - 10;
      
      // Left side: Generated date
      const leftFooter = `Generated: ${asOfDate}`;
      doc.text(leftFooter, margin, footerY);
      
      // Right side: Calendar description (e.g., "Southern Metro Zone Calendar 2026")
      const rightFooter = `${titleText} ${footerYear}`;
      const rightFooterWidth = doc.getTextWidth(rightFooter);
      doc.text(rightFooter, pageWidth - margin - rightFooterWidth, footerY);
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