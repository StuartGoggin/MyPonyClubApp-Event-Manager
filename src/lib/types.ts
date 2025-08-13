export interface Zone {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  zoneId: string;
  latitude?: number;
  longitude?: number;
  
  // Physical Address
  address?: {
    street?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
  
  // Contact & Communication
  email?: string;
  website?: string;
  
  // Social Media
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  
  // Branding
  logoUrl?: string;
  
  // Additional metadata from extended structure (keeping for future use)
  contactDetails?: {
    primaryContact?: {
      name: string;
      role: string;
      email?: string;
      phone?: string;
      mobile?: string;
    };
    secretary?: {
      name: string;
      email?: string;
      phone?: string;
      mobile?: string;
    };
    treasurer?: {
      name: string;
      email?: string;
      phone?: string;
    };
    chiefInstructor?: {
      name: string;
      email?: string;
      phone?: string;
      mobile?: string;
      qualifications?: string[];
    };
  };
  
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
    };
    amenities?: {
      hasClubhouse?: boolean;
      hasCanteen?: boolean;
      hasToilets?: boolean;
      hasParking?: boolean;
      hasWaterForHorses?: boolean;
      hasElectricity?: boolean;
      hasCamping?: boolean;
      isAccessible?: boolean;
    };
  };
  
  operations?: {
    establishedYear?: number;
    membershipCapacity?: number;
    currentMemberCount?: number;
    ageGroups?: string[];
    activeDays?: string[];
    seasonStart?: string;
    seasonEnd?: string;
    hasWaitingList?: boolean;
  };
  
  programs?: {
    certificateLevels?: string[];
    specialPrograms?: string[];
    hasAdultRiding?: boolean;
    hasLeadRein?: boolean;
    hasBeginnerProgram?: boolean;
    hasCompetitiveTeams?: boolean;
  };
  
  registration?: {
    pcaNumber?: string;
    insuranceProvider?: string;
    insuranceExpiry?: Date;
    lastInspectionDate?: Date;
    nextInspectionDue?: Date;
    riskAssessmentCurrent?: boolean;
  };
  
  administration?: {
    yearlyMembershipFee?: number;
    joiningFee?: number;
    lessonFees?: {
      casual?: number;
      member?: number;
    };
    bankDetails?: {
      accountName?: string;
      bsb?: string;
      accountNumber?: string;
    };
    abnNumber?: string;
  };
  
  communication?: {
    newsletter?: boolean;
    emailList?: string;
  };
  
  metadata?: {
    specialFeatures?: string[];
    restrictions?: string[];
    notes?: string;
    lastUpdated?: Date;
    dataSource?: string;
  };
}

export interface EventType {
  id: string;
  name: string;
}

export type EventStatus = 'proposed' | 'approved' | 'rejected' | 'public_holiday';
export type EventSource = 'pca' | 'event_secretary' | 'zone' | 'public_holiday';

export interface Event {
  id:string;
  name: string;
  date: Date;
  clubId: string;
  eventTypeId: string;
  status: EventStatus;
  location: string;
  source: EventSource;

  // New fields from form
  coordinatorName?: string;
  coordinatorContact?: string;
  isQualifier?: boolean;
  notes?: string;
  submittedBy?: string;
  submittedByContact?: string;
}
