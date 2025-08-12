# Firebase Setup for MyPonyClubApp Event Manager

## Overview
This application uses Firebase Firestore for data storage and requires a Firebase service account for admin operations.

## Setup Instructions

### 1. Firebase Console Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select the `ponyclub-events` project (or create it if it doesn't exist)
3. Navigate to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file

### 2. Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   copy .env.example .env.local
   ```

2. Open `.env.local` and replace the `FIREBASE_SERVICE_ACCOUNT_KEY` with your downloaded JSON:
   - Copy the entire JSON content
   - **Important**: Replace all actual newlines in the `private_key` field with `\\n`
   - The JSON should be on one line

### 3. Seed the Configuration Data
Once your environment is configured, seed the database with configuration data (zones, clubs, event types):
```bash
npm run seed-firestore
```

**Note**: This only seeds configuration/reference data, not transactional data like events.

### 4. Optional: Google AI Setup
For AI features (event date suggestions), add your Google AI API key:
1. Get an API key from [Google AI Studio](https://aistudio.google.com/)
2. Add it to `.env.local`:
   ```
   GOOGLE_GENAI_API_KEY=your-api-key-here
   ```

## Troubleshooting

### Firebase Service Account Issues
- Ensure the JSON is properly formatted (no actual newlines in the private_key)
- Verify the service account has Firestore read/write permissions
- Check that the project ID matches: `ponyclub-events`

### Build Issues
- The app can build without Firebase credentials
- Firebase is only required for runtime data operations
- Admin seeding requires the service account key

## Project Structure
- **Client Firebase**: Uses Firebase Lite SDK for frontend operations
- **Admin Firebase**: Uses Admin SDK for server-side operations and seeding
- **Data Sources**: Mock data is available as fallback during development
