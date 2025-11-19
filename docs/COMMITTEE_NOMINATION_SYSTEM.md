# Committee Nomination System

## Overview
A system to allow clubs to capture and submit their committee nominations following their Annual General Meeting (AGM), including District Commissioner (DC) nomination requiring zone approval.

## Business Context

### Annual General Meeting Process
1. Clubs hold their Annual General Meeting (AGM)
2. New committee members are elected
3. A new District Commissioner (DC) is nominated
4. Committee details must be sent to the zone for records
5. DC nomination requires zone representative approval

## Requirements

### Functional Requirements

#### FR1: Committee Submission Form
**Description:** Clubs can submit their new committee details after AGM

**Access Points:**
1. **Primary:** Club Manager Dashboard - accessible as a menu item/button
2. **Secondary:** Standalone embeddable form accessible from external website
3. Must support both authenticated (club manager) and standalone (public form with club selection) modes

**Form Fields:**

##### Club Information
- Club Name (auto-populated if authenticated, dropdown if standalone)
- Zone (auto-populated based on club)
- AGM Date (required)
- Effective Date (when new committee takes over)

##### Committee Members
The form should capture the following positions:

1. **District Commissioner (DC)** - *Requires Zone Approval*
   - Name (with autocomplete from user database)
   - Pony Club ID
   - Mobile Number (auto-populated from user profile if exists)
   - Email Address (auto-populated from user profile if exists)
   - Is this person the Zone Representative? (checkbox)

2. **President**
   - Name (with autocomplete)
   - Pony Club ID
   - Mobile Number (auto-populated)
   - Email Address (auto-populated)
   - Is this person the Zone Representative? (checkbox)

3. **Vice President**
   - Name (with autocomplete)
   - Pony Club ID
   - Mobile Number (auto-populated)
   - Email Address (auto-populated)
   - Is this person the Zone Representative? (checkbox)

4. **Secretary**
   - Name (with autocomplete)
   - Pony Club ID
   - Mobile Number (auto-populated)
   - Email Address (auto-populated)
   - Is this person the Zone Representative? (checkbox)

5. **Treasurer**
   - Name (with autocomplete)
   - Pony Club ID
   - Mobile Number (auto-populated)
   - Email Address (auto-populated)
   - Is this person the Zone Representative? (checkbox)

6. **Committee Members** (up to 10 additional positions)
   - Position/Role (e.g., "Equipment Officer", "Social Coordinator")
   - Name (with autocomplete)
   - Pony Club ID
   - Mobile Number (auto-populated)
   - Email Address (auto-populated)
   - Is this person the Zone Representative? (checkbox)

##### Zone Representative Designation
- **Zone Representative:** Any committee member OR someone else from the club
- If "Someone else", provide:
  - Name (with autocomplete)
  - Pony Club ID
  - Mobile Number (auto-populated)
  - Email Address (auto-populated)

##### Submission Details
- Submitted By (name of person completing form)
- Submitter Email
- Submitter Phone
- Additional Notes/Comments (optional)

#### FR2: Name Autocomplete & Auto-population
**Description:** Enhance user experience by autocompleting member information

**Functionality:**
- When typing a name, search existing user database
- Display matching results with Pony Club ID
- When user selects a match:
  - Auto-populate Pony Club ID
  - Auto-populate mobile number (if available in profile)
  - Auto-populate email address (if available in profile)
- Allow manual entry if person not in database
- Validate Pony Club ID format

**Data Source:** Existing users table in Firebase

#### FR3: Standalone/Embeddable Form
**Description:** Form can be accessed independently from external website

**Implementation:**
- Create dedicated route: `/embed/committee-nomination`
- Similar to event request embed form
- Works without authentication
- Requires club selection dropdown at top
- Can be embedded in iframe on external website
- Responsive design for mobile/tablet/desktop

#### FR4: Submission Workflow

**Submission Process:**
1. User fills out committee nomination form
2. System validates all required fields
3. On submit:
   - Save submission to database
   - Mark DC nomination status as "Pending Zone Approval"
   - Mark other positions as "Submitted"
   - Send confirmation email to submitter
   - Send notification to zone representative for DC approval
   - Send notification to state admin (copy of submission)

**Data Storage:**
- Collection: `committee_nominations`
- Document structure:
```javascript
{
  id: "auto-generated",
  clubId: "club-id",
  clubName: "Club Name",
  zoneId: "zone-id",
  zoneName: "Zone Name",
  agmDate: "2025-11-15",
  effectiveDate: "2025-12-01",
  submittedAt: "2025-11-19T10:30:00Z",
  submittedBy: {
    name: "Submitter Name",
    email: "submitter@example.com",
    phone: "0412345678"
  },
  
  districtCommissioner: {
    name: "John Smith",
    ponyClubId: "PC123456",
    mobile: "0412345678",
    email: "john@example.com",
    isZoneRep: false,
    approvalStatus: "pending", // pending, approved, rejected
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null
  },
  
  president: {
    name: "Jane Doe",
    ponyClubId: "PC234567",
    mobile: "0423456789",
    email: "jane@example.com",
    isZoneRep: true
  },
  
  vicePresident: { /* same structure */ },
  secretary: { /* same structure */ },
  treasurer: { /* same structure */ },
  
  additionalCommittee: [
    {
      position: "Equipment Officer",
      name: "Bob Jones",
      ponyClubId: "PC345678",
      mobile: "0434567890",
      email: "bob@example.com",
      isZoneRep: false
    }
  ],
  
  zoneRepresentative: {
    isCommitteeMember: true, // or false if "someone else"
    position: "president", // which committee position, or null
    name: "Jane Doe", // redundant but useful for queries
    ponyClubId: "PC234567",
    mobile: "0423456789",
    email: "jane@example.com"
  },
  
  additionalNotes: "Optional comments here",
  
  status: "pending_dc_approval" // pending_dc_approval, approved, partially_approved
}
```

#### FR5: Zone Approval Workflow (DC Only)

**Zone Representative Dashboard:**
- New section: "Pending DC Approvals"
- Shows all DC nominations awaiting approval
- Similar UI to event approvals

**Approval Actions:**
1. **Approve DC:**
   - Click "Approve DC" button
   - Optionally add approval message
   - Updates `districtCommissioner.approvalStatus` to "approved"
   - Records approver and timestamp
   - Sends email to club confirming DC approval
   - Updates overall submission status

2. **Reject DC:**
   - Click "Reject DC" button
   - Required: Provide reason for rejection
   - Updates `districtCommissioner.approvalStatus` to "rejected"
   - Records reason, approver, and timestamp
   - Sends email to club with rejection reason
   - Club can resubmit with different DC nominee

**Notification Emails:**
- **To Club (on submission):** "Committee nomination submitted successfully. DC approval pending."
- **To Zone Rep (on submission):** "New DC nomination from [Club] requires your approval."
- **To Club (on approval):** "DC nomination for [Name] has been approved by zone."
- **To Club (on rejection):** "DC nomination requires revision. Reason: [reason]"

#### FR6: Club Manager Dashboard Integration

**Dashboard Additions:**
1. **New Button/Card:** "Submit Committee Nominations"
   - Icon: 👥 or 📋
   - Description: "Submit AGM committee and DC nominations"
   - Links to committee nomination form

2. **Status Display:**
   - Show current committee submission status
   - Display DC approval status (if pending)
   - Show last submission date

3. **History View:**
   - View previous committee submissions
   - See approval history
   - Download submitted forms as PDF

### Non-Functional Requirements

#### NFR1: User Experience
- Form should be intuitive and easy to complete
- Mobile-friendly responsive design
- Clear validation messages
- Progress indicator for long form
- Save draft functionality (for authenticated users)
- Confirmation screen before final submission

#### NFR2: Performance
- Autocomplete search results within 500ms
- Form submission processed within 2 seconds
- Email notifications sent within 1 minute

#### NFR3: Security
- Authenticated route requires club_manager role or higher
- Embed route is public but rate-limited
- Validate all input data
- Sanitize text fields to prevent XSS
- Log all submissions for audit trail

#### NFR4: Data Integrity
- Validate Pony Club ID format
- Validate email format
- Validate phone number format (Australian mobile)
- Ensure at least one zone representative designated
- Prevent duplicate submissions for same AGM period

## Technical Implementation

### Components to Create

#### 1. Frontend Components
```
src/components/committee-nomination/
├── committee-nomination-form.tsx       # Main form component
├── member-autocomplete-field.tsx       # Reusable autocomplete input
├── committee-member-section.tsx        # Repeatable section for each position
├── zone-rep-selector.tsx               # Zone rep designation component
└── submission-confirmation.tsx         # Success screen
```

#### 2. Pages/Routes
```
src/app/
├── club-manager/
│   └── committee-nomination/
│       └── page.tsx                    # Authenticated club manager form
└── embed/
    └── committee-nomination/
        └── page.tsx                    # Public embed form
```

#### 3. API Routes
```
src/app/api/
├── committee-nominations/
│   ├── submit/route.ts                 # Submit new nomination
│   ├── approve-dc/route.ts             # Zone rep approves DC
│   ├── reject-dc/route.ts              # Zone rep rejects DC
│   └── [id]/route.ts                   # Get specific submission
└── users/
    └── autocomplete/route.ts           # User search for autocomplete
```

#### 4. Database Functions
```
src/lib/
├── committee-nominations.ts            # CRUD operations
└── committee-notifications.ts          # Email notifications
```

### Database Schema

#### New Collection: `committee_nominations`
- Indexed on: `clubId`, `zoneId`, `status`, `submittedAt`
- Security rules: Club managers can read their own, zone reps can read their zone

#### Updates to Existing Collections
- Consider adding `isCommitteeMember` flag to users table
- Add `currentCommitteePosition` field to users table (optional)

### Email Templates

#### Template 1: Submission Confirmation (to Club)
```
Subject: Committee Nomination Submitted - [Club Name]

Dear [Submitter Name],

Your committee nomination for [Club Name] has been successfully submitted.

AGM Date: [Date]
Effective Date: [Date]

District Commissioner Nominee: [Name]
Status: Pending Zone Approval

Other Committee Members: [Summary]

You will receive a notification once your DC nomination is approved by the zone representative.

View submission details: [Link]

Thank you,
MyPonyClub Event Manager
```

#### Template 2: DC Approval Required (to Zone Rep)
```
Subject: DC Nomination Requires Approval - [Club Name]

Dear [Zone Rep Name],

A new District Commissioner nomination requires your approval:

Club: [Club Name]
Nominee: [DC Name]
Pony Club ID: [ID]
Submitted: [Date]

Please review and approve/reject this nomination:
[Link to Approval Page]

Thank you,
MyPonyClub Event Manager
```

#### Template 3: DC Approved (to Club)
```
Subject: DC Nomination Approved - [Club Name]

Dear [Submitter Name],

Great news! Your District Commissioner nomination has been approved.

Nominee: [DC Name]
Approved by: [Zone Rep Name]
Approved on: [Date]

Your committee is now active in the system.

Thank you,
MyPonyClub Event Manager
```

#### Template 4: DC Rejected (to Club)
```
Subject: DC Nomination Requires Revision - [Club Name]

Dear [Submitter Name],

Your District Commissioner nomination requires revision.

Nominee: [DC Name]
Reviewed by: [Zone Rep Name]

Reason for rejection:
[Rejection Reason]

Please submit a revised nomination with the necessary changes.

[Link to Resubmit]

Thank you,
MyPonyClub Event Manager
```

## User Stories

### US1: Club Manager Submits Committee
**As a** club manager  
**I want to** submit my club's new committee after AGM  
**So that** the zone has our updated committee information

**Acceptance Criteria:**
- Can access form from club manager dashboard
- Can enter all committee positions
- Can designate zone representative
- Form autocompletes member names and details
- Receive confirmation email upon submission
- See submission status on dashboard

### US2: Zone Rep Approves DC
**As a** zone representative  
**I want to** review and approve DC nominations  
**So that** clubs have authorized district commissioners

**Acceptance Criteria:**
- Can see pending DC approvals on dashboard
- Can view full nomination details
- Can approve with optional message
- Can reject with required reason
- Club receives notification of decision

### US3: External Website Embeds Form
**As a** state administrator  
**I want to** embed the committee nomination form on our main website  
**So that** clubs can access it without logging into the event manager

**Acceptance Criteria:**
- Form works in iframe
- Works on mobile devices
- No authentication required
- Club selection dropdown available
- Submissions work same as authenticated version

### US4: Club Resubmits After Rejection
**As a** club manager  
**I want to** resubmit my DC nomination after rejection  
**So that** I can correct issues and get approval

**Acceptance Criteria:**
- Can see rejection reason
- Can submit new DC nominee
- Previous submission archived
- New submission goes through same approval process

## Implementation Phases

### Phase 1: Core Form (Sprint 1)
- Create basic form UI
- Implement database schema
- Basic submission functionality
- Email notifications

### Phase 2: Enhanced UX (Sprint 2)
- Name autocomplete
- Auto-population of fields
- Form validation
- Confirmation screens

### Phase 3: Dashboard Integration (Sprint 3)
- Add to club manager dashboard
- Zone rep approval interface
- Status tracking
- History view

### Phase 4: Embed & Polish (Sprint 4)
- Create embed route
- Mobile optimization
- Draft save functionality
- Testing & refinement

## Testing Requirements

### Test Scenarios
1. Submit complete committee with all positions filled
2. Submit with minimum required positions only
3. Autocomplete existing user vs manual entry
4. Zone rep approves DC
5. Zone rep rejects DC
6. Club resubmits after rejection
7. Embed form accessed from external site
8. Multiple submissions from same club (should prevent or archive)
9. Zone rep designated as committee member
10. Zone rep designated as non-committee member

### Edge Cases
- User not in database (manual entry)
- Invalid Pony Club ID format
- Duplicate email addresses
- No zone rep designated (validation error)
- Multiple people marked as zone rep (validation error)
- AGM date in future
- Effective date before AGM date

## Future Enhancements
- PDF export of committee list
- Integration with user management (auto-update roles)
- Annual reminder to clubs to update committee
- Historical committee tracking
- Committee member contact directory
- Automated role assignment in system based on position

## Related Documentation
- [User Management System](USER_MANAGEMENT.md)
- [Email Queue System](FIREBASE_BACKUP_SCHEDULER.md)
- [Event Request System](EVENT_REQUEST_SYSTEM.md)
- [Zone Manager Guide](docs/ZONE_MANAGER_QUICK_START.md)

## Questions/Decisions Needed
1. Should system automatically grant committee members access to club manager dashboard?
2. What happens to old committee when new one is approved?
3. Should there be a transition period where both old and new committees are active?
4. How to handle mid-year committee changes (not from AGM)?
5. Should zone rep approval be required for other positions, or only DC?
6. Maximum number of additional committee positions?
7. Should we validate that zone rep is actually a club member?
