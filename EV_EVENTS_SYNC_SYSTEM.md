# Equestrian Victoria Events Sync System

## Overview
The EV Events Sync System automatically synchronizes events from Equestrian Victoria's website into the Pony Club Event Manager. This system provides:
- **Configurable discipline filtering** - Choose which disciplines to sync
- **Automatic scheduling** - Set custom sync intervals
- **Manual sync controls** - Force sync when needed
- **Event lifecycle management** - Automatically removes outdated events

## Architecture

### Components

1. **Cloud Function - Scraper** (`scrapeEquestrianEvents`)
   - Scrapes EV website for events
   - Supports discipline-specific filtering
   - Returns structured event data
   - Location: `functions/src/scrape-ev-events.ts`
   - URL: `https://scrapeequestrianevents-gt54xuwvaq-de.a.run.app`

2. **Cloud Function - Scheduler** (`runEvEventsSync`)
   - Runs on schedule or manually
   - Checks sync configuration and interval
   - Triggers sync API endpoint
   - Location: `functions/src/ev-sync-runner.ts`
   - URL: `https://asia-east1-ponyclub-events.cloudfunctions.net/runEvEventsSync`

3. **API Endpoint** (`/api/admin/sync-ev-events`)
   - GET: Check sync status and configuration
   - POST: Trigger sync (respects interval unless force=true)
   - PUT: Update sync configuration
   - Location: `src/app/api/admin/sync-ev-events/route.ts`

4. **Admin UI** (`EvEventsSyncTile`)
   - Configure disciplines, years, and interval
   - View sync status and statistics
   - Manual sync controls (Auto/Force)
   - Location: `src/components/admin/ev-events-sync-tile.tsx`

## Configuration

### Firestore Documents

**Configuration**: `system_config/ev_events_sync`
```typescript
{
  disciplines: string[],      // Empty array = all disciplines
  yearsAhead: number,          // Current year + X years (default: 2)
  syncIntervalDays: number,    // Minimum days between syncs (default: 7)
  isActive: boolean,           // Enable/disable automatic syncing
  createdAt: Date,
  updatedAt: Date
}
```

**Metadata**: `system_metadata/ev_events_sync`
```typescript
{
  lastSyncDate: Date,
  lastSyncSuccess: boolean,
  eventsCount: number,
  yearsSync: number[],         // Array of years synced
  disciplinesSync: string[],   // Array of disciplines synced
  updatedAt: Date
}
```

### Supported Disciplines
- `interschool` - Interschool events
- `parequestrian` - Para Equestrian events
- `endurance` - Endurance events
- `dressage` - Dressage events
- `jumping` - Jumping events
- `vaulting` - Vaulting events
- `eventing` - Eventing events
- `driving` - Driving events
- `education` - Education events
- `showhorse` - Show Horse events

## Event Data Structure

Events are stored in Firestore `events` collection with:
```typescript
{
  name: string,                // Event name (includes "Day X/Y" for multi-day)
  date: Date,                  // Event start date
  eventLink: string,           // URL to EV event page
  description: string | null,  // "Tier: X" if tier data available
  clubId: null,                // Not club-specific
  zoneId: null,                // Not zone-specific
  eventTypeId: string,         // Discipline name or 'other'
  status: 'ev_event',          // Indicates EV-sourced event
  location: string,            // Event location (default: 'Victoria')
  source: 'ev_scraper',        // Source identifier
  discipline: string | null,   // Discipline from scraper
  tier: string | null,         // Tier from scraper
  updatedAt: Date,
  createdAt: Date,
  isQualifier: false,
  requiresApproval: false
}
```

## Usage

### Initial Configuration

1. Navigate to Admin Dashboard
2. Find "EV Events" tile in Calendar Sync section
3. Click settings icon (gear)
4. Configure:
   - **Disciplines**: Select which disciplines to sync (leave empty for all)
   - **Years Ahead**: How many future years to sync (1-5, default: 2)
   - **Sync Interval**: Minimum days between automatic syncs (1-30, default: 7)
   - **Enable Automatic Sync**: Toggle to activate/deactivate
5. Click "Save Configuration"

### Manual Sync

**Auto Sync**
- Respects sync interval setting
- Will skip if last sync was within interval
- Recommended for regular updates

**Force Sync**
- Bypasses sync interval check
- Always executes sync
- Use when immediate update needed

### Automatic Scheduling

Set up Google Cloud Scheduler to call the sync runner function periodically:

```bash
# Example: Daily sync at 2 AM
gcloud scheduler jobs create http ev-events-daily-sync \
  --location=australia-southeast1 \
  --schedule="0 2 * * *" \
  --uri="https://asia-east1-ponyclub-events.cloudfunctions.net/runEvEventsSync" \
  --http-method=POST \
  --oidc-service-account-email=firebase-adminsdk-fbsvc@ponyclub-events.iam.gserviceaccount.com
```

## Sync Process

1. **Check Configuration**
   - Verify sync configuration exists
   - Confirm sync is active
   - Check sync interval requirement

2. **Fetch Events**
   - Call scraper Cloud Function for each configured year
   - Pass discipline filters if configured
   - Collect all events across years and disciplines

3. **Compare & Update**
   - Match events by unique key: `URL|start_date`
   - **Add**: New events not in database
   - **Update**: Existing events with changed data
   - **Delete**: Events no longer in external source

4. **Update Metadata**
   - Record sync timestamp
   - Store event count and statistics
   - Track years and disciplines synced

5. **Invalidate Cache**
   - Clear events cache to force fresh data load

## Statistics

After each sync, statistics are tracked:
- **Added**: New events created
- **Updated**: Existing events modified
- **Deleted**: Outdated events removed
- **Unchanged**: Events with no changes
- **Total**: Total events processed

## Event Deduplication

Events are uniquely identified by: `${eventLink}|${start_date}`

This preserves multi-day events which are split into separate days with naming like:
- "Event Name (Day 1/2)"
- "Event Name (Day 2/2)"

## API Examples

### Check Sync Status
```bash
GET /api/admin/sync-ev-events

Response:
{
  "synced": true,
  "lastSyncDate": "2025-11-16T09:30:00Z",
  "daysSinceSync": 0,
  "needsSync": false,
  "lastSyncSuccess": true,
  "eventsCount": 166,
  "yearsSync": [2025, 2026, 2027],
  "disciplinesSync": ["interschool", "dressage"],
  "config": {
    "disciplines": ["interschool", "dressage"],
    "yearsAhead": 2,
    "syncIntervalDays": 7,
    "isActive": true
  }
}
```

### Trigger Sync
```bash
POST /api/admin/sync-ev-events
Content-Type: application/json

{
  "force": true  // Optional: bypass interval check
}

Response:
{
  "success": true,
  "message": "Successfully synced 166 EV events",
  "stats": {
    "added": 15,
    "updated": 8,
    "deleted": 2,
    "unchanged": 141,
    "total": 166
  },
  "lastSyncDate": "2025-11-16T09:30:00Z"
}
```

### Update Configuration
```bash
PUT /api/admin/sync-ev-events
Content-Type: application/json

{
  "disciplines": ["interschool", "dressage", "jumping"],
  "yearsAhead": 2,
  "syncIntervalDays": 7,
  "isActive": true
}

Response:
{
  "success": true,
  "message": "Sync configuration updated successfully",
  "config": { ... }
}
```

## Troubleshooting

### Sync Not Running
1. Check configuration exists (GET `/api/admin/sync-ev-events`)
2. Verify `isActive` is `true`
3. Check last sync date vs interval setting
4. Use Force Sync to override interval

### No Events Being Synced
1. Verify scraper function is working: `https://scrapeequestrianevents-gt54xuwvaq-de.a.run.app?year=2025`
2. Check discipline filters are valid
3. Review sync error logs in admin dashboard
4. Verify network access to EV website

### Duplicate Events
1. Events are uniquely identified by `URL|start_date`
2. If duplicates exist, check `eventLink` field consistency
3. Run Force Sync to re-deduplicate

### Events Not Deleted
1. Deleted events must no longer appear in EV scraper results
2. Check if event still exists on EV website
3. Verify sync successfully completed (check stats.deleted)

## Performance Notes

- **Sync Duration**: Approximately 30-60 seconds for 2-3 years of events
- **Scraper Timeout**: 540 seconds (9 minutes)
- **API Rate Limiting**: No rate limits currently applied
- **Cache**: Events cache invalidated on sync completion
- **Parallel Fetching**: All years fetched in parallel for faster sync

## Security

- All endpoints require admin authentication
- Configuration updates restricted to admin users
- Scheduler function can be called by Cloud Scheduler only (OIDC auth)
- Events sourced from verified EV website only

## Future Enhancements

- [ ] Email notifications on sync completion
- [ ] Detailed sync history log
- [ ] Conflict resolution UI (manual edits vs sync updates)
- [ ] Event change detection and notification
- [ ] Custom event mapping rules
- [ ] Multi-state support
- [ ] Webhook support for immediate sync triggers
- [ ] Advanced scheduling (specific times, weekly patterns)
