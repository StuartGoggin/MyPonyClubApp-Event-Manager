# Committee Nomination History Tracking

## Overview

The Committee Nomination system now supports year-based historical tracking, allowing each club to maintain a complete history of their committee nominations across multiple years.

## Key Features

### 1. Year-Based Tracking
- Each committee nomination is associated with a specific year (derived from the AGM date)
- Clubs can view and manage committees for different years
- Historical record of all committee changes is preserved

### 2. Unique Committee Per Club Per Year
- Only one committee nomination can exist per club per year
- Each year's committee is tracked separately
- Approved committees represent the official committee for that year

### 3. Year Selector
- UI includes a year dropdown to switch between different years
- Automatically shows the most recent year by default
- Can navigate to previous years to view historical committees

## Database Schema

### CommitteeNomination Document
```typescript
{
  id: string;
  clubId: string;
  clubName: string;
  zoneId: string;
  zoneName: string;
  year: number;              // AGM year - derived from agmDate
  agmDate: string;           // ISO date string
  effectiveDate: string;     // When committee takes effect
  submittedAt: string;       // When nomination was submitted
  status: 'pending_dc_approval' | 'approved' | 'rejected' | 'withdrawn';
  
  districtCommissioner: { ... };
  president?: { ... };
  vicePresident?: { ... };
  secretary?: { ... };
  treasurer?: { ... };
  additionalCommittee: [ ... ];
  zoneRepresentative?: { ... };
}
```

## API Endpoints

### Get Committee Nominations

**Get available years for a club:**
```
GET /api/committee-nominations?clubId={clubId}&years=true
Response: [2025, 2024, 2023]
```

**Get nomination for specific year:**
```
GET /api/committee-nominations?clubId={clubId}&year=2025
Response: CommitteeNomination | null
```

**Get latest nomination (any year):**
```
GET /api/committee-nominations?clubId={clubId}
Response: CommitteeNomination | null
```

## Data Migration

### For Existing Nominations

Existing committee nominations without a `year` field need to be updated:

```javascript
// Migration script example
const migrateNominations = async () => {
  const nominations = await db.collection('committee_nominations').get();
  
  for (const doc of nominations.docs) {
    const data = doc.data();
    
    if (!data.year && data.agmDate) {
      const year = new Date(data.agmDate).getFullYear();
      
      await doc.ref.update({
        year: year
      });
      
      console.log(`Updated nomination ${doc.id} with year ${year}`);
    }
  }
};
```

### Firestore Index

Add composite index for efficient querying:

```json
{
  "collectionGroup": "committee_nominations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "clubId", "order": "ASCENDING" },
    { "fieldPath": "year", "order": "DESCENDING" },
    { "fieldPath": "submittedAt", "order": "DESCENDING" }
  ]
}
```

## User Interface

### Club Manager View

1. **Year Selector**: Dropdown in the top-right corner of the Committee Nomination card
2. **Year Display**: Shows the selected year in the card title
3. **Available Years**: Automatically populated based on existing nominations
4. **Current Year**: Always available in the dropdown for new nominations

### Historical View

- Switch between years using the year selector
- View approved, pending, rejected, or withdrawn nominations for each year
- Edit or withdraw only pending or rejected nominations for the current or future years
- Historical (past) nominations are read-only once approved

## Business Rules

### Creating Nominations

1. When creating a new nomination, the year is automatically derived from the AGM date
2. If a nomination already exists for the same club and year, user can:
   - Edit the existing pending/rejected nomination
   - Withdraw and create a new one

### Approval Workflow

1. Nominations are submitted and await DC approval
2. Once approved, the committee becomes official for that year
3. Approved nominations cannot be edited (must withdraw and resubmit if changes needed)

### Historical Integrity

1. Approved committees for past years are preserved
2. Cannot delete historical records
3. Withdrawal creates an audit trail (status changed to 'withdrawn')

## Implementation Details

### Automatic Year Extraction

The year is automatically calculated when a user selects an AGM date:

```typescript
onChange={(e) => {
  const agmDate = e.target.value;
  const year = agmDate ? new Date(agmDate).getFullYear() : new Date().getFullYear();
  setFormData(prev => ({ ...prev, agmDate, year }));
}}
```

### Year Management Functions

```typescript
// Get nomination for specific year
getCommitteeNominationByYear(clubId: string, year: number)

// Get all years with nominations
getClubCommitteeYears(clubId: string): Promise<number[]>

// Get latest approved committee (most recent year)
getLatestApprovedCommittee(clubId: string)
```

## Future Enhancements

### Potential Additions

1. **Committee Comparison**: Compare committees year-over-year
2. **Export History**: Export all historical committees as CSV/PDF
3. **Tenure Tracking**: Track how long members have served in positions
4. **Role History**: Show all positions a member has held over time
5. **Approval Timeline**: Visual timeline of approval process for each year

## Testing Checklist

- [ ] Create nomination for current year
- [ ] View nomination for current year
- [ ] Edit pending nomination
- [ ] Withdraw and resubmit nomination
- [ ] Create nomination for a new club (no history)
- [ ] Switch between years using selector
- [ ] View historical (approved) nomination
- [ ] Verify year is auto-populated from AGM date
- [ ] Ensure one nomination per club per year
- [ ] Test approval workflow for different years
