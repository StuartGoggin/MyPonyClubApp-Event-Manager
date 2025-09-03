# PDF Calendar Generation System

## Overview
The PDF Calendar Generation System provides professional, compact calendar layouts with enhanced event display capabilities. The system generates high-quality PDF calendars optimized for printing and digital distribution.

## Features

### 📊 Compact Design
- **Half-Page Layout**: Efficiently uses approximately 50% of page space
- **Cell Dimensions**: 15px height with 10px day headers for optimal compression
- **Professional Spacing**: Minimal padding with maximum content visibility
- **Modern Typography**: 5pt font for event text, 8pt for day numbers, 7pt for headers

### 📝 Enhanced Event Display
- **Extended Text Display**: 
  - Single events: Up to 25 characters
  - Multiple events: Up to 20 characters each
- **Multi-Event Support**: Displays up to 4 individual events before rollup
- **Smart Truncation**: Proper ellipsis (…) character for clean appearance
- **Event Positioning**: Day numbers positioned high in cells for maximum event space

### 🎨 Visual Design
- **Modern Color Palette**: 
  - Primary: RGB(59, 130, 246) - Professional blue
  - Primary Light: RGB(147, 197, 253) - Subtle highlights
  - Dark Medium: RGB(75, 85, 99) - Professional text
  - Border: RGB(209, 213, 219) - Clean separators
  - Shadow: RGB(156, 163, 175) - Subtle depth
- **Professional Styling**:
  - Rounded corners (1-2px radius)
  - Subtle shadow effects
  - Weekend highlighting with light gray backgrounds
  - Event day highlighting with blue tints

### 🔧 Technical Implementation
- **Library**: jsPDF for reliable PDF generation
- **File Size**: Optimized ~11KB output
- **Data Integration**: Real-time Firestore event data
- **API Endpoint**: `/api/calendar/pdf?month=X&year=Y`
- **Error Handling**: Comprehensive validation and fallback systems

## API Usage

### Generate Calendar PDF
```typescript
GET /api/calendar/pdf?month=1&year=2025
```

**Parameters:**
- `month`: Integer (1-12) representing the month
- `year`: Integer representing the year

**Response:** Binary PDF file with appropriate headers

## Calendar Layout Specifications

### Grid Structure
- **7-day week layout**: Sunday through Saturday
- **6-week display**: Accommodates all possible month layouts
- **Header row**: Abbreviated day names (SUN, MON, TUE, etc.)
- **Cell borders**: Subtle 0.2-0.6px borders with rounded corners

### Event Display Logic
1. **1 Event**: Full event name (up to 25 characters)
2. **2-4 Events**: Individual event names (up to 20 characters each)
3. **5+ Events**: Rollup count display ("X events")

### Typography Hierarchy
- **Title**: 22pt Helvetica Bold (white text on colored background)
- **Day Headers**: 7pt Helvetica Bold
- **Day Numbers**: 8pt Helvetica (bold for event days)
- **Event Text**: 5pt Helvetica for maximum content

## Integration Points

### Data Sources
- **Events**: Fetched from Firestore `events` collection
- **Clubs**: Enhanced with club information from `clubs` collection
- **Event Types**: Enriched with type data from `eventTypes` collection

### Frontend Integration
```typescript
// Generate calendar PDF
const response = await fetch(`/api/calendar/pdf?month=${month}&year=${year}`);
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url); // Open in new tab
```

### File Download
```typescript
// Download calendar PDF
const link = document.createElement('a');
link.href = url;
link.download = `calendar-${year}-${month}.pdf`;
link.click();
```

## Performance Characteristics

### File Size Optimization
- **Target Size**: ~11KB for typical month
- **Compression**: Efficient jsPDF rendering
- **Load Time**: Sub-second generation for most months

### Scalability
- **Event Volume**: Handles 100+ events per month efficiently
- **Rendering Time**: <2 seconds for complex months
- **Memory Usage**: Minimal footprint with garbage collection

## Future Enhancements

### Planned Features
- **Multi-month view**: Quarterly and yearly calendar options
- **Custom themes**: Color scheme customization
- **Export formats**: Additional formats (PNG, SVG)
- **Print optimization**: Enhanced print-specific layouts

### Enhancement Opportunities
- **Event categories**: Color-coded event types
- **Club filtering**: Generate club-specific calendars
- **Approval status**: Visual indicators for event approval states
- **Interactive elements**: Clickable PDF elements (if supported)

## Error Handling

### Common Issues
- **Invalid dates**: Graceful fallback to current month/year
- **Missing events**: Empty calendar generation
- **Database errors**: Cached fallback data
- **Font loading**: Embedded font fallbacks

### Debugging
- **Console logging**: Detailed generation steps
- **Error boundaries**: Comprehensive error catching
- **Validation**: Input parameter validation
- **Monitoring**: Performance metrics tracking

## Maintenance

### Regular Updates
- **Event data refresh**: Real-time database synchronization
- **Style updates**: CSS-like color and layout updates
- **Performance monitoring**: File size and generation time tracking
- **Browser compatibility**: Cross-browser PDF rendering testing

### Version Control
- **Calendar templates**: Versioned layout designs
- **API compatibility**: Backward-compatible parameter handling
- **Database schema**: Event data structure evolution support
