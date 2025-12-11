'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Mail, Printer, Calendar } from 'lucide-react';
import { Event, Club, EventType, Zone } from '@/lib/types';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

// Utility function to format dates with validation
const formatDate = (date: Date | string | any) => {
  try {
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date && typeof date === 'object' && date.toDate) {
      validDate = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
      validDate = new Date(date.seconds * 1000);
    } else {
      throw new Error('Invalid date format');
    }
    
    if (isNaN(validDate.getTime())) {
      throw new Error('Invalid date value');
    }
    
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(validDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

const formatDateShort = (date: Date | string | any) => {
  try {
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date && typeof date === 'object' && date.toDate) {
      validDate = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
      validDate = new Date(date.seconds * 1000);
    } else {
      throw new Error('Invalid date format');
    }
    
    if (isNaN(validDate.getTime())) {
      throw new Error('Invalid date value');
    }
    
    return new Intl.DateTimeFormat('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(validDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

interface ZoneEventReportsProps {
  zone: Zone;
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
}

export function ZoneEventReports({ 
  zone, 
  events, 
  clubs, 
  eventTypes 
}: ZoneEventReportsProps) {
  const { toast } = useToast();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Filter pending events (proposed status)
  const pendingEvents = events.filter(event => 
    event.status === 'proposed'
  ).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const getClubName = (clubId: string | undefined, event?: Event) => {
    if (!clubId && event?.zoneId && !event?.clubId) {
      return 'Zone Event';
    }
    const club = clubs.find(c => c.id === clubId);
    return club?.name || 'Unknown Club';
  };

  const getEventTypeName = (eventTypeId: string | undefined) => {
    const eventType = eventTypes.find(et => et.id === eventTypeId);
    return eventType?.name || 'Unknown Type';
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get events on the same day as the given event (scheduling conflicts)
  const getNearbyEvents = (event: Event): Event[] => {
    if (!event) return [];
    
    const eventDate = new Date(event.date);
    // Normalize to start of day for comparison
    eventDate.setHours(0, 0, 0, 0);
    
    return events.filter(e => {
      if (e.id === event.id) return false; // Exclude the current event
      if (e.status === 'rejected') return false; // Exclude rejected events
      
      const otherEventDate = new Date(e.date);
      otherEventDate.setHours(0, 0, 0, 0);
      
      // Only include events on the exact same day
      return eventDate.getTime() === otherEventDate.getTime();
    });
  };

  // Get distance between event and nearby event
  const getEventDistance = (currentEvent: Event, nearbyEvent: Event): string | null => {
    const currentClub = clubs.find(c => c.id === currentEvent.clubId);
    if (!currentClub?.latitude || !currentClub?.longitude) {
      return null;
    }
    
    const nearbyClub = clubs.find(c => c.id === nearbyEvent.clubId);
    if (!nearbyClub?.latitude || !nearbyClub?.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      currentClub.latitude,
      currentClub.longitude,
      nearbyClub.latitude,
      nearbyClub.longitude
    );
    
    return `${Math.round(distance)}km away`;
  };

  // Helper function to decode HTML entities for PDF display
  const decodeHtmlEntities = (text: string): string => {
    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    };
    return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
  };

  // Helper function to load image and convert to base64 for PDF embedding
  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load image:', url, error);
      return null;
    }
  };

  const generateCommitteeLetter = async () => {
    if (pendingEvents.length === 0) {
      toast({
        title: 'No Pending Events',
        description: 'There are no pending events to include in the committee letter.',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let yPos = margin;

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper function to add page header (for continuation pages)
      const addPageHeader = () => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`${zone.name} - Event Approval Request`, margin, 15);
        doc.setTextColor(0, 0, 0);
      };

      // Load zone logo if available
      let zoneLogo: string | null = null;
      if (zone.imageUrl) {
        try {
          zoneLogo = await loadImageAsBase64(zone.imageUrl);
        } catch (error) {
          console.error('Error loading zone logo:', error);
        }
      }

      // ===== ENHANCED HEADER with Zone Logo =====
      if (zoneLogo) {
        try {
          // Add logo - sized appropriately
          doc.addImage(zoneLogo, 'PNG', margin, yPos, 30, 30);
          // Zone name styled next to logo with proper spacing
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 51, 102); // Dark blue
          doc.text(zone.name, margin + 35, yPos + 15);
          doc.setTextColor(0, 0, 0); // Reset to black
          yPos += 35;
        } catch (error) {
          console.error('Error adding zone logo to PDF:', error);
          // Fallback to text-only header
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 51, 102);
          doc.text(zone.name, margin, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 12;
        }
      } else {
        // Text-only header if no logo
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text(zone.name, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 12;
      }

      // Decorative line under header
      doc.setDrawColor(0, 51, 102);
      doc.setLineWidth(0.8);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Date (right aligned)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = formatDate(new Date());
      const dateWidth = doc.getTextWidth(currentDate);
      doc.text(currentDate, pageWidth - margin - dateWidth, yPos);
      yPos += 12;

      // Recipient
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('To: Zone Committee Members', margin, yPos);
      yPos += 10;

      // Subject with background highlight
      doc.setFillColor(240, 240, 240);
      doc.rect(margin - 2, yPos - 5, contentWidth + 4, 9, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Subject: Event Approval Request', margin, yPos);
      yPos += 12;

      // Opening paragraph with better spacing
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const openingText = [
        'Dear Committee Members,',
        '',
        `This letter is to formally request approval and ratification of the following ${pendingEvents.length} event${pendingEvents.length !== 1 ? 's' : ''} that ${pendingEvents.length === 1 ? 'has' : 'have'} been submitted for inclusion in the ${zone.name} calendar.`,
        '',
        'Please review the details below and consider these events for approval at the next committee meeting.'
      ];

      openingText.forEach(line => {
        checkPageBreak(7);
        if (line === '') {
          yPos += 4;
        } else {
          const lines = doc.splitTextToSize(line, contentWidth);
          lines.forEach((textLine: string) => {
            doc.text(textLine, margin, yPos);
            yPos += 5.5;
          });
        }
      });

      yPos += 8;

      // Events section header with decorative styling
      checkPageBreak(15);
      doc.setFillColor(0, 51, 102);
      doc.rect(margin - 2, yPos - 5, contentWidth + 4, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Events Pending Approval:', margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 12;

      // Load club logos in advance
      const clubLogos = new Map<string, string | null>();
      for (const event of pendingEvents) {
        if (event.clubId && !clubLogos.has(event.clubId)) {
          const club = clubs.find(c => c.id === event.clubId);
          if (club?.logoUrl) {
            try {
              const logo = await loadImageAsBase64(club.logoUrl);
              clubLogos.set(event.clubId, logo);
            } catch (error) {
              console.error('Error loading club logo:', error);
            }
          }
        }
      }

      // ===== ENHANCED EVENT LIST with Club Logos =====
      for (let index = 0; index < pendingEvents.length; index++) {
        const event = pendingEvents[index];
        checkPageBreak(45);

        // Event box background (alternating colors)
        const boxColor = index % 2 === 0 ? [250, 250, 252] : [255, 255, 255];
        doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
        doc.roundedRect(margin - 2, yPos - 4, contentWidth + 4, 40, 2, 2, 'F');

        // Club logo or event number - DEDICATED COLUMN (left 20mm)
        const clubLogo = event.clubId ? clubLogos.get(event.clubId) : null;
        const logoSize = 16; // Increased from 10mm
        const logoX = margin + 2;
        const logoY = yPos;
        const logoColumnWidth = 20; // Dedicated space for logo
        const textStartX = margin + logoColumnWidth; // Text starts after logo column
        
        if (clubLogo) {
          try {
            doc.addImage(clubLogo, 'PNG', logoX, logoY, logoSize, logoSize);
          } catch (error) {
            console.error('Error adding club logo to PDF:', error);
            // Fallback to number in circle
            doc.setFillColor(0, 51, 102);
            doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}`, logoX + logoSize/2, logoY + logoSize/2 + 3, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          }
        } else {
          // Number in circle for events without logo
          doc.setFillColor(0, 51, 102);
          doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}`, logoX + logoSize/2, logoY + logoSize/2 + 3, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }

        // Event name (bold, larger font) - starts in text column
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text(decodeHtmlEntities(event.name), textStartX, yPos + 5);
        doc.setTextColor(0, 0, 0);
        yPos += 8;

        // Event details grid with clean labels (no emojis to avoid font issues)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const detailsStartX = textStartX; // Start details in text column, not logo column
        const labelWidth = 35;
        
        // Row 1: Event Date | Requested Date
        doc.setFont('helvetica', 'bold');
        doc.text('Event Date:', detailsStartX, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDateShort(event.date), detailsStartX + labelWidth, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Requested:', detailsStartX + 75, yPos); // Adjusted from 85
        doc.setFont('helvetica', 'normal');
        const requestedDate = event.submittedAt ? formatDateShort(event.submittedAt) : event.createdAt ? formatDateShort(event.createdAt) : 'Not recorded';
        doc.text(requestedDate, detailsStartX + 75 + labelWidth, yPos);
        yPos += 6;

        // Row 2: Club | Event Type
        doc.setFont('helvetica', 'bold');
        doc.text('Club:', detailsStartX, yPos);
        doc.setFont('helvetica', 'normal');
        const clubText = doc.splitTextToSize(getClubName(event.clubId, event), 40);
        doc.text(clubText[0], detailsStartX + labelWidth, yPos);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Type:', detailsStartX + 75, yPos); // Adjusted from 85
        doc.setFont('helvetica', 'normal');
        const typeText = doc.splitTextToSize(getEventTypeName(event.eventTypeId), 40);
        doc.text(typeText[0], detailsStartX + 75 + labelWidth, yPos);
        yPos += 6;

        // Row 3: Location
        doc.setFont('helvetica', 'bold');
        doc.text('Location:', detailsStartX, yPos);
        doc.setFont('helvetica', 'normal');
        const locationText = doc.splitTextToSize(event.location || 'TBC', contentWidth - 40);
        doc.text(locationText[0], detailsStartX + labelWidth, yPos);
        yPos += 6;

        // Description (if available)
        if (event.description) {
          doc.setFont('helvetica', 'bold');
          doc.text('Details:', detailsStartX, yPos);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(event.description, contentWidth - 40);
          doc.text(descLines.slice(0, 2), detailsStartX + labelWidth, yPos); // Limit to 2 lines
          yPos += 6 * Math.min(descLines.length, 2);
        }

        // Coordinator (if available)
        if (event.coordinatorName) {
          doc.setFont('helvetica', 'bold');
          doc.text('Coordinator:', detailsStartX, yPos);
          doc.setFont('helvetica', 'normal');
          const coordinatorInfo = event.coordinatorContact 
            ? `${event.coordinatorName} - ${event.coordinatorContact}`
            : event.coordinatorName;
          const coordText = doc.splitTextToSize(coordinatorInfo, contentWidth - 40);
          doc.text(coordText[0], detailsStartX + labelWidth, yPos);
          yPos += 6;
        }

        // ===== SCHEDULING CONFLICTS SECTION =====
        const nearbyEvents = getNearbyEvents(event);
        if (nearbyEvents.length > 0) {
          // Check if we need extra space for conflicts
          const conflictSpaceNeeded = 15 + (nearbyEvents.length * 18);
          checkPageBreak(conflictSpaceNeeded);
          
          yPos += 3; // Small gap before conflicts section
          
          // Conflicts header with amber background
          doc.setFillColor(255, 243, 205); // Amber-50
          doc.roundedRect(detailsStartX - 2, yPos - 4, contentWidth - logoColumnWidth, 8, 1, 1, 'F');
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(146, 64, 14); // Amber-800
          doc.text('! Potential Scheduling Conflicts:', detailsStartX, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 6;
          
          // List each conflict
          for (const nearbyEvent of nearbyEvents) {
            const conflictClub = clubs.find(c => c.id === nearbyEvent.clubId);
            const distance = getEventDistance(event, nearbyEvent);
            const conflictLogo = nearbyEvent.clubId ? clubLogos.get(nearbyEvent.clubId) : null;
            const conflictType = eventTypes.find(t => t.id === nearbyEvent.eventTypeId);
            
            // Conflict box with lighter amber background - increased height for more details
            doc.setFillColor(254, 252, 232); // Amber-100
            doc.roundedRect(detailsStartX - 2, yPos - 3, contentWidth - logoColumnWidth, 30, 1, 1, 'F');
            
            // Club logo (small, 8mm) for conflict
            const conflictLogoSize = 8;
            const conflictLogoX = detailsStartX;
            const conflictLogoY = yPos - 2;
            
            if (conflictLogo) {
              try {
                doc.addImage(conflictLogo, 'PNG', conflictLogoX, conflictLogoY, conflictLogoSize, conflictLogoSize);
              } catch (error) {
                console.error('Error adding conflict club logo:', error);
              }
            }
            
            // Conflict event details next to logo
            const conflictTextX = detailsStartX + conflictLogoSize + 2;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(120, 53, 15); // Amber-900
            doc.text(decodeHtmlEntities(nearbyEvent.name), conflictTextX, yPos);
            yPos += 4;
            
            // Event date and club
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(92, 38, 5); // Amber-950
            doc.text(`Event Date: ${formatDateShort(nearbyEvent.date)}`, conflictTextX, yPos);
            yPos += 3.5;
            
            // Club/Organizer
            doc.text(`Club: ${conflictClub?.name || 'Unknown Club'}`, conflictTextX, yPos);
            yPos += 3.5;
            
            // Event Type
            if (conflictType) {
              doc.text(`Type: ${conflictType.name}`, conflictTextX, yPos);
              yPos += 3.5;
            }
            
            // Location
            if (nearbyEvent.location) {
              doc.text(`Location: ${nearbyEvent.location}`, conflictTextX, yPos);
              yPos += 3.5;
            }
            
            // Coordinator
            if (nearbyEvent.coordinatorName && nearbyEvent.coordinatorContact) {
              doc.text(`Coordinator: ${nearbyEvent.coordinatorName} - ${nearbyEvent.coordinatorContact}`, conflictTextX, yPos);
            } else if (nearbyEvent.coordinatorName) {
              doc.text(`Coordinator: ${nearbyEvent.coordinatorName}`, conflictTextX, yPos);
            }
            
            // Distance badge (top right of conflict box)
            if (distance) {
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(21, 128, 61); // Green-700
              const distWidth = doc.getTextWidth(distance);
              doc.text(distance, pageWidth - margin - distWidth - 2, yPos - 14);
            }
            
            doc.setTextColor(0, 0, 0);
            yPos += 6;
          }
          
          yPos += 2; // Small gap after conflicts
        }

        yPos += 8; // Space between events
      }

      // ===== CLOSING SECTION =====
      checkPageBreak(35);
      yPos += 5;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const closingText = [
        'We appreciate your timely review and approval of these events. Should you require any additional',
        'information or clarification regarding any of the listed events, please do not hesitate to contact',
        'the zone coordinator or the event organizers directly.',
        '',
        'Thank you for your continued support and dedication to our zone activities.'
      ];

      closingText.forEach(line => {
        checkPageBreak(6);
        if (line === '') {
          yPos += 4;
        } else {
          doc.text(line, margin, yPos);
          yPos += 5.5;
        }
      });

      yPos += 8;

      // Signature section
      checkPageBreak(20);
      doc.setFont('helvetica', 'normal');
      doc.text('Yours sincerely,', margin, yPos);
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Zone Committee', margin, yPos);

      // Footer on every page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        
        // Page numbers
        const pageText = `Page ${i} of ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 10);
        
        // Footer text
        doc.text(`Generated on ${formatDateShort(new Date())}`, margin, pageHeight - 10);
        
        doc.setTextColor(0, 0, 0);
      }

      // Save the PDF
      const fileName = `${zone.name.replace(/\s+/g, '-')}-Committee-Letter-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF Generated',
        description: `Committee letter has been downloaded as ${fileName}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleEmailLetter = async () => {
    // TODO: Implement email functionality
    toast({
      title: 'Coming Soon',
      description: 'Email functionality will be available in the next update.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Committee Letter Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Committee Approval Letter
          </CardTitle>
          <CardDescription>
            Generate an official letter to the zone committee listing pending events for approval and ratification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-medium">Pending Events</div>
              <div className="text-sm text-muted-foreground">
                {pendingEvents.length} event{pendingEvents.length !== 1 ? 's' : ''} awaiting committee approval
              </div>
            </div>
            <Badge variant={pendingEvents.length > 0 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {pendingEvents.length}
            </Badge>
          </div>

          {/* Events Preview */}
          {pendingEvents.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Event Date</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead>Club/Organizer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Conflicts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEvents.map((event) => {
                    const conflicts = getNearbyEvents(event);
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{formatDateShort(event.date)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.submittedAt ? formatDateShort(event.submittedAt) : event.createdAt ? formatDateShort(event.createdAt) : 'N/A'}
                        </TableCell>
                        <TableCell>{getClubName(event.clubId, event)}</TableCell>
                        <TableCell>{getEventTypeName(event.eventTypeId)}</TableCell>
                        <TableCell>{event.location || 'TBC'}</TableCell>
                        <TableCell>
                          {conflicts.length > 0 ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              None
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending events to include in the committee letter</p>
              <p className="text-sm mt-2">Events will appear here when they are submitted and awaiting approval</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleEmailLetter}
              disabled={pendingEvents.length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Letter
            </Button>
            <Button
              onClick={generateCommitteeLetter}
              disabled={pendingEvents.length === 0 || generatingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingPDF ? 'Generating...' : 'Download as PDF'}
            </Button>
          </div>

          {/* Letter Preview Info */}
          <div className="text-sm text-muted-foreground border-t pt-4">
            <p className="font-medium mb-2">The letter will include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Zone logo in header and club logos for each event</li>
              <li>Formal letterhead with zone name and date</li>
              <li>Complete details of all pending events</li>
              <li>Event dates, organizers, types, and locations</li>
              <li>Scheduling conflict warnings with nearby events and distances</li>
              <li>Coordinator contact information (where available)</li>
              <li>Professional closing and footer</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Additional Reports - Placeholder for future reports */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Printer className="h-5 w-5" />
            Additional Reports (Coming Soon)
          </CardTitle>
          <CardDescription>
            More reporting options will be added in future updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Future reports may include:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Event statistics and analytics</li>
              <li>Club participation summary</li>
              <li>Approved events listing</li>
              <li>Equipment booking summary</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
