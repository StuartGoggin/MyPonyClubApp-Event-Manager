# **App Name**: PonyClub Events

## Latest Enhancements (September 12, 2025):

### Advanced User Management System:
- **Optional Role Import Framework**: Revolutionary user import system with flexible role handling
- **Role Database Architecture**: User roles stored as separate database column for enhanced flexibility
- **Import Adaptability**: System works seamlessly whether spreadsheets contain role data or not
- **Data Update Capability**: Existing user records update with new values during import process
- **Graceful Role Handling**: When role column missing, import continues without role assignment
- **Intelligent Mapping System**: Comprehensive zone and club name resolution with fuzzy matching
- **Database Integration**: Real-time zone and club lookup with sophisticated caching mechanisms
- **Pattern Recognition**: Advanced similarity scoring and text normalization algorithms
- **TypeScript Pipeline**: Full type safety throughout import validation and processing

## Previous Enhancements (September 3, 2025):

### PDF Calendar Generation System:
- **Professional PDF Calendars**: High-quality calendar generation with modern design principles
- **Compact Layout Design**: Efficiently uses half-page space while maintaining readability
- **Enhanced Event Display**: Shows up to 25 characters for single events, 20 for multiple events
- **Multi-Event Support**: Displays up to 4 individual events before using rollup counts
- **Modern Visual Styling**: Best-of-breed calendar design with gradients, shadows, and professional typography
- **Real-Time Data Integration**: Live event data from Firestore database with club and event type information
- **Optimized File Size**: Efficient 11KB PDF generation using jsPDF library
- **Smart Text Management**: Proper ellipsis truncation and intelligent font sizing (5pt)

## Calendar UI Improvements (September 2, 2025):

- **Weekend Highlighting**: Saturday and Sunday cells now have a uniform, darker blue background for clear visual distinction.
- **Event Box Styling**: Events are displayed in individual boxes with rounded corners, shadow, and border for a modern look.
- **Event Spacing**: Multiple events on the same day are spaced apart for clarity and readability.
- **Event Summary Dialog**: Clicking an event opens a modal with full event details, including description, club, date, and status.

## Core Features (Updated September 3, 2025):

### Event Management System:
- **Calendar Dashboard**: Professional calendar view with proposed and approved events, clear approval status highlighting
- **Event Request Submission**: Comprehensive form for pony clubs to submit event requests with full validation
- **Event Approval Workflow**: Zone administrator approval/rejection system with status tracking
- **Advanced Club Manager**: Sophisticated dual-panel interface with professional status displays and file management
- **Event Filtering**: Smart filtering system for All Events, Upcoming Events, and Past Events with dynamic counts
- **Event Details Integration**: Event dates prominently displayed in titles with ordinal formatting (12th Dec 2026)

### Document Management:
- **Firebase Storage Integration**: Cloud-based document storage for event schedules and files
- **Multi-Format Support**: Upload and manage PDF, DOCX, TXT, and other document formats
- **Schedule Management**: Dedicated schedule panels with upload, download, and approval workflows
- **Public URL Generation**: Secure document sharing with accessible download links

### AI-Powered Features:
- **Date Conflict Detection**: Generative AI suggestions for alternative dates based on geographical proximity
- **Intelligent Scheduling**: AI-powered recommendations within 100km radius of proposed events
- **Smart Event Analysis**: Conflict resolution and optimal scheduling suggestions

### Administrative Features:
- **Event Type Management**: Admin-controlled event type definitions with pick-list population
- **Zone Management**: Victoria zone administration with geographic boundaries and club assignments
- **Club Geolocation**: Google Maps integration for precise club positioning and proximity calculations
- **API Management Dashboard**: 25+ endpoint registry with real-time enable/disable controls

### Embeddable System:
- **Calendar Embeds**: Full and compact calendar views for external websites
- **Event Request Form Embed**: Complete submission forms for external site integration
- **Google Sites Ready**: Optimized iframe embedding for various platforms
- **Multi-Format Export**: JSON and iCal endpoints for external integrations

### Import & Processing:
- **Advanced User Import System**: Revolutionary user data import with optional role handling
  - **Flexible Role Support**: User roles stored as separate database column (not using Membership)
  - **Optional Column Handling**: Import works whether spreadsheets contain role data or not
  - **Data Update Capability**: Existing user records update with new values during import
  - **Graceful Fallback**: When role column missing, import continues without role assignment
  - **Default Role Assignment**: New users without role data get 'standard' role automatically
- **Comprehensive Mapping Engine**: Advanced zone and club name resolution system
  - **Zone Mapping Library**: Static mappings for all Victorian zones with pattern variations
  - **Club Name Resolution**: Fuzzy matching and normalization for club name variations
  - **Database Integration**: Real-time zone and club lookup with sophisticated caching
  - **Pattern Recognition**: Advanced similarity scoring (Jaccard) and text normalization
  - **Import Mappings**: Complete mapping system in `src/lib/import-mappings.ts`
- **Robust Import Pipeline**: Complete user data processing system
  - **Multi-Format Support**: CSV and Excel file import with optional column detection
  - **Schema Validation**: Zod-based validation with optional field support throughout
  - **Error Resilience**: Graceful handling of missing or invalid data at all levels
  - **TypeScript Integration**: Full type safety with optional fields in UserImportRow
  - **Comprehensive Logging**: Debug logging for mapping, validation, and processing
- **Advanced Calendar Import**: Multi-format support (CSV, Excel, PDF, DOCX, text files)
- **Smart Date Parsing**: Intelligent recognition of Pony Club date formats
- **Batch Processing**: Professional 4-step import workflow with review and rollback
- **Club Matching**: Intelligent name matching with suggestions and validation

## Design System (Modern Glass Morphism):

### Color Palette:
- **Primary Colors**: Deep teal and emerald gradients (#46B1A8 to emerald variations)
- **Background System**: Sophisticated gradient backgrounds from slate to blue tones
- **Accent Colors**: Coral (#FF8A65) for highlights, with blue and green accent variations
- **Panel System**: Dark slate backgrounds (bg-slate-200/80) with white content frames (bg-white/90)

### Typography:
- **Body Font**: 'PT Sans' humanist sans-serif for modern, readable text
- **Gradient Typography**: Beautiful gradient text effects for headers and important elements
- **Enhanced Hierarchy**: Font-extrabold section headers with improved spacing
- **Responsive Text**: Optimized text sizing across all device breakpoints

### Visual Effects:
- **Glass Morphism**: Translucent cards with backdrop blur effects throughout the interface
- **Gradient System**: Sophisticated gradient overlays and background treatments
- **Icon Integration**: Color-coded circular icon containers with consistent theming
- **Shadow Effects**: Subtle shadow systems for depth and visual hierarchy
- **Smooth Transitions**: Professional hover effects and state changes

### Layout Philosophy:
- **Compact Efficiency**: Space-efficient designs optimized for information density
- **Clean Architecture**: Spacious layouts ensuring easy readability and navigation
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
- **Professional Polish**: Enhanced spacing systems (12px headers, 6px details) for optimal balance

### Interactive Elements:
- **10-Type Button System**: Comprehensive button styling with teal/emerald gradients
- **Glass Effect Containers**: Translucent panels with professional backdrop blur
- **Smart Filter System**: Professional filter interface with dynamic count badges
- **Status Indicators**: Color-coded badges and icons for immediate status recognition
- **Hover Animations**: Scale transforms and shadow changes for interactive feedback