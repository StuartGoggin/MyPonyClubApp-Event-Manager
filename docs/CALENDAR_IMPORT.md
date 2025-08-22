# Calendar Import System Documentation

## Overview
The Calendar Import System allows administrators to upload calendar documents and automatically create events in the Pony Club Event Manager. The system supports CSV, Excel, and text file formats with intelligent club matching and batch management.

## Features

### 1. Multi-Format File Support
- **CSV Files**: Comma-separated values with customizable column mapping
- **Excel Files**: .xlsx and .xls formats with automatic data extraction
- **Text Files**: Plain text with intelligent parsing

### 2. Intelligent Club Matching
- **Fuzzy Search**: Matches club names even with slight variations
- **Confidence Scoring**: Shows match confidence percentage
- **Manual Override**: Edit and correct club matches before import

### 3. Event Processing
- **Multi-day Events**: Automatically splits events spanning multiple days
- **Validation**: Checks for required fields and data integrity
- **Duplicate Detection**: Identifies potential duplicate events

### 4. Batch Management
- **Rollback Support**: Complete rollback of imported batches
- **Progress Tracking**: Real-time import progress with detailed statistics
- **Error Handling**: Comprehensive error reporting and recovery

## How to Use

### Step 1: Upload Calendar Document
1. Navigate to Admin → Import Calendar
2. Click "Choose File" or drag and drop your calendar document
3. Supported formats: .csv, .xlsx, .xls, .txt, .doc, .docx
4. Wait for file processing and preview

### Step 2: Review and Edit
1. Review the parsed events in the summary table
2. Check club matching accuracy (green = matched, red = unmatched)
3. Edit individual events using the edit button
4. Delete unwanted events using the delete button
5. Ensure all clubs are matched before proceeding

### Step 3: Execute Import
1. Click "Execute Import" when satisfied with the review
2. Monitor import progress in real-time
3. View success confirmation with import statistics

### Step 4: Manage Results
1. View imported events in the Events section
2. Use "Rollback Import" if needed to undo the entire batch
3. Start new import with "Import Another Calendar"

## File Format Guidelines

### CSV Format
```csv
Event Name,Start Date,End Date,Club Name,Location,Event Type,Coordinator
Spring Rally,2025-03-15,2025-03-15,Melbourne Pony Club,Melbourne Showgrounds,Rally,Jane Smith
```

### Excel Format
- Use clear column headers in the first row
- Date formats: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY
- Keep club names consistent with registered clubs

### Text Format
The system can parse various text formats with intelligent detection of:
- Event names and dates
- Club references
- Location information
- Event types

## Club Matching System

### Automatic Matching
The system uses fuzzy string matching to automatically identify clubs:
- **Exact Match**: 100% confidence for perfect matches
- **Partial Match**: 60-90% confidence for close matches
- **Word Match**: 30-60% confidence for keyword matches

### Manual Correction
For unmatched or low-confidence matches:
1. Click the edit button for the event
2. Select the correct club from the dropdown
3. Update other event details as needed
4. Save changes

## Batch Management

### Import Tracking
Each import creates a batch with:
- Unique batch ID for tracking
- Creation timestamp
- File information
- Event count and status
- Import results

### Rollback System
Complete rollback capability:
- Deletes all events from the batch
- Maintains audit trail
- Cannot be undone once executed
- Updates batch status to "rolled_back"

## API Endpoints

### Import Batches API
- `POST /api/admin/import-batches` - Create, update, execute, or rollback batches
- `GET /api/admin/import-batches` - Retrieve batch information

### Batch Operations
- **create**: Create new import batch
- **update**: Update batch data
- **execute**: Import events to database
- **rollback**: Delete imported events

## Security Considerations

### File Validation
- File size limits (configurable)
- File type validation
- Content sanitization
- Malware scanning (recommended)

### Access Control
- Admin-only access required
- Audit logging of all operations
- Batch tracking for accountability

## Troubleshooting

### Common Issues

#### File Upload Failures
- Check file size (must be under limit)
- Verify file format is supported
- Ensure file is not corrupted

#### Club Matching Problems
- Verify club names in uploaded file
- Check for spelling variations
- Use manual matching for special cases

#### Import Failures
- Check for validation errors in review step
- Ensure all required fields are present
- Verify date formats are correct

### Error Recovery
- Use rollback for failed imports
- Check browser console for detailed errors
- Contact system administrator for database issues

## Best Practices

### File Preparation
1. Use consistent club name spelling
2. Standardize date formats
3. Include all required event information
4. Remove duplicate entries before upload

### Review Process
1. Always review parsed data carefully
2. Verify club matches before importing
3. Check event dates and details
4. Test with small files first

### After Import
1. Verify events appear correctly in the system
2. Check for any missing information
3. Update event details if needed
4. Keep original files for reference

## Future Enhancements

### Planned Features
- Advanced column mapping interface
- Integration with external calendar systems
- Automated duplicate detection
- Enhanced club matching algorithms
- Email notifications for import completion
- Scheduled imports for recurring calendars

### Integration Possibilities
- Google Calendar sync
- Outlook calendar import
- Federation calendar feeds
- Zone-specific imports
- Event template system

---

For technical support or feature requests, please contact the system administrator.
