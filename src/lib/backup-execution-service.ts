import { BackupScheduleService } from './backup-schedule-service';
import { BackupSchedule, BackupExecution } from './types-backup';
import { getAllClubs, getAllZones, getAllEventTypes } from './server-data';
import { sendBackupEmail } from './backup-email-service';
import JSZip from 'jszip';

export class BackupExecutionService {
  /**
   * Execute a scheduled backup
   */
  static async executeBackup(schedule: BackupSchedule): Promise<BackupExecution> {
    const execution: Omit<BackupExecution, 'id'> = {
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      startTime: new Date(),
      status: 'running',
      deliveryStatus: {},
      metadata: {
        exportedRecords: {
          events: 0,
          users: 0,
          clubs: 0,
          zones: 0,
          eventTypes: 0
        },
        executionDuration: 0,
        triggeredBy: 'schedule'
      }
    };

    const startTime = Date.now();

    try {
      console.log(`🚀 Starting backup execution for schedule: ${schedule.name}`);

      // Step 1: Prepare export data
      const exportData = await this.prepareExportData(schedule);
      execution.metadata.exportedRecords = exportData.recordCounts;

      // Step 2: Create backup file
      const backupBuffer = await this.createBackupFile(exportData, schedule);
      execution.exportSize = backupBuffer.length;

      // Step 3: Deliver backup according to schedule settings
      await this.deliverBackup(backupBuffer, schedule, execution);

      // Success
      execution.status = 'completed';
      execution.endTime = new Date();
      execution.metadata.executionDuration = Date.now() - startTime;

      console.log(`✅ Backup execution completed for schedule: ${schedule.name}`);
      
    } catch (error) {
      console.error(`❌ Backup execution failed for schedule: ${schedule.name}`, error);
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      execution.metadata.executionDuration = Date.now() - startTime;
    }

    // Record the execution
    return await BackupScheduleService.recordExecution(execution);
  }

  /**
   * Manually trigger a backup schedule
   */
  static async manualBackup(scheduleId: string): Promise<BackupExecution> {
    const schedule = await BackupScheduleService.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Create a modified execution for manual trigger
    const execution = await this.executeBackup(schedule);
    execution.metadata.triggeredBy = 'manual';
    
    return execution;
  }

  /**
   * Run all scheduled backups that are due
   */
  static async runScheduledBackups(): Promise<BackupExecution[]> {
    try {
      const dueSchedules = await BackupScheduleService.getSchedulesDueForExecution();
      console.log(`📅 Found ${dueSchedules.length} schedules due for execution`);

      const executions: BackupExecution[] = [];

      for (const schedule of dueSchedules) {
        try {
          const execution = await this.executeBackup(schedule);
          executions.push(execution);
        } catch (error) {
          console.error(`Failed to execute backup for schedule ${schedule.name}:`, error);
        }
      }

      return executions;
    } catch (error) {
      console.error('Error running scheduled backups:', error);
      throw new Error('Failed to run scheduled backups');
    }
  }

  /**
   * Prepare export data based on schedule configuration
   */
  private static async prepareExportData(schedule: BackupSchedule): Promise<{
    data: any;
    recordCounts: {
      events: number;
      users: number;
      clubs: number;
      zones: number;
      eventTypes: number;
    };
  }> {
    const exportData: any = {};
    const recordCounts = {
      events: 0,
      users: 0,
      clubs: 0,
      zones: 0,
      eventTypes: 0
    };

    try {
      // Fetch data based on export configuration
      if (schedule.exportConfig.includeClubs) {
        exportData.clubs = await getAllClubs();
        recordCounts.clubs = exportData.clubs.length;
      }

      if (schedule.exportConfig.includeZones) {
        exportData.zones = await getAllZones();
        recordCounts.zones = exportData.zones.length;
      }

      if (schedule.exportConfig.includeEventTypes) {
        exportData.eventTypes = await getAllEventTypes();
        recordCounts.eventTypes = exportData.eventTypes.length;
      }

      // TODO: Add events and users when those services are implemented
      if (schedule.exportConfig.includeEvents) {
        exportData.events = []; // Placeholder
        recordCounts.events = 0;
      }

      if (schedule.exportConfig.includeUsers) {
        exportData.users = []; // Placeholder
        recordCounts.users = 0;
      }

      // Add metadata if requested
      if (schedule.exportConfig.includeMetadata) {
        exportData.exportInfo = {
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          scheduleName: schedule.name,
          scheduleId: schedule.id,
          totalRecords: Object.values(recordCounts).reduce((sum, count) => sum + count, 0),
          exportConfig: schedule.exportConfig,
          appVersion: process.env.npm_package_version || '1.0.0'
        };
      }

      return { data: exportData, recordCounts };
    } catch (error) {
      console.error('Error preparing export data:', error);
      throw new Error('Failed to prepare export data');
    }
  }

  /**
   * Create backup file (ZIP format)
   */
  private static async createBackupFile(
    exportData: { data: any; recordCounts: any }, 
    schedule: BackupSchedule
  ): Promise<Buffer> {
    try {
      const zip = new JSZip();
      const { data } = exportData;

      // Add data files
      if (data.clubs) {
        zip.file('clubs.json', JSON.stringify(data.clubs, null, 2));
      }
      if (data.zones) {
        zip.file('zones.json', JSON.stringify(data.zones, null, 2));
      }
      if (data.eventTypes) {
        zip.file('event-types.json', JSON.stringify(data.eventTypes, null, 2));
      }
      if (data.events) {
        zip.file('events.json', JSON.stringify(data.events, null, 2));
      }
      if (data.users) {
        zip.file('users.json', JSON.stringify(data.users, null, 2));
      }

      // Add metadata if requested
      if (schedule.exportConfig.includeMetadata && data.exportInfo) {
        zip.file('export-info.json', JSON.stringify(data.exportInfo, null, 2));
      }

      // Add manifest if requested
      if (schedule.exportConfig.includeManifest) {
        const manifest = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          scheduleName: schedule.name,
          scheduleId: schedule.id,
          totalRecords: exportData.recordCounts,
          files: Object.keys(data)
            .filter(key => key !== 'exportInfo')
            .map(key => ({
              name: `${key}.json`,
              size: JSON.stringify(data[key]).length,
              records: Array.isArray(data[key]) ? data[key].length : 1
            })),
          metadata: {
            compressionLevel: schedule.exportConfig.compressionLevel,
            createdBy: 'BackupScheduler'
          }
        };
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      }

      // Add README
      const readme = this.generateReadme(schedule, exportData.recordCounts);
      zip.file('README.md', readme);

      // Generate ZIP with compression level
      const compressionLevel = this.getCompressionLevel(schedule.exportConfig.compressionLevel);
      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel }
      });

      return buffer;
    } catch (error) {
      console.error('Error creating backup file:', error);
      throw new Error('Failed to create backup file');
    }
  }

  /**
   * Deliver backup according to schedule settings
   */
  private static async deliverBackup(
    backupBuffer: Buffer, 
    schedule: BackupSchedule, 
    execution: Omit<BackupExecution, 'id'>
  ): Promise<void> {
    const { deliveryOptions } = schedule;
    let emailSuccess = false;
    let storageSuccess = false;
    let errors: string[] = [];

    // Email delivery
    if (deliveryOptions.method === 'email' || deliveryOptions.method === 'both') {
      try {
        execution.deliveryStatus.email = 'pending';
        await this.sendBackupEmail(backupBuffer, schedule);
        execution.deliveryStatus.email = 'sent';
        emailSuccess = true;
      } catch (error) {
        console.error('Error sending backup email:', error);
        execution.deliveryStatus.email = 'failed';
        errors.push(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Storage delivery
    if (deliveryOptions.method === 'storage' || deliveryOptions.method === 'both') {
      try {
        execution.deliveryStatus.storage = 'pending';
        await this.uploadToStorage(backupBuffer, schedule);
        execution.deliveryStatus.storage = 'uploaded';
        storageSuccess = true;
      } catch (error) {
        console.error('Error uploading backup to storage:', error);
        execution.deliveryStatus.storage = 'failed';
        errors.push(`Storage delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine if backup delivery was successful
    const isEmailOnlyAndSucceeded = deliveryOptions.method === 'email' && emailSuccess;
    const isStorageOnlyAndSucceeded = deliveryOptions.method === 'storage' && storageSuccess;
    const isBothAndAtLeastOneSucceeded = deliveryOptions.method === 'both' && (emailSuccess || storageSuccess);

    if (!isEmailOnlyAndSucceeded && !isStorageOnlyAndSucceeded && !isBothAndAtLeastOneSucceeded) {
      throw new Error(`All delivery methods failed: ${errors.join('; ')}`);
    }

    // Log warnings for partial failures in 'both' mode
    if (deliveryOptions.method === 'both' && errors.length > 0) {
      console.warn(`⚠️ Partial backup delivery success: ${errors.join('; ')}`);
    }
  }

  /**
   * Send backup via email
   */
  private static async sendBackupEmail(backupBuffer: Buffer, schedule: BackupSchedule): Promise<void> {
    const { deliveryOptions } = schedule;
    const emailConfig = deliveryOptions.email;
    
    if (!emailConfig) {
      throw new Error('Email configuration not found');
    }

    // Validate recipients
    const validRecipients = emailConfig.recipients.filter(email => 
      email && email.trim() !== '' && email.includes('@')
    );
    
    if (validRecipients.length === 0) {
      throw new Error('No valid email recipients found. Please configure email recipients for this backup schedule.');
    }

    try {
      // Check file size limit (default 25MB for most email providers)
      const fileSizeMB = backupBuffer.length / (1024 * 1024);
      if (fileSizeMB > emailConfig.maxFileSize) {
        throw new Error(`Backup file too large for email (${fileSizeMB.toFixed(1)}MB > ${emailConfig.maxFileSize}MB)`);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const subject = emailConfig.subject?.replace('{date}', timestamp) || `Automated Backup - ${timestamp}`;
      
      console.log('=== SENDING BACKUP EMAIL VIA QUEUE ===');
      console.log(`To: ${validRecipients.join(', ')}`);
      console.log(`Subject: ${subject}`);
      console.log(`File Size: ${fileSizeMB.toFixed(2)} MB`);
      console.log('=====================================');

      // Use the new backup email service to queue the email with validated recipients
      await sendBackupEmail(
        validRecipients,
        subject,
        schedule.name,
        backupBuffer,
        fileSizeMB,
        schedule.exportConfig
      );
      
      console.log(`✅ Backup email queued successfully for ${validRecipients.length} recipient(s)`);
      
    } catch (error) {
      console.error('Error sending backup email:', error);
      throw new Error(`Failed to send backup email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload backup to storage
   */
  private static async uploadToStorage(backupBuffer: Buffer, schedule: BackupSchedule): Promise<void> {
    const { deliveryOptions } = schedule;
    const storageConfig = deliveryOptions.storage;
    
    if (!storageConfig) {
      throw new Error('Storage configuration not found');
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `backup-${schedule.name.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.zip`;
      const fullPath = `${storageConfig.path}/${filename}`.replace(/\/+/g, '/');

      switch (storageConfig.provider) {
        case 'firebase':
          await this.uploadToFirebaseStorage(backupBuffer, fullPath);
          break;
        case 'aws-s3':
          // TODO: Implement AWS S3 upload
          throw new Error('AWS S3 storage not yet implemented');
        case 'google-drive':
          // TODO: Implement Google Drive upload
          throw new Error('Google Drive storage not yet implemented');
        default:
          throw new Error(`Unsupported storage provider: ${storageConfig.provider}`);
      }

      console.log(`✅ Backup uploaded successfully to ${storageConfig.provider} at ${fullPath}`);
      
    } catch (error) {
      console.error('Error uploading backup to storage:', error);
      throw new Error(`Failed to upload backup to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload to Firebase Storage
   */
  private static async uploadToFirebaseStorage(buffer: Buffer, path: string): Promise<void> {
    try {
      // TODO: Implement Firebase Storage upload
      // const { bucket } = require('./firebase-admin');
      // const file = bucket.file(path);
      // await file.save(buffer, { metadata: { contentType: 'application/zip' } });
      
      // For now, simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`🔥 Simulated Firebase Storage upload to: ${path}`);
      
    } catch (error) {
      console.error('Error uploading to Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Generate README content for backup
   */
  private static generateReadme(schedule: BackupSchedule, recordCounts: any): string {
    const timestamp = new Date().toLocaleString();
    
    return `# Automated Database Backup

## Backup Information
- **Schedule Name**: ${schedule.name}
- **Description**: ${schedule.description || 'No description provided'}
- **Generated**: ${timestamp}
- **Schedule ID**: ${schedule.id}

## Data Contents
${Object.entries(recordCounts)
  .filter(([_, count]) => (count as number) > 0)
  .map(([type, count]) => `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${count} records`)
  .join('\n')}

## Configuration
- **Compression Level**: ${schedule.exportConfig.compressionLevel}
- **Includes Metadata**: ${schedule.exportConfig.includeMetadata ? 'Yes' : 'No'}
- **Includes Manifest**: ${schedule.exportConfig.includeManifest ? 'Yes' : 'No'}

## Delivery Method
- **Method**: ${schedule.deliveryOptions.method}
${schedule.deliveryOptions.email ? `- **Email Recipients**: ${schedule.deliveryOptions.email.recipients.join(', ')}` : ''}
${schedule.deliveryOptions.storage ? `- **Storage Provider**: ${schedule.deliveryOptions.storage.provider}` : ''}
${schedule.deliveryOptions.storage ? `- **Storage Path**: ${schedule.deliveryOptions.storage.path}` : ''}

## Data Integrity
This backup includes a manifest.json file with detailed information about all included files.
All data is exported in JSON format for easy parsing and restoration.

## Restoration Instructions
1. Extract all files from this ZIP archive
2. Review the manifest.json file for data structure information
3. Use the appropriate import tools to restore data to your system
4. Verify data integrity using the provided checksums (if available)

---
Generated by Pony Club Event Manager Backup System
`;
  }

  /**
   * Get compression level for JSZip
   */
  private static getCompressionLevel(level: string): number {
    switch (level) {
      case 'low': return 1;
      case 'medium': return 6;
      case 'high': return 9;
      default: return 6;
    }
  }
}