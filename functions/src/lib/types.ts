// Core types for Firebase Functions
export interface Approver {
  name: string;
  email: string;
  mobile: string;
}

export type UserRole = "standard" | "club_manager" | "zone_rep" | "state_admin" | "super_user";

export interface User {
  id: string; // Firestore document ID
  ponyClubId: string; // Unique Pony Club identifier
  mobileNumber: string; // Registered mobile phone number
  role: UserRole; // User"s primary access level (legacy, deprecated)
  roles: UserRole[]; // User"s access levels (supports multiple roles)
  clubId: string; // Associated club ID
  zoneId: string; // Associated zone ID

  // Additional user information
  firstName?: string;
  lastName?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  membershipNumber?: string;
  dateOfBirth?: string;

  // Audit fields
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;

  // Import tracking
  importedAt?: string;
  importBatch?: string; // Track which import batch this user came from
}

export interface Zone {
  id: string;
  name: string;
  streetAddress?: string;
  imageUrl?: string;
  secretary?: Approver;
  eventApprovers?: Approver[];
  scheduleApprovers?: Approver[];
}

export interface Club {
  id: string;
  name: string;
  zoneId: string;
  zoneName?: string; // Optional zone name for display purposes
  clubId?: number;

  // Address information
  physicalAddress?: string;
  postalAddress?: string;
  latitude?: number;
  longitude?: number;

  // Contact information
  email?: string;
  phone?: string;
  website?: string;
  websiteUrl?: string;

  // Social media
  socialMediaUrl?: string;

  // Images
  logoUrl?: string;
  imageUrl?: string;
  images?: string[];

  // Contact details
  contactDetails?: {
    primaryContact?: {
      name: string;
      role: string;
      email: string;
      phone?: string;
      mobile?: string;
    };
    secretary?: {
      name: string;
      email: string;
      phone?: string;
      mobile?: string;
    };
    chiefInstructor?: {
      name: string;
      email: string;
      mobile?: string;
      qualifications?: string[];
    };
  };

  // Status fields
  isActive?: boolean;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Event related types
export interface EventType {
  id: string;
  name: string;
  description?: string;
  color?: string;
  requiresApproval?: boolean;
  defaultDuration?: number;
}

export type EventStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "public_holiday";
export type EventSource = "pca" | "zone" | "public_holiday";
export type EventScheduleStatus =
  | "missing"
  | "pending"
  | "approved"
  | "rejected";
export type EventPriority = 1 | 2 | 3 | 4;

export interface EventSchedule {
  id: string;
  eventId: string;
  fileUrl: string; // URL to the uploaded document
  fileType: string; // e.g., "pdf", "docx", "doc", "txt"
  fileName: string; // The actual filename stored in storage
  uploadedAt: Date;
  updatedAt?: Date;
  status: EventScheduleStatus;
  submittedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  // Event can be associated with either a club OR a zone
  clubId?: string; // For club-specific events
  zoneId?: string; // For zone-wide events
  eventTypeId: string;
  status: EventStatus;
  location: string;
  source: EventSource;

  description?: string;
  // New fields from form
  coordinatorName?: string;
  coordinatorContact?: string;
  isQualifier?: boolean;
  notes?: string;
  submittedBy?: string;
  submittedByContact?: string;

  // Priority and historical traditional event fields
  priority?: EventPriority;
  isHistoricallyTraditional?: boolean;

  // Event schedule reference
  schedule?: EventSchedule;
}

// Email Queue Management Types
export type EmailStatus = "draft" | "pending" | "sent" | "failed" | "cancelled";

export interface QueuedEmail {
  id: string;
  type?: "event_request" | "notification" | "reminder" | "general" | "manual";
  status: EmailStatus;

  // Email content
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string; // For backward compatibility
  htmlContent?: string;
  textContent?: string;

  // Attachments
  attachments?: EmailAttachment[];

  // Metadata
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledFor?: Date; // For delayed sending

  // Related data
  relatedEventRequestId?: string;
  relatedClubId?: string;
  relatedZoneId?: string;
  metadata?: Record<string, any>;

  // Approval workflow
  lastEditedBy?: string;
  lastEditedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Sending details
  sentAt?: Date;
  sentById?: string; // Who actually sent it
  emailProvider?: "resend" | "fallback";
  externalEmailId?: string; // Provider"s email ID

  // Retry information
  retryCount?: number;
  lastRetryAt?: Date;
  maxRetries?: number;
  errorMessage?: string;
  lastError?: string; // Additional error tracking

  // Configuration
  priority?: "low" | "normal" | "high";
  isPriority?: boolean;
  requiresApproval?: boolean;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  content?: string; // Base64 encoded content
  url?: string; // URL to download content (for large files)
  createdAt: Date;
}

export interface EmailQueueConfig {
  id?: string;

  // Queue settings
  maxRetries: number;
  retryDelayMinutes: number;
  maxQueueSize?: number;
  defaultPriority?: "low" | "normal" | "high";

  // Approval settings
  requireApproval?: boolean; // General approval requirement
  requireApprovalForEventRequests?: boolean;
  requireApprovalForNotifications?: boolean;
  requireApprovalForReminders?: boolean;
  requireApprovalForGeneral?: boolean;

  // Feature settings
  enableScheduling?: boolean;
  emailTemplatesEnabled?: boolean;
  adminNotificationEmails?: string[];

  // Auto-send settings
  autoSendScheduledEmails?: boolean;
  autoSendAfterApprovalMinutes?: number;

  // Notification settings
  notifyAdminsOnFailure?: boolean;
  notifyAdminsOnLargeQueue?: boolean;
  largeQueueThreshold?: number;

  // Archive settings
  archiveSuccessfulAfterDays?: number;
  archiveFailedAfterDays?: number;

  // SMTP settings
  smtpSettings?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;

  // Email provider settings
  preferredProvider?: "resend" | "fallback";
  fallbackOnFailure?: boolean;

  // Updated tracking
  updatedBy?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: "event_request" | "notification" | "reminder" | "general";
  subject: string;
  htmlContent: string;
  textContent: string;

  // Template variables available
  variables: string[]; // e.g., ["{{clubName}}", "{{eventName}}", "{{date}}"]

  // Metadata
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

export interface EmailQueueStats {
  total: number;
  draft: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;

  // Time-based stats
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;

  // Performance stats
  averageProcessingTimeMinutes: number;
  successRate: number;
  mostRecentFailure?: Date;
  oldestPendingEmail?: Date;
}

export interface EmailLog {
  id: string;
  emailId?: string;
  timestamp: Date;
  subject?: string;
  recipients?: string[] | string;
  status: "success" | "error" | "retry" | "pending";
  message?: string;
  errorDetails?: string;
  processingTimeMs?: number;
  retryAttempt?: number;
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Import types
export interface ClubJsonData {
  id?: string;
  name: string;
  zoneId: string;
  physicalAddress?: string;
  email?: string;
  phone?: string;
  website?: string;
  [key: string]: any;
}
