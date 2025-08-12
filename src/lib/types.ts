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
  latitude?: number;
  longitude?: number;
  address?: {
    street?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  logoUrl?: string;
  contactDetails?: {
    primaryContact: {
      name: string;
      role: string;
      email: string;
      phone?: string;
      mobile?: string;
    };
    secretary: {
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
  events?: {
    annualEvents?: string[];
    hostingCapability?: boolean;
    maxParticipants?: number;
  };
  communication?: {
    newsletter?: boolean;
    emailList?: string;
    notificationPreferences?: string[];
  };
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
