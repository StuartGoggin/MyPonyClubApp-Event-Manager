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
