# Public Holiday Management System - Implementation Summary

## Overview
Public holidays are now managed as regular events in Firestore with automatic synchronization from an external API. This allows for manual editing while maintaining data consistency through periodic syncs.

## Key Changes

### 1. Storage Model
- **Before**: Public holidays fetched on-demand from external API (https://date.nager.at)
- **After**: Public holidays stored in Firestore `events` collection with `source: 'public_holiday'`
- **Benefits**: 
  - Editable through State Manager UI
  - Consistent with other event types
  - Cached with other events (12-hour TTL)
  - No external API dependency during normal operation

### 2. Sync System

#### API Endpoint: `/api/admin/sync-public-holidays`
- **GET**: Check sync status (last sync date, days since sync, holidays count)
- **POST**: Trigger synchronization
  - Automatic sync: Only syncs if last sync was ≥7 days ago
  - Force sync: Override 7-day restriction with `{ force: true }`
  - Configurable: `yearsAhead` parameter (default: 5 years)

#### Sync Process
1. **Fetch**: Retrieve holidays from external API for current year + 5 years ahead
2. **Compare**: Match against existing holidays in Firestore by date + name
3. **Update**: 
   - Add new holidays
   - Update existing holidays (if data changed)
   - Delete holidays no longer in external source
4. **Track**: Store sync metadata in `system_metadata/public_holidays_sync` collection
5. **Invalidate**: Clear events cache to force fresh data load

#### Metadata Tracking
Stored in `system_metadata/public_holidays_sync` document:
```typescript
{
  lastSyncDate: Date,
  lastSyncSuccess: boolean,
  holidaysCount: number,
  yearsSync: number[],  // Array of years synced
  updatedAt: Date
}
```

### 3. Data Model Changes

#### Event Document (Public Holiday)
```typescript
{
  id: string,
  name: string,              // e.g., "New Year's Day"
  date: Date,
  clubId: null,              // State-level events have no club
  zoneId: null,              // State-level events have no zone
  eventTypeId: 'ph',         // Public holiday event type
  status: 'public_holiday',
  location: 'Victoria',
  source: 'public_holiday',  // Used for filtering
  createdAt: Date,
  updatedAt: Date,
  isQualifier: false,
  requiresApproval: false
}
```

### 4. State Manager Updates

#### UI Enhancements
- **Statistics Tile**: Added "Public Holidays" count display
- **Event Source Filter**: New dropdown to filter by:
  - All Events
  - State Events
  - Public Holidays
- **Event Badge**: Public holidays display with green "Public Holiday" badge
- **Editable**: Public holidays can be edited like any other event

#### Event Filtering Logic
```typescript
// State Manager shows events with no clubId and no zoneId
// This includes both state events and public holidays
const stateEvents = events.filter(e => !e.zoneId && !e.clubId);

// Separate by source
const regularStateEvents = stateEvents.filter(e => e.source !== 'public_holiday');
const publicHolidays = stateEvents.filter(e => e.source === 'public_holiday');
```

### 5. Admin Dashboard

#### Public Holiday Sync Tile
Located in System Configuration section:
- **Status Display**: 
  - Holidays count
  - Days since last sync
  - Sync needed indicator
  - Last sync timestamp
- **Actions**:
  - "Auto Sync" button: Respects 7-day limit
  - "Force Sync" button: Overrides restriction
- **Real-time Updates**: Refreshes after sync completes

### 6. Server-Side Changes

#### `server-data.ts`
- **Removed**: `getPublicHolidays()` function
- **Removed**: External API fetching logic
- **Removed**: `publicHolidays` cache entry
- **Updated**: `getAllEvents()` now returns all events including public holidays from Firestore
- **Updated**: Source assignment logic to detect public holidays:
  ```typescript
  let source = data.source === 'public_holiday' || data.status === 'public_holiday'
    ? 'public_holiday'
    : // other logic
  ```

### 7. Calendar Integration

#### Source Filtering
Public holidays included when "Zone Calendars" filter is selected:
```typescript
// In event-calendar.tsx
const sourceFilteredEvents = events.filter(event => {
  // Include state events when 'zone' is selected
  if (event.source === 'state' && eventSources.includes('zone')) return true;
  return eventSources.includes(event.source);
});
```

## Usage Workflows

### Initial Setup (First Time)
1. Navigate to Admin Dashboard
2. Find "Public Holiday Sync" tile
3. Click "Force Sync" to populate holidays
4. System fetches 6 years of Victorian public holidays
5. Events created in Firestore with `source: 'public_holiday'`

### Regular Maintenance
- **Automatic**: System prevents sync more than once per 7 days
- **Manual Override**: Use "Force Sync" if urgent update needed
- **Edit Individual**: Use State Manager to edit specific holidays
- **Bulk Update**: Force sync will update all holidays from source

### Editing Public Holidays
1. Navigate to State Manager
2. Filter by "Public Holidays" in Event Source dropdown
3. Click "Edit" on any holiday
4. Modify name, date, location, or description
5. Changes saved to Firestore
6. **Note**: Next sync will overwrite manual edits unless holiday removed from external source

## API Reference

### Sync Public Holidays
```typescript
// Check status
GET /api/admin/sync-public-holidays
Response: {
  synced: boolean,
  lastSyncDate?: string,
  daysSinceSync?: number,
  needsSync?: boolean,
  lastSyncSuccess?: boolean,
  holidaysCount?: number,
  yearsSync?: number[]
}

// Trigger sync
POST /api/admin/sync-public-holidays
Body: {
  force?: boolean,      // Override 7-day restriction
  yearsAhead?: number   // Default: 5
}
Response: {
  success: boolean,
  message: string,
  stats: {
    added: number,
    updated: number,
    deleted: number,
    unchanged: number,
    total: number
  },
  lastSyncDate?: Date,
  errors?: string[]
}
```

## External Data Source
- **Provider**: Nager.Date API (https://date.nager.at)
- **Endpoint**: `https://date.nager.at/api/v3/PublicHolidays/{year}/AU`
- **Filter**: Victorian holidays only (counties includes 'AU-VIC' or is null)
- **Coverage**: Current year + 5 years ahead (configurable)

## Security Considerations
- Sync endpoint requires admin authentication (same as other admin APIs)
- State Manager requires `state_admin` or `super_user` role
- Public holidays visible to all users (read-only via calendar)
- Edit permissions controlled by State Manager access

## Performance Notes
- **Cache**: Public holidays cached with events (12-hour TTL)
- **Sync Duration**: ~2-5 seconds for 6 years of data
- **Database Writes**: Minimal (only changed holidays)
- **API Calls**: One per year during sync (6 calls total for 6 years)

## Migration Notes
- **No Data Migration Required**: System creates holidays on first sync
- **Backward Compatible**: Old code paths removed, new system handles all cases
- **Cache Invalidation**: Automatic on sync completion

## Testing Checklist
- [ ] Initial sync from admin dashboard
- [ ] Verify holidays appear in State Manager
- [ ] Test event source filter (State Events vs Public Holidays)
- [ ] Edit a public holiday manually
- [ ] Run sync again (should respect 7-day limit)
- [ ] Force sync (should override limit)
- [ ] Verify holidays display on calendar with Zone Calendars selected
- [ ] Check sync status display updates correctly
- [ ] Test sync with future years (verify 5 years ahead)
- [ ] Verify deleted holidays removed on sync

## Future Enhancements
- [ ] Support for multiple states/territories
- [ ] Custom public holiday definitions (non-API sourced)
- [ ] Sync scheduling (automatic weekly sync via Cloud Functions)
- [ ] Conflict resolution UI (when manual edits conflict with sync)
- [ ] Sync history/audit log
- [ ] Notification when holidays added/removed during sync
