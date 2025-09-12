import { adminDb } from './firebase-admin';
import type { Zone, Club } from './types';

// Cache for database lookups to avoid repeated queries
let zoneCache: Zone[] | null = null;
let clubCache: Club[] | null = null;

// Load zones from database
async function loadZones(): Promise<Zone[]> {
  if (zoneCache) return zoneCache;
  
  try {
    const zonesSnapshot = await adminDb.collection('zones').get();
    zoneCache = [];
    zonesSnapshot.forEach((doc: any) => {
      if (doc.exists) {
        zoneCache!.push({ id: doc.id, ...doc.data() } as Zone);
      }
    });
    return zoneCache;
  } catch (error) {
    console.error('Error loading zones for import mapping:', error);
    return [];
  }
}

// Load clubs from database
async function loadClubs(): Promise<Club[]> {
  if (clubCache) return clubCache;
  
  try {
    const clubsSnapshot = await adminDb.collection('clubs').get();
    clubCache = [];
    clubsSnapshot.forEach((doc: any) => {
      if (doc.exists) {
        clubCache!.push({ id: doc.id, ...doc.data() } as Club);
      }
    });
    return clubCache;
  } catch (error) {
    console.error('Error loading clubs for import mapping:', error);
    return [];
  }
}

/**
 * Normalizes zone names for better matching
 */
function normalizeZoneName(zoneName: string): string {
  return zoneName
    .toLowerCase()
    .replace(/\b(vic|victoria)\b/gi, '')
    .replace(/\b(zone|metropolitan|metro|region|area)\b/gi, '')
    .replace(/[\/\-\s]+/g, ' ')
    .replace(/\b(north|northern)\b/gi, 'north')
    .replace(/\b(south|southern)\b/gi, 'south')
    .replace(/\b(east|eastern)\b/gi, 'east')
    .replace(/\b(west|western)\b/gi, 'west')
    .replace(/\b(gippsland|gipp)\b/gi, 'gippsland')
    .replace(/\bmidland\b/gi, 'midland')
    .replace(/\bbarwon\b/gi, 'barwon')
    .replace(/\bwimmera\b/gi, 'wimmera')
    .replace(/\bcentral\b/gi, 'central')
    .replace(/\bport phillip\b/gi, 'portphillip')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Creates multiple pattern variations for zone matching
 */
function createZonePatterns(zoneName: string): string[] {
  const normalized = normalizeZoneName(zoneName);
  const patterns = [normalized];
  
  // Add variations with different word orders
  const words = normalized.split(' ').filter(w => w.length > 0);
  if (words.length > 1) {
    patterns.push(words.reverse().join(' '));
  }
  
  // Add abbreviated patterns
  patterns.push(words.map(w => w.charAt(0)).join(''));
  
  return [...new Set(patterns)]; // Remove duplicates
}

/**
 * Calculates Jaccard similarity between two strings
 */
function calculateSimilarity(s1: string, s2: string): number {
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 0));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Zone mapping from spreadsheet format to system format
export const ZONE_MAPPINGS: Record<string, { zoneName: string; state: string }> = {
  'VIC/Southern Metropolitan': {
    zoneName: 'Southern Metropolitan Zone',
    state: 'VICTORIA'
  },
  'VIC/Northern Metropolitan': {
    zoneName: 'North Metropolitan Zone',
    state: 'VICTORIA'
  },
  'VIC/Barwon': {
    zoneName: 'Barwon Zone',
    state: 'VICTORIA'
  },
  'VIC/Central': {
    zoneName: 'Central Zone',
    state: 'VICTORIA'
  },
  'VIC/East Gippsland': {
    zoneName: 'East Gippsland Zone',
    state: 'VICTORIA'
  },
  'VIC/Gippsland': {
    zoneName: 'Gippsland Zone',
    state: 'VICTORIA'
  },
  'VIC/Midland': {
    zoneName: 'Midland Zone',
    state: 'VICTORIA'
  },
  'VIC/North Eastern': {
    zoneName: 'North Eastern Zone',
    state: 'VICTORIA'
  },
  'VIC/Northern': {
    zoneName: 'Northern Zone',
    state: 'VICTORIA'
  },
  'VIC/Port Phillip': {
    zoneName: 'Port Phillip Zone',
    state: 'VICTORIA'
  },
  'VIC/West Gippsland': {
    zoneName: 'West Gippsland Zone',
    state: 'VICTORIA'
  },
  'VIC/Western': {
    zoneName: 'Western Zone',
    state: 'VICTORIA'
  },
  'VIC/Wimmera': {
    zoneName: 'Wimmera Zone',
    state: 'VICTORIA'
  },
  // Add variations and aliases
  'Southern Metropolitan': {
    zoneName: 'Southern Metropolitan Zone',
    state: 'VICTORIA'
  },
  'South Metropolitan Zone': {
    zoneName: 'Southern Metropolitan Zone',
    state: 'VICTORIA'
  },
  'South Metro': {
    zoneName: 'Southern Metropolitan Zone',
    state: 'VICTORIA'
  },
  'Northern Metropolitan': {
    zoneName: 'North Metropolitan Zone',
    state: 'VICTORIA'
  },
  'North Metropolitan Zone': {
    zoneName: 'North Metropolitan Zone',
    state: 'VICTORIA'
  },
  'North Metro': {
    zoneName: 'North Metropolitan Zone',
    state: 'VICTORIA'
  },
  'Barwon Zone': {
    zoneName: 'Barwon Zone',
    state: 'VICTORIA'
  },
  'Central Zone': {
    zoneName: 'Central Zone',
    state: 'VICTORIA'
  },
  'East Gippsland Zone': {
    zoneName: 'East Gippsland Zone',
    state: 'VICTORIA'
  },
  'Gippsland Zone': {
    zoneName: 'Gippsland Zone',
    state: 'VICTORIA'
  },
  'Midland Zone': {
    zoneName: 'Midland Zone',
    state: 'VICTORIA'
  },
  'North Eastern Zone': {
    zoneName: 'North Eastern Zone',
    state: 'VICTORIA'
  },
  'Northern Zone': {
    zoneName: 'Northern Zone',
    state: 'VICTORIA'
  },
  'Port Phillip Zone': {
    zoneName: 'Port Phillip Zone',
    state: 'VICTORIA'
  },
  'West Gippsland Zone': {
    zoneName: 'West Gippsland Zone',
    state: 'VICTORIA'
  },
  'Western Zone': {
    zoneName: 'Western Zone',
    state: 'VICTORIA'
  },
  'Wimmera Zone': {
    zoneName: 'Wimmera Zone',
    state: 'VICTORIA'
  }
};

// Club name normalization mappings
export const CLUB_NAME_MAPPINGS: Record<string, string> = {
  // Common variations
  'Monbulk': 'Monbulk Pony Club',
  'Monbulk PC': 'Monbulk Pony Club',
  'Monbulk Pony Club Inc': 'Monbulk Pony Club',
  
  // Add common abbreviations
  'MPHC': 'Mornington Peninsula Pony Club',
  'CPC': 'Chelsea Pony Club',
  'HPC': 'Hastings Pony Club',
  'LPC': 'Langwarrin Pony Club'
};

/**
 * Maps zone name from spreadsheet format to system format
 */
export async function mapZoneName(inputZone: string): Promise<{ zoneId: string; zoneName: string; state: string }> {
  console.log(`[ZoneMapping] Starting mapZoneName with input: "${inputZone}"`);
  
  if (!inputZone || inputZone.trim() === '') {
    console.log('[ZoneMapping] Empty input, looking for default zone');
    // Return default zone for Victoria (first available zone)
    const zones = await loadZones();
    console.log(`[ZoneMapping] Loaded ${zones.length} zones from database:`, zones.map(z => `${z.id}: ${z.name}`));
    if (zones.length > 0) {
      console.log(`[ZoneMapping] Using default zone: ${zones[0].name}`);
      return {
        zoneId: zones[0].id,
        zoneName: zones[0].name,
        state: 'VICTORIA'
      };
    }
    throw new Error('No zones available in database');
  }

  const zones = await loadZones();
  const normalized = inputZone.trim();
  
  console.log(`[ZoneMapping] Attempting to map zone: "${inputZone}"`);
  console.log(`[ZoneMapping] Loaded ${zones.length} zones from database:`, zones.map(z => `${z.id}: ${z.name}`));
  console.log(`[ZoneMapping] Available static mappings:`, Object.keys(ZONE_MAPPINGS));
  
  // 1. Check static mappings first (exact match)
  if (ZONE_MAPPINGS[normalized]) {
    const mapping = ZONE_MAPPINGS[normalized];
    console.log(`[ZoneMapping] Static mapping found for "${normalized}": "${mapping.zoneName}"`);
    const zone = zones.find(z => z.name === mapping.zoneName);
    if (zone) {
      console.log(`[ZoneMapping] Database zone found: "${zone.name}"`);
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        state: mapping.state
      };
    } else {
      console.log(`[ZoneMapping] No database zone found for mapping: "${mapping.zoneName}"`);
      console.log(`[ZoneMapping] Available database zone names:`, zones.map(z => z.name));
    }
  } else {
    console.log(`[ZoneMapping] No static mapping found for: "${normalized}"`);
  }

  // 2. Try direct database match
  const directMatch = zones.find(z => z.name.toLowerCase() === normalized.toLowerCase());
  if (directMatch) {
    console.log(`[ZoneMapping] Direct database match found: "${directMatch.name}"`);
    return {
      zoneId: directMatch.id,
      zoneName: directMatch.name,
      state: 'VICTORIA'
    };
  }

  // 3. Try pattern matching with similarity scoring
  console.log(`[ZoneMapping] Trying pattern matching for: "${inputZone}"`);
  
  let bestMatch: { zone: any; score: number } | null = null;
  let maxScore = 0;

  for (const [key, value] of Object.entries(ZONE_MAPPINGS)) {
    const patterns = createZonePatterns(key);
    const inputPatterns = createZonePatterns(inputZone);
    
    for (const pattern of patterns) {
      for (const inputPattern of inputPatterns) {
        const score = calculateSimilarity(pattern, inputPattern);
        if (score > maxScore && score > 0.3) { // Minimum threshold
          maxScore = score;
          // Find matching database zone
          const dbZone = zones.find(zone => 
            zone.name.toLowerCase().includes(value.zoneName.toLowerCase()) ||
            normalizeZoneName(zone.name) === normalizeZoneName(value.zoneName)
          );
          if (dbZone) {
            bestMatch = { zone: dbZone, score: maxScore };
          }
        }
      }
    }
  }

  if (bestMatch) {
    console.log(`[ZoneMapping] Pattern match found: ${bestMatch.zone.name} (score: ${bestMatch.score})`);
    return {
      zoneId: bestMatch.zone.id,
      zoneName: bestMatch.zone.name,
      state: 'VICTORIA'
    };
  }

  // 4-7: Advanced matching against database zones directly
  for (const zone of zones) {
    // Try partial matches
    if (zone.name.toLowerCase().includes(inputZone.toLowerCase()) || 
        inputZone.toLowerCase().includes(zone.name.toLowerCase())) {
      console.log(`[ZoneMapping] Partial match found: ${zone.name}`);
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        state: 'VICTORIA'
      };
    }

    // Try normalized comparison
    const normalizedInput = normalizeZoneName(inputZone);
    const normalizedZone = normalizeZoneName(zone.name);
    
    if (normalizedInput === normalizedZone) {
      console.log(`[ZoneMapping] Normalized match found: ${zone.name}`);
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        state: 'VICTORIA'
      };
    }

    // Try similarity scoring on normalized names
    const similarity = calculateSimilarity(normalizedInput, normalizedZone);
    if (similarity > 0.6) {
      console.log(`[ZoneMapping] Similarity match found: ${zone.name} (score: ${similarity})`);
      return {
        zoneId: zone.id,
        zoneName: zone.name,
        state: 'VICTORIA'
      };
    }
  }

  // No match found, return default zone
  console.log(`[ZoneMapping] No match found for: "${inputZone}", using default zone`);
  if (zones.length > 0) {
    return {
      zoneId: zones[0].id,
      zoneName: zones[0].name,
      state: 'VICTORIA'
    };
  }

  throw new Error(`No zone mapping found for: ${inputZone}`);
}

/**
 * Maps club name from spreadsheet format to system format
 */
export async function mapClubName(inputClub: string): Promise<{ clubId: string; clubName: string } | null> {
  if (!inputClub || inputClub.trim() === '') {
    console.log('[ClubMapping] Empty club name provided');
    return null;
  }

  const clubs = await loadClubs();
  
  console.log(`[ClubMapping] Input club: "${inputClub}"`);

  // Step 1: Try exact match
  const exactMatch = clubs.find(club => 
    club.name.toLowerCase() === inputClub.toLowerCase().trim()
  );
  
  if (exactMatch) {
    console.log(`[ClubMapping] Exact match found: ${exactMatch.name}`);
    return { clubId: exactMatch.id, clubName: exactMatch.name };
  }

  // Step 2: Try static mapping
  const staticMatch = CLUB_NAME_MAPPINGS[inputClub.trim()];
  if (staticMatch) {
    const club = clubs.find(c => c.name.toLowerCase() === staticMatch.toLowerCase());
    if (club) {
      console.log(`[ClubMapping] Static mapping match found: ${club.name}`);
      return { clubId: club.id, clubName: club.name };
    }
  }

  // Step 3: Try partial matching
  const partialMatch = clubs.find(club => 
    club.name.toLowerCase().includes(inputClub.toLowerCase()) ||
    inputClub.toLowerCase().includes(club.name.toLowerCase())
  );
  
  if (partialMatch) {
    console.log(`[ClubMapping] Partial match found: ${partialMatch.name}`);
    return { clubId: partialMatch.id, clubName: partialMatch.name };
  }

  // Step 4: Try fuzzy matching
  let bestMatch: { club: any; score: number } | null = null;
  for (const club of clubs) {
    const score = calculateSimilarity(
      inputClub.toLowerCase(),
      club.name.toLowerCase()
    );
    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { club, score };
    }
  }

  if (bestMatch) {
    console.log(`[ClubMapping] Fuzzy match found: ${bestMatch.club.name} (score: ${bestMatch.score})`);
    return { clubId: bestMatch.club.id, clubName: bestMatch.club.name };
  }

  console.log(`[ClubMapping] No mapping found for club: "${inputClub}"`);
  return null;
}

/**
 * Comprehensive mapping function for import data
 */
export async function mapImportData(inputData: {
  zoneName?: string;
  clubName?: string;
}): Promise<{
  zoneId: string;
  zoneName: string;
  state: string;
  clubId?: string;
  clubName?: string;
}> {
  const zoneMapping = await mapZoneName(inputData.zoneName || '');
  const clubMapping = await mapClubName(inputData.clubName || '');

  // zoneMapping cannot be null due to default fallback in mapZoneName
  return {
    zoneId: zoneMapping.zoneId,
    zoneName: zoneMapping.zoneName,
    state: zoneMapping.state,
    clubId: clubMapping?.clubId,
    clubName: clubMapping?.clubName
  };
}
