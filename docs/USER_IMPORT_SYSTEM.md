# User Import System Documentation

## Overview

The User Import System is a comprehensive solution for importing user data from spreadsheets with flexible role handling, advanced zone/club mapping, and robust error handling. The system supports optional role columns and seamlessly updates existing user data.

## Key Features

### ✨ Optional Role Import Framework
- **Flexible Role Support**: User roles stored as separate database column (not using Membership system)
- **Optional Column Handling**: Import functions whether spreadsheets contain role data or not
- **Data Update Capability**: Existing user records update with new values during import
- **Graceful Fallback**: When role column missing, import continues without role assignment
- **Default Role Assignment**: New users without role data automatically get 'standard' role

### 🗺️ Advanced Mapping System
- **Zone Mapping Engine**: Intelligent mapping from spreadsheet formats to system zones
- **Club Name Resolution**: Fuzzy matching and normalization for club name variations
- **Database Integration**: Real-time zone and club lookup with sophisticated caching
- **Pattern Recognition**: Advanced similarity scoring using Jaccard similarity algorithm
- **Static Mapping Library**: Comprehensive mappings for all Victorian zones and common abbreviations

### 🔧 Robust Import Pipeline
- **Multi-Format Support**: CSV and Excel file import with optional column detection
- **Schema Validation**: Zod-based validation with optional field support throughout
- **Error Resilience**: Graceful handling of missing or invalid data at all levels
- **TypeScript Integration**: Full type safety with optional fields in UserImportRow interface
- **Comprehensive Logging**: Debug logging for mapping, validation, and processing

## Architecture

### File Structure
```
src/lib/
├── user-validation.ts     # User import validation with optional role support
├── user-service.ts        # User processing with conditional role assignment
├── spreadsheet-parser.ts  # CSV/Excel parsing with optional column handling
├── import-mappings.ts     # Zone and club name mapping system
└── types.ts              # TypeScript interfaces with optional role field
```

### Core Components

#### 1. User Validation (`user-validation.ts`)
- **Purpose**: Validates import data with optional role support
- **Key Features**:
  - Role field made optional in import schema
  - Returns `undefined` when role column not present
  - Removed async `mapImportData` dependency to avoid validation issues
  - Zod schema validation with flexible field handling

#### 2. User Service (`user-service.ts`)
- **Purpose**: Processes user imports with conditional role handling
- **Key Features**:
  - `processUserImport` conditionally sets role field only when provided
  - `createUser` provides default 'standard' role for new users
  - Preserves existing user update functionality
  - Relies on import-mappings.ts for zone/club resolution

#### 3. Spreadsheet Parser (`spreadsheet-parser.ts`)
- **Purpose**: Parses CSV/Excel files with optional role column support
- **Key Features**:
  - Role validation skips gracefully when column missing
  - Proper TypeScript typing for optional role field
  - Returns `UserImportRow` with optional role property
  - Maintains data integrity throughout parsing process

#### 4. Import Mappings (`import-mappings.ts`)
- **Purpose**: Comprehensive zone and club name mapping system
- **Key Features**:
  - Advanced pattern matching with text normalization
  - Database lookup with caching for performance
  - Fuzzy matching using Jaccard similarity algorithm
  - Static mapping library for all Victorian zones
  - Club name resolution with abbreviation support

#### 5. Type Definitions (`types.ts`)
- **Purpose**: TypeScript interfaces for user import system
- **Key Features**:
  - `UserImportRow` interface with `role?: string` optional field
  - Full type safety throughout import pipeline
  - Consistent optional field handling across all components

## Zone Mapping System

### Static Zone Mappings
The system includes comprehensive static mappings for all Victorian zones:
- **Format Variations**: Handles "VIC/Zone Name" and direct zone name formats
- **Abbreviations**: Supports common abbreviations (Metro, North, South, etc.)
- **Aliases**: Multiple variations for each zone (Southern Metropolitan, South Metro, etc.)

### Dynamic Zone Resolution
1. **Static Mapping Check**: Exact match against predefined mappings
2. **Direct Database Match**: Case-insensitive comparison with database zones
3. **Pattern Matching**: Normalized text comparison with similarity scoring
4. **Fuzzy Matching**: Jaccard similarity algorithm with 0.6 threshold
5. **Default Fallback**: Returns first available zone if no match found

### Zone Normalization Process
```typescript
function normalizeZoneName(zoneName: string): string {
  return zoneName
    .toLowerCase()
    .replace(/\b(vic|victoria)\b/gi, '')
    .replace(/\b(zone|metropolitan|metro|region|area)\b/gi, '')
    .replace(/[\/\-\s]+/g, ' ')
    .replace(/\b(north|northern)\b/gi, 'north')
    // ... additional normalization rules
    .trim();
}
```

## Club Mapping System

### Club Name Resolution
1. **Exact Match**: Direct comparison with database club names
2. **Static Mapping**: Check against predefined club abbreviations
3. **Partial Match**: Substring matching for club name variations
4. **Fuzzy Matching**: Similarity scoring with 0.5 threshold

### Common Club Mappings
```typescript
export const CLUB_NAME_MAPPINGS: Record<string, string> = {
  'MPHC': 'Mornington Peninsula Pony Club',
  'CPC': 'Chelsea Pony Club',
  'HPC': 'Hastings Pony Club',
  'LPC': 'Langwarrin Pony Club'
  // ... additional mappings
};
```

## Import Workflow

### Data Processing Flow
1. **File Upload**: User selects CSV or Excel file
2. **Column Detection**: System detects available columns including optional role
3. **Data Parsing**: Spreadsheet parser extracts data with optional role handling
4. **Validation**: Zod schema validates data with optional role field
5. **Mapping**: Zone and club names mapped to database entities
6. **Processing**: Users created or updated with conditional role assignment
7. **Results**: Comprehensive feedback on import success/failures

### Error Handling
- **Missing Role Column**: Import continues without role assignment
- **Invalid Zone Names**: Falls back to default zone with logging
- **Missing Club Names**: Sets club fields to null/undefined
- **Validation Errors**: Reports specific field validation issues
- **Database Errors**: Graceful error handling with user feedback

## Configuration

### Environment Variables
```bash
# Firebase configuration for database access
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Database Collections
- **zones**: Zone data with id, name, and geographic information
- **clubs**: Club data with id, name, and location details
- **users**: User data with optional role field

## Usage Examples

### Basic Import (with role column)
```csv
firstName,lastName,email,zoneName,clubName,role
John,Doe,john@example.com,Southern Metropolitan,Monbulk Pony Club,admin
Jane,Smith,jane@example.com,Northern Zone,Chelsea Pony Club,standard
```

### Import without role column
```csv
firstName,lastName,email,zoneName,clubName
John,Doe,john@example.com,Southern Metropolitan,Monbulk Pony Club
Jane,Smith,jane@example.com,Northern Zone,Chelsea Pony Club
```

### Zone Name Variations (all map to same zone)
- "VIC/Southern Metropolitan"
- "Southern Metropolitan Zone"
- "South Metro"
- "Southern Metropolitan"

## API Reference

### Key Functions

#### `mapZoneName(inputZone: string)`
Maps zone name from spreadsheet format to system format.
- **Returns**: `{ zoneId: string; zoneName: string; state: string }`
- **Fallback**: Returns default zone if no match found

#### `mapClubName(inputClub: string)`
Maps club name from spreadsheet format to system format.
- **Returns**: `{ clubId: string; clubName: string } | null`
- **Fallback**: Returns null if no match found

#### `mapImportData(inputData)`
Comprehensive mapping for both zone and club data.
- **Returns**: Complete mapping object with zone and optional club data

## Troubleshooting

### Common Issues
1. **"No zones available in database"**: Check Firebase connection and zones collection
2. **"No zone mapping found"**: Verify zone name format or add to static mappings
3. **"Role column not found"**: Normal behavior - import continues without role data
4. **Club mapping returns null**: Expected when club name doesn't match database

### Debug Logging
Enable comprehensive logging by checking console output:
```typescript
console.log(`[ZoneMapping] Starting mapZoneName with input: "${inputZone}"`);
console.log(`[ClubMapping] Input club: "${inputClub}"`);
```

## Future Enhancements

### Planned Features
- **Web Interface**: Admin UI for managing zone and club mappings
- **Import History**: Track and review previous import operations
- **Bulk Role Assignment**: Tools for updating user roles in bulk
- **Custom Mapping Rules**: User-defined mapping rules for organizations
- **Import Templates**: Predefined templates for common import formats

### Performance Optimizations
- **Enhanced Caching**: Redis caching for large datasets
- **Batch Processing**: Chunked processing for large imports
- **Background Jobs**: Async processing for large file imports
- **Progress Tracking**: Real-time progress updates for long operations

## Contributing

### Adding New Zone Mappings
1. Update `ZONE_MAPPINGS` in `import-mappings.ts`
2. Add pattern variations and aliases
3. Test with sample data
4. Update documentation

### Adding Club Mappings
1. Update `CLUB_NAME_MAPPINGS` in `import-mappings.ts`
2. Include common abbreviations and variations
3. Verify against database club names
4. Test fuzzy matching accuracy

---

*Last Updated: September 12, 2025*
*Version: 1.0.0*
