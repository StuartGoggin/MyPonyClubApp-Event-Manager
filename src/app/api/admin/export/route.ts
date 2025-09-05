import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents, getAllClubs, getAllZones, getAllEventTypes } from '@/lib/server-data';
import JSZip from 'jszip';
import crypto from 'crypto';
import * as admin from 'firebase-admin';

interface ExportConfig {
  eventTypes?: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  includeSchedules?: boolean;
  includeMetadata?: boolean;
  includeManifest?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

export async function POST(request: NextRequest) {
  try {
    const config: ExportConfig = await request.json();
    
    // Get all data from database
    const [events, clubs, zones, eventTypes] = await Promise.all([
      getAllEvents(),
      getAllClubs(),
      getAllZones(),
      getAllEventTypes()
    ]);

    // Filter events based on configuration
    let filteredEvents = events;

    // Filter by event types
    if (config.eventTypes && config.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        config.eventTypes!.includes(event.eventTypeId)
      );
    }

    // Filter by date range
    if (config.dateRange?.start || config.dateRange?.end) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        const startDate = config.dateRange?.start ? new Date(config.dateRange.start) : null;
        const endDate = config.dateRange?.end ? new Date(config.dateRange.end) : null;

        if (startDate && eventDate < startDate) return false;
        if (endDate && eventDate > endDate) return false;
        return true;
      });
    }

    // Create ZIP archive
    const zip = new JSZip();
    
    // Add main data files
    const exportData = {
      events: filteredEvents,
      clubs: clubs,
      zones: zones,
      eventTypes: eventTypes,
      exportInfo: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        totalEvents: filteredEvents.length,
        filters: config,
        applicationVersion: process.env.npm_package_version || '1.0.0'
      }
    };

    zip.file('events.json', JSON.stringify(exportData.events, null, 2));
    zip.file('clubs.json', JSON.stringify(exportData.clubs, null, 2));
    zip.file('zones.json', JSON.stringify(exportData.zones, null, 2));
    zip.file('event-types.json', JSON.stringify(exportData.eventTypes, null, 2));

    // Add metadata if requested
    if (config.includeMetadata) {
      zip.file('export-info.json', JSON.stringify(exportData.exportInfo, null, 2));
      
      // Add README with export details
      const readme = generateReadme(exportData.exportInfo, filteredEvents.length);
      zip.file('README.md', readme);
    }

    // Add schedule files if requested
    if (config.includeSchedules) {
      const schedulesFolder = zip.folder('schedules');
      
      for (const event of filteredEvents) {
        if (event.schedule?.fileUrl) {
          try {
            console.log(`📄 Downloading schedule for event: ${event.name} from ${event.schedule.fileUrl}`);
            
            // Download the file from Firebase Storage or external URL with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch(event.schedule.fileUrl, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const fileBuffer = await response.arrayBuffer();
              const fileExtension = event.schedule.fileType || 'pdf';
              const fileName = `${event.id}-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
              
              schedulesFolder?.file(fileName, fileBuffer);
              console.log(`✅ Added schedule file: ${fileName}`);
            } else {
              console.warn(`⚠️ Failed to download schedule for ${event.name}: ${response.status} ${response.statusText}`);
              // Add error placeholder
              schedulesFolder?.file(
                `${event.id}-schedule-error.txt`, 
                `Failed to download schedule file for event: ${event.name}\nOriginal URL: ${event.schedule.fileUrl}\nError: ${response.status} ${response.statusText}`
              );
            }
          } catch (error) {
            console.error(`❌ Error downloading schedule for ${event.name}:`, error);
            // Add error placeholder
            const errorMessage = error instanceof Error && error.name === 'AbortError' 
              ? 'Download timeout (30 seconds exceeded)'
              : error instanceof Error ? error.message : 'Unknown error';
              
            schedulesFolder?.file(
              `${event.id}-schedule-error.txt`, 
              `Error downloading schedule file for event: ${event.name}\nOriginal URL: ${event.schedule.fileUrl}\nError: ${errorMessage}`
            );
          }
        }
      }
    }

    // Generate manifest with checksums if requested
    if (config.includeManifest) {
      const manifest = await generateManifest(zip, exportData);
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    }

    // Set compression level
    const compressionOptions = {
      low: { level: 1 },
      medium: { level: 6 },
      high: { level: 9 }
    };

    const compression = compressionOptions[config.compressionLevel || 'medium'];

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: compression
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `events-export-${timestamp}.zip`;

    // Return the ZIP file
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
        'X-Export-Info': JSON.stringify({
          eventCount: filteredEvents.length,
          fileSize: formatFileSize(zipBuffer.byteLength),
          filename: filename
        })
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

function generateReadme(exportInfo: any, eventCount: number): string {
  return `# Event Data Export

## Export Information
- **Exported At:** ${exportInfo.exportedAt}
- **Export Version:** ${exportInfo.version}
- **Application Version:** ${exportInfo.applicationVersion}
- **Total Events:** ${eventCount}

## Contents
- \`events.json\` - All event definitions
- \`clubs.json\` - Club information
- \`zones.json\` - Zone definitions
- \`event-types.json\` - Event type configurations
- \`schedules/\` - Original schedule files (PDFs, etc.) downloaded from Firebase Storage
- \`manifest.json\` - File integrity manifest (if included)

## Schedule Files
The schedules folder contains the actual uploaded schedule files in their original format.
Files are named as: \`{eventId}-{eventName}.{extension}\`
If a schedule file could not be downloaded, an error file will be created instead.

## Filters Applied
${exportInfo.filters.eventTypes?.length ? 
  `- Event Types: ${exportInfo.filters.eventTypes.join(', ')}` : 
  '- Event Types: All types included'}
${exportInfo.filters.dateRange?.start ? 
  `- Start Date: ${exportInfo.filters.dateRange.start}` : ''}
${exportInfo.filters.dateRange?.end ? 
  `- End Date: ${exportInfo.filters.dateRange.end}` : ''}

## Data Integrity
${exportInfo.filters.includeManifest ? 
  'This export includes a manifest.json file with SHA-256 checksums for all files to verify data integrity.' :
  'No integrity manifest was generated for this export.'}

## Re-import Instructions
This export is designed to be self-contained and can be used to restore or migrate event data.
All dependencies and metadata required for full restoration are included.
Schedule files are in their original format and can be viewed with appropriate applications.
`;
}

async function generateManifest(zip: JSZip, exportData: any): Promise<any> {
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    files: {} as Record<string, { size: number; checksum: string; type: string }>,
    summary: {
      totalFiles: 0,
      totalSize: 0,
      dataIntegrity: 'SHA-256'
    }
  };

  // Calculate checksums for each file in the zip
  const files = Object.keys(zip.files);
  
  for (const filename of files) {
    if (!zip.files[filename].dir) {
      const content = await zip.files[filename].async('arraybuffer');
      const buffer = Buffer.from(content);
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      
      manifest.files[filename] = {
        size: buffer.length,
        checksum: checksum,
        type: filename.endsWith('.json') ? 'application/json' : 
              filename.endsWith('.md') ? 'text/markdown' : 'text/plain'
      };
      
      manifest.summary.totalFiles++;
      manifest.summary.totalSize += buffer.length;
    }
  }

  return manifest;
}

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
