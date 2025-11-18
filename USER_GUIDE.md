# MyPonyClub Event Manager - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Role-Specific Guides](#role-specific-guides)
5. [Common Features](#common-features)
6. [Troubleshooting](#troubleshooting)
7. [Support](#support)

---

## Introduction

### What is MyPonyClub Event Manager?

MyPonyClub Event Manager is a comprehensive platform designed to streamline event management across Pony Club Victoria. The system enables clubs to request events, zone representatives to review and approve events, and state managers to oversee the entire calendar.

### Key Features

- **Event Request Management** - Submit and track event requests
- **Multi-level Approval Workflow** - Zone and state-level review process
- **Public Holiday Integration** - Automatic conflict detection
- **Calendar Management** - Import and export zone calendars
- **User Management** - Role-based access control
- **Email Notifications** - Automated updates and reminders
- **Embedded Forms** - Public event request forms for clubs

---

## Getting Started

### First Time Login

1. **Access the Application**
   - Navigate to your organization's MyPonyClub Event Manager URL
   - You'll be directed to the login page

2. **Login with Your Credentials**
   - Enter your **Pony Club ID** (e.g., PC123456 or MID number)
   - Enter your **Mobile Number** (in Australian format)
   - Click **"Login"**

   ![Login Screen Example](./docs/screenshots/login.png)

3. **Initial Setup**
   - On first login, verify your details are correct
   - Your role and club association will be pre-configured by your administrator
   - If you see an "Access Denied" message, contact your administrator

### Understanding the Interface

#### Navigation Bar
- **Logo** (top left) - Returns to your role's home dashboard
- **Navigation Buttons** - Access different sections based on your role
- **User Menu** (top right) - Shows your name, role, and logout option

#### Dashboard Layout
- **Statistics Cards** - Quick overview of key metrics
- **Action Buttons** - Primary functions for your role
- **Data Tables** - Sortable, searchable lists of events, clubs, etc.
- **Filter Controls** - Refine displayed information

---

## User Roles & Permissions

### Role Hierarchy

The system uses a multi-tier role structure:

```
┌─────────────────────────────────────────┐
│         Super User (Admin)              │
│  Full system access, all management     │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼────────┐  ┌────▼──────────────┐
│  State Manager │  │   EV Manager      │
│  State-level   │  │   EV Program      │
│  oversight     │  │   coordination    │
└───────┬────────┘  └───────────────────┘
        │
   ┌────┴────┐
   │         │
┌──▼─────────▼──┐
│  Zone Rep     │
│  Zone-level   │
│  approval     │
└──┬────────────┘
   │
┌──▼────────────┐
│ Club Manager  │
│ Club events   │
│ submission    │
└───────────────┘
```

### Role Descriptions

#### 1. Standard User
- **Purpose**: Basic access for club members
- **Permissions**: 
  - View their club's events
  - Submit event requests (if club_manager)
  - View public calendars

#### 2. Club Manager (`club_manager`)
- **Purpose**: Manage individual club events
- **Permissions**:
  - Submit event requests for their club
  - Edit pending/rejected events
  - View event approval status
  - Upload event schedules
  - Cannot approve own events

#### 3. Zone Representative (`zone_rep`)
- **Purpose**: Review and approve club events within their zone
- **Permissions**:
  - View all events in their zone
  - Approve/reject club event requests
  - Add feedback and comments
  - Manage zone calendar
  - Access zone-level statistics

#### 4. State Manager (`state_manager`)
- **Purpose**: Oversee all zones and provide state-level coordination
- **Permissions**:
  - View events across all zones
  - Manage state-level settings
  - Override zone decisions (if needed)
  - Manage public holidays
  - Generate state-wide reports

#### 5. EV Manager (`ev_manager`)
- **Purpose**: Coordinate Equestrian Victoria (EV) program events
- **Permissions**:
  - Manage EV-specific events
  - Sync with EV calendar
  - Configure EV settings
  - View cross-organization conflicts

#### 6. Super User (`super_user`)
- **Purpose**: Full system administration
- **Permissions**:
  - All permissions from other roles
  - User management (create, edit, delete users)
  - Club and zone configuration
  - Event type management
  - System settings
  - Database maintenance
  - Import/export data

### Multi-Role Support

Users can have multiple roles simultaneously:
- Example: A user might be both a `club_manager` and `zone_rep`
- The system shows all available dashboards
- Permissions are cumulative (you get all rights from all roles)

---

## Role-Specific Guides

### Club Manager Guide

#### Accessing the Club Manager Dashboard

1. After logging in, you'll see the **Club Manager** dashboard
2. Your club will be automatically selected from the dropdown
3. If you manage multiple clubs, select the desired club from the dropdown

#### Dashboard Overview

**Statistics Cards:**
- **Total Events** - All events for your club
- **Approved** - Events approved by zone rep
- **Pending** - Awaiting zone approval
- **Rejected** - Events that need revision

#### Submitting a New Event Request

1. Click **"Add Event"** button (green button, top right)

2. **Fill in Event Details:**
   - **Event Type** - Select from dropdown (Rally, Camp, Competition, etc.)
   - **Event Name** - Descriptive name for your event
   - **Date** - Event date (system checks for conflicts)
   - **Start Time** - When the event begins
   - **End Time** - When the event ends
   - **Location** - Where the event takes place
   - **Description** - Detailed information about the event

3. **Add Additional Information:**
   - Specify if the event is open to other clubs
   - Note any special requirements
   - Include contact information

4. Click **"Submit Event Request"**

5. **What Happens Next:**
   - Event status is set to "Proposed"
   - Zone representative receives notification
   - You can track status in the Events table
   - You'll receive email updates on approval/rejection

#### Managing Submitted Events

**Event Status Filter:**
- **All Events** - View complete history
- **Upcoming** - Future events only
- **Past Events** - Historical records

**Event Actions:**

| Status | Available Actions |
|--------|------------------|
| **Proposed** (Pending) | Edit Details, Cancel Request |
| **Approved** | View Details, Upload Schedule, Mark Complete |
| **Rejected** | View Feedback, Edit & Resubmit, Cancel |
| **Scheduled** | Upload/Update Schedule, View Schedule |

**Editing a Rejected Event:**
1. Click the **Edit** icon on the rejected event
2. Review the zone rep's feedback
3. Make necessary changes
4. Click **"Update Event"** to resubmit
5. Status changes back to "Proposed"

**Uploading Event Schedules:**
1. Click **Upload Schedule** on an approved event
2. Select your PDF file (max 5MB)
3. Click **Upload**
4. Schedule becomes viewable to all stakeholders

#### Club Settings

Access via **"Club Settings"** button:

**Available Settings:**
- Club contact information
- Default event settings
- Notification preferences
- View club history

---

### Zone Representative Guide

#### Accessing the Zone Manager Dashboard

1. Log in with your credentials
2. Navigate to **Zone Manager** (if not auto-directed)
3. Your zone will be automatically selected

#### Dashboard Overview

**Zone Statistics:**
- **Total Clubs** - Number of clubs in your zone
- **Active Events** - Current and upcoming events
- **Pending Approvals** - Events awaiting your review
- **Zone Calendar** - Complete zone event schedule

#### Reviewing Event Requests

1. **View Pending Events**
   - Events with "Proposed" status require your review
   - Events are highlighted in the pending section

2. **Review Event Details**
   - Click on the event to view full information
   - Check for:
     - Date conflicts with other events
     - Public holiday conflicts
     - Proper event type classification
     - Complete information

3. **Approve or Reject**

   **To Approve:**
   - Click **"Approve"** button
   - Optionally add approval notes
   - Event status changes to "Approved"
   - Club receives approval notification

   **To Reject:**
   - Click **"Reject"** button
   - **Required**: Provide detailed feedback explaining:
     - What needs to be changed
     - Why the event was rejected
     - Suggestions for resubmission
   - Event status changes to "Rejected"
   - Club receives rejection with your feedback

4. **Add Comments**
   - Use the comment section to communicate with clubs
   - Provide guidance without formal rejection
   - Request additional information

#### Managing Zone Calendar

**Import Zone Calendar:**
1. Navigate to **Admin → Import Calendar** (if you have admin rights)
2. Select your zone
3. Upload CSV file with zone events
4. Review preview of events to be imported
5. Confirm import

**Export Zone Calendar:**
1. Go to **Zone Settings**
2. Click **"Export Calendar"**
3. Select date range
4. Download CSV or PDF format

#### Zone Settings

Access via **"Zone Settings"** button:

**Configurable Options:**
- Zone contact information
- Default approval workflows
- Notification preferences
- Blackout dates for events

---

### State Manager Guide

#### Accessing the State Manager Dashboard

1. Log in with your credentials
2. Access **State Manager** dashboard
3. View state-wide overview

#### Dashboard Overview

**State-Level Statistics:**
- **Total Zones** - All zones under state management
- **Total Clubs** - Aggregate club count
- **State Events** - State-organized events
- **Approval Pipeline** - Events by status across all zones

#### Managing Public Holidays

1. Navigate to **Public Holiday Manager**

2. **View Current Holidays:**
   - See all configured public holidays
   - Filter by state/territory
   - View upcoming holidays

3. **Add New Holiday:**
   - Click **"Add Holiday"**
   - Enter:
     - Holiday Name
     - Date
     - State/Territory (VIC, NSW, QLD, etc.)
     - Type (Public Holiday, School Holiday, etc.)
   - Click **"Save"**

4. **Sync With Calendar:**
   - Click **"Sync Public Holidays"**
   - System automatically updates from official sources
   - Review and confirm changes

**Why Public Holidays Matter:**
- Events are flagged if scheduled on public holidays
- Automatic conflict warnings
- Helps with planning and resource allocation

#### State-Level Reporting

**Generate Reports:**
1. Go to **Admin → Testing → Export Events**
2. Select date range
3. Select zones (or all zones)
4. Choose export format (CSV, JSON)
5. Download report

**Available Reports:**
- Events by zone
- Events by type
- Approval statistics
- Club participation rates

#### State Settings

**Configure State-Wide Options:**
- State contact information
- Default event policies
- Approval workflow rules
- System-wide notifications

---

### EV Manager Guide

#### Accessing the EV Manager Dashboard

1. Log in with your credentials
2. Access **EV Manager** dashboard
3. View EV-specific events

#### Managing EV Events

**EV Event Types:**
- EV Rallies
- EV Competitions
- EV Training Days
- Joint Pony Club/EV events

#### Syncing with EV Calendar

1. Navigate to **EV Settings**
2. Click **"Sync EV Events"**
3. System pulls events from Equestrian Victoria
4. Review imported events
5. Confirm or reject individual events

#### EV-Specific Features

**Conflict Detection:**
- System flags when EV events overlap with Pony Club events
- Helps coordinate shared resources
- Enables joint event planning

**Settings:**
- EV API configuration
- Sync frequency
- Event filters
- Notification recipients

---

### Super User (Admin) Guide

#### Accessing the Admin Dashboard

1. Log in with super user credentials
2. Click **Admin** in navigation
3. Access comprehensive admin controls

#### User Management

**Creating New Users:**

1. Navigate to **Admin → Users**
2. Click **"Add User"** or **"Import Users"**

**Manual User Creation:**
- Enter Pony Club ID
- Enter mobile number
- Assign role(s)
- Select club association
- Select zone (if zone_rep)
- Click **"Create User"**

**Bulk User Import:**
1. Click **"Import Users"**
2. Download CSV template
3. Fill in user details:
   ```csv
   Pony Club ID,Mobile Number,Club Name,Zone Name,Role
   PC123456,0412345678,Bayside Pony Club,Metro Zone 1,club_manager
   PC789012,0423456789,Country Pony Club,Regional Zone 3,standard
   ```
4. Upload completed CSV
5. Review preview
6. Confirm import

**Managing Existing Users:**
- **Edit User**: Change roles, club, or contact info
- **Change Role**: Upgrade/downgrade permissions
- **Deactivate User**: Remove access without deleting
- **Delete User**: Permanently remove (use with caution)

**Role Preservation:**
- System maintains historical role data
- Users with "Historical Membership" are automatically deactivated
- Can reactivate users by changing membership status

#### Club Management

**Adding Clubs:**
1. Go to **Admin → Clubs**
2. Click **"Add Club"**
3. Enter:
   - Club Name
   - Zone Assignment
   - Contact Email
   - Phone Number
   - Address (enables geolocation)
4. Click **"Save"**

**Import Clubs:**
1. Click **"Import Clubs"**
2. Upload CSV with club data
3. Includes automatic geocoding for addresses

**Managing Club Logos:**
1. **Download Logos**: Bulk download from Pony Club Australia
2. **Upload Logos**: Store in Firebase Storage
3. Logos appear on club manager dashboards

#### Zone Management

**Creating Zones:**
1. Navigate to **Admin → Zones**
2. Click **"Add Zone"**
3. Enter:
   - Zone Name
   - Zone Code
   - Zone Manager contact
4. Click **"Save"**

**Assigning Zone Representatives:**
1. Go to **Admin → Users**
2. Find or create zone rep user
3. Assign `zone_rep` role
4. Select their zone
5. Save changes

#### Event Type Management

**Managing Event Types:**
1. Go to **Admin → Event Types**
2. View existing types (Rally, Camp, Competition, etc.)

**Add New Event Type:**
- Click **"Add Event Type"**
- Enter name and description
- Set default duration
- Set color code (for calendar display)
- Click **"Save"**

**Import/Export Event Types:**
- Maintain consistency across zones
- Export to share configurations
- Import from templates

#### Email Templates

**Managing Email Templates:**
1. Navigate to **Admin → Email Templates**
2. View template list:
   - Event Approval Notification
   - Event Rejection Notification
   - Event Reminder
   - User Welcome Email

**Editing Templates:**
1. Click **Edit** on a template
2. Modify content using placeholders:
   - `{{eventName}}` - Event name
   - `{{clubName}}` - Club name
   - `{{date}}` - Event date
   - `{{approverName}}` - Who approved/rejected
   - `{{feedback}}` - Approval feedback
3. Preview changes
4. Save template

**Testing Email Delivery:**
1. Go to **Admin → Email Queue**
2. View sent, pending, and failed emails
3. Retry failed emails
4. Test email configuration

#### Data Import/Export

**Importing PCA Data:**
1. Navigate to **Admin → Import PCA Data**
2. Select data type (clubs, zones, events)
3. Upload file from Pony Club Australia
4. Map columns to fields
5. Preview import
6. Confirm import

**Importing Zone Calendar:**
1. Go to **Admin → Import Calendar**
2. Select target zone
3. Upload CSV format calendar:
   ```csv
   Event Name,Date,Event Type,Club Name,Location
   Summer Rally,2025-12-15,Rally,Bayside PC,Bayside Grounds
   ```
4. Review import preview
5. Confirm import

**Exporting Data:**
1. Navigate to **Admin → Testing → Export**
2. Select data type:
   - All Events
   - Zones and Clubs
   - Users (with privacy controls)
3. Select date range
4. Choose format (CSV, JSON, PDF)
5. Download export

#### System Maintenance

**Database Maintenance:**
- **Cleanup Duplicates**: Remove duplicate entries
- **Purge Test Data**: Clear test events
- **Archive Old Events**: Move historical data

**Testing Tools:**
1. **API Endpoints**: View and test all API routes
2. **Generate Test Data**: Create sample events for testing
3. **Email Queue Testing**: Verify email system

#### Advanced Features

**Automated Backups:**
1. Navigate to **Admin → Backup Schedules**
2. Create backup schedule:
   - Set frequency (daily, weekly, monthly)
   - Select backup type (events, users, full)
   - Set retention period
3. View backup history
4. Restore from backup if needed

**Distribution Lists:**
1. Go to **Admin → Distribution Lists**
2. Create mailing lists for:
   - All club managers
   - Zone representatives
   - State managers
3. Use in email campaigns

**Geolocation Features:**
1. Navigate to **Admin → Geolocate Clubs**
2. Automatically geocode club addresses
3. Update locations in bulk
4. View clubs on map

---

## Common Features

### Calendar Views

#### Accessing Calendars

**Public Calendar:**
- Navigate to **Embed → Calendar**
- View all approved events
- Filter by zone, club, or event type
- Compact and full views available

**Personal Dashboard Calendar:**
- Shows events relevant to your role
- Club managers see their club's events
- Zone reps see their zone's events
- State managers see all events

#### Calendar Features

**Filtering:**
- By Date Range (Today, This Week, This Month, Custom)
- By Zone
- By Club
- By Event Type
- By Status

**Event Details:**
- Click any event to see full information
- View approval status
- See event location
- Download event schedule (if uploaded)

**Exporting:**
- Export to PDF for printing
- Download as CSV for Excel
- Import to Google Calendar (ICS format)

### Event Request Form (Public)

#### Embedded Form for Clubs

Clubs can share a public event request form:

1. **Access the Form:**
   - Navigate to `/embed/request-event?club=CLUB_ID`
   - Or use generated link from club dashboard

2. **Submit Event Without Login:**
   - Club members can submit events
   - No login required
   - Form validates all required fields

3. **Processing:**
   - Submissions go directly to club manager
   - Club manager reviews and officially submits
   - Maintains data quality and oversight

**Generating Embed Links:**
1. Go to Club Manager Dashboard
2. Click **"Get Embed Form Link"**
3. Copy link to share with club members
4. Optionally embed in club website

### Notifications

#### Email Notifications

**Automatic Notifications:**
- Event submitted → Zone rep notified
- Event approved → Club manager notified
- Event rejected → Club manager notified (with feedback)
- Event upcoming → All participants notified
- Schedule uploaded → Zone rep notified

**Managing Notification Preferences:**
1. Go to your role's **Settings** page
2. Under **Notifications**, select:
   - Email notifications (on/off)
   - Notification frequency
   - Event types to be notified about
3. Save preferences

#### In-App Notifications

- **Notification Bell** (top right of screen)
- Shows unread notifications
- Click to view notification center
- Mark as read or take action

### Search and Filters

#### Global Search

**Quick Search:**
- Search bar in top navigation
- Searches across:
  - Event names
  - Club names
  - Zone names
  - Event descriptions

**Advanced Filtering:**
- Use filter panels on list views
- Combine multiple filters
- Save filter presets

#### Sorting

**All Data Tables Support:**
- Click column headers to sort
- Ascending/descending toggle
- Multi-column sorting (hold Shift)

### Mobile Access

#### Responsive Design

The application is fully responsive:

**Mobile Features:**
- Touch-optimized buttons
- Swipe gestures for tables
- Responsive navigation menu
- Mobile-friendly forms

**Best Practices:**
- Use portrait mode for forms
- Landscape mode for calendars and tables
- Pinch to zoom on calendars

---

## Troubleshooting

### Login Issues

**Problem: Can't log in**
- **Check**: Pony Club ID format (PC123456 or 1234567)
- **Check**: Mobile number format (0412345678)
- **Check**: Internet connection
- **Solution**: Contact administrator if credentials are correct

**Problem: Access Denied after login**
- **Cause**: User not set up in system or no role assigned
- **Solution**: Contact administrator to verify account setup

### Event Submission Issues

**Problem: Can't submit event**
- **Check**: All required fields filled
- **Check**: Date is in future
- **Check**: No date conflicts shown
- **Solution**: Review validation messages

**Problem: Event rejected**
- **Check**: Review zone rep feedback carefully
- **Action**: Make requested changes
- **Action**: Resubmit with updates

### Upload Issues

**Problem: Schedule won't upload**
- **Check**: File is PDF format
- **Check**: File size under 5MB
- **Check**: File not corrupted
- **Solution**: Try reducing PDF size or converting again

**Problem: Logo won't upload**
- **Check**: Image format (JPG, PNG, GIF)
- **Check**: Image size under 2MB
- **Solution**: Resize image before upload

### Performance Issues

**Problem: Slow loading**
- **Check**: Internet connection speed
- **Try**: Refresh the page (F5)
- **Try**: Clear browser cache
- **Try**: Use different browser

**Problem: Page not updating**
- **Try**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- **Try**: Log out and log back in
- **Check**: Browser version (use latest)

### Common Error Messages

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Session expired" | Login timeout | Log in again |
| "Access denied" | Insufficient permissions | Contact admin |
| "Date conflict detected" | Event overlaps | Choose different date |
| "Invalid file format" | Wrong file type | Use correct format (PDF, CSV, etc.) |
| "Network error" | Connection issue | Check internet, retry |

---

## Support

### Getting Help

#### 1. Documentation
- Start with this User Guide
- Check [System Documentation](./SYSTEM_DOCUMENTATION.md) for technical details
- Review [API Documentation](./docs/API_ENDPOINTS.md) for integrations

#### 2. Administrator Support
- Contact your zone administrator
- Email: [admin@ponyclubvic.org.au] (replace with actual)
- Phone: [1234 567 890] (replace with actual)

#### 3. Technical Support
- For system bugs: Submit issue via administrator
- For feature requests: Contact state manager
- For urgent issues: Emergency contact (provide after deployment)

### Training Resources

#### Video Tutorials
- *Club Manager Quick Start* (Coming Soon)
- *Zone Rep Approval Process* (Coming Soon)
- *Admin User Management* (Coming Soon)

#### Training Sessions
- New user orientation (Monthly)
- Advanced features workshop (Quarterly)
- Administrator certification (On request)

### Feedback

We welcome your feedback to improve the system:

**How to Provide Feedback:**
1. Email suggestions to administrator
2. Complete quarterly user survey
3. Participate in user group meetings
4. Submit feature requests through admin

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + S` | Save form |
| `Esc` | Close modal/dialog |
| `Tab` | Navigate form fields |
| `Enter` | Submit form (when applicable) |

### Glossary

- **Approval Workflow**: Multi-step process for event approval
- **Club Association**: Link between user and their club
- **Event Type**: Category of event (Rally, Camp, etc.)
- **Historical Membership**: Inactive member status
- **Multi-role User**: User with multiple permission levels
- **Public Holiday Sync**: Automated holiday calendar update
- **Zone Calendar**: Collection of all events in a zone

### Change Log

**Version 1.3.0** (Current)
- Added multi-role support
- Implemented public holiday manager
- Enhanced email notification system
- Improved mobile responsiveness
- Added club manager auto-selection
- Reduced build logging verbosity

**Version 1.2.0**
- Added zone calendar import
- Implemented email queue system
- Added event schedule uploads
- Enhanced user import with role preservation

**Version 1.1.0**
- Initial multi-role system
- Basic event management
- User authentication
- Admin dashboard

---

## Quick Reference Card

### Club Manager Cheat Sheet

**Submit Event:**
1. Click "Add Event"
2. Fill form
3. Click "Submit"

**Edit Rejected Event:**
1. Find event in list
2. Click "Edit"
3. Make changes
4. Click "Update Event"

**Upload Schedule:**
1. Event must be approved
2. Click "Upload Schedule"
3. Select PDF
4. Click "Upload"

### Zone Rep Cheat Sheet

**Approve Event:**
1. Review event details
2. Check for conflicts
3. Click "Approve"
4. Add optional notes

**Reject Event:**
1. Review event
2. Click "Reject"
3. **Must provide feedback**
4. Submit rejection

### Admin Cheat Sheet

**Add User:**
- Admin → Users → Add User
- Fill required fields
- Assign role(s)
- Save

**Import Users:**
- Admin → Users → Import
- Upload CSV
- Preview
- Confirm

**Manage Events:**
- Admin dashboard for overview
- Navigate to specific manager role for actions
- Use filters to find events

---

**Document Version:** 1.0.0  
**Last Updated:** November 18, 2025  
**Next Review:** Monthly or as features are added

---

*For additional assistance, contact your system administrator or refer to the technical documentation.*
