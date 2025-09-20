import { Zone, Club } from './types';
import { adminDb } from './firebase-admin';

/**
 * Interface for the zone data structure from ClubZoneData.json
 */
export interface ZoneData {
  zone_name: string;
  clubs: ClubJsonData[];
}

export interface ClubJsonData {
  club_id?: number;
  club_name?: string;
  zone?: string;
  physical_address?: string;
  postal_address?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  social_media_url?: string;
}

/**
 * Process zone and club data from ClubZoneData.json format
 */
export class DataProcessor {
  /**
   * Remove undefined and null values from an object (Firestore doesn't accept undefined)
   */
  static cleanUndefinedValues<T extends Record<string, any>>(obj: T): T {
    const cleaned = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        // For arrays, filter out undefined/null items and recursively clean objects
        if (Array.isArray(value)) {
          const cleanedArray = value
            .filter(item => item !== undefined && item !== null)
            .map(item => typeof item === 'object' ? this.cleanUndefinedValues(item) : item);
          if (cleanedArray.length > 0) {
            cleaned[key as keyof T] = cleanedArray as T[keyof T];
          }
        }
        // For nested objects, recursively clean them too
        else if (typeof value === 'object') {
          const cleanedNested = this.cleanUndefinedValues(value);
          // Only include the nested object if it has at least one defined property
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key as keyof T] = cleanedNested as T[keyof T];
          }
        }
        // For primitive values, include them directly
        else {
          cleaned[key as keyof T] = value;
        }
      } else {
        // Skip undefined and null values
      }
    }
    
    return cleaned;
  }

  /**
   * Convert zone name to a consistent zone ID (matching the base seed data)
   */
  static generateZoneId(zoneName: string): string {
    // Map zone names to the same IDs used in the base seed data
    const zoneMap: Record<string, string> = {
      'Barwon Zone': '1',
      'Central Zone': '2', 
      'East Gippsland Zone': '3',
      'Gippsland Zone': '4',
      'Midland Zone': '5',
      'North Eastern Zone': '6',
      'North Metropolitan Zone': '7',
      'Northern Zone': '8',
      'Port Phillip Zone': '9',
      'South Metropolitan Zone': '10',
      'West Gippsland Zone': '11',
      'Western Zone': '12',
      'Wimmera Zone': '13'
    };

    // Return the mapped ID if it exists, otherwise generate a fallback ID
    return zoneMap[zoneName] || `zone-${zoneName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  }

  /**
   * Transform zone data to our Zone interface
   */
  static transformZoneData(zoneData: ZoneData): Omit<Zone, 'id'> & { id: string } {
    const zoneId = this.generateZoneId(zoneData.zone_name);
    
    const baseZone = {
      id: zoneId,
      name: zoneData.zone_name,
      secretary: {
        name: `${zoneData.zone_name} Secretary`,
        email: `secretary@${zoneData.zone_name.toLowerCase().replace(/\s+/g, '')}zone.com`,
        mobile: '0400 000 000'
      },
      eventApprovers: [],
      scheduleApprovers: [],
      imageUrl: `https://example.com/images/${zoneId}.png`
    };

    return this.cleanUndefinedValues(baseZone);
  }

  /**
   * Transform club data to our Club interface
   */
  static transformClubData(clubData: ClubJsonData, zoneId: string): Omit<Club, 'id'> & { id: string } | null {
    // Skip clubs with missing essential data
    if (!clubData.club_name || !clubData.zone) {
      return null;
    }

    const clubId = `club-${clubData.club_id || clubData.club_name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}`;

    const baseClub = {
      id: clubId,
      name: clubData.club_name,
      zoneId: zoneId,
      clubId: clubData.club_id !== undefined ? String(clubData.club_id) : undefined,
      physicalAddress: clubData.physical_address,
      postalAddress: clubData.postal_address,
      email: clubData.email,
      phone: clubData.phone,
      website: clubData.website_url,
      websiteUrl: clubData.website_url,
      socialMediaUrl: clubData.social_media_url,
      // Set up social media structure for backward compatibility
      socialMedia: clubData.social_media_url ? {
        facebook: clubData.social_media_url.includes('facebook') ? clubData.social_media_url : undefined,
        instagram: clubData.social_media_url.includes('instagram') ? clubData.social_media_url : undefined,
      } : undefined
    };

    // Clean undefined/null values before returning
    return this.cleanUndefinedValues(baseClub);
  }

  /**
   * Process zones and clubs from ClubZoneData.json format
   */
  static async processClubZoneData(zonesData: ZoneData[]): Promise<{
    zones: (Omit<Zone, 'id'> & { id: string })[];
    clubs: (Omit<Club, 'id'> & { id: string })[];
    stats: {
      totalZones: number;
      totalClubs: number;
      validClubs: number;
      invalidClubs: number;
    };
  }> {
    const zones: (Omit<Zone, 'id'> & { id: string })[] = [];
    const clubs: (Omit<Club, 'id'> & { id: string })[] = [];
    let validClubs = 0;
    let invalidClubs = 0;

    for (const zoneData of zonesData) {
      // Process zone
      const zone = this.transformZoneData(zoneData);
      zones.push(zone);

      // Process clubs in this zone
      for (const clubData of zoneData.clubs) {
        const club = this.transformClubData(clubData, zone.id);
        if (club) {
          clubs.push({
            ...club,
            clubId: club.clubId !== undefined ? String(club.clubId) : undefined
          });
          validClubs++;
        } else {
          invalidClubs++;
        }
      }
    }

    return {
      zones,
      clubs,
      stats: {
        totalZones: zones.length,
        totalClubs: clubs.length,
        validClubs,
        invalidClubs
      }
    };
  }

  /**
   * Upsert zones to database (insert or update)
   */
  static async upsertZones(zones: (Omit<Zone, 'id'> & { id: string })[]): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const zone of zones) {
      try {
        const zoneRef = adminDb.collection('zones').doc(zone.id);
        const existingZone = await zoneRef.get();

        if (existingZone.exists) {
          // Update existing zone, preserving important fields like approvers
          const existingData = existingZone.data();
          const updatedZone = {
            ...zone,
            eventApprovers: existingData?.eventApprovers || zone.eventApprovers,
            scheduleApprovers: existingData?.scheduleApprovers || zone.scheduleApprovers,
            // Update other fields but preserve secretary if it has real data
            secretary: existingData?.secretary?.email?.includes('@') && !existingData?.secretary?.email?.includes('example') 
              ? existingData.secretary 
              : zone.secretary
          };
          
          await zoneRef.set(updatedZone, { merge: true });
          updated++;
          console.log(`✅ Updated zone: ${zone.name}`);
        } else {
          await zoneRef.set(zone);
          created++;
          console.log(`🆕 Created zone: ${zone.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to upsert zone ${zone.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return { created, updated, errors };
  }

  /**
   * Upsert clubs to database (insert or update)
   */
  static async upsertClubs(clubs: (Omit<Club, 'id'> & { id: string })[]): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const club of clubs) {
      try {
        const clubRef = adminDb.collection('clubs').doc(club.id);
        const existingClub = await clubRef.get();

        if (existingClub.exists) {
          // Merge new data with existing, preserving detailed information
          const existingData = existingClub.data();
          
          // Create updated club object carefully, avoiding undefined spread
          const updatedClub: any = { ...existingData };
          
          // Update basic info from JSON (only if not undefined)
          if (club.name !== undefined) updatedClub.name = club.name;
          if (club.physicalAddress !== undefined) updatedClub.physicalAddress = club.physicalAddress;
          if (club.postalAddress !== undefined) updatedClub.postalAddress = club.postalAddress;
          if (club.email !== undefined) updatedClub.email = club.email;
          if (club.phone !== undefined) updatedClub.phone = club.phone;
          if (club.website !== undefined) updatedClub.website = club.website;
          if (club.websiteUrl !== undefined) updatedClub.websiteUrl = club.websiteUrl;
          if (club.socialMediaUrl !== undefined) updatedClub.socialMediaUrl = club.socialMediaUrl;
          if (club.socialMedia !== undefined) updatedClub.socialMedia = club.socialMedia;

          // Only preserve complex structures if they exist in existing data
          if (existingData?.contactDetails) {
            updatedClub.contactDetails = existingData.contactDetails;
          }
          if (existingData?.facilities) {
            updatedClub.facilities = existingData.facilities;
          }
          if (existingData?.operations) {
            updatedClub.operations = existingData.operations;
          }
          
          // Clean undefined values before saving to Firestore
          const cleanedClub = this.cleanUndefinedValues(updatedClub);
          
          await clubRef.set(cleanedClub, { merge: true });
          updated++;
          console.log(`✅ Updated club: ${club.name}`);
        } else {
          // Clean undefined values for new clubs too
          const cleanedClub = this.cleanUndefinedValues(club);
          
          await clubRef.set(cleanedClub);
          created++;
          console.log(`🆕 Created club: ${club.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to upsert club ${club.name}: ${error}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    return { created, updated, errors };
  }
}

/**
 * Main function to process and load ClubZoneData.json
 */
export async function loadClubZoneData(zonesData: ZoneData[]): Promise<{
  success: boolean;
  message: string;
  stats: {
    zones: { created: number; updated: number; };
    clubs: { created: number; updated: number; };
    processing: {
      totalZones: number;
      totalClubs: number;
      validClubs: number;
      invalidClubs: number;
    };
  };
  errors: string[];
}> {
  console.log(`🚀 Starting ClubZoneData processing for ${zonesData.length} zones`);

  try {
    // Process the data
    const processed = await DataProcessor.processClubZoneData(zonesData);
    console.log(`📊 Processed: ${processed.stats.totalZones} zones, ${processed.stats.validClubs} valid clubs, ${processed.stats.invalidClubs} invalid clubs`);

    // Upsert zones
    console.log(`📍 Upserting ${processed.zones.length} zones...`);
    const zoneResults = await DataProcessor.upsertZones(processed.zones);

    // Upsert clubs
    console.log(`🏇 Upserting ${processed.clubs.length} clubs...`);
    const clubResults = await DataProcessor.upsertClubs(processed.clubs);

    const allErrors = [...zoneResults.errors, ...clubResults.errors];

    console.log(`🎉 ClubZoneData loading completed!`);
    console.log(`  Zones: ${zoneResults.created} created, ${zoneResults.updated} updated`);
    console.log(`  Clubs: ${clubResults.created} created, ${clubResults.updated} updated`);
    if (allErrors.length > 0) {
      console.log(`  Errors: ${allErrors.length}`);
    }

    return {
      success: allErrors.length === 0,
      message: `Loaded ${zoneResults.created + zoneResults.updated} zones and ${clubResults.created + clubResults.updated} clubs`,
      stats: {
        zones: { created: zoneResults.created, updated: zoneResults.updated },
        clubs: { created: clubResults.created, updated: clubResults.updated },
        processing: processed.stats
      },
      errors: allErrors
    };

  } catch (error) {
    const errorMsg = `ClubZoneData loading failed: ${error}`;
    console.error(`🔥 ${errorMsg}`);
    return {
      success: false,
      message: errorMsg,
      stats: {
        zones: { created: 0, updated: 0 },
        clubs: { created: 0, updated: 0 },
        processing: { totalZones: 0, totalClubs: 0, validClubs: 0, invalidClubs: 0 }
      },
      errors: [errorMsg]
    };
  }
}
