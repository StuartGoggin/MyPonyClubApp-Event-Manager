# Firebase App Hosting - Deployment Workflow

This document outlines the complete workflow for developing and deploying the PonyClub Event Manager application using Firebase App Hosting.

## 🏗️ Architecture Overview

Your application now uses **Firebase App Hosting** with a hybrid architecture:
- **Static Pages**: Marketing pages, dashboards (pre-rendered for performance)
- **Dynamic Pages**: Forms, API routes (server-rendered on demand)
- **Server Actions**: Fully functional for form processing
- **API Routes**: Complete backend functionality restored

## 📋 Prerequisites

- Node.js installed
- Firebase CLI installed and authenticated
- Project configured for Firebase App Hosting
- Environment variables in `.env.local`

## 🛠️ Development Commands

### Local Development
```powershell
# Start local development server
npm run dev
```
- **URL**: http://localhost:3000
- **Features**: Hot reload, instant changes, debugging
- **Use for**: Day-to-day development, testing features

### Test Production Build Locally
```powershell
# Build production version
npm run build

# Run production build locally
npm start
```
- **Purpose**: Test production build before deployment
- **Recommended**: Run before every deployment to catch issues
- **URL**: http://localhost:3000 (production mode)

## 🚀 Deployment Commands

### Primary Deployment Command
```powershell
# Deploy application to Firebase App Hosting
firebase deploy --only apphosting
```
- **This is your main deployment command**
- **Duration**: 2-5 minutes typically
- **Process**: Uploads source code → Cloud build → Deploy
- **Automatic**: Handles build process in the cloud

### Full Deployment (if needed)
```powershell
# Deploy everything (App Hosting + Functions + other services)
firebase deploy
```
- **Use when**: You have changes to Firebase Functions or other services
- **Duration**: 5-10 minutes

## 📊 Monitoring & Status Commands

### Check Deployment Status
```powershell
# List all backends and their URLs
firebase apphosting:backends:list

# Check recent deployments
firebase apphosting:rollouts:list --backend myponyclubapp-events

# View deployment logs
firebase apphosting:rollouts:describe [ROLLOUT_ID] --backend myponyclubapp-events
```

### Environment Management
```powershell
# Check current Firebase project
firebase use

# List available projects
firebase projects:list

# Switch to different project (if you have multiple)
firebase use [project-name]
```

## 🔄 Typical Development Workflow

```powershell
# 1. Make your code changes in VS Code
# (Edit files, add features, fix bugs)

# 2. Test changes locally
npm run dev
# → Test at http://localhost:3000

# 3. Test production build (recommended)
npm run build
# → Check for build errors

# 4. Deploy to Firebase App Hosting
firebase deploy --only apphosting
# → Wait 2-5 minutes for deployment

# 5. Test live application
# → Visit: https://myponyclubapp-events--ponyclub-events.asia-east1.hosted.app
```

## 🌐 Live URLs

- **App Hosting URL**: https://myponyclubapp-events--ponyclub-events.asia-east1.hosted.app
- **Firebase Console**: https://console.firebase.google.com/project/ponyclub-events/apphosting
- **GitHub Repository**: https://github.com/StuartGoggin/MyPonyClubApp-Event-Manager

## ⚡ Quick Reference

| Task | Command |
|------|---------|
| **Local development** | `npm run dev` |
| **Test build** | `npm run build` |
| **Deploy changes** | `firebase deploy --only apphosting` |
| **Check status** | `firebase apphosting:backends:list` |
| **View logs** | Check Firebase Console |

## 💡 Pro Tips

### Development Best Practices
- ✅ **Always test locally first** with `npm run dev`
- ✅ **Run production build** before deploying with `npm run build`
- ✅ **Check console logs** in browser dev tools for errors
- ✅ **Test on different devices/browsers** before deployment

### Deployment Best Practices
- 🚀 **No build step needed** before `firebase deploy` - it builds in the cloud
- 🚀 **Source-based deployment** - uploads your code and builds automatically
- 🚀 **Automatic rollback** - if deployment fails, previous version stays live
- 🚀 **Environment variables** managed through `.env.local`

### Troubleshooting
- 🔧 **Build fails locally**: Fix TypeScript/ESLint errors before deploying
- 🔧 **Deployment fails**: Check Firebase Console logs for details
- 🔧 **App not updating**: Clear browser cache, check deployment completed
- 🔧 **Environment issues**: Verify `.env.local` file is properly configured

## 🔧 Environment Configuration

Your application uses these environment files:
- **`.env.local`**: Local development and build-time variables
- **Firebase Console**: Production environment variables
- **`apphosting.yaml`**: App Hosting configuration

## 📈 Performance & Scaling

Firebase App Hosting automatically handles:
- **Auto-scaling**: Scales up/down based on traffic
- **Global CDN**: Static assets served from edge locations
- **Server-side rendering**: Dynamic pages rendered on demand
- **Cost optimization**: Pay only for actual usage

## 🎯 Key Features Restored

After migration to App Hosting, all functionality is working:
- ✅ **Server Actions**: Form submissions work properly
- ✅ **API Routes**: All admin and backend functions operational
- ✅ **File Uploads**: PCA data import and other upload features
- ✅ **Authentication**: Firebase Auth integration
- ✅ **Database**: Firestore operations
- ✅ **Enhanced Diagnostics**: PCA import diagnostics fully functional

---

**Happy Coding!** 🎉

For questions or issues, check the Firebase Console logs or review this workflow document.