# Migration Assistant Prompts - Quick Reference

This file contains all the exact prompts to use with the assistant during each phase of the Firebase Functions migration.

---

## 🚀 **PHASE 1: Infrastructure Setup**

### **Step 1.2: Update Firebase Configuration**
```
Please update the firebase.json file to configure Firebase Hosting with static export and Functions routing. The configuration should route /api/** requests to Firebase Functions and serve static files from the 'out' directory for all other requests.
```

### **Step 1.3: Create Functions Package Configuration**
```
Please create a complete functions/package.json file that includes all dependencies needed for the migrated API routes, including firebase-functions, express, cors, jspdf, resend, and all TypeScript types.
```

### **Step 1.4: Set Up Functions Entry Point**
```
Please create the main functions/src/index.ts file that sets up an Express app with CORS, JSON parsing middleware, and exports it as a Firebase Function. Include proper TypeScript types and error handling.
```

---

## 🔄 **PHASE 2: Core API Migration**

### **Step 2.1: Migrate Health Endpoint**
```
Please migrate the /api/health endpoint from src/app/api/health/route.ts to Firebase Functions. Create functions/src/api/health.ts that implements the same functionality with Express routing. Ensure proper error handling and Firebase Admin SDK integration.
```

### **Step 2.2: Migrate Club Management**
```
Please migrate the /api/clubs endpoint from src/app/api/clubs/route.ts to Firebase Functions. Create functions/src/api/clubs.ts with GET, POST, and PUT handlers. Ensure all existing functionality is preserved including Firestore operations.
```

### **Step 2.3: Migrate Zone Management**
```
Please migrate the /api/zones endpoint from src/app/api/zones/route.ts to Firebase Functions. Create functions/src/api/zones.ts with proper zone data retrieval functionality.
```

### **Step 2.4: Migrate Event Management**
```
Please migrate the /api/events endpoint from src/app/api/events/route.ts to Firebase Functions. Create functions/src/api/events.ts with all CRUD operations. Include proper validation and error handling.
```

### **Step 2.5: Migrate Notification System**
```
Please migrate the critical /api/send-event-request-email endpoint from src/app/api/send-event-request-email/route.ts to Firebase Functions. Create functions/src/api/send-event-request-email.ts with full Phase 1 notification functionality including PDF generation, email templates, and multi-recipient support. Ensure environment variables are properly accessed.
```

### **Phase 2 Testing Script**
```
Please create a comprehensive testing script (test-migrated-apis.js) that tests all migrated API endpoints with proper authentication, sample data, and validates responses. Include tests for the notification system with both queue and direct send modes.
```

---

## 🏗️ **PHASE 3: Complete API Migration**

### **Step 3.1: Email Queue Management**
```
Please migrate all email queue management endpoints from src/app/api/email-queue/* to Firebase Functions. Create functions/src/api/email-queue/ directory with separate files for logs.ts, send.ts, and config.ts. Ensure admin authentication is preserved and all queue operations work correctly.
```

### **Step 3.2: Admin Endpoints**
```
Please migrate all admin endpoints from src/app/api/admin/* to Firebase Functions. Create functions/src/api/admin/ directory structure preserving all existing functionality including user management, data import/export, and testing utilities. Ensure proper authentication middleware is implemented.
```

### **Step 3.3: PDF Generation Endpoints**
```
Please migrate PDF generation endpoints from src/app/api/event-request/pdf/* and src/app/api/calendar/pdf/* to Firebase Functions. Create functions/src/api/pdf/ directory with proper PDF generation functionality using jsPDF. Ensure file handling and response formatting work correctly.
```

### **Step 3.4: Authentication & User Management**
```
Please migrate authentication and user management endpoints from src/app/api/auth/* and src/app/api/users/* to Firebase Functions. Create functions/src/api/auth/ and functions/src/api/users/ directories with all existing functionality preserved.
```

### **Step 3.5: Event-Specific Operations**
```
Please migrate dynamic event endpoints from src/app/api/events/[id]/* to Firebase Functions. Create functions/src/api/events-dynamic/ directory with proper parameter handling for event-specific operations including status updates and file uploads.
```

### **Phase 3 Complete Testing**
```
Please create a complete test suite (test-all-functions.js) that validates every migrated API endpoint. Include authentication tests, file upload tests, PDF generation tests, and email queue operations. The test should provide a detailed report of all functionality.
```

---

## 🎨 **PHASE 4: Frontend Migration**

### **Step 4.1: Update Next.js Configuration**
```
Please update next.config.js to configure Next.js for static export suitable for Firebase Hosting. Remove server-side specific configurations and enable static optimization. Also update package.json scripts for the new build process.
```

### **Step 4.2: Update API Client Code**
```
Please create a comprehensive API client utility (src/lib/api-client.ts) that handles all API calls to Firebase Functions. Include proper error handling, authentication headers, and environment-aware endpoint configuration for local development vs production.
```

### **Step 4.3: Update Frontend Components**
```
Please update all frontend components that make API calls to use the new API client. Focus on critical components like the event request form, admin panels, and email queue management. Ensure all functionality is preserved.
```

### **Step 4.4: Environment Configuration**
```
Please create environment configuration for the frontend that works with static export. Set up proper API endpoint configuration for development (emulator) vs production (Functions) environments.
```

---

## 🚀 **PHASE 5: Deployment & Cleanup**

### **Step 5.2: Code Cleanup**
```
Please identify and remove all unused API route files from src/app/api/* that have been migrated to Functions. Create a cleanup script that safely removes these files while preserving any shared utilities. Update imports and references throughout the codebase.
```

### **Step 5.3: Dependencies Cleanup**
```
Please analyze package.json and remove dependencies that are no longer needed in the frontend build now that server-side functionality is in Functions. Update both root package.json and functions/package.json to have only necessary dependencies.
```

### **Step 5.4: Documentation Update**
```
Please update all documentation files (README.md, TESTING_GUIDE.md, DEPLOYMENT_GUIDE.md) to reflect the new Firebase Functions architecture. Include deployment instructions, environment setup for Functions, and testing procedures.
```

### **Step 5.5: Performance Optimization**
```
Please optimize the Firebase Functions configuration for production including memory allocation, timeout settings, and regional deployment. Create a performance tuning guide for the Functions.
```

### **Final Testing Script**
```
Please create a complete production testing checklist and script that validates all functionality in the deployed Firebase environment. Include load testing for Functions, notification system validation, and admin feature verification.
```

---

## 📚 **Post-Migration Documentation**

### **Final Architecture Documentation**
```
Please create a comprehensive Firebase Functions architecture documentation that includes: 1) System architecture diagram, 2) API endpoint documentation, 3) Environment variable guide, 4) Deployment procedures, 5) Monitoring and maintenance guide, 6) Troubleshooting guide.
```

---

## 💡 **Usage Instructions**

1. **Copy the exact prompt** for each step
2. **Paste into conversation** with the assistant
3. **Review the output** before proceeding
4. **Test thoroughly** after each step
5. **Mark completed** in the checklist
6. **Document any issues** in the notes section

## 🔄 **Emergency Rollback Prompts**

### **If You Need to Rollback**
```
Please help me rollback the Firebase Functions migration to the previous Next.js API routes setup. I need to restore the original firebase.json configuration and redeploy the static hosting version while preserving all data and functionality.
```

### **If You Need Migration Status Check**
```
Please analyze the current state of the Firebase Functions migration and provide a status report of what has been completed, what remains to be done, and any issues that need to be addressed before proceeding.
```