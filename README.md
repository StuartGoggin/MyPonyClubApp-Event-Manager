# MyPonyClubApp Event Manager
Event Management System for Pony Club Zones

A comprehensive Next.js application for managing pony club events, featuring advanced calendar imports, multi-format document processing, embeddable calendars, zone coordination, and a beautiful modern design system.

## ✨ Latest Features (August 2025)

### 🎨 Modern Design System (Latest)
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
- **25+ Endpoint Registry**: Comprehensive API endpoint management system
- **Visual Category Grouping**: Color-coded sections (Pages, Public APIs, Admin APIs, Embed APIs, Data APIs)
- **Admin Dashboard**: Real-time enable/disable controls for all endpoints
- **Base URL Selector**: Dynamic environment switching for testing
- **Documentation**: Detailed parameter and usage documentation
- **Page Integration**: Application pages included alongside API endpoints

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
