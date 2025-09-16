# Firebase Functions API Migration Testing Guide

## Overview

This guide explains how to use the comprehensive testing script (`test-migrated-apis.js`) to validate the Firebase Functions migration. The script tests all migrated API endpoints to ensure no functionality regression occurs during the migration process.

## Prerequisites

### 1. Environment Setup
- **Node.js** (version 16 or higher)
- **Firebase CLI** installed and authenticated
- **Firebase Emulator Suite** for local testing

### 2. Required Services
- Firebase project configured (`ponyclub-events`)
- Firestore database with test data
- Firebase Functions deployed (for production testing)

## Test Script Features

### ✅ **Comprehensive Coverage**
- **5 Core API Endpoints**: Health, Clubs, Zones, Events, Email Notifications
- **CRUD Operations**: GET, POST operations for database connectivity
- **Notification System**: Both queue mode and direct send mode testing
- **Environment Variables**: Verification that Functions can access env vars
- **Error Handling**: Invalid requests and edge case testing

### ✅ **Flexible Configuration**
- **Local Testing**: Firebase emulator endpoints
- **Production Testing**: Live Firebase Functions endpoints
- **Verbose Mode**: Detailed logging for debugging
- **Timeout Handling**: Configurable request timeouts

### ✅ **Migration Success Criteria**
- All core APIs respond correctly
- Notification system sends emails successfully  
- Database operations work properly
- Environment variables accessible in functions
- No functionality regression

## Usage

### Basic Local Testing
```bash
# Start Firebase emulator first
firebase emulators:start --only functions,firestore

# Run tests against local emulator
node test-migrated-apis.js
```

### Production Testing
```bash
# Deploy functions first
firebase deploy --only functions

# Run tests against production
node test-migrated-apis.js --env=production
```

### Verbose Testing
```bash
# Detailed logging
node test-migrated-apis.js --verbose

# Verbose production testing
node test-migrated-apis.js --env=production --verbose
```

### Help
```bash
node test-migrated-apis.js --help
```

## Test Phases

### **Phase 1: Basic Endpoint Health Checks**
- `GET /api/health` - System health verification
- `GET /api/clubs` - Club data retrieval
- `GET /api/zones` - Zone data retrieval  
- `GET /api/events` - Event data retrieval

**Success Criteria**: All endpoints return 200 status with valid JSON data

### **Phase 2: Database Operations Testing**
- `POST /api/clubs` - Club creation with test data
- `POST /api/events` - Event creation with test data

**Success Criteria**: New records created successfully with returned IDs

### **Phase 3: Notification System Testing**
- `POST /api/send-event-request-email` (Queue Mode) - Email queueing
- `POST /api/send-event-request-email` (Direct Mode) - Direct email sending

**Success Criteria**: Both queue and direct send modes work correctly

### **Phase 4: Environment Variables Testing**
- Verification that `RESEND_API_KEY` is accessible
- Environment configuration validation

**Success Criteria**: Functions can access required environment variables

### **Phase 5: Error Handling Testing**
- Invalid endpoint requests (404 errors)
- Invalid POST data validation
- Email notification error scenarios

**Success Criteria**: Proper error responses for invalid requests

## Expected Results

### **Successful Test Run Output**
```
🚀 Starting Comprehensive API Testing for Firebase Functions Migration
Environment: local
Base URL: http://localhost:5001/ponyclub-events/australia-southeast1/api

📋 Phase 1: Basic Endpoint Health Checks
✅ PASSED: Health Endpoint
✅ PASSED: Clubs GET Endpoint
✅ PASSED: Zones GET Endpoint  
✅ PASSED: Events GET Endpoint

📋 Phase 2: Database Operations Testing
✅ PASSED: Clubs POST Endpoint
✅ PASSED: Events POST Endpoint

📋 Phase 3: Notification System Testing
✅ PASSED: Email Notification - Queue Mode
✅ PASSED: Email Notification - Direct Mode

📋 Phase 4: Environment Variables Testing
✅ PASSED: Environment Variables Access

📋 Phase 5: Error Handling Testing
✅ PASSED: Error Handling

🎯 TEST RESULTS SUMMARY
═══════════════════════════════════════════════════════
✅ Tests Passed: 10
❌ Tests Failed: 0
⏱️  Total Duration: 15.23 seconds
🌐 Environment: local

🎯 MIGRATION SUCCESS CRITERIA:
═══════════════════════════════════════════════════════
✅ All core APIs respond correctly
✅ Notification system works (both modes)
✅ Database operations work properly
✅ Environment variables accessible
✅ No functionality regression

🏁 FINAL RESULT:
🎉 ALL MIGRATION SUCCESS CRITERIA PASSED! 🎉
The Firebase Functions migration is ready for production deployment.
```

## Troubleshooting

### **Common Issues**

#### **1. Connection Refused (Local Testing)**
```
Error: connect ECONNREFUSED 127.0.0.1:5001
```
**Solution**: Ensure Firebase emulator is running:
```bash
firebase emulators:start --only functions,firestore
```

#### **2. Environment Variable Errors**
```
Error: RESEND_API_KEY environment variable not accessible
```
**Solution**: Set environment variables for Functions:
```bash
# For local development
echo 'RESEND_API_KEY=your_key_here' > functions/.env

# For production
firebase functions:config:set resend.api_key="your_key_here"
```

#### **3. Test Data Not Found**
```
Error: Expected array of clubs
```
**Solution**: Ensure test data exists in Firestore. Run the seed data script:
```bash
npm run dev
# Navigate to /admin/seed to populate test data
```

## Next Steps

After successful testing:

1. **Deploy to Production**: `firebase deploy --only functions`
2. **Run Production Tests**: `node test-migrated-apis.js --env=production`  
3. **Update Frontend**: Configure frontend to use Functions endpoints
4. **Monitor Performance**: Set up Firebase Functions monitoring
5. **Clean Up**: Remove old Next.js API routes

The testing script is designed to catch any regression issues during migration and ensure a smooth transition to Firebase Functions.