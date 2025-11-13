# Backup Storage Implementation

## Overview
The backup system now fully implements Firebase Storage integration for storing automated backup files.

## Changes Made

### 1. Firebase Storage Integration
- **File**: `src/lib/backup-execution-service.ts`
- Implemented actual Firebase Storage upload in `uploadToFirebaseStorage()` method
- Removed simulated upload delay
- Added proper error handling with specific error messages
- Stores backup metadata including schedule information

### 2. Enhanced BackupExecution Type
- **File**: `src/lib/types-backup.ts`
- Added `storagePath?: string` - Full Firebase Storage path
- Added `downloadUrl?: string` - Signed URL for downloading

### 3. Download API Endpoint
- **File**: `src/app/api/admin/backup-executions/[id]/download/route.ts`
- Generates fresh signed URLs for backup downloads (1 hour validity)
- Validates backup exists and is completed
- Checks file exists in storage before generating URL
- Returns download metadata (filename, size, expiration)

### 4. Backup File Management API
- **File**: `src/app/api/admin/backup-files/route.ts`
- **GET**: Lists all backup files in Firebase Storage with metadata
- **DELETE**: Cleanup old backups based on retention policy
  - Supports dry-run mode for testing
  - Configurable retention period
  - Reports freed space

### 5. Updated UI Component
- **File**: `src/components/admin/backup-history-tile.tsx`
- Implemented real download functionality
- Fetches fresh signed URLs via API
- Handles email-only backups gracefully
- Triggers browser download automatically

## Firebase Storage Structure

```
backups/
  └── backup-{schedule-name}-{date}.zip
      ├── clubs.json
      ├── zones.json
      ├── event-types.json
      ├── events.json (future)
      ├── users.json (future)
      ├── export-info.json (if metadata enabled)
      ├── manifest.json (if manifest enabled)
      └── README.md
```

## Metadata Stored with Files

Each backup file includes custom metadata:
- `uploadedAt`: ISO timestamp
- `uploadedBy`: "BackupScheduler"
- `fileType`: "automated-backup"
- `scheduleId`: Schedule identifier
- `scheduleName`: Human-readable schedule name

## Security Features

1. **Signed URLs**: All downloads use time-limited signed URLs
   - Download endpoint: 1 hour validity
   - Initial storage: 7 days validity (for email delivery)

2. **Validation**: 
   - File existence checks before download
   - Backup status verification
   - Storage path validation

3. **Error Handling**:
   - Permission denied detection
   - Missing bucket detection
   - Network failure handling

## Storage Configuration

### Firebase Storage Rules
Ensure your Firebase Storage rules allow admin access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /backups/{allPaths=**} {
      allow read: if request.auth != null && request.auth.token.role == 'super_user';
      allow write: if request.auth != null && request.auth.token.role == 'super_user';
    }
  }
}
```

### Service Account Permissions
Ensure your service account has these IAM roles:
- `Storage Object Admin` or `Storage Object Creator`
- `Storage Object Viewer` (for downloads)

## Usage Examples

### Manual Backup Download
1. Go to Admin Dashboard → Backups → Backup History
2. Click "View All Backups"
3. Find completed backup
4. Click download icon
5. File downloads automatically via signed URL

### Programmatic Access
```typescript
// Get download URL
const response = await fetch(`/api/admin/backup-executions/${executionId}/download`);
const { downloadUrl, fileName, expiresIn } = await response.json();

// List all backups
const response = await fetch('/api/admin/backup-files');
const { files, totalSize } = await response.json();

// Cleanup old backups (dry run)
const response = await fetch('/api/admin/backup-files?retentionDays=30&dryRun=true', {
  method: 'DELETE'
});
const { deletedCount, freedSpace } = await response.json();
```

## Backup Delivery Methods

The system supports three delivery methods:

1. **Email Only**: Backup sent as attachment, not stored
2. **Storage Only**: Backup stored in Firebase Storage, no email
3. **Both**: Backup stored AND emailed (recommended)

## File Compression

Backups use ZIP compression with configurable levels:
- **Low** (level 1): Fastest, larger files
- **Medium** (level 6): Balanced (default)
- **High** (level 9): Slowest, smallest files

## Monitoring

Check logs for:
- `🔥 Uploading backup to Firebase Storage` - Upload started
- `✅ Backup uploaded successfully` - Upload completed
- `🔗 Download URL (valid for 7 days)` - URL generated
- `❌ Error uploading to Firebase Storage` - Upload failed

## Troubleshooting

### "Firebase Storage not initialized"
- Check `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
- Verify service account JSON is valid
- Ensure Firebase Admin SDK initialization succeeds

### "Permission denied"
- Check Firebase Storage security rules
- Verify service account has correct IAM roles
- Ensure storage bucket exists

### "Backup file no longer exists"
- File may have been manually deleted
- Check retention policy hasn't removed it
- Verify storage path in execution record

## Future Enhancements

- [ ] AWS S3 storage provider
- [ ] Google Drive storage provider
- [ ] Automatic retention policy enforcement
- [ ] Backup verification/integrity checks
- [ ] Restore functionality from UI
- [ ] Backup size quotas and alerts
- [ ] Incremental/differential backups
