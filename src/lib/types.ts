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
  clubId?: number; // For external club IDs like from your JSON
  
  // Address information
  physicalAddress?: string; // Single field for full address like "Park Lane, Bealiba VIC 3475"
  postalAddress?: string; // Separate postal address if different
  latitude?: number;
  longitude?: number;
  address?: { // Legacy structured address - keep for backward compatibility
    street?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
  
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
export type EventSource = 'pca' | 'event_secretary' | 'zone' | 'public_holiday';
export type EventScheduleStatus = 'missing' | 'pending' | 'approved' | 'rejected';

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
  notes?: string;
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

  // Event schedule reference
  schedule?: EventSchedule;
}
