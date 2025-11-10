# Zone Calendar PDF Format Update

## Overview

The zone calendar PDF format has been updated to match the format specified in the Word document template "2025 calendar with State and Zone.docx". This format provides a professional, color-coded calendar layout specifically designed for Pony Club Zone events.

## New Format Features

### 1. Portrait Orientation
- Changed from landscape to portrait to match the reference document
- Better readability and printing compatibility

### 2. SMZ Event Calendar Header
- Professional title: "SMZ EVENT CALENDAR [YEAR]" 
- Centered and properly formatted

### 3. Welcome Message & Description
- Professional welcome message addressing "Clubs, Riders and Families"
- Comprehensive explanation of the SMZ qualifier series and points system
- Information about event dates (1st January to 17th December)
- Instructions for finding updated information and booking events
- Encouragement for club participation and state-level progression

### 3. Color-Coded Legend
- **State Council** (`#EAEBDE`) - STATE Council meetings (1st Tuesday per month, 2nd Tuesday in November)
- **SMZ Meeting** (`#AAC7AC`) - SMZ Meeting dates
- **State Event** (`#FDF699`) - State-level events
- **Zone Competition** (White) - Zone competitions (non-qualifier)
- **STATE SMZ Qualifier** (`#EDF4F7`) - State SMZ qualifier events
- **STATE Club Event** (Yellow) - State club events
- **Freshman's, Clinic or Camp** (`#92D050`) - Training and development events
- **Certificate Assessment** (`#FFC000`) - Assessment and training days
- **School Holidays** (`#ACEFFC`) - School holiday periods

### 4. Enhanced Calendar Table
- **Optimized 4 columns**: **Date** (45mm), **SMZ Qualifier** (22mm), **Club** (40mm), **Event** (73mm)
- **Professional header styling** with light gray background and bold text
- **Dynamic row heights** that adapt to content length
- **Improved text alignment** with proper vertical centering
- **Enhanced borders** with consistent line weights (0.8pt headers, 0.3pt cells)
- **Color-coded rows** based on event type with proper opacity
- **Date format** with ordinal suffixes (1st, 2nd, 3rd, etc.)
- **SMZ Qualifier indicators** with centered checkmarks (✓) for qualifying events
- **Smart text wrapping** for long club names and event descriptions
- **Better spacing** with 3pt padding and improved line heights

### 5. School Holiday Integration
- Special rows for school holiday periods
- Light blue background matching the legend
- Spans full table width for clear visibility

## API Usage

### Endpoint
```
GET /api/calendar/pdf?format=zone&[other-parameters]
```

### Parameters
- `format=zone` - Enables the new zone calendar format
- `scope` - `month`, `year`, or `custom`
- `year` - Calendar year
- `month` - Specific month (if scope=month)
- `startDate` / `endDate` - Custom date range (if scope=custom)
- `filterScope` - `all`, `zone`, or `club`
- `zoneId` - Specific zone ID (if filterScope=zone)
- `clubId` - Specific club ID (if filterScope=club)

### Example URLs
```
# Current month zone format
/api/calendar/pdf?format=zone&scope=month&year=2026&month=1

# Full year zone format  
/api/calendar/pdf?format=zone&scope=year&year=2026

# Zone-specific calendar
/api/calendar/pdf?format=zone&filterScope=zone&zoneId=smz-zone-1&year=2026
```

## Event Type Detection

The system automatically determines event colors based on:
- Event name keywords (e.g., "state council", "qualifier", "freshman")
- Event type classification
- Custom event metadata

Events are intelligently categorized and color-coded to match the legend.

## Technical Implementation

### Files Updated
- `src/lib/calendar-pdf-zone.ts` - New zone format generator
- `src/app/api/calendar/pdf/route.ts` - API route integration
- Color mapping matches HTML reference exactly
- Professional typography and spacing

### Color Codes
All colors precisely match the reference document's HTML color values:
- `#EAEBDE` - State Council meetings  
- `#AAC7AC` - SMZ meetings
- `#FDF699` - State events
- `#EDF4F7` - SMZ qualifiers
- `#92D050` - Freshman's events
- `#FFC000` - Certificate assessments
- `#ACEFFC` - School holidays

## Benefits

1. **Professional Appearance** - Matches official Pony Club formatting standards
2. **Color Coding** - Easy visual identification of event types
3. **Comprehensive Legend** - Clear explanation of all color meanings
4. **Portrait Format** - Better for printing and mobile viewing
5. **School Holiday Integration** - Important date awareness
6. **Zone Focus** - Optimized for zone-level calendar management

## Migration

The zone format is backward compatible:
- Standard format still available with `format=standard` or no format parameter
- Zone format activated with `format=zone` parameter
- All existing API parameters continue to work
- Automatic event type detection ensures proper color coding

This update provides the exact format requested from the Word document template while maintaining all existing functionality.