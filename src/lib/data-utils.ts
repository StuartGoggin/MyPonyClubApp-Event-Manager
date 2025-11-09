/**
 * Data transformation utilities for client-server data exchange
 * Helps prevent cache overflow and serialization issues
 */

import { Club, EventType, Event, Zone } from './types';

/**
 * Convert Firestore timestamps to plain objects for client serialization
 */
export function serializeFirestoreData(data: any): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }
  
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        // Convert Firestore Timestamp to Date
        serialized[key] = value.toDate();
      } else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        // Convert Firestore Timestamp object to Date
        const timestamp = value as { seconds: number; nanoseconds: number };
        serialized[key] = new Date(timestamp.seconds * 1000);
      } else if (typeof value === 'object') {
        serialized[key] = serializeFirestoreData(value);
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }
  
  return data;
}

/**
 * Create a lightweight version of club data for forms
 */
export function createLightweightClubs(clubs: Club[]): Partial<Club>[] {
  return clubs.map(club => ({
    id: club.id,
    name: club.name,
    zoneId: club.zoneId,
    // Keep only essential fields for forms
    email: club.email,
    phone: club.phone,
    address: club.address
  }));
}

/**
 * Create a lightweight version of event data for forms
 */
export function createLightweightEvents(events: Event[]): Partial<Event>[] {
  return events.map(event => ({
    id: event.id,
    name: event.name,
    date: event.date,
    clubId: event.clubId,
    zoneId: event.zoneId,
    eventTypeId: event.eventTypeId,
    location: event.location,
    status: event.status
  }));
}

/**
 * Estimate data size in bytes for cache management
 */
export function estimateDataSize(data: any): number {
  return JSON.stringify(data).length;
}

/**
 * Check if data size exceeds Next.js cache limits
 */
export function isDataSizeSafe(data: any, maxSizeMB: number = 1.5): boolean {
  const sizeMB = estimateDataSize(data) / (1024 * 1024);
  return sizeMB < maxSizeMB;
}