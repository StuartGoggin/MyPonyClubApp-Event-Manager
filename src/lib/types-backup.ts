// Backup scheduling types
export interface BackupSchedule {
  id: string;
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  deliveryOptions: DeliveryConfig;
  exportConfig: ExportConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  createdBy: string;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  time: string; // HH:MM format
  timezone: string;
  customCron?: string; // For custom frequency
  weekday?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
}

export interface DeliveryConfig {
  method: 'email' | 'storage' | 'both';
  email?: EmailDeliveryConfig;
  storage?: StorageDeliveryConfig;
}

export interface EmailDeliveryConfig {
  recipients: string[];
  subject?: string;
  includeMetadata: boolean;
  maxFileSize: number; // MB
}

export interface StorageDeliveryConfig {
  provider: 'firebase' | 'aws-s3' | 'google-drive';
  path: string;
  retentionDays?: number;
  compress: boolean;
}

export interface ExportConfig {
  includeEvents: boolean;
  includeUsers: boolean;
  includeClubs: boolean;
  includeZones: boolean;
  includeEventTypes: boolean;
  includeSchedules: boolean;
  includeMetadata: boolean;
  includeManifest: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface BackupExecution {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  exportSize?: number; // bytes
  storagePath?: string; // Firebase Storage path
  downloadUrl?: string; // Signed URL for download
  deliveryStatus: {
    email?: 'pending' | 'sent' | 'failed';
    storage?: 'pending' | 'uploaded' | 'failed';
  };
  errorMessage?: string;
  metadata: {
    exportedRecords: {
      events: number;
      users: number;
      clubs: number;
      zones: number;
      eventTypes: number;
    };
    executionDuration: number; // milliseconds
    triggeredBy: 'schedule' | 'manual';
  };
}

export interface BackupStats {
  totalSchedules: number;
  activeSchedules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastSuccessfulBackup?: Date;
  nextScheduledBackup?: Date;
  totalBackupSize: number; // bytes
  averageBackupTime: number; // milliseconds
}