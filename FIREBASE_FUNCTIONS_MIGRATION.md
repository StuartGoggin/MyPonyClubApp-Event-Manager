# Firebase Functions Migration Guide

## 🎯 **Migration Overview**

This guide shows how to migrate from Next.js API routes to Firebase Functions while keeping the existing frontend on Firebase Hosting.

## 📁 **New Project Structure**

```
project/
├── src/                     # Frontend (Next.js with static export)
├── functions/               # Firebase Functions (NEW)
│   ├── src/
│   │   ├── index.ts        # Function exports
│   │   ├── api/            # Migrated API routes
│   │   └── lib/            # Shared utilities
│   ├── package.json
│   └── tsconfig.json
├── public/                  # Static assets
├── firebase.json           # Updated configuration
└── .env.local              # Local development only
```

## 🔧 **Step 1: Initialize Firebase Functions**

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Functions in your existing project
firebase init functions

# Select:
# - Use existing project
# - TypeScript
# - Yes to ESLint
# - Yes to install dependencies
```

## 🔧 **Step 2: Update Project Configuration**

### Update `firebase.json`:
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ],
    "runtime": "nodejs18"
  }
}
```

### Update `next.config.js` for static export:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Remove server-side specific configs
  webpack: (config, { isServer }) => {
    // Keep client-side optimizations only
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
};

module.exports = nextConfig;
```

## 🔧 **Step 3: Migrate API Routes**

### Functions `package.json`:
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.0.0",
    "firebase-functions": "^4.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "jspdf": "^2.5.0",
    "resend": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^4.9.0",
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0"
  },
  "private": true
}
```

### Main Functions Entry Point (`functions/src/index.ts`):
```typescript
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import express from 'express';
import cors from 'cors';

// Set global options
setGlobalOptions({
  region: 'australia-southeast1', // Or your preferred region
  maxInstances: 10,
});

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Import API routes
import './api/email-queue';
import './api/send-event-request-email';
import './api/clubs';
import './api/zones';
import './api/events';
import './api/health';
// ... import other API modules

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Export the main API function
export const api = onRequest({
  timeoutSeconds: 540,
  memory: '1GiB',
}, app);
```

## 🔧 **Step 4: Environment Variables**

### Set Firebase Function Environment Variables:
```bash
# Set production environment variables
firebase functions:config:set \
  resend.api_key="your_resend_key" \
  firebase.service_account='{"type":"service_account",...}'

# Or use the new recommended approach with .env files
# Create functions/.env.production
echo 'RESEND_API_KEY=your_key' > functions/.env.production
```

## 🔧 **Step 5: Migration Benefits**

### **Security Improvements**:
- ✅ Environment variables server-side only
- ✅ No client-side exposure of API keys
- ✅ Firebase IAM integration
- ✅ Automatic HTTPS everywhere

### **Performance Benefits**:
- ✅ Static frontend served from CDN
- ✅ Functions auto-scale based on demand
- ✅ Reduced bundle size (no server code in client)
- ✅ Better caching strategies

### **Cost Benefits**:
- ✅ Pay-per-execution for functions
- ✅ Free hosting for static assets
- ✅ No always-on server costs
- ✅ Automatic scaling up/down

### **Developer Experience**:
- ✅ Keep existing codebase structure
- ✅ Same Firebase project
- ✅ Unified deployment commands
- ✅ Integrated logging and monitoring

## 🚀 **Deployment Commands**

```bash
# Build and deploy everything
npm run build && firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Local development with emulators
firebase emulators:start
```

## 📊 **Migration Timeline**

1. **Phase 1**: Set up Functions infrastructure (1-2 hours)
2. **Phase 2**: Migrate critical APIs (email, clubs, zones) (2-3 hours)
3. **Phase 3**: Migrate remaining APIs (2-3 hours)
4. **Phase 4**: Update frontend build process (1 hour)
5. **Phase 5**: Testing and deployment (1-2 hours)

**Total Estimated Time**: 6-10 hours for complete migration

## 🎯 **Recommendation**

**Yes, migrate to Firebase Functions!** This will provide:
- Better security for your notification system
- More scalable architecture
- Native Firebase ecosystem integration
- Future-proof for additional features

Would you like me to start implementing this migration?