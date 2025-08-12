// Only import types, never server-only modules here
import type { Zone, Club, EventType } from './types';

// Mock data for client-side admin interface
export const zonesMockClient: Zone[] = [
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

export const clubsMockClient: Club[] = [
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

export const eventTypesMockClient: EventType[] = [
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
