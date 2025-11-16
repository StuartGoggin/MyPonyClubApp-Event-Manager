# EV Events Management Feature

## Overview
Added comprehensive event management capabilities to the EV Manager page, allowing administrators to list, edit, and delete events scraped from Equestrian Victoria.

## Changes Made

### 1. Updated Type Definitions (`src/lib/types.ts`)
- Added `'ev_scraper'` to `EventSource` type
- Added `'ev_event'` to `EventStatus` type  
- Added new optional fields to `Event` interface:
  - `discipline?: string` - For EV events (dressage, jumping, eventing, etc.)
  - `tier?: string` - For EV events (State, National, etc.)

### 2. New Component: EVEventsManagement (`src/components/ev-manager/ev-events-management.tsx`)

**Features:**
- **Event Listing**: Table view of all scraped EV events with:
  - Event name with external link icon (if eventLink exists)
  - Date with "Past" badge for historical events
  - Discipline badge
  - Location
  - Tier badge
  - Action buttons (Edit/Delete)

- **Search & Filter:**
  - Search by name, location, or discipline
  - Filter by discipline dropdown
  - Clear filters button
  - Results count display
  - Refresh button

- **Edit Functionality:**
  - Dialog with form for editing event details:
    - Event Name
    - Date
    - Location
    - Discipline
    - Tier
    - Event Link (URL)
    - Description
  - Real-time updates to Firestore
  - Success/error toasts

- **Delete Functionality:**
  - Confirmation dialog before deletion
  - Permanent removal from Firestore
  - Automatic refresh after deletion
  - Success/error toasts

- **Event Callbacks:**
  - `onEventsUpdate` prop to refresh parent component data

### 3. Updated EV Manager Page (`src/app/ev-manager/page.tsx`)
- Added import for `EVEventsManagement` component
- Updated event filter to include both:
  - `'equestrian_victoria'` (legacy source)
  - `'ev_scraper'` (new sync source)
- Added `<EVEventsManagement />` component to page layout with `onEventsUpdate` callback

## Page Structure

The EV Manager page now has four main sections:

1. **Statistics Cards** (existing)
   - Total EV Events
   - Upcoming Events  
   - Total Zones
   - Total Clubs

2. **Event Calendar** (existing)
   - Visual calendar view of events

3. **Web Scraper** (existing)
   - Manual scraping interface with discipline selection

4. **Event Management** (NEW)
   - Table view with search/filter
   - Edit/delete capabilities
   - Full CRUD operations

## API Endpoints Used

- `GET /api/events` - Fetch all events (filtered client-side for `ev_scraper` source)
- `PUT /api/events/[id]` - Update event details
- `DELETE /api/events/[id]` - Delete event

## Event Sources

The system now handles multiple event sources:

| Source | Description | Editable in EV Manager |
|--------|-------------|----------------------|
| `pca` | Pony Club Australia events | No |
| `zone` | Zone-specific events | No |
| `state` | State-level events | No |
| `equestrian_victoria` | Legacy EV events | Yes |
| `ev_scraper` | New automated sync events | Yes |
| `public_holiday` | Public holidays | No |

## User Experience

### Listing Events
- Events displayed in table with clean, modern design
- Past events shown with muted styling and "Past" badge
- External link icons for quick access to EV website
- Discipline and tier badges for easy identification
- Sorted by date (newest first)

### Searching & Filtering
- Real-time search across name, location, and discipline
- Discipline dropdown populated from existing events
- One-click filter clearing
- Results count updates automatically

### Editing Events
- Single-click edit button opens modal dialog
- All event fields editable (except system fields)
- Date picker for easy date selection
- Form validation and error handling
- Loading states during save
- Automatic refresh on success

### Deleting Events
- Confirmation dialog prevents accidental deletion
- Clear warning message with event name
- Loading states during deletion
- Automatic refresh on success

## Technical Details

**Component Type:** Client Component (`'use client'`)

**Dependencies:**
- shadcn/ui components (Card, Button, Badge, Input, Select, Table, Dialog, AlertDialog)
- Lucide React icons
- React hooks (useState, useEffect)
- Custom toast hook

**State Management:**
- Local component state for events, filters, dialogs
- No global state required
- Optimistic UI updates

**Error Handling:**
- Try-catch blocks for all API calls
- Toast notifications for success/error states
- Console logging for debugging
- Graceful fallbacks for missing data

## Future Enhancements

Potential improvements:
1. Bulk operations (multi-select with batch delete/edit)
2. Export filtered events to CSV/Excel
3. Inline editing (edit directly in table row)
4. Advanced filters (date range, multi-discipline)
5. Pagination for large event lists
6. Event duplication detection and merging
7. History/audit log for changes
8. Undo/redo functionality

## Testing Checklist

- [ ] Load EV Manager page - verify no errors
- [ ] Verify scraped events appear in table
- [ ] Test search functionality
- [ ] Test discipline filter dropdown
- [ ] Test clear filters button
- [ ] Test edit dialog opens correctly
- [ ] Test editing event fields and saving
- [ ] Test delete confirmation dialog
- [ ] Test deleting an event
- [ ] Verify events refresh after edit/delete
- [ ] Test with no events (empty state)
- [ ] Test with past events (styling/badge)
- [ ] Test external link clicks
- [ ] Verify mobile responsiveness

## Deployment Notes

No additional environment variables or configuration required. The feature uses existing:
- Firestore database structure
- API routes
- Authentication/authorization (State Admin or Super User only)
- UI component library

Files modified:
- `src/lib/types.ts`
- `src/app/ev-manager/page.tsx`

Files created:
- `src/components/ev-manager/ev-events-management.tsx`
