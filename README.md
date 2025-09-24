# MyPonyClub Event Manager

## 🚀 **Quick Access Links**
- **📧 Admin Email Queue**: [http://localhost:9002/admin/email-queue](http://localhost:9002/admin/email-queue)
- **📝 Submit Event Request**: [http://localhost:9002/request-event](http://localhost:9002/request-event)
- **🔍 System Health Check**: [http://localhost:9002/api/health](http://localhost:9002/api/health)
- **📖 Complete Documentation**: [`SYSTEM_DOCUMENTATION.md`](./SYSTEM_DOCUMENTATION.md)
- **🧪 Testing Guide**: Run `test-simple.ps1` for automated testing

## ✨ Latest Features (September 2025)

### 🔄 **AUTOMATED BACKUP SYSTEM** (September 24, 2025) - **✅ FULLY OPERATIONAL**
- **Comprehensive Database Backup System**: Enterprise-grade automated backup solution
  - **✅ Scheduled Backups**: Firebase Cloud Scheduler integration with flexible timing (daily, weekly, monthly)
  - **✅ Manual Backup Triggers**: On-demand backup execution from admin dashboard
  - **✅ Data Export Integration**: Complete data export including events, clubs, zones, users, and event types
  - **✅ ZIP Archive Creation**: Professional backup files with comprehensive data organization
  - **✅ Email Delivery**: Automatic email notifications with backup attachments
- **Advanced Email Integration**: Seamless integration with existing email queue system
  - **✅ Queue Integration**: Backup emails use existing email management infrastructure
  - **✅ No Approval Required**: Backup emails bypass approval workflow for immediate delivery
  - **✅ High Priority Processing**: Backup emails processed with highest priority
  - **✅ Professional Templates**: Rich HTML emails with backup details and professional branding
  - **✅ Large File Support**: Firebase Storage integration for attachments exceeding Firestore limits
- **Firebase Storage Architecture**: Scalable file storage for large backup attachments
  - **✅ Automatic Upload**: Large backup files (8+ MB) automatically stored in Firebase Storage
  - **✅ URL References**: Email queue stores download URLs instead of file content
  - **✅ On-Demand Download**: Files downloaded from storage when emails are sent
  - **✅ Automatic Cleanup**: Backup files expire after 30 days for storage optimization
  - **✅ Size Limit Resolution**: Solved Firestore document size limits (11MB+ base64 content)
- **Production-Ready Infrastructure**: Complete Firebase Functions deployment
  - **✅ Cloud Functions**: Deployed backup execution functions to australia-southeast1 region
  - **✅ HTTP Triggers**: Manual backup execution via secure HTTP endpoints
  - **✅ Scheduled Execution**: Automatic backup execution based on configured schedules
  - **✅ Admin Authentication**: Secure API endpoints with admin middleware protection
  - **✅ Error Handling**: Comprehensive error management and recovery
- **Admin Interface Integration**: Complete backup management from admin dashboard
  - **✅ Backup Schedule Tile**: Professional UI component for backup management
  - **✅ Schedule Creation**: Easy setup of backup schedules with email configuration
  - **✅ Manual Execution**: One-click backup execution with real-time progress
  - **✅ Email Queue Integration**: View and manage backup emails in email queue interface
  - **✅ Status Monitoring**: Real-time backup execution status and logging
- **Email Configuration & Delivery**: Professional email system with verified domain
  - **✅ Resend API Integration**: Production email delivery with API key: `re_hbMtXjCA_5pkVZWAKFQ6JruJ3WfrJ4TME`
  - **✅ Verified Domain**: Emails sent from `MyPonyClub Event Manager <noreply@myponyclub.com>`
  - **✅ Professional Branding**: Consistent email templates with backup details and instructions
  - **✅ Attachment Handling**: Secure ZIP file attachments downloaded from Firebase Storage
  - **✅ Real Email Delivery**: Production-ready email sending with proper error handling
- **Technical Architecture**: Modern, scalable backup infrastructure
  - **✅ TypeScript Integration**: Full type safety throughout backup system
  - **✅ Firebase Admin SDK**: Secure database operations with service account authentication
  - **✅ JSZip Integration**: Professional ZIP file creation with compression
  - **✅ Email Queue Compatibility**: Seamless integration with existing email management
  - **✅ Storage Management**: Automatic file lifecycle management with expiration

### � **FIREBASE FUNCTIONS MIGRATION** (September 17, 2025) - **✅ PHASE 2 COMPLETE**
- **Core API Migration**: Successfully migrated all essential API endpoints to Firebase Functions
  - **✅ Health Endpoint**: `/api/health` - System monitoring with detailed status reporting
  - **✅ Clubs API**: `/api/clubs` - Complete club management (GET/POST/PUT) with Firestore integration
  - **✅ Zones API**: `/api/zones` - Zone data retrieval with proper REST API formatting
  - **✅ Events API**: `/api/events` - Event management with advanced filtering and robust error handling
  - **✅ Email Notifications**: `/api/send-event-request-email` - Critical notification system with full functionality
- **Infrastructure Foundation**: Production-ready Firebase Functions architecture
  - **✅ TypeScript Configuration**: Clean builds with comprehensive type safety
  - **✅ Express.js Integration**: Professional routing with middleware (CORS, compression, security)
  - **✅ Error Handling**: Comprehensive error management with appropriate HTTP status codes
  - **✅ Environment Configuration**: Seamless local development vs production deployment
- **Email System Migration**: Complete notification system preserved and enhanced
  - **✅ PDF Generation**: jsPDF-powered document creation with complex layouts
  - **✅ Multi-Recipient Support**: Requester, zone approvers, and super user workflows
  - **✅ Email Queue Integration**: Approval-based email management system
  - **✅ Resend API Integration**: Professional email delivery service
  - **✅ JSON Export**: Administrative reporting with detailed event data
- **Testing & Validation**: Comprehensive test suite confirms migration success
  - **✅ All Success Criteria Met**: 5/5 core requirements validated
  - **✅ API Endpoint Testing**: All endpoints respond correctly with proper formatting
  - **✅ Database Architecture**: Robust connection handling and error management
  - **✅ Testing Scripts**: `test-migrated-apis.js` and `test-core-migration.js` for validation
  - **✅ Ready for Phase 3**: Complete API migration and frontend integration

### �📄 Revolutionary PDF Event Request System (September 15, 2025)
- **Hybrid PDF Generation**: Advanced document creation combining original policy pages with dynamic form generation
  - **Original Policy Integration**: Uses actual Process.pdf first page for perfect formatting consistency
  - **Dynamic Form Generation**: jsPDF-powered second page with professional layout and typography
  - **Async Architecture**: Proper async/await handling with Buffer conversion for NextResponse
  - **Error Resilience**: Comprehensive error handling with fallback PDF generation
- **Professional Document Layout**: Modern, business-ready PDF design with enhanced visual hierarchy
  - **Helvetica Typography**: Professional font family throughout with proper sizing hierarchy
  - **Centered Dynamic Titles**: Auto-updating year display (e.g., "Events requested between 1st January to 31st December 2026")
  - **Smart Year Detection**: Automatically uses year from first event or defaults to next calendar year
  - **Responsive Text Wrapping**: Intelligent text fitting with proper line breaks and spacing
- **Enhanced Visual Design**: Modern table styling and professional presentation
  - **Steel Blue Header**: Professional table headers (#4682B4) with white text for excellent contrast
  - **Color-Coded Qualifiers**: Green "YES" and red "NO" with centered alignment for quick scanning
  - **Alternating Row Colors**: Subtle light blue alternating rows for improved readability
  - **Optimized Column Widths**: Better proportioned columns (22, 85, 32, 35mm) for content display
  - **Increased Font Sizes**: Enhanced readability with 10-11pt fonts throughout the table
- **Intelligent Space Management**: Optimized layout ensuring all content fits professionally
  - **Compact Spacing**: Reduced white space throughout (header: 8mm, text: 3.5mm, sections: 4-6mm)
  - **Fixed Footer Positioning**: Club list always anchored at bottom (15-10mm from edge) regardless of content
  - **Smart Notes Allocation**: Dynamic notes area sizing (15-35mm) with guaranteed minimum space
  - **Separate Footer Sections**: Clean separation between notes and "Who filled in this form" areas
- **Content Quality Improvements**: Professional, grammatically correct text with business-appropriate tone
  - **Streamlined Instructions**: Concise, error-free text with proper grammar and professional language
  - **Updated Submission Requirements**: General calendar year requirements instead of specific dates
  - **Bullet Point Lists**: Clean, compact formatting with minimal spacing for maximum content density
  - **Contact Information**: Clear submission instructions with highlighted email addresses
- **Advanced Layout Engineering**: Precise positioning and spacing calculations for optimal presentation
  - **Fixed Footer Architecture**: 20mm reserved for club footer, 15mm for signature section
  - **Dynamic Content Fitting**: Intelligent space allocation preventing content overflow
  - **Professional Signature Areas**: Enhanced "Who filled in this form" section with proper field sizing
  - **Consistent Margins**: 20mm margins throughout with optimized content width calculations

### 📧 **PHASE 1 - Core Notification System** (September 16, 2025) - **✅ COMPLETED**
- **Multi-Recipient Email Notifications**: Comprehensive notification system for event request submissions
  - **Requesting User**: Immediate confirmation email with PDF attachment and reference number
  - **Zone Approvers**: Automatic notification to appropriate zone coordinators based on club selection
  - **Super Users**: Administrative notifications with both PDF and JSON export attachments
  - **Smart Recipient Management**: Intelligent routing based on club-zone mapping and approver database
- **Professional Email Templates**: HTML-formatted notifications with comprehensive event details
  - **Responsive Design**: Mobile-friendly email templates with professional styling
  - **Event Summary Tables**: Complete event listing with priorities, dates, locations, and qualifiers
  - **Reference Number Integration**: Unique tracking numbers for all event requests
  - **Contact Information Display**: Clear submitter and club details for follow-up communication
  - **Professional Branding**: Consistent visual design with proper typography and color schemes
- **Advanced Attachment System**: Intelligent document generation and attachment management
  - **PDF Generation**: Automatic creation of professional event request PDFs with policy integration
  - **JSON Export**: Administrative data export for super users with structured event request data
  - **Secure Attachment Handling**: Base64-encoded attachments with proper MIME type detection
  - **Multi-Format Support**: Both PDF and JSON attachments in same email where appropriate
- **Queue Integration & Email Management**: Seamless integration with existing email queue system
  - **Firestore Integration**: Proper email storage using existing queue management infrastructure
  - **Queue vs Direct Send**: Configurable email delivery (queue for review vs immediate sending)
  - **Email Queue UI Compatibility**: Fixed ID generation to work with existing queue management interface
  - **Status Tracking**: Complete email lifecycle tracking from creation to delivery
- **Robust Error Handling & Fallback**: Production-ready error management
  - **Graceful Degradation**: Form submission succeeds even if email sending fails
  - **Comprehensive Logging**: Detailed console output for debugging and monitoring
  - **Service Validation**: Automatic detection of missing zone approvers or configuration issues
  - **Development Mode Support**: Email simulation when Resend API key not configured
- **Data Integration & Export Features**: Advanced data handling for administrative purposes
  - **Club-Zone Mapping**: Automatic lookup of zone information based on club selection
  - **Event Type Resolution**: Database integration for event type names and details
  - **JSON Export Generation**: Structured data export with enriched club and zone information
  - **Reference Number System**: Unique tracking identifiers for all event requests
- **API & Configuration**: RESTful endpoints with comprehensive configuration options
  - **POST /api/send-event-request-email**: Main notification endpoint with queue/immediate options
  - **Environment Configuration**: Secure Resend API key management with development fallback
  - **Type Safety**: Full TypeScript integration with proper interface definitions
  - **Validation**: Comprehensive input validation and error reporting

### 📧 Automated Email Notification System (September 15, 2025)
- **Zone-Based Email Routing**: Intelligent zone approver notification system with automatic club-to-zone mapping
  - **Zone Lookup Integration**: Seamless connection between club selection and zone identification
  - **Zone Approver Database**: Comprehensive zone coordinator contact management with mock data
  - **Automatic Email Routing**: Event requests automatically sent to appropriate zone coordinators
  - **Multi-Approver Support**: Zone can have multiple approvers with all receiving notifications
- **Professional Email Templates**: HTML-formatted email notifications with comprehensive event request details
  - **Responsive Email Design**: Mobile-friendly HTML templates with proper formatting
  - **Event Summary Display**: Complete event listing with priorities, dates, locations, and qualifiers
  - **Club and Submitter Information**: Clear contact details and club identification
  - **PDF Attachment Integration**: Automatic attachment of generated PDF to email notifications
  - **Professional Email Styling**: Brand-consistent email templates with proper typography
- **Robust Email Infrastructure**: Enterprise-grade email delivery with Resend service integration

### 🚀 **Email Queue Management System** (September 15, 2025) - **FULLY OPERATIONAL**
- **Admin Review Interface**: Comprehensive email queue dashboard for managing all outgoing communications
  - **Real-time Queue Monitoring**: Live view of all pending, sent, and failed emails with detailed statistics
  - **Bulk Operations**: Multi-select email management with bulk approve, edit, and delete capabilities
  - **Email Editing**: In-line editing of email content, recipients, and scheduling before sending
  - **Status Management**: Complete email lifecycle tracking from draft to sent with retry mechanisms
- **Authentication & Security**: Role-based access control with development and production authentication
  - **Development Tokens**: `admin-token` and `dev-admin-token` for testing and development
  - **Admin Middleware**: Secure API endpoint protection with authentication verification
  - **Authorization Checks**: Granular permission system for different admin operations
- **Database Integration**: Firebase Firestore backend with comprehensive email queue management
  - **Admin SDK Implementation**: Server-side Firebase operations with proper error handling
  - **Type-Safe Operations**: Full TypeScript integration with normalized data structures
  - **Configuration Management**: Dynamic email queue settings with admin-configurable parameters
- **Error Resolution & Bug Fixes**: Production-ready system with all critical issues resolved
  - **✅ Fixed**: 500 Internal Server Errors from improper Firebase SDK usage
  - **✅ Fixed**: Authentication failures and 401 Unauthorized errors
  - **✅ Fixed**: Runtime TypeErrors from email field type mismatches
  - **✅ Fixed**: Email recipient normalization (string vs array handling)
- **API Endpoints**: Complete RESTful API for email queue operations
  - **GET /api/email-queue**: List emails with filtering and statistics
  - **POST /api/email-queue**: Create new emails with automatic field normalization
  - **PUT /api/email-queue**: Update existing emails with validation
  - **GET /api/email-queue/config**: Configuration management with admin settings
  - **GET /api/health**: System health monitoring with database connectivity checks
- **Testing & Documentation**: Comprehensive testing framework with automated validation
  - **PowerShell Test Suite**: Automated testing scripts for full system validation
  - **API Testing Scripts**: Complete endpoint testing with authentication and error scenarios
  - **Health Monitoring**: Continuous system health checks with detailed status reporting
  - **📖 Complete Documentation**: See `SYSTEM_DOCUMENTATION.md` for detailed testing and usage guide
  - **Resend API Integration**: Professional email service for reliable delivery and tracking
  - **Attachment Handling**: Secure PDF attachment processing with proper MIME types
  - **Error Handling**: Graceful fallback when email sending fails (doesn't block form submission)
  - **CC to Submitter**: Event request submitter receives copy of email for their records
  - **Environment Configuration**: Secure API key management with environment variables
- **Email Content Features**: Rich content design for comprehensive communication
  - **Event Request Summary**: Complete form data formatted for easy review
  - **Zone Coordinator Context**: Clear identification of receiving zone and contact information
  - **Submission Timestamp**: Clear date/time stamps for tracking and record keeping
  - **Contact Information**: Direct contact details for follow-up communication
  - **Action Instructions**: Clear next steps for zone coordinators to approve/review requests

### 🎯 Enhanced Event Request System (September 15, 2025)
- **Revolutionary User Experience Design**: Complete redesign focusing on progressive disclosure and user-centric workflow
  - **Name-First Approach**: Streamlined form flow starting with organizer name for immediate context
  - **Intelligent Auto-Population**: Automatic form filling using comprehensive user directory
  - **Visual Progress Indicators**: Clear visual feedback showing completion status across all form sections
  - **Progressive Disclosure Pattern**: Help information available on-demand without overwhelming the main interface
- **Advanced Autocomplete System**: Sophisticated user selection with real-time search
  - **Fuzzy Name Matching**: Intelligent search across first name, last name, and full name combinations
  - **User Directory Integration**: Seamless connection to club member database with 500+ users
  - **Auto-Population Logic**: Automatic filling of club, email, and phone fields based on user selection
  - **Manual Override Capability**: Allow custom entries when user not found in directory
- **Separated Contact Management**: Enhanced contact field organization for better data quality
  - **Dedicated Email Field**: Separate email input with validation and auto-population
  - **Dedicated Phone Field**: Separate phone input with formatting and validation
  - **Contact Validation**: Real-time validation ensuring data quality and completeness
  - **Visual Field Organization**: Clear separation and labeling for improved user experience
- **Professional Help System**: Comprehensive contextual help without interface clutter
  - **HelpTooltip Component**: Reusable tooltip system for contextual assistance
  - **HelpSection Component**: Collapsible content sections with variants and state management
  - **Strategic Help Placement**: Tooltips positioned at key decision points and complex fields
  - **Clean Default View**: Uncluttered interface with help available when needed
- **Enhanced Policy Integration**: Organized information architecture with collapsible sections
  - **Priority Levels Reference**: Visual priority badges moved to collapsible policy section
  - **Collapsible Policy Information**: EventRequestPolicyInfo component with comprehensive guidelines
  - **Content Deduplication**: Removed duplicate policy sections for cleaner page layout
  - **Contextual Policy Access**: Policy information available within form context when needed
- **Improved Form Validation & UX**: Enhanced form interaction patterns
  - **Priority Field Integration**: Database-persisted priority selection (1-4) with validation
  - **Traditional Event Marking**: Enhanced traditional event designation with database persistence
  - **Real-time Validation**: Immediate feedback on form errors and completion status
  - **Enhanced Visual Design**: Modern glass morphism effects and professional styling

### 🔧 Critical Role Preservation Bug Fix (September 13, 2025)
- **Role Preservation Fix**: Fixed critical bug where super_user roles were being overwritten to 'standard' during CSV imports
  - **Root Cause**: Preview endpoint was applying default values (`|| 'standard'`) to undefined role fields in `validRowsData`
  - **Impact**: CSVs without role columns were incorrectly changing existing user roles instead of preserving them
  - **Solution**: Removed default assignment in preview data transmission, preserving `undefined` values for role preservation logic
  - **Validation Enhancement**: Added comprehensive debugging and role field detection for membership data vs role data
  - **Type Safety**: Updated TypeScript definitions to properly handle optional role fields
- **Enhanced Role Detection**: Improved validation to distinguish between membership status and role data
  - **Membership Data Detection**: Automatically detects "Senior Riding Member", "Non-Riding Member", etc. as membership status
  - **Role Preservation Logic**: When no role column exists, existing user roles (super_user, zone_rep) are preserved
  - **Fallback Behavior**: New users without role data receive system default ('standard') role
  - **Debug Logging**: Comprehensive role assignment tracking for troubleshooting

### 🚀 Enhanced User Import System with Preview & Progress Tracking (September 13, 2025)ClubApp Event Manager
Event Management System for Pony Club Zones

A comprehensive Next.js application for managing pony club events, featuring advanced calendar imports, multi-format document processing, embeddable calendars, zone coordination, and a sophisticated modern design system.

## ✨ Latest Features (September 2025)

### � Enhanced User Import System with Preview & Progress Tracking (September 13, 2025)
- **Two-Stage Import Workflow**: Complete preview-then-import system for maximum user control
  - **File Upload & Parse**: Intelligent file processing with comprehensive validation
  - **Preview & Review**: Detailed import summary with ability to confirm or abort
  - **Progress-Tracked Import**: Real-time progress for 5+ minute mapping operations
  - **Enhanced Data Summary**: Comprehensive analysis with visual organization
- **Advanced Import Preview System**: Professional review interface before import execution
  - **File Summary Statistics**: Total rows, valid rows, error rates, and success percentages
  - **Comprehensive Data Analysis**: 3-column layout with color-coded information sections
  - **Organization Data Display**: Visual club and zone listings with proper formatting
  - **Data Quality Assessment**: Contact information analysis and missing data reporting
  - **Issue Detection**: Duplicate ID detection with actual values and context
  - **Import Rules Explanation**: Clear filtering rules and membership handling
- **Enhanced Progress Tracking**: Detailed mapping stage simulation with real-time feedback
  - **Multi-Phase Progress**: Upload → Validation → Mapping → Import with detailed steps
  - **Mapping Stage Simulation**: Detailed progress for 5+ minute club/zone mapping operations
  - **Real-Time Updates**: 200ms intervals with specific action descriptions
  - **Visual Progress Indicators**: Phase icons, percentages, and current action display
  - **Background Processing**: Non-blocking UI with proper loading states
- **Professional User Experience**: Complete workflow with proper state management
  - **Preview First Approach**: No accidental imports - always review before executing
  - **Abort Capability**: Cancel at preview stage without making changes
  - **State Management**: Proper transitions between upload, preview, and import stages
  - **Error Handling**: Comprehensive error reporting with user-friendly messages

### �👥 Advanced User Management System (September 12, 2025)
- **Optional Role Import System**: Revolutionary user import with flexible role handling
  - **Role Column Support**: User roles stored as separate database column (not using Membership)
  - **Optional Role Import**: Import works seamlessly whether spreadsheets contain role data or not
  - **Data Update Capability**: Existing user data updates with new values during import
  - **Graceful Fallback**: When role column missing, import continues without role data
  - **Default Role Assignment**: New users without role data get 'standard' role automatically
- **Historical Membership Processing**: Intelligent membership status handling
  - **Automatic Deactivation**: Users with "Historical Membership" status automatically deactivated
  - **Membership Status Detection**: Smart recognition of membership vs role data
  - **Account Preservation**: Historical users kept in system but marked inactive
  - **Role Protection**: Existing roles preserved when historical status detected
- **Comprehensive Import Mapping System**: Advanced zone and club name resolution
  - **Zone Mapping Engine**: Intelligent mapping from spreadsheet formats to system zones
  - **Club Name Resolution**: Fuzzy matching and normalization for club name variations
  - **Database Integration**: Real-time zone and club lookup with caching system
  - **Pattern Matching**: Advanced similarity scoring and normalization algorithms
  - **Static Mapping Library**: Comprehensive mappings for all Victorian zones and common abbreviations
- **Robust Import Pipeline**: Complete user data processing system
  - **Multi-Format Support**: CSV and Excel file import with optional column handling
  - **Schema Validation**: Zod-based validation with optional field support
  - **Error Resilience**: Graceful handling of missing or invalid data
  - **TypeScript Integration**: Full type safety throughout import pipeline
  - **Logging System**: Comprehensive debug logging for mapping and validation

### 🧪 Testing Infrastructure & Data Management (September 5, 2025)
- **Testing Section**: New dedicated testing area in admin dashboard with purple-themed design
- **Advanced Event Export Tool**: Complete backup and migration system
  - Full ZIP archive creation with real schedule file downloads
  - Configurable filtering by event types and date ranges  
  - Real-time progress tracking with detailed logging
  - SHA-256 integrity verification with manifest files
  - Self-contained exports with all dependencies
- **Comprehensive Event Import Tool**: Complete data restoration capabilities
  - ZIP archive processing with manifest verification
  - Intelligent conflict detection (duplicate IDs, names, dates)
  - Advanced conflict resolution (skip, overwrite, rename)
  - Dry run mode for safe import testing
  - Real-time import progress with detailed logging
  - Schedule file restoration to Firebase Storage
- **Test Data Generator**: Realistic synthetic data creation for testing
- **Event Purge Tool**: Safe removal of events using exported archives
  - Configurable generation (1-5 years, 1-20 events/week)
  - Authentic patterns with seasonal variation and weekend bias
  - Mock PDF schedule generation with professional layouts
  - Export-compatible ZIP format with manifest verification
  - Preview mode and real-time progress monitoring
- **Professional Data Management Interface**: 
  - Multi-stage progress indicators (analysis, validation, import, upload)
  - Conflict resolution UI with side-by-side comparison
  - Success/error handling with comprehensive reporting
  - Auto-download export with manual re-download option
  - Configurable compression levels and import filtering
- **Geographic Distance Features**: Enhanced event dialog with distance calculations
  - Haversine formula for accurate distance between club coordinates
  - Visual distance tiles (green for success, red for unavailable)
  - Integration with scheduling conflict detection
- **Robust File Handling**: Firebase Storage integration for actual PDF downloads
  - 30-second timeout protection with graceful error handling
  - Sanitized filenames and comprehensive error diagnostics
  - Real schedule files instead of placeholder text

### 📊 Enhanced PDF Calendar Generation (September 3, 2025)
- **Compact Calendar Design**: Professionally compressed calendar layout using only half the page
- **Extended Event Text Display**: Event names show up to 25 characters (single events) or 20 characters (multiple events)
- **Multi-Event Support**: Displays up to 4 individual events per day before showing rollup counts
- **Modern Visual Design**: Best-of-breed calendar styling with:
  - Enhanced color palette with professional gradients
  - Subtle shadow effects and rounded corners
  - Optimized typography with smart font sizing (5pt for maximum text)
  - Clean cell borders with weekend highlighting
- **Smart Text Truncation**: Proper ellipsis (…) character for clean appearance
- **Optimal Layout**: 15px cell height with 10px day headers for compact yet readable display
- **Real Event Data**: Fully integrated with Firestore database for live event information
- **PDF Optimization**: Efficient 11KB file generation with jsPDF library

### 🎨 Club Manager Interface Enhancement (August 29, 2025)
- **Event Date Integration**: Event dates now prominently displayed in tile titles (format: "12th Dec 2026 - Event Name")
- **Reorganized Zone Qualifier**: Moved from title badge to Event Details section with clear YES/NO display
- **Optimized Spacing**: Refined vertical spacing in details sections for better information density
- **Enhanced Section Headers**: Larger, bolder "EVENT DETAILS" and "EVENT SCHEDULE" headings for improved hierarchy
- **Smart Event Filtering**: Professional filter system with three categories:
  - **All Events**: Complete event list with total count
  - **Upcoming Events**: Future events based on current date
  - **Past Events**: Historical events for reference
- **Dynamic Filter Badges**: Real-time event counts displayed on each filter option
- **Professional Filter Design**: Glass morphism effects with gradient backgrounds and smooth transitions
- **Improved Layout**: Filter positioned on left side, preserving the distinctive Add Event button

### 🎨 Club Manager Interface Redesign (August 28, 2025)
- **Professional Status Panel System**: Complete redesign with sophisticated dual-panel layout
- **Unified Event Details Panel**: Comprehensive information display with icons for Date, Location, Type, Zone Qualifier, and Coordinator
- **Event Schedule Panel**: Dedicated schedule management with document display and upload functionality
- **Distinctive Button System**: 10-type button styling with teal/emerald gradients and hover effects
- **Dark Slate Backgrounds**: Consistent non-gradient backgrounds (`bg-slate-200/80`) for both panels
- **High-Contrast Content**: White content frames (`bg-white/90`) for excellent readability
- **Flexbox Layout System**: Proper alignment with bottom-positioned action buttons
- **Enhanced Information Architecture**: Logical grouping with streamlined headers and separate status sections

### 📁 Event Schedule Management (August 27, 2025)
- **Firebase Storage Integration**: Complete cloud-based document storage for event schedules
- **Multi-Format Support**: Upload PDF, DOCX, TXT, and other document formats
- **Secure File Management**: Organized storage structure with unique file naming to prevent conflicts
- **Public URL Generation**: Automatic generation of accessible download URLs for approved schedules
- **API Compliance**: Next.js App Router compliant endpoints for file upload and management
- **Error Handling**: Comprehensive upload validation and error handling for robust user experience
- **Cloud Storage Benefits**: Scalable Firebase Storage bucket (`ponyclub-events.firebasestorage.app`)
- **Future Workflow**: Foundation for approval workflow and status management system

### 🎨 Modern Design System
- **Glass Morphism Effects**: Beautiful translucent cards with backdrop blur and gradient overlays
- **Compact Layouts**: Space-efficient designs for better screen utilization and mobile experience
- **Gradient Typography**: Stunning gradient text effects for headers and important elements
- **Custom Sidebar**: Collapsible navigation with glass effects replacing complex library components
- **Professional Styling**: Consistent visual hierarchy with enhanced spacing and modern aesthetics
- **Responsive Design**: Optimized layouts that work beautifully across all device sizes

### 📝 Enhanced User Interfaces
- **Manage Events Page**: Beautiful card-based layout with glass effects, gradient badges, and compact design
- **Request Event Form**: Streamlined form with reduced spacing, smaller inputs, and improved workflow
- **Event Cards**: Modern glass effect containers with gradient status indicators and compact information display
- **Action Dialogs**: Professional modal designs with gradient buttons and contextual icons
- **Tab Navigation**: Enhanced tab system with gradient active states and visual feedback

### 🚀 Embed System Improvements
- **Sidebar Suppression**: Clean embed layouts without navigation interference
- **Conditional Rendering**: Smart layout detection for embed vs. full application modes
- **Iframe Optimization**: Perfect embedding experience for external websites
- **Responsive Embeds**: Layouts that adapt beautifully in any container size

### 📝 Embeddable Event Request Form
- **Request Form Embed**: Complete event request form for external websites (`/embed/request-event`)
- **Self-Contained Interface**: Automatic data loading with professional success flow
- **iframe Integration**: Optimized for embedding in external sites with responsive design
- **Enhanced Component**: Upgraded EventRequestForm with embed mode support and callbacks

### 🎛️ Enhanced Admin Dashboard
- **Reorganized Admin Interface**: Restructured dashboard with logical section grouping
- **Visual Category Grouping**: Color-coded API endpoint management with themed sections
- **Comprehensive Page Registry**: All application pages included in endpoint management
- **Base URL Switching**: Dynamic environment selection for testing and development
- **Data Accuracy Fixes**: Resolved count display issues and API response parsing

### 📅 Advanced Calendar Import System
- **Multi-Format Support**: Import calendars from CSV, Excel, PDF, DOCX, and text files
- **Smart Date Parsing**: Intelligent recognition of Pony Club date formats like "6thFebruary", "20th February"
- **Batch Processing**: Professional 4-step import workflow with review and rollback capabilities
- **Club Matching**: Intelligent club name matching with suggestions and validation

### 🌐 Embeddable System
- **Full Calendar Embed**: Complete calendar view for external websites (`/embed/calendar`)
- **Compact Calendar**: Streamlined view for smaller spaces (`/embed/calendar/compact`)
- **Event Request Form**: Complete event submission form for external sites (`/embed/request-event`)
- **Calendar API**: JSON and iCal export endpoints for external integrations
- **Google Sites Ready**: Optimized for iframe embedding in Google Sites and other platforms

### 🗺️ Club Geolocation
- **Google Maps Integration**: Interactive location setting for all 172+ clubs
- **Batch Processing**: Zone-wide or individual club geolocation
- **Smart Search**: Multi-strategy search with fallbacks for accurate positioning
- **Manual Override**: Click-and-drag interface for precise location adjustment

### 🔧 API Management
- **35+ Endpoint Registry**: Comprehensive API endpoint management system with new categories
- **Enhanced Categories**: 
  - **Public APIs**: Core data access endpoints
  - **Admin APIs**: Administrative functions including event export and import
  - **Embed APIs**: External website integration
  - **Data APIs**: Import/export operations with conflict resolution
  - **Storage APIs**: Firebase Storage management
  - **Documents APIs**: File upload and document management
  - **Testing APIs**: Export, import, and backup operations
- **Visual Category Grouping**: Color-coded sections with dedicated icons
- **Admin Dashboard**: Real-time enable/disable controls for all endpoints
- **Base URL Selector**: Dynamic environment switching for testing
- **Documentation**: Detailed parameter and usage documentation
- **Page Integration**: Application pages included alongside API endpoints

#### New API Categories (September 2025)
- **Event Export System**: Comprehensive ZIP archive generation with filtering
- **Event Import System**: Complete data restoration with conflict detection and resolution
- **Calendar PDF Generation**: Advanced PDF export with filtering and customization
- **Document Management**: Event schedule upload with Firebase Storage integration
- **Storage Administration**: Bucket management and connectivity testing
- **Enhanced Data Operations**: Batch processing and database maintenance tools

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (for data storage)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions):
   ```bash
   copy .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. Seed the database (optional):
   ```bash
   npm run seed-firestore
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:9002

## � Technical Documentation

### User Import System
- **[Role Preservation System](./docs/user-import-role-preservation.md)** - Detailed technical documentation for role preservation during CSV imports
- **Two-Stage Import Workflow** - Preview-then-import system with comprehensive validation
- **Historical Membership Processing** - Automatic user deactivation for historical memberships
- **Club/Zone Mapping Engine** - Intelligent fuzzy matching and normalization

### API Documentation
- **35+ Endpoint Registry** - Comprehensive API system with 7 categories
- **Real-time Admin Controls** - Enable/disable endpoints dynamically
- **Multi-Environment Support** - Base URL switching for testing

### Development
- **TypeScript Integration** - Full type safety throughout the application
- **Firebase Integration** - Firestore database and Storage for documents
- **Modern React Patterns** - Next.js 14 with app router and server components

## �📁 Project Structure
- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utilities, data access, Firebase configuration, and user import system
- `/src/ai` - Genkit AI flows for intelligent features
- `/docs` - Comprehensive documentation including specialized guides

### Key Import System Files
- `/src/lib/import-mappings.ts` - Advanced zone and club name mapping system
- `/src/lib/user-validation.ts` - User import validation with optional role support
- `/src/lib/user-service.ts` - User processing with conditional role assignment
- `/src/lib/spreadsheet-parser.ts` - CSV/Excel parsing with optional column handling
- `/docs/USER_IMPORT_SYSTEM.md` - Comprehensive user import system documentation

## 🔧 Available Scripts
- `npm run dev` - Start development server on port 9002
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run seed-firestore` - Seed database with initial data
- `npm run genkit:dev` - Start Genkit AI development server
- `npm run genkit:watch` - Start Genkit AI with file watching

## 🔒 Environment Setup
See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete Firebase configuration instructions.

### Email Configuration (Required for Event Request Notifications)
The Phase 1 notification system requires a Resend API key for production email delivery:

1. **Get Resend API Key** (Production Only):
   - Sign up at [resend.com](https://resend.com)
   - Navigate to **API Keys** section in your dashboard
   - Click **"Create API Key"**
   - Copy the generated key (starts with `re_`)

2. **Configure Environment Variable**:
   ```env
   RESEND_API_KEY=re_your_actual_api_key_here
   ```
   
   **Important**: Replace `re_your_actual_api_key_here` with your actual Resend API key

3. **Development Mode** (No API Key Required):
   - If no `RESEND_API_KEY` is configured, the system runs in **development mode**
   - Email content is logged to the console instead of being sent
   - All functionality works normally, but emails are simulated
   - Perfect for testing the notification system without email service setup
   - Console output shows complete email details including recipients and attachments

4. **Production Mode** (With API Key):
   - With `RESEND_API_KEY` configured, emails are actually sent via Resend service
   - Multi-recipient notifications: requester, zone approvers, and super users
   - Professional HTML email templates with PDF and JSON attachments
   - Real-time email delivery with proper error handling
   - Email queue integration for administrative review and management

5. **Phase 1 Notification Features**:
   - **Immediate Confirmation**: Requester receives instant email with PDF attachment
   - **Zone Coordinator Alerts**: Automatic notifications to appropriate zone approvers
   - **Super User Notifications**: Administrative emails with both PDF and JSON exports
   - **Reference Number Tracking**: Unique identifiers for all event requests
   - **Professional Templates**: HTML-formatted emails with complete event details
   - **Queue Management**: Integration with existing email queue system for admin review

## 🤖 AI Features
This app includes AI-powered features using Google's Genkit:
- Event date suggestion based on existing events
- Intelligent conflict detection
- Optimized scheduling recommendations

## 🏗️ Tech Stack
- **Framework**: Next.js 14 with App Router
- **UI**: React with Tailwind CSS, Radix UI components, and custom glass morphism design system
- **Design**: Modern glass effects, gradient typography, responsive layouts, and compact spacing
- **Database**: Firebase Firestore
- **AI**: Google Genkit with Google AI
- **Forms**: React Hook Form with Zod validation
- **State**: Jotai for client state management
- **Styling**: Custom CSS classes for glass effects, gradients, and enhanced visual hierarchy

## 📚 Documentation

### Core Documentation
- **[Blueprint](./docs/blueprint.md)**: Complete application architecture and feature overview
- **[Firebase Setup](./FIREBASE_SETUP.md)**: Detailed Firebase configuration guide
- **[Event Request System](./docs/EVENT_REQUEST_SYSTEM.md)**: Comprehensive guide to the enhanced event request workflow

### Specialized Guides
- **[User Import System](./docs/USER_IMPORT_SYSTEM.md)**: Comprehensive guide covering:
  - Optional role import framework with flexible handling
  - Advanced zone and club mapping algorithms
  - Database integration and caching strategies
  - Import pipeline architecture and error handling
  - TypeScript integration and type safety
  - Configuration, usage examples, and troubleshooting

### System Features
- **Event Request System**: Revolutionary user-centric design with progressive disclosure, intelligent autocomplete, and contextual help
- **User Management**: Optional role imports, data updates, graceful fallbacks
- **Mapping Engine**: Zone/club name resolution with fuzzy matching
- **Import Pipeline**: Multi-format support with comprehensive validation
- **Error Handling**: Robust error management throughout import process

## 🎨 Design Features
- **Glass Morphism**: Translucent cards with backdrop blur effects
- **Gradient System**: Beautiful gradient text and background effects throughout
- **Compact Layouts**: Space-efficient designs optimized for all screen sizes
- **Custom Components**: Purpose-built sidebar, dialogs, and form elements
- **Professional Typography**: Enhanced text hierarchy with gradient treatments
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
