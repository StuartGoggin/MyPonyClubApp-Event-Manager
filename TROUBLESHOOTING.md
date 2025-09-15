# Troubleshooting Guide - Email Queue System

## 🚨 Common Issues & Quick Fixes

### **Issue: Admin Interface Shows Runtime Errors**
**Error**: `TypeError: email.to.join is not a function`
**Status**: ✅ **FIXED** (September 15, 2025)
**Solution Applied**: Updated admin interface to handle both string and array formats for email fields

### **Issue: 500 Internal Server Error on API Endpoints**
**Error**: API endpoints return 500 errors
**Status**: ✅ **FIXED** (September 15, 2025)
**Root Cause**: Client-side Firebase SDK used in server-side code
**Solution Applied**: Created `email-queue-admin.ts` with proper Admin SDK implementation

### **Issue: 401 Unauthorized Errors**
**Error**: API requests fail with authentication errors
**Status**: ✅ **FIXED** (September 15, 2025)
**Solution Applied**: Updated auth middleware to accept both `admin-token` and `dev-admin-token`

## 🔧 Quick Diagnostic Steps

### **Step 1: Health Check**
```powershell
Invoke-WebRequest -Uri "http://localhost:9002/api/health" | ConvertFrom-Json
```
**Expected Result**:
```json
{
  "status": "ok",
  "database": {"status": "connected", "test": "success"},
  "environment": {"hasServiceAccount": true}
}
```

### **Step 2: Authentication Test**
```powershell
$headers = @{"Authorization" = "Bearer dev-admin-token"}
Invoke-WebRequest -Uri "http://localhost:9002/api/email-queue?action=stats" -Headers $headers
```
**Expected Result**: JSON response with email statistics

### **Step 3: Admin Interface Test**
1. Open: `http://localhost:9002/admin/email-queue`
2. Should load without JavaScript errors
3. Should display email queue dashboard

## 🛠️ Server Issues

### **Dev Server Not Running**
```bash
# Start the development server
npm run dev

# Should output:
# ▲ Next.js 14.x.x
# - Local: http://localhost:9002
```

### **Port Conflicts**
If port 9002 is in use:
```bash
# Kill process on port 9002
netstat -ano | findstr :9002
taskkill /PID <PID_NUMBER> /F

# Or use different port
npm run dev -- -p 3000
```

## 🔐 Authentication Issues

### **Development Tokens**
The system accepts these tokens for development:
- `admin-token`
- `dev-admin-token`

### **Testing Authentication**
```powershell
# Test with curl/PowerShell
$headers = @{"Authorization" = "Bearer admin-token"}
Invoke-WebRequest -Uri "http://localhost:9002/api/email-queue/config" -Headers $headers
```

## 🗄️ Database Issues

### **Firebase Connection Problems**
1. Check `.env.local` file exists
2. Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is set
3. Test with health endpoint

### **Firestore Rules**
Ensure Firestore rules allow admin access:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development only
    }
  }
}
```

## 🧪 Testing Issues

### **PowerShell Execution Policy**
If scripts won't run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Test Script Failing**
```powershell
# Run with verbose output
powershell -ExecutionPolicy Bypass -File "test-simple.ps1" -Verbose
```

## 📊 System Status Verification

### **All Systems Check**
Run the comprehensive test:
```powershell
powershell -ExecutionPolicy Bypass -File "test-simple.ps1"
```

**Expected Output**:
```
✅ Health Check: System Status: ok
✅ Configuration: Config loaded successfully
✅ Queue Operations: Queue accessed successfully
✅ Email Creation: Test email created successfully
✅ Admin Interface: Admin page accessible
```

## 🆘 When All Else Fails

### **Nuclear Option: Fresh Start**
```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

### **Check Browser Console**
1. Open browser dev tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests

### **Check Server Logs**
Look at the terminal running `npm run dev` for server-side errors

---

## 📞 **System Status: 🟢 ALL ISSUES RESOLVED**

As of September 15, 2025, all major issues have been identified and fixed:
- ✅ Authentication working
- ✅ Database connected
- ✅ API endpoints functional
- ✅ Admin interface operational
- ✅ Type safety implemented
- ✅ Error handling robust

For detailed system documentation, see [`SYSTEM_DOCUMENTATION.md`](./SYSTEM_DOCUMENTATION.md)