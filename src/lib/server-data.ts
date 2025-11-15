import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from './firebase-admin';
import type { Zone, Club, EventType, Event } from './types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';
import { getYear } from 'date-fns';

// Interface for public holiday API response
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

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = {
  clubs: null as CacheEntry<Club[]> | null,
  zones: null as CacheEntry<Zone[]> | null,
  eventTypes: null as CacheEntry<EventType[]> | null,
  events: null as CacheEntry<Event[]> | null,
  publicHolidays: null as CacheEntry<Event[]> | null,
};

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const PUBLIC_HOLIDAYS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (holidays don't change often)

function getCached<T>(key: keyof typeof cache, customTTL?: number): T | null {
  const entry = cache[key] as CacheEntry<T> | null;
  if (!entry) return null;
  
  const ttl = customTTL || CACHE_TTL;
  const age = Date.now() - entry.timestamp;
  if (age > ttl) {
    cache[key] = null; // Expire
    return null;
  }
  
  console.log(`✨ Cache HIT for ${key} (age: ${Math.round(age / 1000)}s)`);
  return entry.data;
}

function setCache<T>(key: keyof typeof cache, data: T): void {
  (cache[key] as CacheEntry<T>) = {
    data,
    timestamp: Date.now(),
  };
}

// Function to invalidate specific cache entries
export function invalidateCache(keys: (keyof typeof cache)[]): void {
  keys.forEach(key => {
    if (cache[key]) {
      cache[key] = null;
      console.log(`🗑️  Cache invalidated for ${key}`);
    }
  });
}

// Convenience functions for common invalidation scenarios
export function invalidateEventsCache(): void {
  invalidateCache(['events']);
}

export function invalidateClubsCache(): void {
  invalidateCache(['clubs']);
}

export function invalidateZonesCache(): void {
  invalidateCache(['zones']);
}

export function invalidateEventTypesCache(): void {
  invalidateCache(['eventTypes']);
}

// Server-side functions for fetching data from Firestore
export async function getAllZones(): Promise<Zone[]> {
  try {
    // Check cache first
    const cached = getCached<Zone[]>('zones');
    if (cached) {
      return cached;
    }
    
    // Fast fail if database is not connected
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ getAllZones: Database not connected -', errorMessage);
      return [];
    }
    
    console.log('🔍 Fetching zones from Firestore (cache miss)...');
    const zonesSnapshot = await adminDb.collection('zones').get();
    const zones: Zone[] = [];
    
    zonesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        zones.push({ id: doc.id, ...doc.data() } as Zone);
      }
    });
    
    console.log(`✅ Retrieved ${zones.length} zones - CACHED for 12 hours`);
    
    // Cache the result
    setCache('zones', zones);
    
    return zones;
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.error('⚠️ getAllZones: Database connection timeout or unavailable');
    } else {
      console.error('❌ Error fetching zones:', error);
    }
    return [];
  }
}

export async function getAllClubs(): Promise<Club[]> {
  try {
    // Check cache first
    const cached = getCached<Club[]>('clubs');
    if (cached) {
      return cached;
    }
    
    // Fast fail if database is not connected - don't attempt connection
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ getAllClubs: Database not connected -', errorMessage);
      console.warn('⚠️ Returning empty array to avoid timeout');
      return [];
    }
    
    console.log('� Fetching clubs from Firestore (cache miss)...');
    const startTime = Date.now();
    const clubsSnapshot = await adminDb.collection('clubs').get();
    const queryTime = Date.now() - startTime;
    
    console.log(`📦 Processing ${clubsSnapshot.size} documents...`);
    const processStart = Date.now();
    const clubs: Club[] = [];
    
    clubsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        clubs.push({ id: doc.id, ...doc.data() } as Club);
      }
    });
    
    const processTime = Date.now() - processStart;
    const totalTime = Date.now() - startTime;
    
    console.log(`⏱️  Timing breakdown:`);
    console.log(`   - Firestore query: ${queryTime}ms`);
    console.log(`   - Document processing: ${processTime}ms`);
    console.log(`   - Total: ${totalTime}ms`);
    console.log(`✅ Retrieved ${clubs.length} clubs - CACHED for 12 hours`);
    
    // Cache the result
    setCache('clubs', clubs);
    
    return clubs;
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.error('⚠️ getAllClubs: Database connection timeout or unavailable');
    } else {
      console.error('❌ Error fetching clubs:', error);
    }
    return [];
  }
}

export async function getAllEventTypes(): Promise<EventType[]> {
  try {
    // Check cache first
    const cached = getCached<EventType[]>('eventTypes');
    if (cached) {
      return cached;
    }
    
    if (!adminDb) {
      console.warn('Firebase Admin not initialized, returning empty event types array');
      return [];
    }
    
    console.log('🔍 Fetching event types from Firestore (cache miss)...');
    const eventTypesSnapshot = await adminDb.collection('eventTypes').get();
    const eventTypes: EventType[] = [];
    
    eventTypesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        eventTypes.push({ id: doc.id, ...doc.data() } as EventType);
      }
    });
    
    console.log(`✅ Retrieved ${eventTypes.length} event types - CACHED for 12 hours`);
    
    // Cache the result
    setCache('eventTypes', eventTypes);
    
    return eventTypes;
  } catch (error) {
    console.error('Error fetching event types:', error);
    return [];
  }
}

// Fetch public holidays with caching
async function getPublicHolidays(startYear: number, yearsAhead: number = 5): Promise<Event[]> {
  // Check cache first
  const cached = getCached<Event[]>('publicHolidays', PUBLIC_HOLIDAYS_CACHE_TTL);
  if (cached) {
    return cached;
  }

  console.log('🎉 Fetching public holidays from API (cache miss)...');
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
  
  console.log(`✅ Fetched ${allHolidays.length} public holidays - CACHED for 24 hours`);
  
  // Cache the result for 24 hours
  setCache('publicHolidays', allHolidays);
  
  return allHolidays;
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    // Check cache first
    const cached = getCached<Event[]>('events');
    if (cached) {
      // Still need to append public holidays (they're cached separately)
      const currentYear = getYear(new Date());
      const publicHolidays = await getPublicHolidays(currentYear);
      return [...cached, ...publicHolidays];
    }
    
    if (!adminDb) {
      console.warn('Firebase Admin not initialized, returning empty events array');
      return [];
    }
    
    console.log('📅 Fetching events from Firestore (cache miss)...');
    const startTime = Date.now();
    const eventsSnapshot = await adminDb.collection('events').get();
    const events: Event[] = [];
    
    eventsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        const data = doc.data();
        // Convert Firestore timestamp to Date if needed
        if (data.date && typeof data.date.toDate === 'function') {
          data.date = data.date.toDate();
        }
        // Clean event name - remove priority suffixes
        if (data.name) {
          data.name = data.name.replace(/\s*\(Priority\s+\d+[^)]*\)\s*$/i, '').trim();
        }
        events.push({ id: doc.id, ...data } as Event);
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Retrieved ${events.length} events in ${queryTime}ms - CACHED for 12 hours`);
    
    // Cache the Firestore events
    setCache('events', events);
    
    // Fetch and append public holidays
    const currentYear = getYear(new Date());
    const publicHolidays = await getPublicHolidays(currentYear);
    
    return [...events, ...publicHolidays];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export async function getZoneById(id: string): Promise<Zone | null> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return null;
    }
    
    const zoneDoc = await adminDb.collection('zones').doc(id).get();
    
    if (zoneDoc.exists) {
      return { id: zoneDoc.id, ...zoneDoc.data() } as Zone;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching zone by id:', error);
    return null;
  }
}

export async function getClubById(id: string): Promise<Club | null> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return null;
    }
    
    const clubDoc = await adminDb.collection('clubs').doc(id).get();
    
    if (clubDoc.exists) {
      return { id: clubDoc.id, ...clubDoc.data() } as Club;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching club by id:', error);
    return null;
  }
}

export async function updateClub(id: string, clubData: Partial<Club>): Promise<Club | null> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return null;
    }
    
    // Remove the id from the data if it exists to avoid overwriting it
    const { id: _, ...dataToUpdate } = clubData as Club;
    
    await adminDb.collection('clubs').doc(id).update(dataToUpdate);
    
    // Return the updated club
    return await getClubById(id);
  } catch (error) {
    console.error('Error updating club:', error);
    return null;
  }
}

export async function createClub(clubData: Omit<Club, 'id'>): Promise<Club | null> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return null;
    }
    
    const docRef = await adminDb.collection('clubs').add(clubData);
    
    // Return the created club with its new ID
    return { id: docRef.id, ...clubData };
  } catch (error) {
    console.error('Error creating club:', error);
    return null;
  }
}

export async function deleteClub(clubId: string): Promise<boolean> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ deleteClub: Database connection issue -', errorMessage);
      return false;
    }
    
    await adminDb.collection('clubs').doc(clubId).delete();
    invalidateClubsCache();
    console.log(`Club ${clubId} deleted successfully`);
    return true;
  } catch (error: any) {
    console.error('Error deleting club:', error);
    return false;
  }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ deleteEvent: Database connection issue -', errorMessage);
      return false;
    }
    
    await adminDb.collection('events').doc(eventId).delete();
    invalidateEventsCache();
    console.log(`Event ${eventId} deleted successfully`);
    return true;
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return false;
  }
}

export async function deleteEventsBatch(eventIds: string[]): Promise<{ success: string[], failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];
  
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ deleteEventsBatch: Database connection issue -', errorMessage);
      return { success, failed: eventIds };
    }
    
    // Firestore batch has a limit of 500 operations
    const BATCH_SIZE = 500;
    const batches = [];
    
    for (let i = 0; i < eventIds.length; i += BATCH_SIZE) {
      batches.push(eventIds.slice(i, i + BATCH_SIZE));
    }
    
    for (const batch of batches) {
      const firestoreBatch = adminDb.batch();
      
      for (const eventId of batch) {
        const eventRef = adminDb.collection('events').doc(eventId);
        firestoreBatch.delete(eventRef);
      }
      
      try {
        await firestoreBatch.commit();
        success.push(...batch);
        console.log(`Batch deleted ${batch.length} events successfully`);
      } catch (error: any) {
        console.error('Error in batch delete:', error);
        failed.push(...batch);
      }
    }
    
    // Invalidate cache if any events were successfully deleted
    if (success.length > 0) {
      invalidateEventsCache();
    }
    
  } catch (error: any) {
    console.error('Error in deleteEventsBatch:', error);
    failed.push(...eventIds);
  }
  
  return { success, failed };
}
