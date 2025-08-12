import { Zone, Club, EventType } from './types';

// Mock data for client-side admin interface
export const zonesMockClient: Zone[] = [
  { id: 'zone-barwon', name: 'Barwon Zone' },
  { id: 'zone-central', name: 'Central Zone' },
  { id: 'zone-east-gippsland', name: 'East Gippsland Zone' },
  { id: 'zone-midland', name: 'Midland Zone' },
  { id: 'zone-north-eastern', name: 'North Eastern Zone' },
  { id: 'zone-north-metropolitan', name: 'North Metropolitan Zone' },
  { id: 'zone-northern', name: 'Northern Zone' },
  { id: 'zone-southern-metropolitan', name: 'Southern Metropolitan Zone' },
  { id: 'zone-wannon', name: 'Wannon Zone' },
  { id: 'zone-west-gippsland', name: 'West Gippsland Zone' }
];

export const clubsMockClient: Club[] = [
  { 
    id: 'club-melbourne', 
    name: 'Melbourne Pony Club', 
    zoneId: 'zone-north-metropolitan',
    latitude: -37.8136,
    longitude: 144.9631
  },
  { 
    id: 'club-geelong', 
    name: 'Geelong Pony Club', 
    zoneId: 'zone-barwon',
    latitude: -38.1499,
    longitude: 144.3617
  },
  { 
    id: 'club-ballarat', 
    name: 'Ballarat Pony Club', 
    zoneId: 'zone-central',
    latitude: -37.5622,
    longitude: 143.8503
  },
  { 
    id: 'club-bendigo', 
    name: 'Bendigo Pony Club', 
    zoneId: 'zone-northern',
    latitude: -36.7570,
    longitude: 144.2794
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
