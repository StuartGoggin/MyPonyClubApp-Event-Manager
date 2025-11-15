# State Manager Feature

## Overview
The State Manager is a new page that allows state-level administrators to create, edit, and delete state-level events. This is a simplified version of the Zone Manager, focused solely on managing state events without any approval workflows.

## Key Differences from Zone Manager

### Zone Manager
- Manages zone-level and club events
- Has approval workflows for club event requests
- Has schedule approval workflows
- Shows events from clubs within the zone
- Requires zone representative or super user access

### State Manager
- Manages state-level events only
- **No approval workflows** - state events are automatically approved
- No club or zone event management
- Events are visible to all zones and clubs across the state
- Requires state admin or super user access

## Features

### Event Management
- **Create** state-level events with full details (name, date, type, location, description, coordinator)
- **Edit** existing state events
- **Delete** state events
- **Search and Filter** events by name, location, or type
- **Export** events to CSV

### Event Organization
Events are organized into two tabs:
1. **Upcoming Events** - Events scheduled for today or future dates
2. **Past Events** - Historical events for reference

### Dashboard Statistics
The header shows:
- Total state events
- Upcoming state events count
- Total zones in the system
- Total clubs in the system

## User Roles

### Access Control
- **Super User** (`super_user`) - Full access to all features
- **State Admin** (`state_admin`) - Access to state manager (new role added)

### Role Implementation
The new `state_admin` role has been added to:
- `src/lib/access-control.ts` - Access control utilities
- `src/lib/types.ts` - User type definitions
- Navigation menu - Visible only to authorized users

## Files Created

### Pages
- `src/app/state-manager/page.tsx` - Main state manager dashboard page

### Components
- `src/components/state-manager/state-event-management.tsx` - Event management component with CRUD operations

### Updated Files
- `src/components/layout/app-layout.tsx` - Added State Manager navigation item
- `src/lib/access-control.ts` - Added `state_admin` role type
- `src/lib/types.ts` - Added `state_admin` to UserRole type

## Navigation
The State Manager appears in the main navigation menu between Admin Dashboard and Zone Manager, with the FerrisWheel icon (🎡).

## Look and Feel
The State Manager follows the same design system as the Zone Manager:
- Glass-effect cards with gradient backgrounds
- Responsive layout for mobile and desktop
- Consistent color scheme and typography
- Beautiful hover effects and transitions
- Compact statistics tiles in the header

## Event Creation Flow
1. Click "Add State Event" button
2. Fill in required fields:
   - Event Name (required)
   - Date (required)
   - Event Type (required)
   - Location (optional)
   - Description (optional)
   - Coordinator Name (optional)
   - Coordinator Contact (optional)
3. Click "Create Event"
4. Event is automatically approved and visible to all zones/clubs

## Technical Notes

### Event Identification
State-level events are identified by having:
- No `zoneId` property
- No `clubId` property
- Status automatically set to `'approved'`

This distinguishes them from:
- Zone events (have `zoneId` but no `clubId`)
- Club events (have both `zoneId` and `clubId`)

### API Integration
Uses existing event APIs:
- `GET /api/events` - Fetch all events (filtered client-side for state events)
- `POST /api/events` - Create new state event
- `PUT /api/events/[id]` - Update existing state event
- `DELETE /api/events/[id]` - Delete state event
- `GET /api/event-types` - Fetch event types for dropdown

### Future Enhancements
Potential improvements could include:
1. Dedicated state event logo image
2. Bulk import of state events from CSV
3. Event templates for recurring state events
4. Integration with state-level notifications
5. State event calendar export (PDF)
6. Event duplication feature
7. Event series/recurring events support
