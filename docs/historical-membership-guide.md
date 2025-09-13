# Historical Membership Handling

## Overview
The user import system now automatically detects and handles historical memberships by deactivating user accounts when membership status is marked as "historical membership" in the spreadsheet.

## How It Works

### Membership Status Detection
The system looks for membership status in these columns (case-insensitive):
- `membership`
- `membership status`
- `membership_status`
- `member status`
- `status`
- `membership type`

If no dedicated membership column exists, the system checks if the role column contains membership information (like "Historical Membership").

### Historical Membership Processing
When a row contains "historical" in the membership status:

1. **Find Existing User**: Look up the user by Pony Club ID
2. **Deactivate Account**: Set `isActive = false` and add deactivation metadata
3. **Track Changes**: Record deactivation reason and timestamp
4. **Count Results**: Include in `deactivatedUsers` count in import results

### Deactivation Process
When a historical membership is detected, the user account is updated with:

```javascript
{
  isActive: false,
  membershipStatus: 'historical',
  deactivatedAt: new Date(),
  deactivatedBy: 'import',
  deactivationReason: 'Historical membership detected in import',
  lastImportBatch: importBatch,
  updatedAt: new Date()
}
```

## Import Results
The import response now includes deactivated users:

```javascript
{
  success: true,
  message: "Import completed: 15 users created, 23 users updated, 3 users deactivated",
  results: {
    validRows: 41,
    createdUsers: 15,
    updatedUsers: 23,
    deactivatedUsers: 3,
    importErrors: 0
  }
}
```

## Example Scenarios

### Scenario 1: Dedicated Membership Column
```csv
PonyClubID,FirstName,LastName,Email,Mobile,Club,Membership
PC123456,John,Smith,john@email.com,0412345678,Melbourne PC,Active Membership
PC789012,Jane,Doe,jane@email.com,0498765432,Sydney PC,Historical Membership
```

**Result**: 
- PC123456: Account updated normally
- PC789012: Account deactivated (if exists) or ignored (if new)

### Scenario 2: Role Column Contains Membership
```csv
PonyClubID,FirstName,LastName,Email,Mobile,Club,Role
PC123456,John,Smith,john@email.com,0412345678,Melbourne PC,zone_rep
PC789012,Jane,Doe,jane@email.com,0498765432,Sydney PC,Historical Membership
```

**Result**:
- PC123456: Role set to zone_rep
- PC789012: Account deactivated, no role assigned

### Scenario 3: Mixed Active and Historical
```csv
PonyClubID,FirstName,LastName,Email,Mobile,Club,Membership,Role
PC111111,Alice,Wilson,alice@email.com,0411111111,Brisbane PC,Active Membership,standard
PC222222,Bob,Johnson,bob@email.com,0422222222,Perth PC,Historical Membership,
PC333333,Carol,Brown,carol@email.com,0433333333,Adelaide PC,Active Membership,super_user
```

**Result**:
- PC111111: Updated with standard role
- PC222222: Account deactivated
- PC333333: Updated with super_user role

## Console Logging
The system provides detailed logging:

```
[SpreadsheetParser] Row 2: Historical membership detected - will process for account deactivation
[UserService] Deactivated user PC789012 due to historical membership
[UserService] User PC999999 has historical membership but no existing account found - skipping
```

## API Integration

### Standard Import (handles historical automatically)
```javascript
fetch('/api/admin/users/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    validRows: importData,
    fileName: 'membership_update.xlsx'
  })
});
```

### Response with Deactivations
```javascript
{
  "success": true,
  "message": "Import completed: 0 users created, 5 users updated, 2 users deactivated",
  "results": {
    "validRows": 7,
    "createdUsers": 0,
    "updatedUsers": 5,
    "deactivatedUsers": 2,
    "importErrors": 0
  }
}
```

## Data Safety
- **No Data Loss**: Users are deactivated, not deleted
- **Audit Trail**: Full metadata about when and why deactivation occurred
- **Reversible**: Deactivated users can be manually reactivated if needed
- **Skip New Users**: Historical memberships for non-existent users are ignored (logged but not processed)

## Benefits
1. **Automatic Cleanup**: No need to manually remove historical members
2. **Audit Compliance**: Complete trail of who was deactivated and when
3. **Data Integrity**: Prevents inactive members from accessing the system
4. **Import Efficiency**: Handles active and inactive members in one operation