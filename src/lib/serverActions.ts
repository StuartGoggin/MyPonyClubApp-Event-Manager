
"use server";

import { adminDb } from './firebase-admin';
import type { Zone, Club, EventType } from './types';
import { loadClubZoneData, type ZoneData } from './data-processor';

// Comprehensive seed data with all zone and club associations
const zonesSeedData: Zone[] = [
  {
    id: 'zone-barwon',
    name: 'Barwon Zone',
    secretary: { name: 'Alice Barwon', email: 'alice@barwonzone.com', mobile: '0400 111 222' },
    eventApprovers: [
      { name: 'John Event', email: 'john@barwonzone.com', mobile: '0400 111 223' },
      { name: 'Mary Event', email: 'mary@barwonzone.com', mobile: '0400 111 224' }
    ],
    scheduleApprovers: [
      { name: 'Steve Schedule', email: 'steve@barwonzone.com', mobile: '0400 111 225' }
    ],
    imageUrl: 'https://example.com/images/barwon-zone.png'
  },
  {
    id: 'zone-central',
    name: 'Central Zone',
    secretary: { name: 'Bob Central', email: 'bob@centralzone.com', mobile: '0400 222 333' },
    eventApprovers: [
      { name: 'Jane Event', email: 'jane@centralzone.com', mobile: '0400 222 334' }
    ],
    scheduleApprovers: [
      { name: 'Tom Schedule', email: 'tom@centralzone.com', mobile: '0400 222 335' },
      { name: 'Lisa Schedule', email: 'lisa@centralzone.com', mobile: '0400 222 336' }
    ],
    imageUrl: 'https://example.com/images/central-zone.png'
  },
  {
    id: 'zone-east-gippsland',
    name: 'East Gippsland Zone',
    secretary: { name: 'Eve Gipps', email: 'eve@eastgippsland.com', mobile: '0400 333 444' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/east-gippsland-zone.png'
  },
  {
    id: 'zone-midland',
    name: 'Midland Zone',
    secretary: { name: 'Mia Midland', email: 'mia@midlandzone.com', mobile: '0400 444 555' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/midland-zone.png'
  },
  {
    id: 'zone-north-eastern',
    name: 'North Eastern Zone',
    secretary: { name: 'Ned North', email: 'ned@northeasternzone.com', mobile: '0400 555 666' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/north-eastern-zone.png'
  },
  {
    id: 'zone-north-metropolitan',
    name: 'North Metropolitan Zone',
    secretary: { name: 'Nina Metro', email: 'nina@northmetrozone.com', mobile: '0400 666 777' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/north-metropolitan-zone.png'
  },
  {
    id: 'zone-northern',
    name: 'Northern Zone',
    secretary: { name: 'Noah North', email: 'noah@northernzone.com', mobile: '0400 777 888' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/northern-zone.png'
  },
  {
    id: 'zone-southern-metropolitan',
    name: 'Southern Metropolitan Zone',
    secretary: { name: 'Sophie South', email: 'sophie@southmetrozone.com', mobile: '0400 888 999' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/southern-metropolitan-zone.png'
  },
  {
    id: 'zone-wannon',
    name: 'Wannon Zone',
    secretary: { name: 'Will Wannon', email: 'will@wannonzone.com', mobile: '0400 999 000' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/wannon-zone.png'
  },
  {
    id: 'zone-west-gippsland',
    name: 'West Gippsland Zone',
    secretary: { name: 'Wendy Gipps', email: 'wendy@westgippslandzone.com', mobile: '0400 000 111' },
    eventApprovers: [],
    scheduleApprovers: [],
    imageUrl: 'https://example.com/images/west-gippsland-zone.png'
  }
];

const clubsSeedData: Club[] = [
  { 
    id: 'club-melbourne', 
    name: 'Melbourne Pony Club', 
    zoneId: 'zone-north-metropolitan',
    latitude: -37.8136,
    longitude: 144.9631,
    address: {
      street: '123 Horse Lane',
      suburb: 'Bundoora',
      postcode: '3083',
      state: 'VIC',
      country: 'Australia'
    },
    email: 'info@melbourneponyclub.com.au',
    website: 'https://www.melbourneponyclub.com.au',
    socialMedia: {
      facebook: 'https://facebook.com/melbourneponyclub',
      instagram: 'https://instagram.com/melbourneponyclub',
      youtube: 'https://youtube.com/@melbourneponyclub'
    },
    logoUrl: 'https://example.com/logos/melbourne-pony-club.png',
    contactDetails: {
      primaryContact: {
        name: 'Sarah Johnson',
        role: 'President',
        email: 'president@melbourneponyclub.com.au',
        phone: '03 9876 5432',
        mobile: '0412 345 678'
      },
      secretary: {
        name: 'Mike Thompson',
        email: 'secretary@melbourneponyclub.com.au',
        phone: '03 9876 5433',
        mobile: '0423 456 789'
      },
      chiefInstructor: {
        name: 'Emma Wilson',
        email: 'instructor@melbourneponyclub.com.au',
        mobile: '0434 567 890',
        qualifications: ['Level 2 Coaching', 'First Aid Certified']
      }
    },
    facilities: {
      grounds: {
        arenaCount: 3,
        arenaTypes: ['Sand', 'Grass'],
        hasIndoorArena: true,
        hasRoundYard: true,
        hasCrossCountryTrack: true,
        hasJumpingCourse: true,
        hasDressageArenas: true,
        hasStabling: true,
        stablingCapacity: 20
      },
      amenities: {
        hasClubhouse: true,
        hasCanteen: true,
        hasToilets: true,
        hasParking: true,
        hasWaterForHorses: true,
        hasElectricity: true,
        hasCamping: false,
        isAccessible: true
      }
    },
    operations: {
      establishedYear: 1965,
      membershipCapacity: 120,
      currentMemberCount: 95,
      ageGroups: ['Under 8', '8-12', '13-17', '18-25', 'Adult'],
      activeDays: ['Saturday', 'Sunday', 'Wednesday'],
      seasonStart: 'February',
      seasonEnd: 'November',
      hasWaitingList: false
    },
    programs: {
      certificateLevels: ['D Certificate', 'C Certificate', 'B Certificate'],
      specialPrograms: ['Dressage', 'Show Jumping', 'Cross Country', 'Mounted Games'],
      hasAdultRiding: true,
      hasLeadRein: true,
      hasBeginnerProgram: true,
      hasCompetitiveTeams: true
    },
    communication: {
      newsletter: true,
      emailList: 'newsletter@melbourneponyclub.com.au'
    }
  },
  { 
    id: 'club-geelong', 
    name: 'Geelong Pony Club', 
    zoneId: 'zone-barwon',
    latitude: -38.1499,
    longitude: 144.3617,
    address: {
      street: '456 Country Road',
      suburb: 'Geelong West',
      postcode: '3218',
      state: 'VIC',
      country: 'Australia'
    },
    email: 'contact@geelongponyclub.org.au',
    website: 'https://www.geelongponyclub.org.au',
    socialMedia: {
      facebook: 'https://facebook.com/geelongponyclub',
      instagram: 'https://instagram.com/geelongponyclub'
    },
    logoUrl: 'https://example.com/logos/geelong-pony-club.png',
    contactDetails: {
      primaryContact: {
        name: 'John Parker',
        role: 'President',
        email: 'president@geelongponyclub.org.au',
        mobile: '0445 678 901'
      },
      secretary: {
        name: 'Lisa Brown',
        email: 'secretary@geelongponyclub.org.au',
        mobile: '0456 789 012'
      }
    },
    facilities: {
      grounds: {
        arenaCount: 2,
        arenaTypes: ['All-weather', 'Sand'],
        hasIndoorArena: false,
        hasRoundYard: true,
        hasCrossCountryTrack: true,
        hasJumpingCourse: true,
        hasDressageArenas: false,
        hasStabling: false,
        stablingCapacity: 0
      }
    },
    operations: {
      establishedYear: 1972,
      currentMemberCount: 65,
      ageGroups: ['8-12', '13-17', 'Adult'],
      activeDays: ['Saturday', 'Sunday'],
      seasonStart: 'March',
      seasonEnd: 'October'
    }
  },
  { 
    id: 'club-ballarat', 
    name: 'Ballarat Pony Club', 
    zoneId: 'zone-central',
    latitude: -37.5622,
    longitude: 143.8503,
    email: 'info@ballaratponyclub.com.au',
    website: 'https://www.ballaratponyclub.com.au'
  },
  { 
    id: 'club-bendigo', 
    name: 'Bendigo Pony Club', 
    zoneId: 'zone-northern',
    latitude: -36.7570,
    longitude: 144.2794,
    email: 'contact@bendigoponyclub.org'
  },
  { 
    id: 'club-pakenham', 
    name: 'Pakenham Pony Club', 
    zoneId: 'zone-west-gippsland',
    latitude: -38.0708,
    longitude: 145.4844
  }
];

const eventTypesSeedData: EventType[] = [
  { id: 'event-type-rally', name: 'Rally' },
  { id: 'event-type-ode', name: 'ODE (One Day Event)' },
  { id: 'event-type-dressage', name: 'Dressage' },
  { id: 'event-type-jumping', name: 'Show Jumping' },
  { id: 'event-type-cross-country', name: 'Cross Country' },
  { id: 'event-type-combined', name: 'Combined Training' },
  { id: 'event-type-tetrathlon', name: 'Tetrathlon' },
  { id: 'event-type-games', name: 'Games' },
  { id: 'event-type-prince-philip', name: 'Prince Philip Cup' },
  { id: 'event-type-championships', name: 'Championships' },
  { id: 'event-type-clinic', name: 'Clinic' },
  { id: 'event-type-training', name: 'Training Day' },
  { id: 'event-type-fundraising', name: 'Fund Raising Event' }
];

export async function callSeedData() {
  if (!adminDb) {
    return { 
      success: false, 
      message: 'Firebase Admin SDK not initialized. Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
    };
  }

  console.log('🌱 Starting comprehensive database seeding process...');

  try {
    const batch = adminDb.batch();
    let seededItems = [];

    // Check and seed Event Types first (they don't conflict with ClubZoneData)
    console.log('📅 Checking event types collection...');
    const eventTypesSnapshot = await adminDb.collection('eventTypes').limit(1).get();
    if (eventTypesSnapshot.empty) {
      console.log(`🌟 Seeding ${eventTypesSeedData.length} event types...`);
      eventTypesSeedData.forEach(eventType => {
        const eventTypeRef = adminDb.collection('eventTypes').doc(eventType.id);
        batch.set(eventTypeRef, eventType);
      });
      seededItems.push(`${eventTypesSeedData.length} event types`);
    } else {
      console.log('✅ Event types already exist, skipping...');
    }

    // Commit the event types first
    if (seededItems.length > 0) {
      console.log('💾 Committing event types to Firestore...');
      await batch.commit();
      console.log('✅ Event types committed successfully!');
    }

    // Now load comprehensive ClubZoneData.json (this will handle zones and clubs with correct IDs)
    console.log('📂 Loading comprehensive ClubZoneData.json...');
    try {
      // Load the ClubZoneData file from the root directory
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const clubZoneDataPath = path.join(process.cwd(), 'Information, Requirements and Data', 'ClubZoneData.json');
      const clubZoneDataContent = await fs.readFile(clubZoneDataPath, 'utf-8');
      const clubZoneData = JSON.parse(clubZoneDataContent);
      
      console.log(`🚀 Processing ${clubZoneData.length} zones from ClubZoneData.json...`);
      const clubZoneResult = await loadFromClubZoneData(clubZoneData);
      
      if (clubZoneResult.success) {
        const zoneSummary = `${clubZoneResult.stats.zones.created} zones created, ${clubZoneResult.stats.zones.updated} zones updated`;
        const clubSummary = `${clubZoneResult.stats.clubs.created} clubs created, ${clubZoneResult.stats.clubs.updated} clubs updated`;
        seededItems.push(`ClubZoneData: ${zoneSummary}, ${clubSummary}`);
        
        return { 
          success: true, 
          message: `🎉 Complete database seeding successful!\n\n` +
                  `Base data: ${seededItems.filter(item => !item.startsWith('ClubZoneData')).join(', ')}\n` +
                  `📊 ClubZoneData import results:\n` +
                  `📍 Zones: ${clubZoneResult.stats.zones.created} created, ${clubZoneResult.stats.zones.updated} updated\n` +
                  `🏇 Clubs: ${clubZoneResult.stats.clubs.created} created, ${clubZoneResult.stats.clubs.updated} updated\n` +
                  `📈 Processed: ${clubZoneResult.stats.processing.totalZones} zones with ${clubZoneResult.stats.processing.validClubs} valid clubs`
        };
      } else {
        return {
          success: false,
          message: `❌ Seeding partially failed!\n\n` +
                  `✅ Base data seeded: ${seededItems.filter(item => !item.startsWith('ClubZoneData')).join(', ')}\n` +
                  `❌ ClubZoneData import failed: ${clubZoneResult.message}\n` +
                  `Errors: ${clubZoneResult.errors?.join(', ') || 'Unknown errors'}`
        };
      }
      
    } catch (clubZoneError) {
      console.error('❌ Error loading ClubZoneData.json:', clubZoneError);
      
      if (seededItems.length > 0) {
        return {
          success: true,
          message: `⚠️ Partial seeding completed!\n\n` +
                  `✅ Base data seeded: ${seededItems.join(', ')}\n` +
                  `❌ ClubZoneData.json could not be loaded: ${clubZoneError instanceof Error ? clubZoneError.message : 'Unknown error'}\n\n` +
                  `Note: Make sure ClubZoneData.json exists in the 'Information, Requirements and Data/' directory.`
        };
      } else {
        return {
          success: false,
          message: `❌ Seeding failed: Could not load ClubZoneData.json\n` +
                  `Error: ${clubZoneError instanceof Error ? clubZoneError.message : 'Unknown error'}\n\n` +
                  `Please ensure ClubZoneData.json exists in the 'Information, Requirements and Data/' directory.`
        };
      }
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return { 
      success: false, 
      message: `Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Load data from ClubZoneData.json file (your comprehensive dataset)
 */
export async function loadFromClubZoneData(zonesData: ZoneData[]) {
  try {
    console.log('🚀 Starting ClubZoneData import...');
    const result = await loadClubZoneData(zonesData);
    
    if (result.success) {
      console.log('✅ ClubZoneData import completed successfully');
    } else {
      console.log('⚠️ ClubZoneData import completed with errors');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error loading ClubZoneData:', error);
    return {
      success: false,
      message: `Failed to load ClubZoneData: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: {
        zones: { created: 0, updated: 0 },
        clubs: { created: 0, updated: 0 },
        processing: { totalZones: 0, totalClubs: 0, validClubs: 0, invalidClubs: 0 }
      },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Purge all config data from the database (zones, clubs, club pictures)
 */
export async function purgeConfigData() {
  if (!adminDb) {
    return { 
      success: false, 
      message: 'Firebase Admin SDK not initialized. Please check your FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
    };
  }

  try {
    console.log('🔥 Starting config data purge...');

    const results = {
      zones: { deleted: 0, errors: [] as string[] },
      clubs: { deleted: 0, errors: [] as string[] },
      clubPictures: { deleted: 0, errors: [] as string[] }
    };

    // Purge Zones
    const zonesSnapshot = await adminDb.collection('zones').get();
    if (!zonesSnapshot.empty) {
      const zoneBatch = adminDb.batch();
      zonesSnapshot.docs.forEach((doc: any) => {
        zoneBatch.delete(doc.ref);
      });
      await zoneBatch.commit();
      results.zones.deleted = zonesSnapshot.docs.length;
    }

    // Purge Clubs
    const clubsSnapshot = await adminDb.collection('clubs').get();
    if (!clubsSnapshot.empty) {
      const clubBatch = adminDb.batch();
      clubsSnapshot.docs.forEach((doc: any) => {
        clubBatch.delete(doc.ref);
      });
      await clubBatch.commit();
      results.clubs.deleted = clubsSnapshot.docs.length;
    }

    // Purge Club Pictures
    const picturesSnapshot = await adminDb.collection('clubPictures').get();
    if (!picturesSnapshot.empty) {
      const picturesBatch = adminDb.batch();
      picturesSnapshot.docs.forEach((doc: any) => {
        picturesBatch.delete(doc.ref);
      });
      await picturesBatch.commit();
      results.clubPictures.deleted = picturesSnapshot.docs.length;
    }

    const totalDeleted = results.zones.deleted + results.clubs.deleted + results.clubPictures.deleted;

    console.log(`🎉 Config data purge completed! Deleted ${totalDeleted} items total.`);

    return {
      success: true,
      message: `Config data purge completed successfully. Deleted ${totalDeleted} items total.`,
      results: {
        summary: { totalDeleted, totalErrors: 0 },
        details: results
      }
    };

  } catch (error) {
    console.error('❌ Error purging config data:', error);
    return { 
      success: false, 
      message: `Failed to purge config data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}


    