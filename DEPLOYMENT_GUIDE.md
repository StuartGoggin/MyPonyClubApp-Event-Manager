# Firebase Production Deployment Guide

## 🚨 Important: Environment Variables in Production

The current app uses server-side API routes that require secure environment variables (like `RESEND_API_KEY`). These cannot be safely deployed to Firebase Hosting alone.

## ✅ Recommended Deployment Options

### Option 1: Vercel (Easiest)
Vercel provides full Next.js support with secure environment variables:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables via Vercel dashboard or CLI
vercel env add RESEND_API_KEY production
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
```

### Option 2: Firebase Functions + Hosting
Restructure to use Firebase Functions for API routes:

1. **Move API routes to Firebase Functions**:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase Functions
firebase init functions

# Move /api routes to /functions/src
```

2. **Configure environment variables**:
```bash
# Set function environment variables
firebase functions:config:set resend.api_key="your_key_here"
firebase functions:config:set firebase.service_account="your_json_here"
```

3. **Update deployment**:
```bash
# Deploy both hosting and functions
firebase deploy
```

### Option 3: Other Platforms
- **Railway**: Full Next.js support with environment variables
- **Render**: Similar to Vercel with secure env var support
- **Netlify**: With serverless functions
- **AWS Amplify**: Full-stack deployment option

## 🔧 Required Environment Variables for Production

```env
# Required for all deployments
FIREBASE_SERVICE_ACCOUNT_KEY='{...}'
RESEND_API_KEY=re_your_production_key

# Optional
GEMINI_API_KEY=your_key_here
GOOGLE_GENAI_API_KEY=your_key_here
```

## 🚫 What NOT to Do

❌ **Don't deploy to Firebase Hosting with client-side environment variables**
❌ **Don't commit `.env.local` to version control**
❌ **Don't use NEXT_PUBLIC_ prefix for sensitive keys**

## ✅ Current App Compatibility

This app is designed for platforms that support:
- Server-side rendering (SSR)
- API routes
- Secure environment variables
- File system access (for PDF generation)

**Best Match**: Vercel, Railway, Render, or Firebase Functions + Hosting