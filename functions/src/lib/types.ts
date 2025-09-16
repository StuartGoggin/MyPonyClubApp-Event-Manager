// Core types for Firebase Functions
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
export type EventStatus = 'proposed' | 'approved' | 'rejected' | 'public_holiday';
export type EventSource = 'pca' | 'event_secretary' | 'zone' | 'public_holiday';
export type EventScheduleStatus = 'missing' | 'pending' | 'approved' | 'rejected';
export type EventPriority = 1 | 2 | 3 | 4;

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
  reviewNotes?: string;
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
