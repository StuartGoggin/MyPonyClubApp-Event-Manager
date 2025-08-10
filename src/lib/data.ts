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
  { id: '1', name: 'Barwon Valley Pony Club', zoneId: '1' },
  { id: '2', name: 'Colac Pony Club', zoneId: '1' },
  { id: '3', name: 'Bellarine Peninsula Pony Club', zoneId: '1' },
  { id: '4', name: 'Kyneton Pony Club', zoneId: '2' },
  { id: '5', name: 'Macedon Pony Club', zoneId: '2' },
  { id: '6', name: 'Bairnsdale Pony Club', zoneId: '3' },
  { id: '7', name: 'Wangaratta Pony Club', zoneId: '4' },
  { id: '8', name: 'Benalla Pony Club', zoneId: '4' },
  { id: '9', name: 'Echuca Pony Club', zoneId: '5' },
  { id: '10', name: 'Shepparton Pony Club', zoneId: '5' },
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
  { id: '1', name: 'Monthly Rally Day', date: addDays(startOfThisMonth, 2), clubId: '1', eventTypeId: '1', status: 'approved', location: 'Geelong, VIC' },
  { id: '2', name: 'Spring Show Jumping', date: addDays(startOfThisMonth, 9), clubId: '4', eventTypeId: '2', status: 'approved', location: 'Kyneton, VIC' },
  { id: '3', name: 'Official Dressage Comp', date: addDays(startOfThisMonth, 10), clubId: '7', eventTypeId: '3', status: 'proposed', location: 'Wangaratta, VIC' },
  { id: '4', name: 'Games Practice', date: subDays(startOfThisMonth, 5), clubId: '2', eventTypeId: '5', status: 'approved', location: 'Colac, VIC' },
  { id: '5', name: 'C-Cert Assessment Day', date: addDays(startOfThisMonth, 20), clubId: '9', eventTypeId: '6', status: 'proposed', location: 'Echuca, VIC' },
  { id: '6', name: 'XC Training Day', date: addDays(startOfThisMonth, 2), clubId: '6', eventTypeId: '4', status: 'proposed', location: 'Bairnsdale, VIC' },
  { id: '7', name: 'Winter Woolies Rally', date: addDays(startOfMonth(addMonths(today, 1)), 5), clubId: '5', eventTypeId: '1', status: 'approved', location: 'Macedon, VIC' },
  { id: '8', name: 'Grade 3/4 Show Jumping', date: addDays(startOfMonth(addMonths(today, 1)), 12), clubId: '10', eventTypeId: '2', status: 'proposed', location: 'Shepparton, VIC' },
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
