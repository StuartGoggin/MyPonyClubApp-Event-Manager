# MyPonyClubApp Event Manager
Event Management System for Pony Club Zones

A comprehensive Next.js application for managing pony club events, featuring advanced calendar imports, multi-format document processing, embeddable calendars, and zone coordination.

## ✨ Latest Features (August 2025)

### 🎛️ Enhanced Admin Dashboard (Latest)
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

### 🌐 Embeddable Calendar System
- **Full Calendar Embed**: Complete calendar view for external websites (`/embed/calendar`)
- **Compact Calendar**: Streamlined view for smaller spaces (`/embed/calendar/compact`)
- **Calendar API**: JSON and iCal export endpoints for external integrations
- **Google Sites Ready**: Optimized for iframe embedding in Google Sites

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
- **UI**: React with Tailwind CSS and Radix UI components
- **Database**: Firebase Firestore
- **AI**: Google Genkit with Google AI
- **Forms**: React Hook Form with Zod validation
- **State**: Jotai for client state management
