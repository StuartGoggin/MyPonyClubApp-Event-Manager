import type { Zone, Club, EventType, Event } from './types';
import { addMonths, startOfMonth, addDays, subDays } from 'date-fns';

// In a real application, this data would be stored in and fetched from a database.
// For this example, we use mock data stored in memory.

let zones: Zone[] = [
  { id: '1', name: 'Barwon Zone' },
  { id: '2', name: 'Central Zone' },
  { id: '3', name: 'East Gippsland Zone' },
  { id: '4', name: 'North Eastern Zone' },
  { id: '5', name: 'Northern Zone' },
];

let clubs: Club[] = [
    { id: '1', name: 'Barwon Valley Pony Club', zoneId: '1', latitude: -38.1499, longitude: 144.3617 },
    { id: '2', name: 'Colac Pony Club', zoneId: '1', latitude: -38.3403, longitude: 143.5855 },
    { id: '3', name: 'Bellarine Peninsula Pony Club', zoneId: '1', latitude: -38.1736, longitude: 144.5623 },
    { id: '4', name: 'Kyneton Pony Club', zoneId: '2', latitude: -37.2475, longitude: 144.4552 },
    { id: '5', name: 'Macedon Pony Club', zoneId: '2', latitude: -37.4167, longitude: 144.5667 },
    { id: '6', name: 'Bairnsdale Pony Club', zoneId: '3', latitude: -37.8278, longitude: 147.6275 },
    { id: '7', name: 'Wangaratta Pony Club', zoneId: '4', latitude: -36.3575, longitude: 146.3156 },
    { id: '8', name: 'Benalla Pony Club', zoneId: '4', latitude: -36.5511, longitude: 145.9822 },
    { id: '9', name: 'Echuca Pony Club', zoneId: '5', latitude: -36.1333, longitude: 144.75 },
    { id: '10', name: 'Shepparton Pony Club', zoneId: '5', latitude: -36.3833, longitude: 145.4 },
];

let eventTypes: EventType[] = [
  { id: '1', name: 'Rally' },
  { id: '2', name: 'Show Jumping Competition' },
  { id: '3', name: 'Dressage Competition' },
  { id: '4', name: 'Cross Country Clinic' },
  { id: '5', name: 'Mounted Games' },
  { id: '6', name: 'Certificate Assessment' },
];

const today = new Date();
const startOfThisMonth = startOfMonth(today);

let events: Event[] = [
  { id: '1', name: 'Monthly Rally Day', date: addDays(startOfThisMonth, 2), clubId: '1', eventTypeId: '1', status: 'approved', location: 'Geelong, VIC', source: 'zone' },
  { id: '2', name: 'Spring Show Jumping', date: addDays(startOfThisMonth, 9), clubId: '4', eventTypeId: '2', status: 'approved', location: 'Kyneton, VIC', source: 'pca' },
  { id: '3', name: 'Official Dressage Comp', date: addDays(startOfThisMonth, 10), clubId: '7', eventTypeId: '3', status: 'proposed', location: 'Wangaratta, VIC', source: 'event_secretary' },
  { id: '4', name: 'Games Practice', date: subDays(startOfThisMonth, 5), clubId: '2', eventTypeId: '5', status: 'approved', location: 'Colac, VIC', source: 'zone' },
  { id: '5', name: 'C-Cert Assessment Day', date: addDays(startOfThisMonth, 20), clubId: '9', eventTypeId: '6', status: 'proposed', location: 'Echuca, VIC', source: 'pca' },
  { id: '6', name: 'XC Training Day', date: addDays(startOfThisMonth, 2), clubId: '6', eventTypeId: '4', status: 'proposed', location: 'Bairnsdale, VIC', source: 'event_secretary' },
  { id: '7', name: 'Winter Woolies Rally', date: addDays(startOfMonth(addMonths(today, 1)), 5), clubId: '5', eventTypeId: '1', status: 'approved', location: 'Macedon, VIC', source: 'zone' },
  { id: '8', name: 'Grade 3/4 Show Jumping', date: addDays(startOfMonth(addMonths(today, 1)), 12), clubId: '10', eventTypeId: '2', status: 'proposed', location: 'Shepparton, VIC', source: 'pca' },
];

// Data access functions
export const getZones = async () => Promise.resolve(zones);
export const getClubs = async () => Promise.resolve(clubs);
export const getEventTypes = async () => Promise.resolve(eventTypes);
export const getEvents = async () => Promise.resolve(events);
export const getEventById = async (id: string) => Promise.resolve(events.find(e => e.id === id));

export const getClubById = async (id: string) => Promise.resolve(clubs.find(c => c.id === id));
export const getEventTypeById = async (id: string) => Promise.resolve(eventTypes.find(et => et.id === id));

export const addEvent = async (event: Omit<Event, 'id'>) => {
  const newEvent: Event = {
    id: String(Date.now()),
    ...event,
    source: 'event_secretary', // Default source for new events
  };
  events.push(newEvent);
  return Promise.resolve(newEvent);
};

export const updateEventStatus = async (id: string, status: 'approved' | 'rejected') => {
  const eventIndex = events.findIndex(e => e.id === id);
  if (eventIndex !== -1) {
    events[eventIndex].status = status;
    return Promise.resolve(events[eventIndex]);
  }
  return Promise.resolve(null);
};
