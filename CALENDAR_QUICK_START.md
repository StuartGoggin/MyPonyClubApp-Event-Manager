# Calendar View Quick Start Guide

## Overview 📅

The MyPonyClub Event Manager calendar is your visual hub for viewing, filtering, and managing events across clubs and zones. This guide will get you using the calendar feature in minutes.

---

## Accessing the Calendar

### Public Calendar (No Login Required)
```
URL: /embed/calendar
```
- Available to anyone
- Shows all approved events
- Read-only view
- Great for sharing with parents and members

### Personal Dashboard Calendar
- Available after login
- Shows events relevant to your role
- Interactive and filterable
- Different views based on permissions

---

## Quick Start: Viewing Events

### Step 1: Open the Calendar

**Option A: From Navigation**
1. Click **"Calendar"** in the main navigation
2. Calendar loads with current month

**Option B: Public Link**
1. Navigate to `/embed/calendar`
2. No login required
3. Shows public events only

### Step 2: Choose Your View

The calendar offers multiple viewing modes:

| View | Best For | Shows |
|------|----------|-------|
| **Month View** | Overview of entire month | All events in calendar grid |
| **Week View** | Detailed weekly planning | Events by day with times |
| **List View** | Event details | Scrollable list with full info |
| **Compact View** | Quick reference | Minimal event cards |

**To Switch Views:**
- Click view buttons at top right of calendar
- Or use dropdown: **View → [Month/Week/List/Compact]**

---

## Understanding the Calendar Display

### Color Coding 🎨

Events are color-coded by type:

| Color | Event Type |
|-------|------------|
| 🟦 **Blue** | Rally |
| 🟩 **Green** | Training Day |
| 🟨 **Yellow** | Camp |
| 🟥 **Red** | Competition |
| 🟪 **Purple** | Social Event |
| 🟧 **Orange** | Administrative/Meeting |
| ⬜ **Gray** | Past Events |

### Event Status Indicators

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ | Approved | Event confirmed and scheduled |
| ⏳ | Pending | Awaiting zone approval |
| ❌ | Rejected | Needs revision |
| 📅 | Scheduled | Schedule uploaded |
| ⚠️ | Conflict | Public holiday or overlap warning |

### Event Information on Hover

**Hover over any event to see:**
- Event name
- Club name
- Start/end time
- Location
- Status
- Quick actions

---

## Filtering Events

### Basic Filters

Located at the top of the calendar:

#### 1️⃣ Date Range Filter
```
[Today] [This Week] [This Month] [Custom Range]
```

**Quick Filters:**
- **Today** - Shows only today's events
- **This Week** - Next 7 days
- **This Month** - Current calendar month
- **Custom** - Pick specific start and end dates

**To Use Custom Range:**
1. Click **"Custom Range"**
2. Select **Start Date**
3. Select **End Date**
4. Click **"Apply"**

#### 2️⃣ Zone Filter
```
[All Zones ▼] [Metro Zone 1] [Metro Zone 2] [Regional Zone 1] ...
```

**To Filter by Zone:**
1. Click zone dropdown
2. Select zone(s) to view
3. Calendar updates instantly

**Pro Tip:** Hold Ctrl/Cmd to select multiple zones

#### 3️⃣ Club Filter
```
[All Clubs ▼] [Bayside PC] [Country PC] [Metro PC] ...
```

**To Filter by Club:**
1. Click club dropdown
2. Select club(s)
3. View only those club events

**Zone-Aware:** If you select a zone first, club list filters to that zone

#### 4️⃣ Event Type Filter
```
[All Types ▼] [Rally] [Camp] [Competition] [Training] ...
```

**To Filter by Type:**
1. Click event type dropdown
2. Select type(s)
3. See only that event category

#### 5️⃣ Status Filter
```
[All Status ▼] [Approved] [Pending] [Rejected] [Scheduled]
```

**Common Uses:**
- **Approved** - See confirmed events only (most common)
- **Pending** - Zone reps checking what needs approval
- **Scheduled** - Events with uploaded schedules

### Combining Filters

**Power Users: Stack filters for precision**

**Example 1: My Club's Upcoming Rallies**
1. Date Range: **This Month**
2. Club: **Your Club**
3. Event Type: **Rally**
4. Status: **Approved**

**Example 2: Zone Pending Events**
1. Zone: **Metro Zone 1**
2. Status: **Pending**
3. Date Range: **This Week**

**Example 3: All Zone Competitions**
1. Zone: **Your Zone**
2. Event Type: **Competition**
3. Date Range: **Custom** (next 3 months)

---

## Interacting with Events

### Viewing Event Details

**Click on any event to see:**
- Full event information
- Club details
- Venue/location
- Description
- Approval status
- Approval history
- Comments
- Schedule (if uploaded)

**In the Event Modal:**
- View map of location (if geocoded)
- Download event schedule PDF
- See who approved/rejected
- Read feedback and comments

### Quick Actions (Role-Based)

**Actions Available Depend on Your Role:**

#### Club Managers
- ✏️ **Edit** - Modify pending/rejected events
- 📤 **Upload Schedule** - Add PDF schedule to approved events
- 🗑️ **Cancel** - Cancel your club's events

#### Zone Representatives
- ✅ **Approve** - Approve pending events in your zone
- ❌ **Reject** - Reject with feedback
- 💬 **Comment** - Add notes or questions

#### State Managers
- 📊 **View Analytics** - See event statistics
- 📥 **Export** - Download calendar data
- ⚙️ **Override** - State-level controls

#### All Users
- 📅 **Add to Calendar** - Export to Google Calendar, iCal
- 🔗 **Share** - Get shareable link
- 🖨️ **Print** - Print event details

---

## Navigation Tips

### Keyboard Shortcuts

Speed up calendar navigation:

| Shortcut | Action |
|----------|--------|
| `→` or `N` | Next month/week |
| `←` or `P` | Previous month/week |
| `T` | Jump to Today |
| `Esc` | Close event details |
| `Ctrl/Cmd + F` | Quick search events |
| `Ctrl/Cmd + P` | Print calendar |

### Month Navigation

**Using Calendar Controls:**
- **Today** button - Jump to current date
- **◀ Previous** - Go back one month/week
- **Next ▶** - Go forward one month/week
- **Month/Year selector** - Jump to any month

**Quick Jump:**
1. Click month/year at top
2. Select year from dropdown
3. Select month from grid
4. Calendar updates instantly

---

## Exporting the Calendar

### Export Options

#### 1️⃣ Export to PDF
```
Perfect for printing or sharing
```

**Steps:**
1. Apply desired filters
2. Click **"Export"** button
3. Select **"PDF"**
4. Choose layout:
   - **Portrait** - Best for list view
   - **Landscape** - Best for month grid
5. Click **"Download PDF"**

**What's Included:**
- Event names and dates
- Club names
- Event types
- Times and locations
- Color-coded by type

#### 2️⃣ Export to CSV
```
Perfect for Excel or data analysis
```

**Steps:**
1. Apply filters
2. Click **"Export"** → **"CSV"**
3. Download opens in Excel/Sheets

**CSV Contains:**
- Event ID
- Event Name
- Date & Time
- Club Name
- Zone Name
- Event Type
- Status
- Location
- Description

#### 3️⃣ Export to ICS (Calendar Format)
```
Import to Google Calendar, Outlook, Apple Calendar
```

**Steps:**
1. Apply filters (exports only visible events)
2. Click **"Export"** → **"ICS"**
3. Download .ics file

**To Import:**
- **Google Calendar**: Settings → Import & Export → Import
- **Outlook**: File → Open & Export → Import/Export
- **Apple Calendar**: File → Import

#### 4️⃣ Share Link
```
Generate shareable URL with filters applied
```

**Steps:**
1. Set up filters exactly as you want
2. Click **"Share"** button
3. Copy generated URL
4. Share with others

**Link Includes:**
- All active filters
- Selected view mode
- Date range
- Read-only access (public)

---

## Role-Specific Calendar Features

### Club Managers

**Your Calendar Shows:**
- Your club's events (all statuses)
- Zone calendar (approved events)
- Other club events (if marked public)

**What You Can Do:**
- See pending approval status
- Upload schedules to approved events
- Edit events before approval
- View rejection feedback inline

### Zone Representatives

**Your Calendar Shows:**
- All events in your zone (all statuses)
- Pending approvals highlighted
- Conflict warnings

**What You Can Do:**
- Approve/reject directly from calendar
- Filter to see only pending events
- Add comments without opening full details
- Bulk approve multiple events (coming soon)

### State Managers

**Your Calendar Shows:**
- All zones and clubs
- State-wide overview
- Cross-zone conflicts

**What You Can Do:**
- View analytics overlay
- See event density by zone
- Export state-wide reports
- Manage public holidays

---

## Common Calendar Scenarios

### Scenario 1: Finding Next Month's Rallies

**Steps:**
1. Click **"Next ▶"** to go to next month
2. Set Event Type filter to **"Rally"**
3. Set Status to **"Approved"**
4. View all confirmed rallies

### Scenario 2: Checking for Date Conflicts

**As a Zone Rep:**
1. Select your zone
2. Choose **"Month View"**
3. Look for days with multiple events
4. Click events to compare times
5. System shows conflict warnings (⚠️)

### Scenario 3: Planning Club Events

**Before Requesting New Event:**
1. Select your club
2. View next 3 months (Custom Range)
3. Check for:
   - Public holidays (marked with 🏖️)
   - Other club events
   - Zone events
4. Find clear date
5. Submit event request

### Scenario 4: Sharing Calendar with Parents

**Create Public Link:**
1. Filter to your club
2. Set Status to **"Approved"** (hide pending)
3. Set Date Range to **"This Month"**
4. Click **"Share"**
5. Copy link and send to club email list

### Scenario 5: Printing Monthly Schedule

**For Notice Board:**
1. Set filters for your club
2. Choose **"Month View"**
3. Click **"Export"** → **"PDF"**
4. Select **Landscape** orientation
5. Print and post on club notice board

---

## Mobile Calendar Usage

### Mobile-Optimized Features

**On Phone/Tablet:**
- Swipe left/right to change months
- Tap event for details
- Use compact view for better fit
- Filters collapse into dropdown menu

**Best Practices:**
- Use **List View** on small screens
- Portrait mode for event details
- Landscape mode for month grid
- Pinch to zoom on month view

### Mobile Quick Actions

**Swipe Gestures:**
- Swipe event right → Quick approve (zone reps)
- Swipe event left → Quick view details
- Pull down → Refresh calendar

---

## Troubleshooting

### Common Issues

#### Events Not Showing

**Check:**
- [ ] Date range includes the event date
- [ ] Status filter (try "All Status")
- [ ] Zone/Club filter (try "All")
- [ ] Event type filter (try "All Types")

**Solution:** Click **"Clear All Filters"** button

#### Calendar Won't Load

**Try:**
1. Refresh page (F5)
2. Clear browser cache
3. Try different browser
4. Check internet connection

#### Can't Export Calendar

**Check:**
- [ ] You have events visible (apply filters)
- [ ] Pop-up blocker isn't blocking download
- [ ] You have space on device

#### Colors Look Wrong

**Note:** Event colors are set by event type
- Check event type in event details
- Colors can be customized by admin
- Colorblind mode available in settings

---

## Advanced Features

### Conflict Detection

**Automatic Warnings for:**
- 🚫 Same club, same date/time
- ⚠️ Public holidays
- ⚠️ Multiple zone events same time
- ⚠️ Venue double-booking (coming soon)

**Conflict Indicators:**
- Red outline on event
- Warning icon (⚠️)
- Tooltip explains conflict
- Details in event modal

### Public Holiday Integration

**Calendar Shows:**
- 🏖️ **Public Holidays** - State/federal holidays
- 📚 **School Holidays** - Term breaks
- 🎪 **Special Events** - Royal Show, etc.

**Why It Matters:**
- Plan around holidays
- Avoid low attendance dates
- Coordinate with school terms

**To View:**
- Public holidays appear as gray bars
- Hover for holiday name
- Events on holidays show warning
- Filter by "Has Conflict" to see all

### Recurring Events (Coming Soon)

**Future Feature:**
- Set events to repeat weekly/monthly
- Club managers can create series
- Edit one or all instances
- Smart conflict detection

---

## Calendar Settings

### Customize Your View

**Access Settings:**
1. Click ⚙️ icon on calendar
2. Or go to Profile → Calendar Preferences

**Available Options:**

**Display Settings:**
- [ ] Show event times on month view
- [ ] Show club logos
- [ ] Compact event cards
- [ ] 24-hour time format
- [ ] Week starts on Monday/Sunday

**Notification Settings:**
- [ ] Email reminder 1 day before events
- [ ] Email reminder 1 week before events
- [ ] Weekly calendar digest
- [ ] Event changes notification

**Filter Defaults:**
- Save preferred filters
- Auto-apply on login
- Reset to defaults option

---

## Tips for Power Users

### ⚡ Efficiency Hacks

1. **Save Common Filter Sets**
   - Use browser bookmarks with share links
   - Save different views for different purposes

2. **Use Keyboard Shortcuts**
   - Learn the shortcuts in this guide
   - Navigate 10x faster

3. **Multi-Monitor Setup**
   - Calendar on one screen
   - Event details on another
   - Great for zone reps reviewing multiple events

4. **Quick Search**
   - Press Ctrl/Cmd+F
   - Type event name or club
   - Jump directly to event

5. **Regular Exports**
   - Weekly CSV export for records
   - Monthly PDF for archives
   - Quarterly analytics review

### 🎯 Role-Specific Tips

**Club Managers:**
- Bookmark: Your club + next 3 months + approved
- Check daily for approval status changes
- Export ICS monthly for Google Calendar sync

**Zone Reps:**
- Bookmark: Your zone + pending events
- Use week view for detailed conflict checking
- Export weekly PDF for zone committee meetings

**State Managers:**
- Use dashboard calendar for overview
- Export all zones monthly for state reports
- Track approval velocity by zone

---

## Calendar Workflow Examples

### Club Manager: Planning Next Quarter

```
1. Open Calendar
2. Filter: My Club + Next 3 Months + Approved Events
3. Identify gaps in schedule
4. Check for public holidays (avoid)
5. Note zone events (consider coordination)
6. Submit new event requests for gaps
7. Export ICS and add to personal calendar
```

### Zone Rep: Morning Approval Routine

```
1. Open Calendar
2. Filter: My Zone + Pending Status + This Week
3. Switch to List View for details
4. Review each pending event:
   - Check conflicts (auto-highlighted)
   - Verify details complete
   - Approve or request changes
5. Switch to Month View
6. Export PDF for zone committee
7. Done! All events processed
```

### Parent: Viewing Club Schedule

```
1. Navigate to public calendar link (from club email)
2. Filter: My Club + This Month + Approved
3. View in Month View
4. Click events to see details
5. Export ICS to phone calendar
6. All set for the month!
```

---

## Quick Reference Card

### Essential Actions

| Task | Steps |
|------|-------|
| View this month | Click "This Month" filter |
| View my club only | Select club from dropdown |
| See event details | Click event on calendar |
| Export to PDF | Export → PDF → Download |
| Share calendar | Click Share → Copy link |
| Print calendar | Ctrl/Cmd+P or Export PDF |
| Find specific event | Ctrl/Cmd+F, type name |
| Clear all filters | Click "Clear Filters" |

### Filter Combinations

| Need to See... | Filters to Apply |
|----------------|------------------|
| My club's upcoming events | Club: Mine, Date: This Month, Status: Approved |
| Events needing approval | Zone: Mine, Status: Pending |
| Next month's rallies | Date: Next Month, Type: Rally |
| Conflict warnings | Status: All, Show Conflicts: Yes |
| Complete zone schedule | Zone: Mine, Date: This Year, Status: Approved |

---

## Next Steps

Now that you know the calendar basics:

1. ✅ Open the calendar and explore different views
2. ✅ Try each filter type
3. ✅ Click on an event to see details
4. ✅ Export the calendar in different formats
5. ✅ Set up your default preferences
6. ✅ Bookmark your most-used filter combination
7. ✅ Share the public calendar with your club

**Pro Tip:** The calendar is the heart of the system - check it daily! 📅

For more detailed information, see the complete [User Guide](./USER_GUIDE.md).

---

**Quick Start Version:** 1.0.0  
**Last Updated:** November 18, 2025  
**For:** All Users

*Questions? Contact your system administrator or refer to the full User Guide.*
