# Role Preservation in User Import

## Overview
The user import system now intelligently handles roles based on whether the spreadsheet contains a role column or not.

## Two Types of Spreadsheets Supported

### 1. **Role-Aware Spreadsheets** (e.g., from app export)
- **Contains**: Role column with values like 'super_user', 'zone_rep', 'standard'
- **Behavior**: Updates user roles as specified in the spreadsheet
- **Use Case**: Managing role changes, bulk role assignments

### 2. **Role-Agnostic Spreadsheets** (e.g., from external systems)
- **Contains**: No role column or empty role column
- **Behavior**: Preserves existing user roles, ignores role data completely
- **Use Case**: Refreshing user data (names, emails, clubs) without affecting permissions

## Import Logic Flow

### When Role Column EXISTS:
```
if (spreadsheet has role column AND role value is provided) {
    if (re-import AND existing user AND role changed) {
        → Log role change and update role
    } else if (new import OR new user) {
        → Set the provided role
    } else {
        → Keep existing role (same role value)
    }
} else if (existing user) {
    → Always preserve existing role
}
// New users with no role column get system default
```

### When Role Column MISSING:
```
if (no role column in spreadsheet) {
    if (existing user) {
        → Preserve existing role (no role changes at all)
        → Log: "No role column found, preserving existing role"
    } else {
        → New user gets system default role
    }
}
```

## Examples

### Example 1: External System Import (No Role Column)
**Spreadsheet columns**: PonyClubID, FirstName, LastName, Email, Mobile, Club
**Existing user**: PC123456 (super_user)
**Result**: All data updated EXCEPT role remains 'super_user'

### Example 2: App Export Import (With Role Column)
**Spreadsheet columns**: PonyClubID, FirstName, LastName, Email, Mobile, Club, Role
**Existing user**: PC123456 (super_user)
**Spreadsheet role**: standard
**Result**: All data updated AND role changed to 'standard'

### Example 3: Mixed Scenario
**Spreadsheet**: Has role column but some cells are empty
**User 1**: PC123456 - Role cell = 'zone_rep' → Role updated
**User 2**: PC789012 - Role cell = empty → Role preserved
**User 3**: NEW123456 - Role cell = 'standard' → Role set

## Console Logging
The system provides clear logging for role handling:

```
[UserService] Setting role for PC123456: zone_rep
[UserService] No role column found, preserving existing role for PC789012: super_user
[UserService] Role change detected for PC111222: standard -> zone_rep
```

## API Usage

### For External System Refreshes:
```javascript
// No need to specify isReImport - role preservation happens automatically
fetch('/api/admin/users/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    validRows: dataWithoutRoles,
    fileName: 'external_system_export.xlsx'
  })
});
```

### For Role Management Imports:
```javascript
fetch('/api/admin/users/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    validRows: dataWithRoles,
    fileName: 'app_export_with_roles.xlsx',
    isReImport: true  // Optional: enables enhanced change detection
  })
});
```

## Key Benefits

1. **No More Accidental Role Overwrites**: External data refreshes won't downgrade your super users
2. **Flexible Role Management**: Still allows intentional role changes when needed  
3. **Clear Logging**: Always know when and why roles are being changed
4. **Backward Compatibility**: Existing imports continue to work as expected