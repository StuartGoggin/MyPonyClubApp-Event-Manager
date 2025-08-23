import { getZones, getClubs, getEventTypes } from './data';
import type { Zone, Club, EventType } from './types';

// Re-export data loading functions for admin use
export { getZones, getClubs, getEventTypes };

// Export types for convenience
export type { Zone, Club, EventType };
