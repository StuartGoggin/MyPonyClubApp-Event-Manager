# User Import Role Preservation System

## Overview

The MyPonyClub Event Manager includes a sophisticated role preservation system that ensures existing user roles (such as `super_user` and `zone_rep`) are maintained during CSV imports, even when the imported spreadsheet contains no role column.

## Key Features

### 🔒 Role Preservation Logic

- **Existing User Protection**: When a CSV has no role column, existing user roles are preserved
- **New User Defaults**: New users without role data receive the system default (`standard`) role
- **Role Change Detection**: Explicit role changes are logged and applied when role data is present
- **Membership vs Role Distinction**: Automatic detection of membership status data vs role assignment data

### 📊 Import Data Flow

```
CSV File → Parser → Validation → Preview → Confirmed Import → Role Assignment
```

1. **Parser Stage**: Detects column mappings and sets `role: undefined` when no role column exists
2. **Validation Stage**: Preserves `undefined` role values and validates actual role data
3. **Preview Stage**: Maintains `undefined` values (no default assignment)
4. **Import Stage**: Applies role preservation logic based on `undefined` vs explicit role values

## Technical Implementation

### Role Validation Transform

The role validation transform in `user-validation.ts` includes:

```typescript
role: z.string()
  .optional()
  .transform(s => {
    // If role column is missing or empty, return undefined
    if (!s || s.trim() === '' || s.trim() === 'null' || s.trim() === 'undefined') {
      return undefined;
    }
    
    // Detect membership data that was incorrectly mapped to role field
    if (normalized.includes('riding member') || normalized.includes('non-riding') || 
        normalized.includes('senior') || normalized.includes('junior') ||
        normalized.includes('adult') || normalized.includes('child')) {
      return undefined; // Don't treat membership data as role data
    }
    
    // ... role mapping logic
  })
```

### Role Assignment Logic

The role assignment logic in `user-service.ts`:

```typescript
if (row.role !== undefined) {
  // Role column exists and has a value - apply role change logic
  if (isReImport && existingUser && row.role !== existingUser.role) {
    console.log(`Role change detected: ${existingUser.role} -> ${row.role}`);
    userData.role = row.role;
  } else {
    userData.role = row.role;
  }
} else if (existingUser) {
  // No role column in spreadsheet - preserve existing user's role
  userData.role = existingUser.role;
  console.log(`Preserving existing role: ${existingUser.role}`);
} else {
  // New user with no role column - use system default
  console.log(`New user with no role column, will use system default`);
}
```

## Bug Fix History

### Critical Issue (Fixed September 13, 2025)

**Problem**: Super_user roles were being overwritten to 'standard' during CSV imports without role columns.

**Root Cause**: The preview endpoint (`/api/admin/users/import/preview`) was applying default values in the `validRowsData` generation:

```typescript
// BEFORE (buggy):
validRowsData: validRows.map(row => ({
  ...row,
  role: row.role || 'standard' // This converted undefined to 'standard'
}))

// AFTER (fixed):
validRowsData: validRows.map(row => ({
  ...row,
  role: row.role // Preserves undefined for role preservation logic
}))
```

**Impact**: CSVs without role columns were incorrectly changing existing user roles instead of preserving them.

**Solution**: 
1. Removed default assignment in preview data transmission
2. Updated TypeScript definitions to allow optional role fields
3. Added comprehensive debugging for role assignment tracking

## Usage Examples

### CSV with No Role Column

```csv
MID,Firstname,Lastname,Club Name,Membership
2528589,Stuart,Goggin,Monbulk Pony Club,Non-Riding Member
```

**Expected Behavior**:
- Existing super_user role for user 2528589 is preserved
- New users receive 'standard' role by default
- Import logs show: `Preserving existing role for 2528589: super_user`

### CSV with Role Column

```csv
MID,Firstname,Lastname,Club Name,Role
2528589,Stuart,Goggin,Monbulk Pony Club,zone_rep
```

**Expected Behavior**:
- Role change is detected and applied
- Import logs show: `Role change detected for 2528589: super_user -> zone_rep`

### CSV with Membership Data in Role Field

```csv
MID,Firstname,Lastname,Club Name,Role
2528589,Stuart,Goggin,Monbulk Pony Club,Senior Riding Member
```

**Expected Behavior**:
- "Senior Riding Member" is detected as membership data, not role data
- Existing role is preserved
- Membership status is processed separately

## Debugging

### Role Assignment Logs

The system provides comprehensive logging for role assignment:

```
[UserValidation] Role transform received: "undefined" (type: undefined)
[UserValidation] Role is empty/null/undefined, returning undefined
[UserService] Role assignment for 2528589: row.role="undefined", isReImport=true, existingUser=true
[UserService] No role column found, preserving existing role for 2528589: super_user
[UserService] Final userData.role for 2528589: super_user
```

### Troubleshooting

1. **Check parser logs**: Verify `role: undefined` is set when no role column exists
2. **Check validation logs**: Ensure validation preserves `undefined` values
3. **Check preview data**: Verify `validRowsData` doesn't apply defaults to role field
4. **Check role assignment**: Verify preservation logic is triggered for existing users

## Related Files

- `src/lib/user-validation.ts` - Role validation and transform logic
- `src/lib/user-service.ts` - Role assignment and preservation logic
- `src/lib/spreadsheet-parser.ts` - Column mapping and parsing
- `src/app/api/admin/users/import/preview/route.ts` - Preview data generation
- `src/app/api/admin/users/import/route.ts` - Confirmed import processing

## Testing

To test role preservation:

1. Create a user with `super_user` role
2. Import a CSV with no role column containing that user's data
3. Verify the user retains their `super_user` role after import
4. Check logs for "Preserving existing role" messages