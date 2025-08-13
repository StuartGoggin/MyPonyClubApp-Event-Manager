# PonyClub Events Blueprint

This document outlines the features and ideas for the PonyClub Events application.

## Implemented Features

### Calendar & Event Management
- **Calendar Weekend Highlighting**: Saturdays and Sundays are visually highlighted in the calendar view to make them more prominent.
- **Calendar Year View**: A "Year" button has been added to the calendar to provide a full year-long overview of events.
- **Content-Aware Year View**: In the year view, calendar columns dynamically resize. Days with events become wider to fit the content, while empty days remain narrow, creating a more readable and compact layout. This behavior is consistent across all weeks of a given month.
- **Responsive Calendar Year View**: The year view is now fully responsive, adjusting the number of columns to fit the screen size for optimal viewing on any device.
- **Dynamic Row Heights**: Calendar rows in both month and year views dynamically adjust their height to fit the number of events they contain, preventing overlap and improving readability.
- **Event Request System**: Complete workflow for clubs to request event dates with approval process.

### Filtering & Search
- **Hierarchical Event Filtering**: Users can filter calendar events based on a hierarchy:
    - All of Victoria
    - Specific Zones
    - Specific Clubs within a Zone
- **Distance-Based Event Filtering**: Users can find events within a specific distance from a selected "home" club. This includes:
    - A toggle to switch between location and distance filtering.
    - Dropdowns to select a home club and a distance radius (e.g., 25km, 50km, 100km).
- **Event Source Filtering**: A set of checkboxes in the sidebar allows users to filter events based on their source:
    - PCA Event Calendar
    - Event Secretary
    - Zone Calendars

### Admin & Data Management
- **Comprehensive Club Management**: Enhanced club administration with detailed information capture:
    - **Physical Address**: Complete address with validation (street, suburb, postcode, state, country)
    - **Contact Information**: Club email with format validation
    - **Web Presence**: Website URL with validation
    - **Social Media Integration**: Facebook, Instagram, Twitter, YouTube links with platform-specific validation
    - **Branding**: Club logo image URL with display and error handling
    - **Geographic Coordinates**: Latitude/longitude for mapping and distance calculations

- **Advanced Data Import/Export**: Comprehensive CSV import/export functionality:
    - **Smart Import**: Preview data before import with duplicate detection
    - **Selective Import**: Choose which new records to import while skipping existing ones
    - **Nested Data Support**: Handle complex data structures (e.g., address.street, socialMedia.facebook)
    - **Data Validation**: Real-time validation during import with error reporting
    - **Export Capabilities**: Export all club data including nested properties

- **Zone Management**: Complete zone administration with CRUD operations and data import/export
- **Event Types Management**: Configurable event types with import/export capabilities
- **Database Seeding**: Automated seeding of configuration data

### User Interface & Experience
- **Tabbed Admin Interface**: Organized data entry with tabs for Basic Info, Address, Contact, and Social & Branding
- **Real-time Validation**: Form validation with immediate feedback and error messages
- **Enhanced Data Display**: Rich club information display with:
    - Logo thumbnails with fallback handling
    - Clickable contact links (email, website)
    - Social media badges with direct links
    - Formatted address display
    - Smart status indicators (Complete/Basic/Minimal)
- **Responsive Design**: Mobile-friendly interface that works across all device sizes
- **Visual Icons**: Intuitive icons for different data types and actions

### AI & Intelligence
- **AI-Powered Date Suggestions**: Using Google's Genkit for intelligent event scheduling:
    - Conflict detection based on geographic proximity
    - Alternative date suggestions
    - Optimized scheduling recommendations

### Technical Infrastructure
- **Firebase Integration**: Complete Firebase Firestore setup for data persistence
- **TypeScript**: Full type safety with comprehensive interfaces
- **Modern UI Components**: Radix UI components with Tailwind CSS styling
- **State Management**: Jotai for efficient client-side state management
- **Form Handling**: React Hook Form with Zod validation
- **Build System**: Next.js 14 with App Router for optimal performance

## Data Validation & Quality

### Address Validation
- Australian postcode validation (4 digits)
- State selection with predefined options
- Formatted address display with proper concatenation

### Contact Validation
- Email format validation with regex patterns
- URL validation for websites and social media
- Platform-specific social media URL validation (Facebook, Instagram, Twitter, YouTube)

### Data Import Validation
- Required field checking
- Duplicate detection and prevention
- Format validation for all data types
- Error reporting with specific field feedback

## Future Ideas

### Enhanced Features
- **Map View Integration**: Interactive map showing club locations and event proximity
- **Advanced Reporting**: Analytics dashboard with club statistics and event trends
- **Notification System**: Automated email notifications for event approvals and updates
- **Mobile App**: Native mobile application for on-the-go event management
- **Calendar Integration**: Sync with external calendar systems (Google Calendar, Outlook)

### Data Enhancements
- **Club Facility Details**: Detailed facility information (arenas, stabling, amenities)
- **Member Management**: Basic member information and enrollment tracking
- **Financial Integration**: Fee tracking and payment processing
- **Document Management**: File upload and storage for club documents

### Technical Improvements
- **Offline Support**: PWA capabilities for offline data access
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Advanced Search**: Full-text search across all club and event data
- **Data Backup**: Automated backup and restore functionality
- **API Integration**: REST API for third-party integrations

## Recent Updates (August 2025)

### Club Management Overhaul
- Completely redesigned club data structure with comprehensive information capture
- Added validation system for all data types with real-time feedback
- Implemented tabbed interface for organized data entry
- Enhanced admin table display with rich information visualization

### Import/Export Enhancement
- Extended CSV import/export to support nested object properties
- Added intelligent import preview with duplicate detection
- Implemented selective import functionality
- Added comprehensive data validation during import process

### User Experience Improvements
- Added visual icons and indicators throughout the interface
- Implemented responsive design patterns for mobile compatibility
- Enhanced error handling and user feedback systems
- Improved data display with clickable links and formatted information
