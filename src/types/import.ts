// Import/Export related type definitions

export interface ImportPreviewResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  errorRows: number;
  summary: {
    clubsFound: string[];
    zonesFound: string[];
    rolesFound: string[];
    missingMobileNumbers: number;
    missingClubNames: number;
    usersWithEmail: number;
    historicalMemberships: number;
    duplicatePonyClubIds: string[];
    // Mapping statistics
    mappedClubs: string[];
    mappedZones: string[];
    successfulClubMappings: number;
    successfulZoneMappings: number;
    totalClubsWithMappings: number;
    totalZonesWithMappings: number;
  };
  sampleData: Array<{
    ponyClubId: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    originalClubName?: string;
    mappedClubName?: string;
    originalZoneName?: string;
    mappedZoneName?: string;
    role: string;
    email?: string;
    membershipStatus?: string;
  }>;
  validRowsData: Array<{
    ponyClubId: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    clubName?: string;
    zoneName?: string;
    role?: string;
    email?: string;
    membershipStatus?: string;
  }>;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  parseErrors: string[];
}