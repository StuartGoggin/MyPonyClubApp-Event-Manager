// Email template management types
export type EmailTemplateType = 
  | 'event-request-requester'      // Email sent to the person who created the event request
  | 'event-request-zone-manager'   // Email sent to zone managers/approvers
  | 'event-request-club-admin'     // Email sent to club administrators
  | 'event-request-super-user';    // Email sent to super users

export type EmailTemplateStatus = 'draft' | 'active' | 'archived';

export interface EmailTemplateVariable {
  key: string;                     // Variable key like {{requesterName}}
  name: string;                    // Human readable name
  description: string;             // Description of what this variable contains
  type: 'string' | 'date' | 'array' | 'object' | 'boolean';
  required: boolean;               // Whether this variable is required
  defaultValue?: string;           // Default value if not provided
}

export interface EmailTemplateContent {
  subject: string;                 // Email subject line with variable placeholders
  htmlBody: string;               // HTML email content
  textBody: string;               // Plain text email content
  previewText?: string;           // Email preview text (for email clients)
}

export interface EmailTemplateAttachment {
  id: string;                     // Unique attachment identifier
  name: string;                   // Display name for the attachment
  type: 'pdf-form' | 'json-data' | 'custom'; // Type of attachment
  description: string;            // Description of attachment content
  enabled: boolean;               // Whether to include this attachment
  filename?: string;              // Custom filename override
}

export interface EmailTemplateAttachmentSettings {
  eventRequestPdf?: EmailTemplateAttachment;    // Event request PDF form
  eventDataJson?: EmailTemplateAttachment;      // Event data JSON export
  customAttachments?: EmailTemplateAttachment[]; // Additional custom attachments
}

export interface EmailTemplate {
  id: string;                     // Unique template ID
  name: string;                   // Display name for the template
  description: string;            // Description of template purpose
  type: EmailTemplateType;        // Template type/category
  status: EmailTemplateStatus;    // Template status
  content: EmailTemplateContent; // Template content
  variables: EmailTemplateVariable[]; // Available variables for this template
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;              // User ID who created the template
  lastModifiedBy: string;         // User ID who last modified
  version: number;                // Template version number
  
  // Template settings
  isDefault: boolean;             // Whether this is the default template for its type
  attachments?: EmailTemplateAttachmentSettings;
  
  // Scheduling/sending settings
  sendSettings?: {
    sendImmediately: boolean;     // Send immediately or queue
    delay?: number;               // Delay in minutes before sending
    maxRetries: number;           // Maximum retry attempts
  };
}

export interface EmailTemplateVariableData {
  // Event request data
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  clubName: string;
  clubId: string;
  zoneName: string;
  zoneId: string;
  submissionDate: string;
  referenceNumber: string;
  
  // Event details
  events: Array<{
    priority: number;
    name: string;
    eventTypeName: string;
    date: string;
    location: string;
    isQualifier: boolean;
    isHistoricallyTraditional: boolean;
    coordinatorName?: string;
    coordinatorContact?: string;
    notes?: string;
  }>;
  
  // Additional context
  generalNotes?: string;
  isForSuperUser?: boolean;
  
  // System data
  systemUrl: string;
  supportEmail: string;
  organizationName: string;
  
  // Recipient specific
  recipientName?: string;
  recipientRole?: string;
}

export interface EmailTemplateRenderOptions {
  templateId: string;
  variables: EmailTemplateVariableData;
  recipientType: 'requester' | 'zone-manager' | 'club-admin' | 'super-user';
}

export interface EmailTemplateRenderResult {
  subject: string;
  htmlBody: string;
  textBody: string;
  previewText?: string;
  attachments?: EmailTemplateAttachmentSettings;
}

// Template creation/update requests
export interface CreateEmailTemplateRequest {
  name: string;
  description: string;
  type: EmailTemplateType;
  content: EmailTemplateContent;
  variables?: EmailTemplateVariable[];
  attachments?: EmailTemplateAttachmentSettings;
  sendSettings?: EmailTemplate['sendSettings'];
  isDefault?: boolean;
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {
  status?: EmailTemplateStatus;
}

// Template search/filter options
export interface EmailTemplateFilters {
  type?: EmailTemplateType;
  status?: EmailTemplateStatus;
  isDefault?: boolean;
  search?: string;                // Search in name/description
}

export interface EmailTemplateSortOptions {
  field: 'name' | 'type' | 'createdAt' | 'updatedAt' | 'version';
  direction: 'asc' | 'desc';
}