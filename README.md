# MyPonyClubApp Event Manager
Event Management System for Pony Club Zones

A comprehensive Next.js application for managing pony club events, featuring advanced calendar imports, multi-format document processing, embeddable calendars, zone coordination, and a sophisticated modern design system.

## ✨ Latest Features (September 2025)

### 🧪 Testing Infrastructure & Event Export (September 5, 2025)
- **Testing Section**: New dedicated testing area in admin dashboard with purple-themed design
- **Advanced Event Export Tool**: Complete backup and migration system
  - Full ZIP archive creation with real schedule file downloads
  - Configurable filtering by event types and date ranges  
  - Real-time progress tracking with detailed logging
  - SHA-256 integrity verification with manifest files
  - Self-contained exports with all dependencies
- **Professional Export Interface**: 
  - Multi-stage progress indicators (database fetch, file download, compression)
  - Success/error handling with retry capabilities
  - Auto-download with manual re-download option
  - Configurable compression levels (low/medium/high)
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
  - **Admin APIs**: Administrative functions including event export
  - **Embed APIs**: External website integration
  - **Data APIs**: Import/export operations
  - **Storage APIs**: Firebase Storage management
  - **Documents APIs**: File upload and document management
  - **Testing APIs**: Export and backup operations
- **Visual Category Grouping**: Color-coded sections with dedicated icons
- **Admin Dashboard**: Real-time enable/disable controls for all endpoints
- **Base URL Selector**: Dynamic environment switching for testing
- **Documentation**: Detailed parameter and usage documentation
- **Page Integration**: Application pages included alongside API endpoints

#### New API Categories (September 2025)
- **Event Export System**: Comprehensive ZIP archive generation with filtering
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

## 📁 Project Structure
- `/src/app` - Next.js app router pages
- `/src/components` - Reusable React components
- `/src/lib` - Utilities, data access, and Firebase configuration
- `/src/ai` - Genkit AI flows for intelligent features

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

## 🎨 Design Features
- **Glass Morphism**: Translucent cards with backdrop blur effects
- **Gradient System**: Beautiful gradient text and background effects throughout
- **Compact Layouts**: Space-efficient designs optimized for all screen sizes
- **Custom Components**: Purpose-built sidebar, dialogs, and form elements
- **Professional Typography**: Enhanced text hierarchy with gradient treatments
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations
