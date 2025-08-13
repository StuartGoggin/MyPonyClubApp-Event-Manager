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

- **Advanced Data Import/Export**: Comprehensive JSON export functionality:
    - **Zones & Clubs Export**: Export complete club database with all nested properties and relationships
    - **Events Export**: Export all events with enriched data including:
        - Related club names, zone names, and event type names
        - Status-based groupings (pending, approved, completed, cancelled)
        - Type-based groupings for easy analysis
        - Comprehensive metadata and summaries
    - **Smart Export**: Descriptive filenames with timestamps for easy identification
    - **Progress Tracking**: Real-time progress indicators during export operations

- **Organized Admin Interface**: Restructured admin panel with grouped functionality:
    - **Database Seeding Section**: Initialize database with comprehensive pony club data
    - **Data Export Section**: Grouped export functions for zones/clubs and events
    - **Database Maintenance Section**: Cleanup and purge operations
    - **Visual Separation**: Clear card-based layout with distinct icons and descriptions

- **Dedicated Club Management**: Focused club administration interface:
    - **CRUD Operations**: Create, read, update, and delete clubs with comprehensive form validation
    - **Safe Delete System**: Multi-layered protection against accidental club deletion:
        - **Confirmation Dialog**: Requires opening a dedicated delete confirmation dialog
        - **Name Verification**: User must type the exact club name to enable deletion
        - **Visual Warnings**: Red styling, warning icons, and clear messaging throughout
        - **Loading Protection**: Prevents multiple submissions during deletion process
        - **Context Display**: Shows club details (name, zone, contact) before deletion
        - **Production Safeguards**: Includes warnings about checking for associated events
    - **Zone-based Organization**: Clubs grouped and displayed by their assigned zones
    - **Real-time Data Loading**: Fetches live data from Firestore with loading states and error handling
    - **Summary Statistics**: Dashboard showing total clubs, clubs with coordinates, and active zones
    - **Rich Club Profiles**: Detailed club information including contact, address, social media, and branding
    - **Separated Concerns**: Import/export functionality moved to dedicated "Manage Data" section

- **Zone Management**: Complete zone administration with CRUD operations and data import/export
- **Event Types Management**: Configurable event types with import/export capabilities
- **Database Seeding**: Automated seeding of configuration data from ClubZoneData.json

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
- **Loading States**: Comprehensive loading indicators and error handling for data fetching
- **Separation of Concerns**: Clear functional boundaries between different admin sections:
    - **Club Management**: Focus on individual club CRUD operations and viewing
    - **Manage Data**: Centralized location for bulk operations (import, export, seeding, maintenance)

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

### Admin Interface Reorganization
- **Renamed Admin Tab**: Changed "Database Seeding" to "Manage Data" for better clarity
- **Grouped Functionality**: Reorganized admin interface into three distinct sections:
    - **Database Seeding**: Initialize database with comprehensive pony club data
    - **Data Export**: Grouped export functions for related data types
    - **Database Maintenance**: Cleanup and purge operations
- **Visual Enhancement**: Card-based layout with distinct icons and descriptions for each section

### Events Export System
- **Comprehensive Events Export**: New export facility for all events with related data:
    - **Enriched Data**: Events include club names, zone names, and event type names
    - **Smart Grouping**: Status-based and type-based groupings for analysis
    - **Metadata Integration**: Comprehensive summaries and relationship mappings
    - **Progress Tracking**: Real-time progress indicators during export operations
- **Dual Export System**: Separate export functions for zones/clubs and events data
- **Descriptive Filenames**: Auto-generated filenames with timestamps and metadata

### Enhanced Server Functions
- **getAllEvents Function**: New server-side function for comprehensive event data retrieval
- **Timestamp Handling**: Proper Firestore timestamp conversion for Date objects
- **Error Handling**: Robust error handling with fallback responses
- **Type Safety**: Full TypeScript integration with Event interface

### User Interface Improvements
- **Responsive Layout**: Better layout that works on different screen sizes
- **Progress Indicators**: Separate progress tracking for different export operations
- **Result Feedback**: Individual success/error messages for each operation
- **Visual Separation**: Clear distinction between different function groups
- **Enhanced Security UX**: Implemented safety-first approach for destructive operations:
    - **Destructive Button Styling**: Delete buttons use red "destructive" variant for clear visual warning
    - **Confirmation Dialogs**: Replace simple browser confirms with rich, informative dialogs
    - **Step-by-step Guidance**: Clear instructions and validation feedback for dangerous operations
    - **Tooltips and Context**: Helpful tooltips and contextual information for all actions

### Club Management Redesign
- **Real-time Data Integration**: Connected to Firestore with live data fetching and loading states
- **Focused User Interface**: Removed import/export functionality to focus on core CRUD operations
- **Enhanced Data Display**: Zone-based organization with comprehensive club information
- **Summary Dashboard**: Real-time statistics showing total clubs, clubs with coordinates, and active zones
- **Error Handling**: Robust error handling with retry functionality for data loading failures
- **API Integration**: Created dedicated API endpoints (/api/zones, /api/clubs) for data fetching
- **Separation of Concerns**: Moved bulk operations to "Manage Data" section for cleaner interface
- **Safe Delete Implementation**: Multi-step confirmation system to prevent accidental club deletion:
    - **Name Confirmation Required**: Users must type exact club name to enable deletion
    - **Visual Warning System**: Red styling, warning icons, and clear danger messaging
    - **Context Information**: Shows club details and zone assignment before deletion
    - **Production Safeguards**: Includes warnings about checking for associated events
    - **Loading States**: Prevents multiple deletion attempts with proper loading indicators

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
