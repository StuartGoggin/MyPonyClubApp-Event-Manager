# MyPonyClubApp Event Manager
Event Management System for Pony Club Zones

A Next.js application for managing pony club events, including event requests, calendar management, and zone coordination.

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
