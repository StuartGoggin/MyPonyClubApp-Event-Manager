import { Request, Response } from 'express';
import { logger } from 'firebase-functions/v2';
import JSZip from 'jszip';
import { checkAdminAccess } from '../../lib/auth-middleware';
import { getAllClubs, getAllZones } from '../../lib/server-data';
import type { EventType, Event } from '../../lib/types';

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

export async function exportData(req: Request, res: Response) {
  try {
    // Check admin authentication
    const { authorized, user } = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn('Unauthorized access attempt to admin data export');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    logger.info('Admin data export requested', { 
      adminUser: user?.email,
      config: req.body 
    });

    const config: ExportConfig = req.body || {};

    // Get all data from database
    const [clubs, zones] = await Promise.all([
      getAllClubs(),
      getAllZones()
    ]);

    // Placeholder data for events and event types (to be implemented)
    const events: Event[] = [];
    const eventTypes: EventType[] = [];

    // Filter events based on configuration (placeholder - no events yet)
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
        applicationVersion: process.env.npm_package_version || '1.0.0',
        exportedBy: user?.email || 'admin'
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

    // Add manifest if requested
    if (config.includeManifest) {
      const manifest = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalEvents: filteredEvents.length,
        files: [
          { name: 'events.json', size: JSON.stringify(exportData.events).length },
          { name: 'clubs.json', size: JSON.stringify(exportData.clubs).length },
          { name: 'zones.json', size: JSON.stringify(exportData.zones).length },
          { name: 'event-types.json', size: JSON.stringify(exportData.eventTypes).length }
        ],
        metadata: {
          exportedBy: user?.email || 'admin',
          appVersion: '1.0.0',
          includesSchedules: config.includeSchedules || false
        }
      };
      
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    }

    // Generate ZIP file
    const compressionLevel = getCompressionLevel(config.compressionLevel);
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: compressionLevel }
    });

    logger.info('Data export completed', { 
      totalEvents: filteredEvents.length,
      zipSize: zipBuffer.length,
      adminUser: user?.email 
    });

    // Set response headers for file download
    const filename = `ponyclub-export-${new Date().toISOString().split('T')[0]}.zip`;
    
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': zipBuffer.length.toString()
    });

    return res.send(zipBuffer);

  } catch (error) {
    logger.error('Data export error', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return res.status(500).json({
      error: 'Failed to export data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateReadme(exportInfo: any, eventCount: number): string {
  return `# PonyClub Event Data Export

## Export Information
- **Exported At**: ${exportInfo.exportedAt}
- **Version**: ${exportInfo.version}
- **Total Events**: ${eventCount}
- **Exported By**: ${exportInfo.exportedBy}

## Files Included
- \`events.json\` - Event data
- \`clubs.json\` - Club information
- \`zones.json\` - Zone data
- \`event-types.json\` - Event type definitions
- \`export-info.json\` - Export metadata

## Usage
This export contains PonyClub event management data in JSON format.
Import this data using the admin import functionality.

Generated by PonyClub Event Manager v${exportInfo.applicationVersion}
`;
}

function getCompressionLevel(level?: string): number {
  switch (level) {
    case 'low': return 1;
    case 'medium': return 5;
    case 'high': return 9;
    default: return 5;
  }
}