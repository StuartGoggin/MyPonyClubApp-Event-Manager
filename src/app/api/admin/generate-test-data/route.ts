import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { Event, Club, Zone, EventType, EventStatus, EventSource } from '@/lib/types';
import { getAllZones, getAllClubs, getAllEventTypes } from '@/lib/server-data';
import { createHash } from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface GenerationConfig {
  years: number;
  eventsPerWeek: number;
  selectedZones: string[];
  selectedClubs: string[];
  includeSchedules: boolean;
  scheduleProbability: number;
  approvalDistribution: {
    approved: number;
    pending: number;
    rejected: number;
  };
  seasonalVariation: boolean;
  weekendBias: boolean;
  dryRun: boolean;
  outputFormat: 'zip' | 'preview';
}

interface GenerationResult {
  success: boolean;
  totalEvents: number;
  eventsPerYear: { [year: string]: number };
  eventsByType: { [type: string]: number };
  eventsByZone: { [zone: string]: number };
  scheduleFiles: number;
  downloadUrl?: string;
  previewData?: any;
  errors: string[];
  generationTime: number;
}

// Event name templates for realistic generation
const EVENT_NAME_TEMPLATES = {
  rally: [
    'Spring Rally', 'Summer Rally', 'Autumn Rally', 'Winter Rally',
    'Annual Rally', 'Regional Rally', 'Monthly Rally', 'Training Rally'
  ],
  ode: [
    'Spring ODE', 'Summer ODE', 'Autumn One Day Event', 'Regional ODE',
    'Annual One Day Event', 'Championship ODE', 'Training ODE'
  ],
  showjumping: [
    'Show Jumping Competition', 'Jumping Championships', 'Show Jumping Training',
    'Regional Jumping', 'Monthly Jumping', 'Junior Jumping'
  ],
  dressage: [
    'Dressage Competition', 'Dressage Championships', 'Dressage Training',
    'Regional Dressage', 'Monthly Dressage', 'Junior Dressage'
  ],
  'cross-country': [
    'Cross Country Training', 'XC Competition', 'Cross Country Championships',
    'Regional Cross Country', 'XC Skills Day', 'Cross Country Clinic'
  ]
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(startDate: Date, endDate: Date, weekendBias: boolean): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  let randomDate: Date;
  let attempts = 0;
  
  do {
    randomDate = new Date(start + Math.random() * (end - start));
    attempts++;
    
    // If weekend bias is enabled, prefer weekends (Saturday = 6, Sunday = 0)
    if (!weekendBias || attempts > 10) break;
    
    const dayOfWeek = randomDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // 60% chance for weekend events when weekend bias is enabled
    if (Math.random() < 0.6 && isWeekend) break;
    if (Math.random() < 0.4 && !isWeekend) break;
    
  } while (attempts < 10);
  
  return randomDate;
}

function getSeasonalMultiplier(date: Date, seasonalVariation: boolean): number {
  if (!seasonalVariation) return 1;
  
  const month = date.getMonth();
  
  // Higher activity in spring (Sep-Nov) and summer (Dec-Feb) in Australia
  if (month >= 8 && month <= 10) return 1.5; // Spring
  if (month >= 11 || month <= 1) return 1.3; // Summer
  if (month >= 2 && month <= 4) return 1.1; // Autumn
  return 0.8; // Winter
}

function getApprovalStatus(distribution: { approved: number; pending: number; rejected: number }): EventStatus {
  const rand = Math.random() * 100;
  
  if (rand < distribution.approved) return 'approved';
  if (rand < distribution.approved + distribution.pending) return 'proposed'; // Use 'proposed' instead of 'pending'
  return 'rejected';
}

async function generateMockPDF(eventName: string, eventType: string, date: Date, club: Club): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const { height } = page.getSize();
  
  let yPosition = height - 50;
  
  // Header
  page.drawText('Event Schedule', {
    x: 50,
    y: yPosition,
    size: 24,
    font: timesRomanBoldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  // Event details
  page.drawText(`Event: ${eventName}`, {
    x: 50,
    y: yPosition,
    size: 14,
    font: timesRomanBoldFont,
  });
  
  yPosition -= 25;
  page.drawText(`Type: ${eventType}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesRomanFont,
  });
  
  yPosition -= 20;
  page.drawText(`Date: ${date.toLocaleDateString()}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesRomanFont,
  });
  
  yPosition -= 20;
  page.drawText(`Venue: ${club.name}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesRomanFont,
  });
  
  yPosition -= 20;
  page.drawText(`Address: ${club.address}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: timesRomanFont,
  });
  
  yPosition -= 40;
  
  // Schedule
  page.drawText('Schedule', {
    x: 50,
    y: yPosition,
    size: 16,
    font: timesRomanBoldFont,
  });
  
  yPosition -= 30;
  
  const scheduleItems = [
    '8:00 AM - Registration Opens',
    '8:30 AM - Rider Briefing',
    '9:00 AM - First Session Begins',
    '10:30 AM - Morning Tea Break',
    '11:00 AM - Second Session',
    '12:30 PM - Lunch Break',
    '1:30 PM - Afternoon Activities',
    '3:00 PM - Competition Rounds',
    '4:30 PM - Prize Giving',
    '5:00 PM - Event Concludes'
  ];
  
  scheduleItems.forEach(item => {
    page.drawText(item, {
      x: 70,
      y: yPosition,
      size: 11,
      font: timesRomanFont,
    });
    yPosition -= 20;
  });
  
  yPosition -= 20;
  
  // Footer
  page.drawText('Generated by MyPonyClubApp Event Manager - Test Data', {
    x: 50,
    y: yPosition,
    size: 8,
    font: timesRomanFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  return await pdfDoc.save();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const config: GenerationConfig = await request.json();
    
    // Fetch real zones, clubs, and event types from database
    const [zones, clubs, eventTypes] = await Promise.all([
      getAllZones(),
      getAllClubs(),
      getAllEventTypes()
    ]);

    const result: GenerationResult = {
      success: true,
      totalEvents: 0,
      eventsPerYear: {},
      eventsByType: {},
      eventsByZone: {},
      scheduleFiles: 0,
      errors: [],
      generationTime: 0
    };

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - config.years);

    // Determine which zones and clubs to use
    const zonesToUse = config.selectedZones.length > 0 
      ? zones.filter(z => config.selectedZones.includes(z.id))
      : zones;
    
    const clubsToUse = config.selectedClubs.length > 0
      ? clubs.filter(c => config.selectedClubs.includes(c.id))
      : clubs.filter(c => zonesToUse.some(z => z.id === c.zoneId));

    if (clubsToUse.length === 0) {
      return NextResponse.json({
        success: false,
        details: 'No clubs available for selected zones',
        result: { ...result, errors: ['No clubs available for generation'] }
      }, { status: 400 });
    }

    // Generate events
    const events: Event[] = [];
    const totalWeeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const baseEventsPerWeek = config.eventsPerWeek;

    for (let week = 0; week < totalWeeks; week++) {
      const weekStart = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Apply seasonal variation
      const seasonalMultiplier = getSeasonalMultiplier(weekStart, config.seasonalVariation);
      const eventsThisWeek = Math.round(baseEventsPerWeek * seasonalMultiplier * (0.5 + Math.random()));
      
      for (let i = 0; i < eventsThisWeek; i++) {
        const eventDate = getRandomDate(weekStart, weekEnd, config.weekendBias);
        const eventType = getRandomElement(eventTypes);
        const club = getRandomElement(clubsToUse);
        const zone = zonesToUse.find(z => z.id === club.zoneId)!;
        
        const eventNameTemplate = getRandomElement(EVENT_NAME_TEMPLATES[eventType.id as keyof typeof EVENT_NAME_TEMPLATES] || ['Event']);
        const eventName = `${eventNameTemplate} - ${club.name}`;
        
        const event: Event = {
          id: `test-event-${events.length + 1}`,
          name: eventName,
          date: eventDate,
          location: club.physicalAddress || club.name,
          description: `${eventType.name} event hosted by ${club.name}`,
          clubId: club.id,
          eventTypeId: eventType.id,
          status: getApprovalStatus(config.approvalDistribution),
          source: 'zone' as EventSource,
          coordinatorName: `Test Coordinator ${Math.floor(Math.random() * 100)}`,
          coordinatorContact: `coordinator${Math.floor(Math.random() * 100)}@example.com`,
          isQualifier: Math.random() < 0.3,
          notes: `Generated test data for ${eventType.name} event`
        };

        events.push(event);
        
        // Update statistics
        const year = eventDate.getFullYear().toString();
        result.eventsPerYear[year] = (result.eventsPerYear[year] || 0) + 1;
        result.eventsByType[eventType.name] = (result.eventsByType[eventType.name] || 0) + 1;
        result.eventsByZone[zone.name] = (result.eventsByZone[zone.name] || 0) + 1;
      }
    }

    result.totalEvents = events.length;

    // Add actual counts used
    const actualClubsUsed = new Set(events.map(e => e.clubId)).size;
    const actualZonesUsed = new Set(events.map(e => {
      const club = clubsToUse.find(c => c.id === e.clubId);
      return club?.zoneId;
    }).filter(Boolean)).size;

    // If dry run, return preview data
    if (config.dryRun) {
      result.generationTime = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        details: `Preview: Would generate ${events.length} events`,
        result: {
          ...result,
          previewData: {
            sampleEvents: events.slice(0, 5),
            totalEvents: events.length,
            actualClubsUsed: actualClubsUsed,
            actualZonesUsed: actualZonesUsed,
            dateRange: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] }
          }
        }
      });
    }

    // Create ZIP archive
    const zip = new JSZip();
    
    // Add core data files
    zip.file('events.json', JSON.stringify(events, null, 2));
    zip.file('clubs.json', JSON.stringify(clubsToUse, null, 2));
    zip.file('zones.json', JSON.stringify(zonesToUse, null, 2));
    zip.file('event-types.json', JSON.stringify(eventTypes, null, 2));

    // Generate schedule files
    if (config.includeSchedules) {
      const schedulesFolder = zip.folder('schedules');
      
      for (const event of events) {
        if (Math.random() * 100 < config.scheduleProbability) {
          const club = clubsToUse.find(c => c.id === event.clubId)!;
          const eventDate = new Date(event.date);
          const eventType = eventTypes.find(t => t.id === event.eventTypeId)!;
          
          try {
            const pdfBytes = await generateMockPDF(event.name, eventType.name, eventDate, club);
            const filename = `${event.id}-${event.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
            schedulesFolder?.file(filename, pdfBytes);
            result.scheduleFiles++;
          } catch (error) {
            console.error(`Failed to generate schedule for ${event.id}:`, error);
          }
        }
      }
    }

    // Create manifest
    const manifest = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalEvents: events.length,
      files: [] as Array<{ name: string; size: number; checksum: string }>,
      metadata: {
        exportedBy: 'Test Data Generator',
        appVersion: '1.2.0',
        includesSchedules: config.includeSchedules,
        generatedData: true,
        generationConfig: {
          years: config.years,
          eventsPerWeek: config.eventsPerWeek,
          zones: zonesToUse.length,
          clubs: clubsToUse.length,
          scheduleCoverage: config.scheduleProbability
        }
      }
    };

    // Calculate checksums for core files
    const coreFiles = ['events.json', 'clubs.json', 'zones.json', 'event-types.json'];
    for (const fileName of coreFiles) {
      const fileContent = zip.file(fileName)?.async('uint8array');
      if (fileContent) {
        const content = await fileContent;
        const hash = createHash('sha256').update(content).digest('hex');
        manifest.files.push({
          name: fileName,
          size: content.length,
          checksum: hash
        });
      }
    }

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Add README
    const readme = `# Test Data Archive

This ZIP archive contains synthetic test data generated by the MyPonyClubApp Event Manager.

## Contents
- events.json: ${events.length} generated events
- clubs.json: ${clubsToUse.length} club definitions
- zones.json: ${zonesToUse.length} zone definitions  
- event-types.json: ${eventTypes.length} event type definitions
- schedules/: ${result.scheduleFiles} mock PDF schedule files
- manifest.json: File integrity information

## Generation Parameters
- Time period: ${config.years} year(s)
- Average events per week: ${config.eventsPerWeek}
- Seasonal variation: ${config.seasonalVariation ? 'Enabled' : 'Disabled'}
- Weekend bias: ${config.weekendBias ? 'Enabled' : 'Disabled'}
- Schedule coverage: ${config.scheduleProbability}%

## Import Instructions
This archive is compatible with the Event Import Tool in the Admin Dashboard.
Navigate to /admin/testing/import-events to restore this data.

Generated: ${new Date().toISOString()}
Generator Version: 1.0.0
`;

    zip.file('README.md', readme);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Create download response with descriptive filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    // Build scope description
    let scopeDescription = '';
    if (config.selectedZones.length > 0) {
      const zoneNames = zonesToUse.map(z => z.name.replace(/[^a-zA-Z0-9]/g, '')).join('-');
      scopeDescription = `${zoneNames}-Zone`;
      if (config.selectedClubs.length > 0) {
        scopeDescription += `-${config.selectedClubs.length}clubs`;
      } else {
        scopeDescription += `-${actualClubsUsed}clubs`;
      }
    } else if (config.selectedClubs.length > 0) {
      scopeDescription = `${config.selectedClubs.length}clubs`;
    } else {
      scopeDescription = `All-${actualZonesUsed}zones-${actualClubsUsed}clubs`;
    }
    
    // Build spread description
    const spreadDescription = `${config.years}yr-${config.eventsPerWeek}perweek`;
    
    const filename = `PonyClub-TestData-${scopeDescription}-${spreadDescription}-${events.length}events-${timestamp}.zip`;

    result.generationTime = Date.now() - startTime;

    // Return the ZIP file as a download
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString(),
        'X-Generation-Result': JSON.stringify(result)
      }
    });

  } catch (error) {
    console.error('Test data generation error:', error);
    return NextResponse.json({
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      result: {
        success: false,
        totalEvents: 0,
        eventsPerYear: {},
        eventsByType: {},
        eventsByZone: {},
        scheduleFiles: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        generationTime: Date.now() - Date.now()
      }
    }, { status: 500 });
  }
}
