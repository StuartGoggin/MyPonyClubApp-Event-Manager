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
   * Convert zone name to a consistent zone ID
   */
  static generateZoneId(zoneName: string): string {
    return 'zone-' + zoneName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Transform zone data to our Zone interface
   */
  static transformZoneData(zoneData: ZoneData): Omit<Zone, 'id'> & { id: string } {
    const zoneId = this.generateZoneId(zoneData.zone_name);
    
    return {
      id: zoneId,
      name: zoneData.zone_name,
      secretary: {
        name: `${zoneData.zone_name} Secretary`,
        email: `secretary@${zoneId.replace('zone-', '')}zone.com`,
        mobile: '0400 000 000'
      },
      eventApprovers: [],
      scheduleApprovers: [],
      imageUrl: `https://example.com/images/${zoneId}.png`
    };
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

    return {
      id: clubId,
      name: clubData.club_name,
      zoneId: zoneId,
      clubId: clubData.club_id,
      physicalAddress: clubData.physical_address || undefined,
      postalAddress: clubData.postal_address || undefined,
      email: clubData.email || undefined,
      phone: clubData.phone || undefined,
      website: clubData.website_url || undefined,
      websiteUrl: clubData.website_url || undefined,
      socialMediaUrl: clubData.social_media_url || undefined,
      // Set up social media structure for backward compatibility
      socialMedia: clubData.social_media_url ? {
        facebook: clubData.social_media_url.includes('facebook') ? clubData.social_media_url : undefined,
        instagram: clubData.social_media_url.includes('instagram') ? clubData.social_media_url : undefined,
      } : undefined
    };
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
          clubs.push(club);
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
          const updatedClub = {
            ...existingData, // Preserve existing detailed data
            ...club, // Override with new data
            // Preserve complex structures if they exist
            contactDetails: existingData?.contactDetails || club.contactDetails,
            facilities: existingData?.facilities || club.facilities,
            operations: existingData?.operations || club.operations,
            // Update basic info from JSON
            name: club.name,
            physicalAddress: club.physicalAddress || existingData?.physicalAddress,
            postalAddress: club.postalAddress || existingData?.postalAddress,
            email: club.email || existingData?.email,
            phone: club.phone || existingData?.phone,
            website: club.website || existingData?.website,
            websiteUrl: club.websiteUrl || existingData?.websiteUrl,
            socialMediaUrl: club.socialMediaUrl || existingData?.socialMediaUrl
          };
          
          await clubRef.set(updatedClub, { merge: true });
          updated++;
          console.log(`✅ Updated club: ${club.name}`);
        } else {
          await clubRef.set(club);
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
