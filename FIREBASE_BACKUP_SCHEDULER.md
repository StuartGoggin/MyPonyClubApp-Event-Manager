# Firebase Backup Scheduler Setup Guide

## 🎯 **Overview**
Instead of using traditional cron jobs, we've implemented Firebase Cloud Functions that can be triggered by Google Cloud Scheduler. This is the native Firebase way to handle scheduled tasks.

## 🔧 **Functions Created**

### 1. `runBackups` Function
- **Purpose**: Checks for and executes all due backup schedules
- **Trigger**: HTTP endpoint that should be called every 15 minutes
- **URL**: `https://us-central1-[YOUR-PROJECT-ID].cloudfunctions.net/runBackups`

### 2. `triggerBackup` Function  
- **Purpose**: Manually execute a specific backup schedule
- **Trigger**: HTTP POST with `{ "scheduleId": "abc123" }`
- **URL**: `https://us-central1-[YOUR-PROJECT-ID].cloudfunctions.net/triggerBackup`

## 🚀 **Deployment Steps**

### Step 1: Deploy Functions
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Step 2: Set Up Google Cloud Scheduler

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your Firebase project

2. **Enable Cloud Scheduler API**
   - Go to APIs & Services > Library
   - Search for "Cloud Scheduler API"
   - Enable it

3. **Create Scheduled Job**
   - Go to Cloud Scheduler
   - Click "Create Job"
   - Configure:
     - **Name**: `backup-runner`
     - **Frequency**: `*/15 * * * *` (every 15 minutes)
     - **Timezone**: Your preferred timezone
     - **Target Type**: HTTP
     - **URL**: `https://us-central1-[YOUR-PROJECT-ID].cloudfunctions.net/runBackups`
     - **HTTP Method**: POST
     - **Headers**: `Content-Type: application/json`
     - **Body**: `{}`

### Step 3: Test the Setup

1. **Test Manually First**:
   ```bash
   curl -X POST "https://us-central1-[YOUR-PROJECT-ID].cloudfunctions.net/runBackups"
   ```

2. **Check Logs**:
   - Go to Firebase Console > Functions
   - Click on `runBackups` function
   - Check the logs tab

3. **Trigger Test Job**:
   - In Cloud Scheduler, click "Run now" on your job

## 📊 **Monitoring**

### Firebase Functions Console
- Monitor function executions
- View logs and errors
- Check performance metrics

### Cloud Scheduler Console  
- View job history
- Monitor success/failure rates
- Adjust scheduling as needed

### Your Admin Dashboard
- Use the backup statistics API to monitor from your app
- Check execution history in the backup management UI

## 🔄 **Integration with Your App**

The Firebase Functions will:
1. **Query** your `backupSchedules` collection for due schedules
2. **Execute** backups by creating export data
3. **Deliver** via email/storage based on schedule configuration
4. **Update** schedule stats and next run times
5. **Log** all execution details to `backupExecutions` collection

## 🛠️ **Alternative: Manual Testing**

You can also call the functions directly from your Next.js app for testing:

```typescript
// In your admin dashboard
const testBackups = async () => {
  const response = await fetch('https://us-central1-your-project.cloudfunctions.net/runBackups', {
    method: 'POST'
  });
  const result = await response.json();
  console.log('Backup results:', result);
};
```

## 🎯 **Benefits of This Approach**

✅ **Native Firebase Integration**: Uses Firebase's own infrastructure  
✅ **Automatic Scaling**: Functions scale based on demand  
✅ **Built-in Monitoring**: Full logging and error tracking  
✅ **Cost Effective**: Only pay for actual execution time  
✅ **Reliable**: Google's enterprise-grade scheduler  
✅ **Easy Management**: Configure through Google Cloud Console  

This setup gives you enterprise-grade backup scheduling without managing any servers or cron jobs!