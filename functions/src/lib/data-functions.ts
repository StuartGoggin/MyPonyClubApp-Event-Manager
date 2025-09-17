import { adminDb } from "./firebase-admin";
import { Club, Zone, EventType } from "./types";

/**
 * Get club by ID using Firebase Admin SDK
 */
export const getClubById = async (id: string): Promise<Club | undefined> => {
  try {
    if (!adminDb) {
      console.error("Admin database not initialized");
      return undefined;
    }

    const clubDoc = await adminDb.collection("clubs").doc(id).get();
    if (!clubDoc.exists) {
      return undefined;
    }

    return { id: clubDoc.id, ...clubDoc.data() } as Club;
  } catch (error) {
    console.error("Error fetching club by ID:", error);
    return undefined;
  }
};

/**
 * Get zone by ID using Firebase Admin SDK
 */
export const getZoneById = async (zoneId: string): Promise<Zone | null> => {
  try {
    if (!adminDb) {
      console.error("Admin database not initialized");
      return null;
    }

    const zoneDoc = await adminDb.collection("zones").doc(zoneId).get();
    if (!zoneDoc.exists) {
      return null;
    }

    return { id: zoneDoc.id, ...zoneDoc.data() } as Zone;
  } catch (error) {
    console.error("Error fetching zone by ID:", error);
    return null;
  }
};

/**
 * Get zone by club ID using Firebase Admin SDK
 */
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
    console.error("Error fetching zone by club ID:", error);
    return null;
  }
};

/**
 * Get event type by ID using Firebase Admin SDK
 */
export const getEventTypeById = async (
  id: string,
): Promise<EventType | undefined> => {
  try {
    if (!adminDb) {
      console.error("Admin database not initialized");
      return undefined;
    }

    const eventTypeDoc = await adminDb.collection("eventTypes").doc(id).get();
    if (!eventTypeDoc.exists) {
      return undefined;
    }

    return { id: eventTypeDoc.id, ...eventTypeDoc.data() } as EventType;
  } catch (error) {
    console.error("Error fetching event type by ID:", error);
    return undefined;
  }
};
