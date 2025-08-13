// Client-side mock data for admin interfaces
import type { Zone, Club, EventType } from './types';

export const zonesMock: Zone[] = [
    { id: '1', name: 'Barwon Zone' },
    { id: '2', name: 'Central Zone' },
    { id: '3', name: 'East Gippsland Zone' },
    { id: '4', name: 'Gippsland Zone' },
    { id: '5', name: 'Midland Zone' },
    { id: '6', name: 'North Eastern Zone' },
    { id: '7', name: 'North Metropolitan Zone' },
    { id: '8', name: 'Northern Zone' },
    { id: '9', name: 'Port Phillip Zone' },
    { id: '10', name: 'South Metropolitan Zone' },
    { id: '11', name: 'West Gippsland Zone' },
    { id: '12', name: 'Western Zone' },
    { id: '13', name: 'Wimmera Zone' },
];

export const clubsMock: Club[] = [
    // Barwon Zone
    { id: 'b1', name: 'Anglesea Pony Club', zoneId: '1', latitude: -38.4116, longitude: 144.1793 },
    { id: 'b2', name: 'Barwon Heads Pony Club', zoneId: '1', latitude: -38.2705, longitude: 144.4820 },
    { id: 'b3', name: 'Barwon Valley Pony Club', zoneId: '1', latitude: -38.1888, longitude: 144.3317 },
    { id: 'b4', name: 'Colac Pony Club', zoneId: '1', latitude: -38.3403, longitude: 143.5855 },
    { id: 'b5', name: 'Drysdale Leopold Pony Club', zoneId: '1', latitude: -38.1736, longitude: 144.5623 },
    { id: 'b6', name: 'Forrest Pony Club', zoneId: '1', latitude: -38.5209, longitude: 143.7126 },
    { id: 'b7', name: 'Geelong Pony Club', zoneId: '1', latitude: -38.1064, longitude: 144.3490 },
    { id: 'b8', name: 'Inverleigh Pony Club', zoneId: '1', latitude: -38.1258, longitude: 144.0538 },
    // More simplified mock data...
    { id: 'c1', name: 'Melbourne Pony Club', zoneId: '7', latitude: -37.8136, longitude: 144.9631 },
    { id: 'c2', name: 'Geelong Pony Club', zoneId: '1', latitude: -38.1499, longitude: 144.3617 },
    { id: 'c3', name: 'Ballarat Pony Club', zoneId: '2', latitude: -37.5622, longitude: 143.8503 },
];

export const eventTypesMock: EventType[] = [
    { id: 'rally', name: 'Rally' },
    { id: 'ode', name: 'ODE (One Day Event)' },
    { id: 'dressage', name: 'Dressage' },
    { id: 'jumping', name: 'Show Jumping' },
    { id: 'cross-country', name: 'Cross Country' },
    { id: 'combined', name: 'Combined Training' },
    { id: 'tetrathlon', name: 'Tetrathlon' },
    { id: 'games', name: 'Games' },
    { id: 'prince-philip', name: 'Prince Philip Cup' },
    { id: 'championships', name: 'Championships' },
    { id: 'clinic', name: 'Clinic' },
    { id: 'training', name: 'Training Day' },
    { id: 'fundraising', name: 'Fund Raising Event' }
];
