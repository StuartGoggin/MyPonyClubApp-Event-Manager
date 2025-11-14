export interface Approver {
  name: string;
  email: string;
  mobile: string;
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
  // New fields for external import
  docId?: number;
  syncGuid?: string;
  clubId?: string; // Now string to match new format
  image?: string;
  phoneNumber?: string;
  emailAddress?: string;
  totalRows?: number;
  distance?: number;
  // Address information
  address?: {
    address1?: string;
    address2?: string;
    address3?: string;
    town?: string;
    postcode?: string;
    county?: string;
    country?: string;
  };
  latlng?: {
    lat?: string;
    lng?: string;
  };
  // Legacy/compatibility fields
  physicalAddress?: string;
  postalAddress?: string;
  latitude?: number;
  longitude?: number;
  // ...existing code...
  
  // Contact information
  email?: string;
  phone?: string; // Direct phone number
  website?: string;
  websiteUrl?: string; // Alternative field name for compatibility
  
  // Social media - simplified structure
  socialMediaUrl?: string; // Primary social media URL like Facebook
  socialMedia?: { // Legacy structured social media - keep for backward compatibility
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  
  // Images
  logoUrl?: string;
  imageUrl?: string; // General club image
  images?: string[]; // Multiple images if needed
  
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
  
  // Facilities
  facilities?: {
    grounds?: {
      arenaCount?: number;
      arenaTypes?: string[];
      hasIndoorArena?: boolean;
      hasRoundYard?: boolean;
      hasCrossCountryTrack?: boolean;
      hasJumpingCourse?: boolean;
      hasDressageArenas?: boolean;
      hasStabling?: boolean;
      stablingCapacity?: number;
      hasClubhouse?: boolean;
    };
    equipment?: {
      jumps?: number;
      cavaletti?: number;
      dressageLetters?: boolean;
      firstAidKit?: boolean;
    };
    amenities?: {
      hasClubhouse?: boolean;
      hasCanteen?: boolean;
      hasToilets?: boolean;
      hasParking?: boolean;
      hasSpectatorArea?: boolean;
      hasWaterForHorses?: boolean;
      hasElectricity?: boolean;
      hasCamping?: boolean;
      isAccessible?: boolean;
    };
  };
  
  // Activities and programs
  activities?: {
    disciplines?: string[];
    ageGroups?: string[];
    competitionLevels?: string[];
    specialPrograms?: string[];
    hasAdultRiding?: boolean;
    hasLeadRein?: boolean;
    hasBeginnerProgram?: boolean;
    hasCompetitiveTeams?: boolean;
  };
  programs?: {
    certificateLevels?: string[];
    specialPrograms?: string[];
    hasAdultRiding?: boolean;
    hasLeadRein?: boolean;
    hasBeginnerProgram?: boolean;
    hasCompetitiveTeams?: boolean;
  };
  
  // Membership
  membership?: {
    totalMembers?: number;
    activeMembers?: number;
    juniorMembers?: number;
    adultMembers?: number;
    hasWaitingList?: boolean;
    fees?: {
      annual?: number;
      joining?: number;
      insurance?: number;
    };
  };
  
  // Operations
  operations?: {
    establishedYear?: number;
    membershipCapacity?: number;
    currentMemberCount?: number;
    hasWaitingList?: boolean;
    ageGroups?: string[];
    activeDays?: string[];
    seasonStart?: string;
    seasonEnd?: string;
  };
  
  // Events
  events?: {
    annualEvents?: string[];
    hostingCapability?: boolean;
    maxParticipants?: number;
  };
  
  // Communication
  communication?: {
    newsletter?: boolean;
    emailList?: string;
    notificationPreferences?: string[];
  };
  
  // Affiliation
  affiliation?: {
    pcaState?: string;
    pcaNational?: boolean;
    otherAffiliations?: string[];
  };
}

export interface EventType {
  id: string;
  name: string;
}

export type EventStatus = 'proposed' | 'approved' | 'rejected' | 'public_holiday';
export type EventSource = 'pca' | 'zone' | 'public_holiday';
export type EventScheduleStatus = 'missing' | 'pending' | 'approved' | 'rejected';

export interface AIReviewIssue {
  severity: 'high' | 'medium' | 'low';
  category: 'safety' | 'timing' | 'compliance' | 'content';
  description: string;
}

export interface ScheduleAIReview {
  summary: string;
  issues: AIReviewIssue[];
  suggestions: string[];
  overallScore: number; // 0-100
  compliant: boolean;
  reviewedAt: Date;
  model: string;
  rawResponse?: string;
}

export interface EventSchedule {
  id: string;
  eventId: string;
  fileUrl: string; // URL to the uploaded document
  fileType: string; // e.g., 'pdf', 'docx', 'doc', 'txt'
  fileName: string; // The actual filename stored in storage
  uploadedAt: Date;
  updatedAt?: Date;
  status: EventScheduleStatus;
  submittedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string; // Comments from reviewer (approval or rejection feedback)
  notes?: string;
  aiReview?: ScheduleAIReview; // AI-powered compliance review
}

// User Management Types
export type UserRole = 'standard' | 'zone_rep' | 'super_user';

export interface User {
  id: string;                      // Firestore document ID
  ponyClubId: string;             // Unique Pony Club identifier
  mobileNumber: string;           // Registered mobile phone number
  role: UserRole;                 // User's access level
  clubId: string;                 // Associated club ID
  zoneId: string;                 // Associated zone ID
  
  // Additional user information
  firstName?: string;
  lastName?: string;
  email?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  
  // Import tracking
  importedAt?: Date;
  importBatch?: string;           // Track which import batch this user came from
}

export interface UserImportRow {
  ponyClubId: string;
  mobileNumber: string;
  clubName: string;
  zoneName: string;
  role?: string; // Make role optional
  firstName?: string;
  lastName?: string;
  email?: string;
  membershipStatus?: string; // Added for membership status (active, historical, etc.)
}

export interface UserImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  updatedUsers?: number;
  createdUsers?: number;
  deactivatedUsers?: number; // Added for historical membership processing
  errors: UserImportError[];
  importBatch: string;
  importedAt: Date;
  changesSummary?: ImportChangesSummary; // Added for re-import analysis
}

export interface ImportChangesSummary {
  totalRows: number;
  newUsers: number;
  usersWithChanges: number;
  fieldChanges: {
    email: number;
    mobileNumber: number;
    firstName: number;
    lastName: number;
    clubId: number;
    other: number;
  };
  detailedChanges: UserDetailedChanges[];
}

export interface UserDetailedChanges {
  ponyClubId: string;
  changes: ChangedFields;
}

export interface ChangedFields {
  email?: FieldChange;
  mobileNumber?: FieldChange;
  firstName?: FieldChange;
  lastName?: FieldChange;
  clubId?: FieldChange;
}

export interface FieldChange {
  old: string;
  new: string;
}

export interface UserDataChanges {
  hasChanges: boolean;
  changedFields: ChangedFields;
}

export interface UserImportError {
  row: number;
  data: UserImportRow;
  error: string;
  field?: string;
}

// Authentication types
export interface LoginCredentials {
  ponyClubId: string;
  mobileNumber: string;
}

export interface AuthSession {
  userId: string;
  user: User;
  expiresAt: Date;
  createdAt: Date;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  // Event can be associated with either a club OR a zone
  clubId?: string;        // For club-specific events
  zoneId?: string;        // For zone-wide events
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

// Priority-based event request types
export type EventPriority = 1 | 2 | 3 | 4;

export interface EventRequestDetails {
  priority: EventPriority;
  name: string;
  eventTypeId: string;
  location: string;
  isQualifier?: boolean;
  isHistoricallyTraditional?: boolean;  // Track if this is a traditional event with historical date significance
  date: Date;  // Single preferred date for this event
  description?: string;
  coordinatorName?: string;
  coordinatorContact?: string;
  notes?: string;
}

export interface MultiEventRequest {
  id?: string;
  clubId: string;
  submittedBy: string;
  submittedByContact: string;
  events: EventRequestDetails[];  // Up to 4 events with priorities 1-4
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: Date;
  updatedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  generalNotes?: string;
}

// Legacy single event request interface for backward compatibility
export interface SingleEventRequest {
  id: string;
  clubId: string;
  name: string;
  eventTypeId: string;
  location: string;
  date: Date;  // Single date for backward compatibility
  coordinatorName?: string;
  coordinatorContact?: string;
  isQualifier?: boolean;
  isHistoricallyTraditional?: boolean;  // Historical significance flag
  notes?: string;
  submittedBy?: string;
  submittedByContact?: string;
  status: EventStatus;
}

// Email Queue Management Types
export type EmailStatus = 'draft' | 'pending' | 'sent' | 'failed' | 'cancelled';

export interface QueuedEmail {
  id: string;
  type?: 'event_request' | 'notification' | 'reminder' | 'general' | 'manual' | 'backup';
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
  scheduledFor?: Date;  // For delayed sending
  
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
  sentById?: string;  // Who actually sent it
  emailProvider?: 'resend' | 'fallback';
  externalEmailId?: string;  // Provider's email ID
  
  // Retry information
  retryCount?: number;
  lastRetryAt?: Date;
  maxRetries?: number;
  errorMessage?: string;
  lastError?: string; // Additional error tracking
  
  // Configuration
  priority?: 'low' | 'normal' | 'high';
  isPriority?: boolean;
  requiresApproval?: boolean;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  content?: string;  // Base64 encoded content
  url?: string;      // URL to download content (for large files)
  createdAt: Date;
}

export interface EmailQueueConfig {
  id?: string;
  
  // Queue settings
  maxRetries: number;
  retryDelayMinutes: number;
  maxQueueSize?: number;
  defaultPriority?: 'low' | 'normal' | 'high';
  
  // Approval settings
  requireApproval?: boolean; // General approval requirement
  requireApprovalForEventRequests?: boolean;
  requireApprovalForNotifications?: boolean;
  requireApprovalForReminders?: boolean;
  requireApprovalForGeneral?: boolean;
  requireApprovalForBackups?: boolean;
  
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
  preferredProvider?: 'resend' | 'fallback';
  fallbackOnFailure?: boolean;
  
  // Updated tracking
  updatedBy?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  type: 'event_request' | 'notification' | 'reminder' | 'general' | 'backup';
  subject: string;
  htmlContent: string;
  textContent: string;
  
  // Template variables available
  variables: string[];  // e.g., ['{{clubName}}', '{{eventName}}', '{{date}}']
  
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
  status: 'success' | 'error' | 'retry' | 'pending';
  message?: string;
  errorDetails?: string;
  processingTimeMs?: number;
  retryAttempt?: number;
}

// Notification System Types
export type NotificationTrigger = 
  | 'event_submitted' 
  | 'event_approved' 
  | 'event_rejected' 
  | 'event_updated' 
  | 'event_cancelled'
  | 'schedule_conflict'
  | 'approaching_deadline'
  | 'manual';

export type NotificationDeliveryMethod = 'email' | 'sms' | 'push' | 'webhook';

export type NotificationRecipientType = 
  | 'event_requester'
  | 'club_contacts'
  | 'zone_approvers'
  | 'admin_users'
  | 'custom_emails';

export interface NotificationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // Trigger configuration
  trigger: string; // Using string instead of NotificationTrigger to be more flexible
  conditions?: {
    eventTypes?: string[];
    zones?: string[];
    clubs?: string[];
    timeframe?: {
      start?: string; // ISO time string like "09:00"
      end?: string;   // ISO time string like "17:00"
    };
  };
  
  // Delivery configuration
  deliveryMethods: string[]; // Using string array to be more flexible
  recipients: {
    type: string; // Using string to be more flexible
    addresses?: string[]; // For custom emails
  }[];
  
  // Attachments
  attachments?: {
    includePDF?: boolean;
    includeJSON?: boolean;
  };
  
  // Template and content
  templateId?: string;
  customSubject?: string;
  customMessage?: string;
  
  // Timing
  delay?: number; // Minutes to delay after trigger
  retryAttempts?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: string; // Using string to be more flexible
  subject: string;
  htmlContent: string;
  textContent: string;
  
  // Available variables for this template
  variables: string[];
  
  // Metadata
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}

export interface NotificationConfig {
  id: string;
  name: string;
  description?: string;
  
  // Global settings
  enabled: boolean;
  defaultFromEmail: string;
  defaultFromName: string;
  replyToEmail?: string;
  
  // SMS settings
  smsEnabled: boolean;
  
  // Admin settings
  superUsers: string[];
  
  // Configuration data
  rules: NotificationRule[];
  templates: NotificationTemplate[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy: string;
}
