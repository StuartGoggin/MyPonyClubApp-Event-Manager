import { Club } from './types';

/**
 * Interface for the club data from your JSON file
 */
export interface ClubJsonData {
  club_id: number;
  club_name: string;
  zone: string;
  physical_address: string;
  postal_address: string;
  email: string;
  phone: string;
  website_url: string;
  social_media_url: string;
}

/**
 * Transform club data from JSON format to our Club interface
 */
export function transformClubData(jsonClub: ClubJsonData, zoneId: string): Omit<Club, 'id'> {
  return {
    name: jsonClub.club_name,
    zoneId: zoneId,
    clubId: jsonClub.club_id,
    physicalAddress: jsonClub.physical_address,
    postalAddress: jsonClub.postal_address,
    email: jsonClub.email,
    phone: jsonClub.phone,
    websiteUrl: jsonClub.website_url,
    socialMediaUrl: jsonClub.social_media_url,
    // Set website field for backward compatibility
    website: jsonClub.website_url,
  };
}

/**
 * Validate required fields for club data
 */
export function validateClubData(club: ClubJsonData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!club.club_name?.trim()) {
    errors.push('Club name is required');
  }
  
  if (!club.zone?.trim()) {
    errors.push('Zone is required');
  }
  
  if (!club.physical_address?.trim()) {
    errors.push('Physical address is required');
  }
  
  if (!club.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(club.email)) {
    errors.push('Valid email is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper to find zone ID by zone name
 */
export async function findZoneIdByName(zoneName: string, zones: { id: string; name: string }[]): Promise<string | null> {
  const zone = zones.find(z => 
    z.name.toLowerCase().trim() === zoneName.toLowerCase().trim()
  );
  
  return zone?.id || null;
}

/**
 * Process multiple clubs from JSON data
 */
export async function processClubsFromJson(
  clubsData: ClubJsonData[], 
  zones: { id: string; name: string }[]
): Promise<{
  validClubs: (Omit<Club, 'id'> & { originalData: ClubJsonData })[];
  invalidClubs: { data: ClubJsonData; errors: string[] }[];
  missingZones: string[];
}> {
  const validClubs: (Omit<Club, 'id'> & { originalData: ClubJsonData })[] = [];
  const invalidClubs: { data: ClubJsonData; errors: string[] }[] = [];
  const missingZones: string[] = [];
  
  for (const clubData of clubsData) {
    // Validate the data
    const validation = validateClubData(clubData);
    
    if (!validation.isValid) {
      invalidClubs.push({ data: clubData, errors: validation.errors });
      continue;
    }
    
    // Find the zone ID
    const zoneId = await findZoneIdByName(clubData.zone, zones);
    
    if (!zoneId) {
      if (!missingZones.includes(clubData.zone)) {
        missingZones.push(clubData.zone);
      }
      invalidClubs.push({ 
        data: clubData, 
        errors: [`Zone '${clubData.zone}' not found`] 
      });
      continue;
    }
    
    // Transform the data
    const clubRecord = transformClubData(clubData, zoneId);
    validClubs.push({ ...clubRecord, originalData: clubData });
  }
  
  return { validClubs, invalidClubs, missingZones };
}

/**
 * Example usage for importing clubs from JSON
 */
export function exampleUsage() {
  return `
// Example usage:
import { processClubsFromJson } from './lib/club-data-utils';
import { getAllZones } from './lib/server-data';

async function importClubsFromJson(jsonData: ClubJsonData[]) {
  const zones = await getAllZones();
  const result = await processClubsFromJson(jsonData, zones);
  
  console.log(\`Processing \${jsonData.length} clubs:\`);
  console.log(\`✅ Valid clubs: \${result.validClubs.length}\`);
  console.log(\`❌ Invalid clubs: \${result.invalidClubs.length}\`);
  console.log(\`🔍 Missing zones: \${result.missingZones.join(', ')}\`);
  
  // Save valid clubs to database
  for (const club of result.validClubs) {
    await addDoc(collection(db, 'clubs'), club);
  }
}
`;
}
