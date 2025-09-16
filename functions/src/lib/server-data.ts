import { adminDb, getDatabaseStatus } from './firebase-admin';
import type { Club, Zone } from './types';

/**
 * Check if database is connected
 */
function isDatabaseConnected(): boolean {
  return getDatabaseStatus() === 'connected';
}

/**
 * Get database error message
 */
function getDatabaseErrorMessage(): string {
  const status = getDatabaseStatus();
  switch (status) {
    case 'disconnected':
      return 'Database not connected';
    case 'error':
      return 'Database connection error';
    case 'unknown':
      return 'Database status unknown';
    default:
      return 'Database connection issue';
  }
}

/**
 * Get all clubs from the database
 */
export async function getAllClubs(): Promise<Club[]> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ getAllClubs: Database connection issue -', errorMessage);
      return [];
    }
    
    const clubsSnapshot = await adminDb.collection('clubs').get();
    const clubs: Club[] = [];
    
    clubsSnapshot.forEach((doc: any) => {
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

/**
 * Get a club by ID
 */
export async function getClubById(id: string): Promise<Club | null> {
  try {
    if (!adminDb) {
      console.warn('Firebase Admin not initialized');
      return null;
    }
    
    const doc = await adminDb.collection('clubs').doc(id).get();
    
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Club;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching club by id:', error);
    return null;
  }
}

/**
 * Update a club
 */
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

/**
 * Create a new club
 */
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

/**
 * Get all zones from the database
 */
export async function getAllZones(): Promise<Zone[]> {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage();
      console.warn('⚠️ getAllZones: Database connection issue -', errorMessage);
      return [];
    }
    
    const zonesSnapshot = await adminDb.collection('zones').get();
    const zones: Zone[] = [];
    
    zonesSnapshot.forEach((doc: any) => {
      if (doc.exists) {
        zones.push({ id: doc.id, ...doc.data() } as Zone);
      }
    });
    
    return zones;
  } catch (error: any) {
    console.error('Error fetching zones:', error);
    return [];
  }
}
