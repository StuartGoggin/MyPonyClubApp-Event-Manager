# Testing Infrastructure Documentation

## Overview
The Testing section in the Admin Dashboard provides comprehensive tools for data backup, migration, and system testing. This documentation covers the Event Export Tool, Event Import Tool, Test Data Generator, and related testing infrastructure.

## Event Export Tool

### Purpose
The Event Export Tool creates complete, self-contained ZIP archives containing all event data, schedule files, and metadata for backup, migration, or analysis purposes.

### Features

#### 🎯 Complete Data Export
- **All Event Definitions**: Complete event records from Firestore database
- **Associated Metadata**: Clubs, zones, event types, and coordinator information
- **Real Schedule Files**: Actual PDF/document files downloaded from Firebase Storage
- **Dependency Information**: All required data for complete restoration

#### 🔍 Advanced Filtering
- **Event Type Selection**: Filter by Rally, ODE, Show Jumping, Dressage, Cross Country
- **Date Range Filtering**: Optional start and end date constraints
- **Selective Inclusion**: Toggle schedules, metadata, and integrity manifests

#### 📦 ZIP Archive Features
- **Configurable Compression**: Low (fast), Medium (balanced), High (smaller file)
- **Descriptive Filenames**: Timestamp-based naming (e.g., `events-export-2025-09-05T12-34-56.zip`)
- **Organized Structure**: Logical folder organization with clear hierarchy

#### ✅ Integrity & Verification
- **SHA-256 Checksums**: File integrity verification with manifest.json
- **Version Metadata**: Compatibility tracking and export information
- **README Documentation**: Complete export details and re-import instructions

#### 📊 Progress Feedback
- **Real-time Updates**: Multi-stage progress with percentage completion
- **Detailed Logging**: Timestamped log entries for each operation
- **Error Handling**: Graceful failure handling with detailed error messages

### Technical Implementation

#### Backend API (`/api/admin/export`)
```typescript
interface ExportConfig {
  eventTypes?: string[];           // Filter by event types
  dateRange?: {
    start?: string;               // ISO date string
    end?: string;                 // ISO date string
  };
  includeSchedules?: boolean;     // Download actual schedule files
  includeMetadata?: boolean;      // Include dependency data
  includeManifest?: boolean;      // Generate integrity manifest
  compressionLevel?: 'low' | 'medium' | 'high';
}
```

#### File Structure
```
events-export-2025-09-05T12-34-56.zip
├── events.json                 # Event definitions
├── clubs.json                  # Club information
├── zones.json                  # Zone definitions
├── event-types.json            # Event type configurations
├── export-info.json           # Export metadata
├── README.md                   # Documentation
├── manifest.json              # File integrity checksums
└── schedules/                 # Schedule files
    ├── event123-Spring_Rally.pdf
    ├── event456-Summer_Competition.pdf
    └── event789-schedule-error.txt
```

#### Schedule File Handling
- **Real File Downloads**: Fetches actual PDFs from Firebase Storage URLs
- **Timeout Protection**: 30-second timeout per file with AbortController
- **Error Files**: Creates descriptive error files for failed downloads
- **Filename Sanitization**: Safe filenames: `{eventId}-{eventName}.{extension}`

### User Interface

#### Configuration Panel
- **Event Type Checkboxes**: Multi-select event type filtering
- **Date Range Inputs**: Optional start/end date selection
- **Export Options**: Toggles for schedules, metadata, and manifest
- **Compression Selection**: Dropdown for compression level

#### Progress Panel
- **Progress Bar**: Real-time percentage with visual progress indicator
- **Stage Indicators**: Current operation (Fetching, Downloading, Compressing)
- **Log Output**: Scrollable log with timestamped entries
- **Status Messages**: Descriptive text for current operation

#### Results Handling
- **Success State**: File details, size, and event count
- **Auto-Download**: Automatic download trigger on completion
- **Manual Download**: "Download Archive" button for re-downloading
- **Error State**: Detailed error messages with retry option

### Error Handling

#### Network Issues
- **Connection Timeouts**: 30-second timeout per file download
- **HTTP Errors**: Proper handling of 404, 403, 500 responses
- **Network Failures**: Graceful degradation with error documentation

#### File System Issues
- **Storage Failures**: Handles Firebase Storage access errors
- **Memory Management**: Proper cleanup of blob URLs
- **ZIP Generation**: Error handling during archive creation

#### User Experience
- **Progress Preservation**: Maintains progress through errors
- **Detailed Logging**: Error details in log output
- **Retry Mechanisms**: Clear retry options for failed exports

### Security Considerations

#### Access Control
- **Admin-Only Access**: Testing section restricted to admin users
- **API Authentication**: Server-side validation of admin permissions
- **Rate Limiting**: Prevents abuse of export functionality

#### Data Protection
- **No Sensitive Data**: Exports contain only event-related information
- **Temporary URLs**: Download URLs automatically cleaned up
- **Client-Side Processing**: ZIP generation in browser for security

### Performance Optimization

#### Parallel Processing
- **Concurrent Data Fetching**: Parallel database queries
- **Batch File Downloads**: Efficient schedule file retrieval
- **Streaming Compression**: Memory-efficient ZIP creation

#### Memory Management
- **Blob URL Cleanup**: Automatic cleanup to prevent memory leaks
- **Progress Updates**: Efficient state updates without blocking
- **Error Recovery**: Continues processing despite individual file failures

### Future Enhancements

#### Planned Features
- **Selective Event Export**: Individual event selection interface
- **Scheduled Exports**: Automated backup scheduling
- **Cloud Storage Integration**: Direct export to cloud storage services

#### API Extensions
- **Webhook Integration**: Export completion notifications
- **Batch Processing**: Large dataset handling improvements
- **Format Options**: Additional export formats (JSON, CSV, Excel)
- **Incremental Exports**: Delta exports since last backup

## Event Import Tool

### Purpose
The Event Import Tool provides comprehensive data restoration capabilities from exported ZIP archives, enabling complete backup recovery, data migration, and testing scenarios with advanced conflict detection and resolution.

### Features

#### 📂 Archive Processing
- **ZIP File Validation**: Complete archive structure and content verification
- **Manifest Verification**: SHA-256 checksum validation for file integrity
- **Version Compatibility**: Automatic compatibility checking with current system
- **Dependency Analysis**: Missing club/zone/event-type detection

#### 🔍 Conflict Detection
- **Duplicate ID Detection**: Identifies events with matching IDs but different data
- **Name Conflicts**: Finds events with same names but different dates/details
- **Date Conflicts**: Detects scheduling conflicts with existing events
- **Missing Dependencies**: Reports missing clubs, zones, or event types

#### ⚡ Resolution Options
- **Skip Import**: Ignore conflicting events during import
- **Overwrite Existing**: Replace existing data with imported version
- **Rename Import**: Auto-rename imported events to avoid conflicts
- **Selective Resolution**: Configure resolution per conflict type

#### 🛡️ Safety Features
- **Dry Run Mode**: Simulate imports without making any database changes
- **Progress Monitoring**: Real-time progress with detailed logging
- **Rollback Information**: Complete operation tracking for potential rollbacks
- **Validation Checks**: Pre-import validation of all data integrity

#### 📊 Import Configuration
- **Event Type Filtering**: Import only specific event types
- **Date Range Limiting**: Restrict imports to specific date ranges
- **Schedule File Control**: Option to skip schedule file uploads
- **Manifest Validation**: Toggle integrity verification requirements

### Technical Implementation

#### Backend API (`/api/admin/import`)
```typescript
interface ImportConfig {
  eventTypes: string[];           // Filter imported event types
  dateRange: {
    start: string;               // Earliest event date to import
    end: string;                 // Latest event date to import
  };
  dryRun: boolean;              // Simulate without database changes
  validateManifest: boolean;     // Verify file integrity
  allowDuplicates: boolean;      // Allow duplicate event imports
  skipSchedules: boolean;        // Skip schedule file uploads
}

interface ConflictItem {
  id: string;                   // Unique conflict identifier
  type: 'duplicate_id' | 'duplicate_name' | 'date_conflict' | 'club_missing' | 'type_missing';
  severity: 'high' | 'medium' | 'low';
  existing: any;                // Current database record
  imported: any;                // Incoming import record
  resolution: 'skip' | 'overwrite' | 'rename' | 'merge' | null;
  message: string;              // Human-readable conflict description
}

interface ImportResult {
  success: boolean;             // Overall import success status
  imported: number;             // Count of successfully imported events
  skipped: number;              // Count of skipped events
  errors: string[];             // List of error messages
  conflicts: ConflictItem[];    // Resolved conflict details
  schedulesUploaded: number;    // Count of uploaded schedule files
}
```

#### Archive Structure Validation
```
expected-structure/
├── events.json              (Required: All event definitions)
├── clubs.json               (Required: Club data with coordinates)
├── zones.json               (Required: Zone definitions)
├── event-types.json         (Required: Event type configurations)
├── manifest.json            (Optional: Integrity verification)
├── README.md               (Optional: Export documentation)
└── schedules/              (Optional: PDF schedule files)
    ├── event-123.pdf
    ├── event-456.pdf
    └── ...
```

#### Conflict Resolution Process
1. **Archive Analysis**: Parse ZIP contents and validate structure
2. **Data Extraction**: Read JSON files and validate format
3. **Conflict Detection**: Compare imported data with existing database
4. **User Resolution**: Present conflicts with resolution options
5. **Import Execution**: Apply resolved conflicts and import data
6. **Schedule Upload**: Transfer PDF files to Firebase Storage
7. **Completion Report**: Provide detailed import summary

### User Interface

#### Import Workflow
1. **File Selection**: Drag-and-drop or browse for ZIP archive
2. **Analysis Phase**: Automatic archive validation and conflict detection
3. **Configuration**: Set import options and filters
4. **Conflict Resolution**: Review and resolve detected conflicts
5. **Import Execution**: Monitor progress and view detailed logs
6. **Results Summary**: Review import statistics and any errors

#### Conflict Resolution UI
- **Visual Conflict Cards**: Color-coded by severity (red=high, yellow=medium, blue=low)
- **Side-by-side Comparison**: Existing vs. imported data comparison
- **One-click Resolution**: Quick resolution buttons for each conflict
- **Bulk Actions**: Apply same resolution to multiple similar conflicts

#### Progress Monitoring
- **Multi-stage Progress**: Archive parsing, validation, import, file upload
- **Detailed Logging**: Timestamped entries for each operation
- **Error Reporting**: Clear error messages with suggested solutions
- **Summary Statistics**: Real-time counts of processed, imported, and skipped items

## Test Data Generator

### Purpose
The Test Data Generator creates realistic synthetic event data in export-compatible ZIP format for testing, development, and demonstration purposes. It generates comprehensive datasets with authentic patterns and relationships.

### Features

#### 🎯 Realistic Data Generation
- **Configurable Time Spans**: Generate data spanning 1-5 years with customizable event density
- **Authentic Patterns**: Seasonal variation with higher activity in spring/summer months
- **Weekend Bias**: Configurable weekend event preference (default 60% weekend events)
- **Event Distribution**: Balanced distribution across multiple event types and venues

#### 📊 Advanced Configuration
- **Volume Control**: 1-20 events per week with seasonal multipliers
- **Zone/Club Filtering**: Generate data for specific zones or clubs
- **Event Type Selection**: Include all or specific event types (Rally, ODE, Show Jumping, etc.)
- **Schedule Coverage**: Configurable percentage of events with schedule files (0-100%)

#### 📋 Approval Status Simulation
- **Realistic Distribution**: Configurable approval ratios (default: 80% approved, 15% proposed, 5% rejected)
- **Status Variety**: Mix of approved, proposed, and rejected events for testing workflows
- **Historical Patterns**: Past events more likely to be approved, future events mixed status

#### 📄 Schedule File Generation
- **Mock PDF Creation**: Realistic PDF schedule files using pdf-lib
- **Professional Layout**: Event details, venue information, and structured timetables
- **Variable Coverage**: Configurable percentage of events with schedules
- **Authentic Content**: Real-looking event schedules with registration times, activities, and contact details

#### 🛡️ Export Compatibility
- **Identical Format**: Generated archives use exact same structure as Export Tool
- **Manifest Generation**: Complete manifest.json with checksums and metadata
- **Version Tagging**: Clear identification as generated test data
- **Import Ready**: Direct compatibility with Import Tool for seamless testing

### Technical Implementation

#### Backend API (`/api/admin/generate-test-data`)
```typescript
interface GenerationConfig {
  years: number;                    // Time span (1-5 years)
  eventsPerWeek: number;           // Average events per week (1-20)
  selectedZones: string[];         // Zone filtering (empty = all)
  selectedClubs: string[];         // Club filtering (empty = all)
  includeSchedules: boolean;       // Generate schedule files
  scheduleProbability: number;     // Percentage with schedules (0-100)
  approvalDistribution: {
    approved: number;              // Percentage approved (0-100)
    pending: number;               // Percentage proposed (0-100)
    rejected: number;              // Percentage rejected (0-100)
  };
  seasonalVariation: boolean;      // Apply seasonal patterns
  weekendBias: boolean;           // Prefer weekend events
  dryRun: boolean;                // Preview mode without file creation
  outputFormat: 'zip' | 'preview'; // Output format selection
}
```

#### Data Generation Algorithms
- **Date Distribution**: Weighted random distribution with seasonal multipliers
- **Weekend Preference**: Configurable bias toward Saturday/Sunday events  
- **Event Naming**: Realistic naming patterns using templates per event type
- **Venue Assignment**: Random club selection with zone relationship validation
- **Coordinator Details**: Generated contact information with realistic patterns

#### PDF Schedule Generation
```typescript
// Mock PDF generation with professional layout
const generateMockPDF = async (event, club, eventType) => {
  // Professional event schedule with:
  // - Event header and details
  // - Venue information and address  
  // - Structured timetable (8:00 AM - 5:00 PM)
  // - Registration and activity periods
  // - Contact information and notes
};
```

#### Archive Structure
```
test-data-YYYY-MM-DD-NNNevents.zip
├── events.json              (Generated event records)
├── clubs.json               (Club definitions with coordinates)
├── zones.json               (Zone definitions)
├── event-types.json         (Event type configurations)
├── manifest.json            (Integrity verification)
├── README.md               (Generation documentation)
└── schedules/              (Mock PDF schedule files)
    ├── test-event-1-Spring-Rally.pdf
    ├── test-event-2-Summer-ODE.pdf
    └── ...
```

### User Interface

#### Generation Workflow
1. **Time Configuration**: Set years and events per week using sliders
2. **Filtering Options**: Select specific zones/clubs or use all available
3. **Realism Settings**: Configure seasonal variation, weekend bias, schedule coverage
4. **Approval Distribution**: Set realistic approval status percentages
5. **Preview/Generate**: Use dry run mode to preview or generate actual files
6. **Progress Monitoring**: Real-time progress with detailed logging
7. **Auto-Download**: Automatic ZIP file download upon completion

#### Configuration Interface
- **Intuitive Sliders**: Visual control for numeric parameters (years, events/week, coverage %)
- **Checkbox Controls**: Enable/disable features (seasonal variation, weekend bias, schedules)
- **Dropdown Selection**: Zone and club filtering with "All" options
- **Approval Sliders**: Visual distribution control for approval status ratios
- **Preview Mode**: Dry run option for safe configuration testing

#### Progress Visualization
- **Multi-stage Progress**: Initialize → Generate Events → Create Schedules → Build Archive
- **Percentage Completion**: Real-time progress bars with detailed stage information
- **Detailed Logging**: Timestamped entries showing generation steps and statistics
- **Error Handling**: Clear error messages with suggested troubleshooting steps

### Usage Examples

#### Quick Test Dataset
```
Configuration:
- Years: 1
- Events per week: 3
- All zones and clubs
- Weekend bias: Enabled
- Schedule coverage: 50%
- Output: ~156 events with realistic distribution
```

#### Comprehensive Development Dataset  
```
Configuration:
- Years: 3
- Events per week: 8  
- Seasonal variation: Enabled
- Weekend bias: Enabled
- Schedule coverage: 80%
- Output: ~1,000+ events with full schedule files
```

#### Zone-Specific Testing
```
Configuration:
- Years: 2
- Events per week: 5
- Selected zones: Western Australia only
- Schedule coverage: 100%
- Output: Zone-focused dataset for regional testing
```

#### Preview Mode Testing
```
Configuration:
- Dry run: Enabled
- Any settings for preview
- Output: Statistics and sample data without file creation
```

---

This documentation provides comprehensive coverage of the Testing infrastructure and Event Export Tool functionality.
