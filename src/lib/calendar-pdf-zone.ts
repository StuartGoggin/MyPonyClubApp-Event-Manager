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

export function generateZoneFormatCalendarPDF(options: ZoneCalendarPDFOptions): Buffer {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'landscape', // Use landscape for zone format to accommodate more information
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Colors for zone format
    const colors = {
      header: [34, 139, 34] as const,      // Forest Green
      subheader: [70, 130, 180] as const,  // Steel Blue
      text: [0, 0, 0] as const,            // Black
      border: [128, 128, 128] as const,    // Gray
      background: [245, 245, 245] as const, // Light Gray
    };

    let yPosition = margin;

    // Title - centered and larger
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...colors.header);
    const title = options.title || 'Pony Club Events Calendar - Zone Format';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 15;

    // Year range from months
    if (options.months && options.months.length > 0) {
      const years = [...new Set(options.months.map(m => m.year))];
      const yearText = years.length === 1 ? `${years[0]}` : `${Math.min(...years)} - ${Math.max(...years)}`;
      
      doc.setFontSize(14);
      doc.setTextColor(...colors.subheader);
      const yearWidth = doc.getTextWidth(yearText);
      doc.text(yearText, (pageWidth - yearWidth) / 2, yPosition);
      yPosition += 15;
    }

    // Group events by month for zone format display
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Create table structure for zone format
    const columnWidths = {
      date: 25,
      event: 60,
      club: 45,
      location: 50,
      contact: 35,
      zone: 40,
      state: 25
    };

    // Table headers
    const drawTableHeader = () => {
      const startX = margin;
      let currentX = startX;
      
      doc.setFillColor(...colors.background);
      doc.rect(startX, yPosition - 3, contentWidth, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...colors.text);
      
      doc.text('Date', currentX + 2, yPosition + 2);
      currentX += columnWidths.date;
      
      doc.text('Event', currentX + 2, yPosition + 2);
      currentX += columnWidths.event;
      
      doc.text('Club', currentX + 2, yPosition + 2);
      currentX += columnWidths.club;
      
      doc.text('Location', currentX + 2, yPosition + 2);
      currentX += columnWidths.location;
      
      doc.text('Contact', currentX + 2, yPosition + 2);
      currentX += columnWidths.contact;
      
      doc.text('Zone', currentX + 2, yPosition + 2);
      currentX += columnWidths.zone;
      
      doc.text('State', currentX + 2, yPosition + 2);
      
      yPosition += 8;
      
      // Draw header border
      doc.setDrawColor(...colors.border);
      doc.line(startX, yPosition, startX + contentWidth, yPosition);
    };

    sortedMonths.forEach((monthKey, monthIndex) => {
      const [year, month] = monthKey.split('-');
      const monthEvents = eventsByMonth[monthKey];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }
      
      // Month header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...colors.subheader);
      const monthText = `${getMonthName(parseInt(month))} ${year}`;
      doc.text(monthText, margin, yPosition);
      yPosition += 10;
      
      if (monthEvents.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);
        doc.text('No events scheduled', margin + 10, yPosition);
        yPosition += 8;
      } else {
      
      // Draw table header
      drawTableHeader();
      
      // Sort events by date within the month
      monthEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Event rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      monthEvents.forEach((event, eventIndex) => {
        const startX = margin;
        let currentX = startX;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
          drawTableHeader();
        }
        
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toLocaleDateString('en-AU', { 
          day: '2-digit', 
          month: '2-digit'
        });
        
        // Alternate row background
        if (eventIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(startX, yPosition - 2, contentWidth, 6, 'F');
        }
        
        doc.setTextColor(...colors.text);
        
        // Date
        doc.text(dateStr, currentX + 2, yPosition + 2);
        currentX += columnWidths.date;
        
        // Event name (truncate if too long)
        const eventName = event.name.length > 35 ? event.name.substring(0, 32) + '...' : event.name;
        doc.text(eventName, currentX + 2, yPosition + 2);
        currentX += columnWidths.event;
        
        // Club (truncate if too long)
        const clubName = (event.club || '').length > 20 ? (event.club || '').substring(0, 17) + '...' : (event.club || '');
        doc.text(clubName, currentX + 2, yPosition + 2);
        currentX += columnWidths.club;
        
        // Location (truncate if too long)
        const location = (event.location || '').length > 25 ? (event.location || '').substring(0, 22) + '...' : (event.location || '');
        doc.text(location, currentX + 2, yPosition + 2);
        currentX += columnWidths.location;
        
        // Contact (truncate if too long)
        const contact = (event.contact || '').length > 18 ? (event.contact || '').substring(0, 15) + '...' : (event.contact || '');
        doc.text(contact, currentX + 2, yPosition + 2);
        currentX += columnWidths.contact;
        
        // Zone
        const zoneText = (event.zone || 'Unknown').length > 15 ? (event.zone || 'Unknown').substring(0, 12) + '...' : (event.zone || 'Unknown');
        doc.text(zoneText, currentX + 2, yPosition + 2);
        currentX += columnWidths.zone;
        
        // State
        const stateText = event.state || 'VIC';
        doc.text(stateText, currentX + 2, yPosition + 2);
        
        yPosition += 6;
        
        // Draw row separator
        doc.setDrawColor(220, 220, 220);
        doc.line(startX, yPosition, startX + contentWidth, yPosition);
      });
      
      yPosition += 8; // Space after each month
      }
    });
    
    // Footer with generation info
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      
      const footerText = `Generated: ${new Date().toLocaleDateString('en-AU')} | Page ${i} of ${totalPages} | Zone Format Calendar`;
      const footerY = pageHeight - 10;
      doc.text(footerText, margin, footerY);
      
      // Add zone format identifier
      doc.text('Zone Format - State and Zone Information Included', pageWidth - margin - 80, footerY);
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