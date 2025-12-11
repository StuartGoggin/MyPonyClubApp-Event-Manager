# Zone Manager Reports - Visual Guide

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Zone Manager Dashboard                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Zone Selection: [Select Zone ▼]                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Main Tabs:                                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [Events] [Approvals] [Submit Event] [Committee] [Settings]│ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

EVENTS TAB - SUB-TABS:
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Upcoming] [Pending] [Past] [Rejected] [Reports ⚡NEW]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  When REPORTS Tab Selected:                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📄 Committee Approval Letter                           │   │
│  │  Generate an official letter to the zone committee...   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Pending Events                              [3]  │   │   │
│  │  │ 3 events awaiting committee approval              │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Event Name    │ Date        │ Club      │ Type   │   │   │
│  │  ├──────────────────────────────────────────────────┤   │   │
│  │  │ Spring Rally  │ 15-Jan-2026 │ Sunbury PC│ Rally  │   │   │
│  │  │ Dressage Day  │ 22-Jan-2026 │ Zone Event│ Show   │   │   │
│  │  │ Jump Clinic   │ 05-Feb-2026 │ Romsey PC │ Clinic │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  [✉️ Email Letter]  [📥 Download as PDF]               │   │
│  │                                                          │   │
│  │  The letter will include:                               │   │
│  │  • Formal letterhead with zone name and date            │   │
│  │  • Complete details of all pending events               │   │
│  │  • Event dates, organizers, types, and locations        │   │
│  │  • Coordinator contact information                      │   │
│  │  • Professional closing and footer                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 Additional Reports (Coming Soon)                    │   │
│  │  More reporting options will be added in future updates │   │
│  │                                                          │   │
│  │  Future reports may include:                            │   │
│  │  • Event statistics and analytics                       │   │
│  │  • Club participation summary                           │   │
│  │  • Approved events listing                              │   │
│  │  • Equipment booking summary                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Generated PDF Letter Structure

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  NORTH METRO ZONE                                      │
│  11 December 2025                                      │
│                                                        │
│  To: Zone Committee Members                            │
│                                                        │
│  Subject: Event Approval Request                       │
│                                                        │
│  Dear Committee Members,                               │
│                                                        │
│  This letter is to formally request approval and       │
│  ratification of the following 3 events that have      │
│  been submitted for inclusion in the North Metro       │
│  Zone calendar.                                        │
│                                                        │
│  Please review the details below and consider these    │
│  events for approval at the next committee meeting.    │
│                                                        │
│                                                        │
│  Events Pending Approval:                              │
│                                                        │
│  1. Spring Rally                                       │
│     Date: 15 Jan 2026                                  │
│     Club/Organizer: Sunbury Pony Club                  │
│     Event Type: Rally                                  │
│     Location: Sunbury Equestrian Centre                │
│     Description: First rally of the year featuring     │
│                  dressage and showjumping              │
│     Coordinator: Jane Smith - 0412 345 678             │
│                                                        │
│  2. Dressage Day                                       │
│     Date: 22 Jan 2026                                  │
│     Club/Organizer: Zone Event                         │
│     Event Type: Show                                   │
│     Location: Greenvale Reserve                        │
│     Coordinator: John Doe - 0423 456 789               │
│                                                        │
│  3. Jump Clinic                                        │
│     Date: 05 Feb 2026                                  │
│     Club/Organizer: Romsey Pony Club                   │
│     Event Type: Clinic                                 │
│     Location: Romsey Park                              │
│     Description: Advanced jumping clinic with          │
│                  Level 2 instructor                    │
│                                                        │
│                                                        │
│  Please review these events and provide your approval  │
│  or feedback. Once ratified by the committee, these    │
│  events will be published to the official zone         │
│  calendar.                                             │
│                                                        │
│  If you have any questions or require additional       │
│  information about any of these events, please         │
│  contact the zone representative.                      │
│                                                        │
│  Thank you for your consideration.                     │
│                                                        │
│  Regards,                                              │
│  North Metro Zone Representative                       │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Generated by MyPonyClub Event Manager   11 Dec 2025   │
└────────────────────────────────────────────────────────┘
```

## Empty State

When no pending events exist:

```
┌─────────────────────────────────────────────────────────┐
│  📄 Committee Approval Letter                           │
│  Generate an official letter to the zone committee...   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Pending Events                              [0]  │   │
│  │ 0 events awaiting committee approval              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│                                                          │
│              📅                                          │
│                                                          │
│     No pending events to include in the committee       │
│     letter                                              │
│                                                          │
│     Events will appear here when they are submitted     │
│     and awaiting approval                               │
│                                                          │
│                                                          │
│  [✉️ Email Letter (disabled)]  [📥 Download as PDF      │
│                                    (disabled)]          │
└─────────────────────────────────────────────────────────┘
```

## Tab Navigation Icons

```
Upcoming  → ✓ (CheckCircle)
Pending   → 🕐 (Clock)
Past      → 📅 (Calendar)
Rejected  → ✕ (XCircle)
Reports   → 📊 (BarChart3)  ⚡NEW
```

## Button States

### Download PDF Button
- **Enabled**: `📥 Download as PDF` (when events exist)
- **Disabled**: `📥 Download as PDF` (when no events)
- **Loading**: `⏳ Generating...` (during PDF creation)

### Email Letter Button  
- **Enabled**: `✉️ Email Letter` (when events exist)
- **Disabled**: `✉️ Email Letter` (when no events)
- **Clicked**: Shows toast "Coming Soon" message

## Responsive Behavior

### Desktop (>768px)
- Full 5-column tab layout
- Table shows all columns
- Side-by-side action buttons

### Tablet/Mobile (<768px)
- Tabs stack or scroll horizontally
- Table becomes scrollable
- Buttons stack vertically

## Color Coding

- **Primary Actions**: Default blue buttons
- **Event Count Badge**: Blue outline when > 0, gray when 0
- **Empty State Icons**: Muted gray (opacity 50%)
- **Table Headers**: Default table header styling
- **Report Cards**: White background with subtle shadow

## User Flow

```
1. User logs in as Zone Representative
   ↓
2. Navigates to Zone Manager
   ↓
3. Selects their zone from dropdown
   ↓
4. Clicks "Events" main tab
   ↓
5. Clicks "Reports" sub-tab (NEW!)
   ↓
6. Reviews pending events in preview table
   ↓
7. Clicks "Download as PDF"
   ↓
8. PDF generates and downloads
   ↓
9. User opens PDF and reviews
   ↓
10. User prints/emails PDF to committee
    ↓
11. Committee reviews at next meeting
    ↓
12. Events approved in "Approvals" tab
```

## Integration Points

The Reports tab integrates with:

1. **Event Data**: Reads from `events` prop filtered by status
2. **Club Data**: Uses `clubs` for club name lookup
3. **Event Types**: Uses `eventTypes` for type name lookup
4. **Zone Context**: Uses `zoneId` and `zoneName` for header
5. **PDF Library**: jsPDF for document generation
6. **Toast System**: For user notifications
7. **Empty States**: Conditional rendering based on data

## File Downloads

Download format:
```
Filename: {ZoneName}-Committee-Letter-{YYYY-MM-DD}.pdf
Example:  North-Metro-Zone-Committee-Letter-2025-12-11.pdf
Location: Browser's default download folder
```

## Accessibility Features

- Proper heading hierarchy (h1 → h2 → h3)
- Button labels describe action clearly
- Table has proper header row
- Empty states have descriptive text
- Color is not the only indicator
- Keyboard navigation supported
- Screen reader friendly

---

This visual guide shows the complete user experience for the new Reports feature.
