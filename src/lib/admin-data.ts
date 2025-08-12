import { Zone, Club, EventType } from './types';

// Mock data for client-side admin interface
export const zonesMockClient: Zone[] = [
  { id: 'zone-eastern', name: 'Eastern Victoria' },
  { id: 'zone-western', name: 'Western Victoria' },
  { id: 'zone-northern', name: 'Northern Victoria' },
  { id: 'zone-central', name: 'Central Victoria' },
  { id: 'zone-gippsland', name: 'Gippsland' }
];

export const clubsMockClient: Club[] = [
  { 
    id: 'club-melbourne', 
    name: 'Melbourne Pony Club', 
    zoneId: 'zone-central',
    latitude: -37.8136,
    longitude: 144.9631
  },
  { 
    id: 'club-geelong', 
    name: 'Geelong Pony Club', 
    zoneId: 'zone-western',
    latitude: -38.1499,
    longitude: 144.3617
  },
  { 
    id: 'club-ballarat', 
    name: 'Ballarat Pony Club', 
    zoneId: 'zone-western',
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
    zoneId: 'zone-gippsland',
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
