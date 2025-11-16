# Deployment Guide

## Architecture

This project uses **Firebase App Hosting** for the Next.js application and **Cloud Functions** for serverless backend operations.

### ⚠️ Important: We do NOT use Firebase Hosting (static)

- **App Hosting** = Modern Next.js SSR deployment (what we use)
- **Hosting** = Static file hosting (we don't use this)

## Deployment Commands

### ⚠️ PowerShell Users (Windows)
When using PowerShell, you MUST use quotes around comma-separated lists:
```powershell
firebase deploy --only "functions,apphosting"
```

### Full Deployment (Recommended)
```bash
npm run deploy
```
This builds the project and deploys both App Hosting and Functions.

### Deploy Functions Only
```bash
npm run deploy:functions
```
or
```bash
firebase deploy --only functions
```

### Deploy App Hosting Only
```bash
npm run deploy:apphosting
```
or
```bash
firebase deploy --only apphosting
```

### Deploy Specific Function
```bash
firebase deploy --only functions:functionName
```
Example:
```bash
firebase deploy --only functions:scrapeEquestrianEvents
```

## ❌ DO NOT USE

```bash
firebase deploy --only hosting  # We don't have static hosting configured
firebase deploy                 # Without --only flag will fail
```

## Build Commands

### Development
```bash
npm run dev
```
Runs on http://localhost:9002

### Production Build
```bash
npm run build
```

### Type Checking
```bash
npm run typecheck
```

## Environment Setup

Ensure you have these files:
- `.env.local` - Local development environment variables
- `functions/.env.local` - Cloud Functions environment variables

## Deployment Workflow

1. **Make changes** to your code
2. **Test locally**: `npm run dev`
3. **Type check**: `npm run typecheck`
4. **Build**: `npm run build`
5. **Deploy**: `npm run deploy`

## Firebase Project

- Project ID: `ponyclub-events`
- App Hosting Backend ID: `myponyclubapp-events`
- Region: `australia-southeast1`

## Troubleshooting

### Error: "Directory 'out' for Hosting does not exist"
- You ran `firebase deploy` without `--only` flag
- Solution: Use `npm run deploy` or `firebase deploy --only functions,apphosting`

### App Hosting Deployment Takes Long Time
- App Hosting builds from source on Firebase servers
- This is normal and can take 3-5 minutes

### Functions Deployment Fails
- Check `functions/.env.local` exists
- Ensure you're in the project root directory
- Run `cd functions && npm run build` to check for TypeScript errors
