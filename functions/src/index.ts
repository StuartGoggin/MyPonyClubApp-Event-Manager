/**
 * Firebase Functions for PonyClub Event Manager
 * 
 * Simplified exports while debugging complex initialization issues
 */

// Export simple working functions only
export { apiSimple } from './api-simple';
export { runBackupsFixed, triggerBackupFixed } from './backup-fixed';
export { testSimple } from './test-simple';
export { runBackupsSimple, triggerBackupSimple } from './backup-simple';
export { scrapeEquestrianEvents } from './scrape-ev-events';
export { runEvEventsSync } from './ev-sync-runner';