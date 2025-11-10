import { getYear } from 'date-fns';
import type { Zone, Club, EventType, Event } from './types';
import { adminDb } from './firebase-admin';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';

export const updateZone = async (zone: Zone) => {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  const zoneRef = adminDb.collection('zones').doc(zone.id);
  await zoneRef.update({
    name: zone.name,
    streetAddress: zone.streetAddress,
    imageUrl: zone.imageUrl,
    secretary: zone.secretary,
    eventApprovers: zone.eventApprovers,
    scheduleApprovers: zone.scheduleApprovers,
  });
  return { success: true };
};


// In a real application, this data would be stored in and fetched from a database.
// For this example, we use mock data stored in memory.

export let zonesMock: Zone[] = [
    { 
        id: '1', 
        name: 'Barwon Zone',
        eventApprovers: [
            { name: 'Sarah Johnson', email: 'sarah.johnson@example.com', mobile: '+61412345001' }
        ]
    },
    { 
        id: '2', 
        name: 'Central Zone',
        eventApprovers: [
            { name: 'Michael Brown', email: 'michael.brown@example.com', mobile: '+61412345002' }
        ]
    },
    { 
        id: '3', 
        name: 'East Gippsland Zone',
        eventApprovers: [
            { name: 'Emma Wilson', email: 'emma.wilson@example.com', mobile: '+61412345003' }
        ]
    },
    { 
        id: '4', 
        name: 'Gippsland Zone',
        eventApprovers: [
            { name: 'David Miller', email: 'david.miller@example.com', mobile: '+61412345004' }
        ]
    },
    { 
        id: '5', 
        name: 'Midland Zone',
        eventApprovers: [
            { name: 'Lisa Davis', email: 'lisa.davis@example.com', mobile: '+61412345005' }
        ]
    },
    { 
        id: '6', 
        name: 'North Eastern Zone',
        eventApprovers: [
            { name: 'James Anderson', email: 'james.anderson@example.com', mobile: '+61412345006' }
        ]
    },
    { 
        id: '7', 
        name: 'North Metropolitan Zone',
        eventApprovers: [
            { name: 'Rachel Thompson', email: 'rachel.thompson@example.com', mobile: '+61412345007' }
        ]
    },
    { 
        id: '8', 
        name: 'Northern Zone',
        eventApprovers: [
            { name: 'Mark Garcia', email: 'mark.garcia@example.com', mobile: '+61412345008' }
        ]
    },
    { 
        id: '9', 
        name: 'Port Phillip Zone',
        eventApprovers: [
            { name: 'Jennifer Martinez', email: 'jennifer.martinez@example.com', mobile: '+61412345009' }
        ]
    },
    { 
        id: '10', 
        name: 'South Metropolitan Zone',
        eventApprovers: [
            { name: 'Christopher Lee', email: 'christopher.lee@example.com', mobile: '+61412345010' }
        ]
    },
    { 
        id: '11', 
        name: 'West Gippsland Zone',
        eventApprovers: [
            { name: 'Amanda Taylor', email: 'amanda.taylor@example.com', mobile: '+61412345011' }
        ]
    },
    { 
        id: '12', 
        name: 'Western Zone',
        eventApprovers: [
            { name: 'Daniel White', email: 'daniel.white@example.com', mobile: '+61412345012' }
        ]
    },
    { 
        id: '13', 
        name: 'Wimmera Zone',
        eventApprovers: [
            { name: 'Michelle Harris', email: 'michelle.harris@example.com', mobile: '+61412345013' }
        ]
    },
];

export let clubsMock: Club[] = [
    // Barwon Zone
    { id: 'b1', name: 'Anglesea Pony Club', zoneId: '1', latitude: -38.4116, longitude: 144.1793 },
    { id: 'b2', name: 'Barwon Heads Pony Club', zoneId: '1', latitude: -38.2705, longitude: 144.4820 },
    { id: 'b3', name: 'Barwon Valley Pony Club', zoneId: '1', latitude: -38.1888, longitude: 144.3317 },
    { id: 'b4', name: 'Colac Pony Club', zoneId: '1', latitude: -38.3403, longitude: 143.5855 },
    { id: 'b5', name: 'Drysdale Leopold Pony Club', zoneId: '1', latitude: -38.1736, longitude: 144.5623 },
    { id: 'b6', name: 'Forrest Pony Club', zoneId: '1', latitude: -38.5209, longitude: 143.7126 },
    { id: 'b7', name: 'Geelong Pony Club', zoneId: '1', latitude: -38.1064, longitude: 144.3490 },
    { id: 'b8', name: 'Inverleigh Pony Club', zoneId: '1', latitude: -38.1258, longitude: 144.0538 },
    { id: 'b9', name: 'Ocean Grove Pony Club', zoneId: '1', latitude: -38.2570, longitude: 144.5360 },
    { id: 'b10', name: 'Teesdale Pony Club', zoneId: '1', latitude: -38.0505, longitude: 144.0673 },
    { id: 'b11', name: 'Winchelsea Pony Club', zoneId: '1', latitude: -38.2411, longitude: 143.9852 },

    // Central Zone
    { id: 'c1', name: 'Ballan Pony Club', zoneId: '2', latitude: -37.6033, longitude: 144.2289 },
    { id: 'c2', name: 'Bacchus Marsh Pony Club', zoneId: '2', latitude: -37.6761, longitude: 144.4394 },
    { id: 'c3', name: 'Bullengarook Pony Club', zoneId: '2', latitude: -37.5851, longitude: 144.5020 },
    { id: 'c4', name: 'Daylesford Pony Club', zoneId: '2', latitude: -37.3421, longitude: 144.1437 },
    { id: 'c5', name: 'Gisborne Pony Club', zoneId: '2', latitude: -37.4871, longitude: 144.5881 },
    { id: 'c6', name: 'Kyneton Pony Club', zoneId: '2', latitude: -37.2475, longitude: 144.4552 },
    { id: 'c7', name: 'Macedon Pony Club', zoneId: '2', latitude: -37.4167, longitude: 144.5667 },
    { id: 'c8', name: 'Riddells Creek Pony Club', zoneId: '2', latitude: -37.4645, longitude: 144.6806 },
    { id: 'c9', name: 'Romsey Pony Club', zoneId: '2', latitude: -37.3486, longitude: 144.7431 },
    { id: 'c10', name: 'Woodend Pony Club', zoneId: '2', latitude: -37.3600, longitude: 144.5269 },

    // East Gippsland Zone
    { id: 'eg1', name: 'Bairnsdale Pony Club', zoneId: '3', latitude: -37.8278, longitude: 147.6275 },
    { id: 'eg2', name: 'Buchan Pony Club', zoneId: '3', latitude: -37.4950, longitude: 148.1750 },
    { id: 'eg3', name: 'Lindenow Pony Club', zoneId: '3', latitude: -37.7958, longitude: 147.4686 },
    { id: 'eg4', name: 'Orbost Pony Club', zoneId: '3', latitude: -37.7050, longitude: 148.4550 },
    { id: 'eg5', name: 'Omeo Pony Club', zoneId: '3', latitude: -37.0989, longitude: 147.6653 },
    { id: 'eg6', name: 'Sale Pony Club', zoneId: '3', latitude: -38.1061, longitude: 147.0681 },
    { id: 'eg7', name: 'Stratford Pony Club', zoneId: '3', latitude: -37.9667, longitude: 147.0833 },
    { id: 'eg8', name: 'Swifts Creek Pony Club', zoneId: '3', latitude: -37.2667, longitude: 147.7333 },

    // Gippsland Zone
    { id: 'g1', name: 'Leongatha Pony Club', zoneId: '4', latitude: -38.4770, longitude: 145.9450 },
    { id: 'g2', name: 'Mirboo North Pony Club', zoneId: '4', latitude: -38.3900, longitude: 146.1620 },
    { id: 'g3', name: 'Moe Pony Club', zoneId: '4', latitude: -38.1750, longitude: 146.2650 },
    { id: 'g4', name: 'Morwell Pony Club', zoneId: '4', latitude: -38.2333, longitude: 146.4000 },
    { id: 'g5', name: 'Traralgon Pony Club', zoneId: '4', latitude: -38.1960, longitude: 146.5410 },
    { id: 'g6', name: 'Warragul Pony Club', zoneId: '4', latitude: -38.1560, longitude: 145.9320 },
    { id: 'g7', name: 'Yarram Pony Club', zoneId: '4', latitude: -38.5667, longitude: 146.6833 },

    // Midland Zone
    { id: 'm1', name: 'Ballarat Pony Club', zoneId: '5', latitude: -37.5622, longitude: 143.8503 },
    { id: 'm2', name: 'Burrumbeet Pony Club', zoneId: '5', latitude: -37.5333, longitude: 143.6833 },
    { id: 'm3', name: 'Clunes Pony Club', zoneId: '5', latitude: -37.2833, longitude: 143.7833 },
    { id: 'm4', name: 'Creswick Pony Club', zoneId: '5', latitude: -37.4289, longitude: 143.8906 },
    { id: 'm5', name: 'Maryborough Pony Club', zoneId: '5', latitude: -37.0492, longitude: 143.7383 },

    // North Eastern Zone
    { id: 'ne1', name: 'Benalla Pony Club', zoneId: '6', latitude: -36.5511, longitude: 145.9822 },
    { id: 'ne2', name: 'Bright Pony Club', zoneId: '6', latitude: -36.7292, longitude: 146.9606 },
    { id: 'ne3', name: 'Corryong Pony Club', zoneId: '6', latitude: -36.1994, longitude: 147.9011 },
    { id: 'ne4', name: 'Mansfield Pony Club', zoneId: '6', latitude: -37.0542, longitude: 146.0825 },
    { id: 'ne5', name: 'Myrtleford Pony Club', zoneId: '6', latitude: -36.5583, longitude: 146.7222 },
    { id: 'ne6', name: 'Rutherglen Pony Club', zoneId: '6', latitude: -36.0553, longitude: 146.4608 },
    { id: 'ne7', name: 'Tallangatta Pony Club', zoneId: '6', latitude: -36.2167, longitude: 147.1667 },
    { id: 'ne8', name: 'Wangaratta Pony Club', zoneId: '6', latitude: -36.3575, longitude: 146.3156 },
    { id: 'ne9', name: 'Wodonga Pony Club', zoneId: '6', latitude: -36.1242, longitude: 146.8844 },
    { id: 'ne10', name: 'Yackandandah Pony Club', zoneId: '6', latitude: -36.3167, longitude: 146.8500 },

    // North Metropolitan Zone
    { id: 'nm1', name: 'Broadford Pony Club', zoneId: '7', latitude: -37.2056, longitude: 145.0489 },
    { id: 'nm2', name: 'Bulla Adult Riders Club', zoneId: '7', latitude: -37.6333, longitude: 144.8167 },
    { id: 'nm3', name: 'Craigieburn Pony Club', zoneId: '7', latitude: -37.6000, longitude: 144.9333 },
    { id: 'nm4', name: 'Whittlesea Pony Club', zoneId: '7', latitude: -37.5139, longitude: 145.1169 },
    { id: 'nm5', name: 'Yarra Glen Pony Club', zoneId: '7', latitude: -37.6539, longitude: 145.3725 },

    // Northern Zone
    { id: 'n1', name: 'Barmah Pony Club', zoneId: '8', latitude: -36.0167, longitude: 145.0167 },
    { id: 'n2', name: 'Cobram Pony Club', zoneId: '8', latitude: -35.9167, longitude: 145.6500 },
    { id: 'n3', name: 'Echuca Pony Club', zoneId: '8', latitude: -36.1333, longitude: 144.7500 },
    { id: 'n4', name: 'Kyabram Pony Club', zoneId: '8', latitude: -36.3167, longitude: 145.0500 },
    { id: 'n5', name: 'Nathalia Pony Club', zoneId: '8', latitude: -36.0667, longitude: 145.2167 },
    { id: 'n6', name: 'Rochester Pony Club', zoneId: '8', latitude: -36.3667, longitude: 144.7000 },
    { id: 'n7', name: 'Shepparton Pony Club', zoneId: '8', latitude: -36.3833, longitude: 145.4000 },
    { id: 'n8', name: 'Yarrawonga Pony Club', zoneId: '8', latitude: -36.0167, longitude: 146.0000 },

    // Port Phillip Zone
    { id: 'pp1', name: 'Altona Pony Club', zoneId: '9', latitude: -37.8667, longitude: 144.8333 },
    { id: 'pp2', name: 'Doongala Pony Club', zoneId: '9', latitude: -37.7667, longitude: 145.3000 },
    { id: 'pp3', name: 'Healesville Pony Club', zoneId: '9', latitude: -37.6561, longitude: 145.5150 },
    { id: 'pp4', name: 'Main Ridge Pony Club', zoneId: '9', latitude: -38.3833, longitude: 144.9167 },
    { id: 'pp5', name: 'Mentone Pony Club', zoneId: '9', latitude: -38.0000, longitude: 145.0833 },
    { id: 'pp6', name: 'Mooroolbark Pony Club', zoneId: '9', latitude: -37.7833, longitude: 145.3167 },
    { id: 'pp7', name: 'Oaklands Pony Club', zoneId: '9', latitude: -37.6167, longitude: 144.8333 },
    { id: 'pp8', name: 'Point Cook Pony Club', zoneId: '9', latitude: -37.9167, longitude: 144.7500 },
    { id: 'pp9', name: 'Portarlington Pony Club', zoneId: '9', latitude: -38.1167, longitude: 144.6500 },
    { id: 'pp10', name: 'Riddells Creek Pony Club', zoneId: '9', latitude: -37.4645, longitude: 144.6806 },
    { id: 'pp11', name: 'Wyndham Pony Club', zoneId: '9', latitude: -37.8994, longitude: 144.6599 },

    // South Metropolitan Zone
    { id: 'sm1', name: 'Berwick Pony Club', zoneId: '10', latitude: -38.0333, longitude: 145.3500 },
    { id: 'sm2', name: 'Bunyip Pony Club', zoneId: '10', latitude: -38.0833, longitude: 145.7167 },
    { id: 'sm3', name: 'Chelsea Pony Club', zoneId: '10', latitude: -38.0500, longitude: 145.1167 },
    { id: 'sm4', name: 'Cranbourne Pony Club', zoneId: '10', latitude: -38.1000, longitude: 145.2833 },
    { id: 'sm5', name: 'Dandenong Ranges Pony Club', zoneId: '10', latitude: -37.9000, longitude: 145.3500 },
    { id: 'sm6', name: 'Hampton & District Pony Club', zoneId: '10', latitude: -37.9150, longitude: 145.0060 },
    { id: 'sm7', name: 'Keysborough Pony Club', zoneId: '10', latitude: -37.9890, longitude: 145.1650 },
    { id: 'sm8', name: 'Monbulk Pony Club', zoneId: '10', latitude: -37.8809, longitude: 145.4243 },
    { id: 'sm9', name: 'Mornington Peninsula Pony Club', zoneId: '10', latitude: -38.4063, longitude: 144.8622 },
    { id: 'sm10', name: 'Pakenham Pony Club', zoneId: '10', latitude: -38.0667, longitude: 145.4833 },
    { id: 'sm11', name: 'Peninsula Pony Club', zoneId: '10', latitude: -38.3500, longitude: 144.8833 },
    { id: 'sm12', name: 'Upper Beaconsfield Pony Club', zoneId: '10', latitude: -38.0500, longitude: 145.4167 },
    { id: 'sm13', name: 'Yarra Brae Pony Club', zoneId: '10', latitude: -37.7020, longitude: 145.3260 },
    

    // West Gippsland Zone
    { id: 'wg1', name: 'Corner Inlet Pony Club', zoneId: '11', latitude: -38.6833, longitude: 146.3333 },
    { id: 'wg2', name: 'Drouin Pony Club', zoneId: '11', latitude: -38.1333, longitude: 145.8500 },
    { id: 'wg3', name: 'Loch Pony Club', zoneId: '11', latitude: -38.3667, longitude: 145.7000 },
    { id: 'wg4', name: 'Neerim Pony Club', zoneId: '11', latitude: -37.9500, longitude: 145.9500 },
    { id: 'wg5', name: 'Trafalgar Pony Club', zoneId: '11', latitude: -38.2000, longitude: 146.1500 },
    { id: 'wg6', name: 'Wonthaggi Pony Club', zoneId: '11', latitude: -38.6000, longitude: 145.5833 },

    // Western Zone
    { id: 'w1', name: 'Ararat Pony Club', zoneId: '12', latitude: -37.2833, longitude: 142.9167 },
    { id: 'w2', name: 'Casterton Pony Club', zoneId: '12', latitude: -37.5833, longitude: 141.4000 },
    { id: 'w3', name: 'Cobden Pony Club', zoneId: '12', latitude: -38.3333, longitude: 143.0833 },
    { id: 'w4', name: 'Coleraine Pony Club', zoneId: '12', latitude: -37.6000, longitude: 141.6833 },
    { id: 'w5', name: 'Hamilton Pony Club', zoneId: '12', latitude: -37.7333, longitude: 142.0167 },
    { id: 'w6', name: 'Heywood Pony Club', zoneId: '12', latitude: -38.1333, longitude: 141.6167 },
    { id: 'w7', name: 'Koroit Pony Club', zoneId: '12', latitude: -38.2500, longitude: 142.3833 },
    { id: 'w8', name: 'Macarthur Pony Club', zoneId: '12', latitude: -38.0500, longitude: 142.0000 },
    { id: 'w9', name: 'Mortlake Pony Club', zoneId: '12', latitude: -38.0833, longitude: 142.7833 },
    { id: 'w10', name: 'Mount Gambier Pony Club', zoneId: '12', latitude: -37.8292, longitude: 140.7808 },
    { id: 'w11', name: 'Port Fairy Pony Club', zoneId: '12', latitude: -38.3833, longitude: 142.2333 },
    { id: 'w12', name: 'Portland Pony Club', zoneId: '12', latitude: -38.3500, longitude: 141.6000 },
    { id: 'w13', name: 'Warrnambool Pony Club', zoneId: '12', latitude: -38.3833, longitude: 142.4833 },

    // Wimmera Zone
    { id: 'wi1', name: 'Donald Pony Club', zoneId: '13', latitude: -36.3667, longitude: 142.9833 },
    { id: 'wi2', name: 'Dimboola Pony Club', zoneId: '13', latitude: -36.4500, longitude: 142.0167 },
    { id: 'wi3', name: 'Horsham Pony Club', zoneId: '13', latitude: -36.7167, longitude: 142.2000 },
    { id: 'wi4', name: 'Kaniva Pony Club', zoneId: '13', latitude: -36.4167, longitude: 141.2333 },
    { id: 'wi5', name: 'Nhill Pony Club', zoneId: '13', latitude: -36.3333, longitude: 141.6500 },
    { id: 'wi6', name: 'Stawell Pony Club', zoneId: '13', latitude: -37.0500, longitude: 142.7667 },
    { id: 'wi7', name: 'Warracknabeal Pony Club', zoneId: '13', latitude: -36.2500, longitude: 142.4000 },
];


export let eventTypesMock: EventType[] = [
  { id: '1', name: 'Rally' },
  { id: '2', name: 'Show Jumping Competition' },
  { id: '3', name: 'Dressage Competition' },
  { id: '4', name: 'Cross Country Clinic' },
  { id: '5', name: 'Mounted Games' },
  { id: '6', name: 'Certificate Assessment' },
  { id: 'ph', name: 'Public Holiday'},
];

interface PublicHoliday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    fixed: boolean;
    global: boolean;
    counties: string[] | null;
    launchYear: number | null;
    types: string[];
}

const getPublicHolidays = async (startYear: number, yearsAhead: number = 5): Promise<Event[]> => {
    const allHolidays: Event[] = [];
    
    // Fetch holidays for current year and next 5 years (6 years total)
    for (let i = 0; i <= yearsAhead; i++) {
        const year = startYear + i;
        
        try {
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/AU`);
            if (!response.ok) {
                console.warn(`Failed to fetch public holidays for ${year}:`, response.statusText);
                continue; // Skip this year but continue with others
            }
            
            const holidays: PublicHoliday[] = await response.json();
            
            // Filter for Victorian holidays (AU-VIC) and convert to Event format
            const yearHolidays = holidays
                .filter(holiday => holiday.counties === null || holiday.counties?.includes('AU-VIC'))
                .map((holiday, index) => ({
                    id: `ph-${year}-${index}`,
                    name: holiday.localName,
                    date: new Date(holiday.date),
                    clubId: 'N/A',
                    eventTypeId: 'ph', 
                    status: 'public_holiday' as const,
                    location: 'Victoria',
                    source: 'public_holiday' as const,
                }));
            
            allHolidays.push(...yearHolidays);
            
        } catch (error) {
            console.error(`Error fetching public holidays for ${year}:`, error);
            // Continue with other years even if one fails
        }
    }
    
    return allHolidays;
};


// Data access functions
export async function seedData() {
    if (!adminDb) {
        console.log('Admin DB not available - skipping seed data during build');
        return { success: false, message: 'Admin database not available. Check Firebase configuration.' };
    }
    
    console.log('Seeding data...');
    const batch = adminDb.batch();

    try {
        const zonesSnapshot = await adminDb.collection('zones').limit(1).get();
        if (zonesSnapshot.empty) {
            console.log('Seeding zones...');
            zonesMock.forEach(zone => {
                const zoneRef = adminDb.collection('zones').doc(zone.id);
                batch.set(zoneRef, zone);
            });
        }

        const clubsSnapshot = await adminDb.collection('clubs').limit(1).get();
        if (clubsSnapshot.empty) {
            console.log('Seeding clubs...');
            clubsMock.forEach(club => {
                const clubRef = adminDb.collection('clubs').doc(club.id);
                batch.set(clubRef, club);
            });
        }

        const eventTypesSnapshot = await adminDb.collection('eventTypes').limit(1).get();
        if (eventTypesSnapshot.empty) {
            console.log('Seeding event types...');
            eventTypesMock.forEach(eventType => {
                const eventTypeRef = adminDb.collection('eventTypes').doc(eventType.id);
                batch.set(eventTypeRef, eventType);
            });
        }
        
        await batch.commit();

        console.log('Seeding complete.');
        return { success: true, message: "Database seeded successfully." };
    } catch (error) {
        console.error("Error seeding database: ", error);
        return { success: false, message: "Error seeding database." };
    }
}


export const getClubs = async (): Promise<Club[]> => {
    if (!adminDb) {
        console.warn('Admin DB not available - returning empty clubs array');
        return [];
    }
    const querySnapshot = await adminDb.collection('clubs').get();
    return querySnapshot.docs.map((doc: DocumentData) => {
        const data = doc.data();
        // Convert Firestore timestamps to plain Date objects for serialization
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            data.updatedAt = data.updatedAt.toDate();
        }
        return { id: doc.id, ...data } as Club;
    });
};

export const getEventTypes = async (): Promise<EventType[]> => {
    if (!adminDb) {
        console.warn('Admin DB not available - returning empty event types array');
        return [];
    }
    const querySnapshot = await adminDb.collection('eventTypes').get();
    return querySnapshot.docs.map((doc: DocumentData) => {
        const data = doc.data();
        // Convert Firestore timestamps to plain Date objects for serialization
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            data.updatedAt = data.updatedAt.toDate();
        }
        return { id: doc.id, ...data } as EventType;
    });
};

export const getEvents = async (): Promise<Event[]> => {
    if (!adminDb) {
        console.warn('Admin DB not available - returning empty events array');
        return [];
    }
    const querySnapshot = await adminDb.collection('events').get();
    const events = querySnapshot.docs.map((doc: DocumentData) => {
        const data = doc.data();
        // Convert Firestore timestamps to plain Date objects for serialization
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            data.updatedAt = data.updatedAt.toDate();
        }
        return {
            id: doc.id,
            ...data,
            // The `date` field from firestore is a timestamp
            date: data.date && data.date.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date),
        } as Event;
    });

    const currentYear = getYear(new Date());
    const publicHolidays = await getPublicHolidays(currentYear);
    return [...events, ...publicHolidays];
};

export const getEventById = async (id: string) => {
    if (!adminDb) {
        return undefined;
    }
    const eventDocRef = adminDb.collection('events').doc(id);
    const docSnap = await eventDocRef.get();
    if (!docSnap.exists) return undefined;
    const data = docSnap.data();
    if (!data) return undefined;
    return {
        id: docSnap.id,
        ...data,
        date: data.date && data.date.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date),
    } as Event;
}

export const getClubById = async (id: string) => {
    if (!adminDb) {
        return undefined;
    }
    const clubDocRef = adminDb.collection('clubs').doc(id);
    const docSnap = await clubDocRef.get();
    if (!docSnap.exists) return undefined;
    return { id: docSnap.id, ...docSnap.data() } as Club;
};

export const updateClub = async (id: string, updateData: Partial<Club>) => {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  const clubRef = adminDb.collection('clubs').doc(id);
  await clubRef.update(updateData);
  return { success: true };
};

export const getEventTypeById = async (id: string) => {
    if (!adminDb) {
        return undefined;
    }
    const eventTypeDocRef = adminDb.collection('eventTypes').doc(id);
    const docSnap = await eventTypeDocRef.get();
    if (!docSnap.exists) return undefined;
    return { id: docSnap.id, ...docSnap.data() } as EventType;
};

export const addEvent = async (event: Omit<Event, 'id' | 'source'>) => {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  const newEventData = {
    ...event,
    source: 'zone', // Default source for new events
    date: Timestamp.fromDate(event.date), // Convert Date to Firestore Timestamp
  };
  const eventsCollection = adminDb.collection('events');
  const docRef = await eventsCollection.add(newEventData);
  return { id: docRef.id, ...event };
};

export const updateEventStatus = async (id: string, status: 'approved' | 'rejected') => {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized');
  }
  const eventRef = adminDb.collection('events').doc(id);
  await eventRef.update({ status });
  return { success: true };
};

// Zone-related functions
export const getZones = async (): Promise<Zone[]> => {
  if (!adminDb) {
    console.warn('Admin DB not available - returning mock zones');
    return zonesMock;
  }
  
  const zonesCollection = adminDb.collection('zones');
  const querySnapshot = await zonesCollection.get();
  
  if (querySnapshot.empty) {
    // If no zones in database, return mock data
    return zonesMock;
  }
  
  return querySnapshot.docs.map((doc: DocumentData) => {
    const data = doc.data();
    // Convert Firestore timestamps to plain Date objects for serialization
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      data.createdAt = data.createdAt.toDate();
    }
    if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
      data.updatedAt = data.updatedAt.toDate();
    }
    return { id: doc.id, ...data } as Zone;
  });
};

export const getZoneById = async (zoneId: string): Promise<Zone | null> => {
  try {
    if (!adminDb) {
      return zonesMock.find(zone => zone.id === zoneId) || null;
    }
    
    const zoneRef = adminDb.collection('zones').doc(zoneId);
    const docSnap = await zoneRef.get();
    
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Zone;
    }
    
    // Fallback to mock data
    return zonesMock.find(zone => zone.id === zoneId) || null;
  } catch (error) {
    console.error('Error fetching zone:', error);
    // Fallback to mock data
    return zonesMock.find(zone => zone.id === zoneId) || null;
  }
};

export const getZoneByClubId = async (clubId: string): Promise<Zone | null> => {
  try {
    // First get the club to find its zoneId
    const club = await getClubById(clubId);
    if (!club) {
      return null;
    }
    
    // Then get the zone by zoneId
    return await getZoneById(club.zoneId);
  } catch (error) {
    console.error('Error fetching zone by club ID:', error);
    return null;
  }
};