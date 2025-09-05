import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from './firebase-admin';
import type { Zone, Club, EventType, Event } from './types';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

// Server-side functions for fetching data from Firestore
export async function getAllZones(): Promise<Zone[]> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ getAllZones: Database connection issue -', errorMessage);
      return [];
    }
    
    const zonesSnapshot = await adminDb.collection('zones').get();
    const zones: Zone[] = [];
    
    zonesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        zones.push({ id: doc.id, ...doc.data() } as Zone);
      }
    });
    
    return zones;
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ getAllZones: Database connection timeout or unavailable');
    } else {
      console.error('Error fetching zones:', error);
    }
    return [];
  }
}

export async function getAllClubs(): Promise<Club[]> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ getAllClubs: Database connection issue -', errorMessage);
      return [];
    }
    
    const clubsSnapshot = await adminDb.collection('clubs').get();
    const clubs: Club[] = [];
    
    clubsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        clubs.push({ id: doc.id, ...doc.data() } as Club);
      }
    });
    
    return clubs;
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ getAllClubs: Database connection timeout or unavailable');
    } else {
      console.error('Error fetching clubs:', error);
    }
    return [];
  }
}

export async function getAllEventTypes(): Promise<EventType[]> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized, returning empty event types array');
      return [];
    }
    
    const eventTypesSnapshot = await adminDb.collection('eventTypes').get();
    const eventTypes: EventType[] = [];
    
    eventTypesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        eventTypes.push({ id: doc.id, ...doc.data() } as EventType);
      }
    });
    
    return eventTypes;
  } catch (error) {
    console.error('Error fetching event types:', error);
    return [];
  }
}

export async function getAllEvents(): Promise<Event[]> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized, returning empty events array');
      return [];
    }
    
    const eventsSnapshot = await adminDb.collection('events').get();
    const events: Event[] = [];
    
    eventsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      if (doc.exists) {
        const data = doc.data();
        // Convert Firestore timestamp to Date if needed
        if (data.date && typeof data.date.toDate === 'function') {
          data.date = data.date.toDate();
        }
        events.push({ id: doc.id, ...data } as Event);
      }
    });
    
    return events;
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

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ deleteEvent: Database connection issue -', errorMessage);
      return false;
    }
    
    await adminDb.collection('events').doc(eventId).delete();
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
    
  } catch (error: any) {
    console.error('Error in deleteEventsBatch:', error);
    failed.push(...eventIds);
  }
  
  return { success, failed };
}
