# Email Queue Recipient Reevaluation Feature

## Overview
The email queue now supports automatic reevaluation of email recipients when editing queued emails. This ensures that emails are sent to the correct recipients even if the underlying user roles or permissions have changed since the email was originally queued.

## Features

### 1. Automatic Reevaluation
When you click "Edit Email" on a queued email:
- The system automatically reevaluates who should receive the email based on current database state
- Shows a comparison between current recipients (stored in queue) and suggested recipients (based on current rules)
- Displays loading state while fetching suggested recipients

### 2. Manual Reevaluation
- Click the "Reevaluate Recipients" button at any time to refresh the suggested recipients
- Useful if you make changes to user roles while the edit dialog is open

### 3. Apply Suggested Recipients
- If suggested recipients differ from current recipients, an "Apply Suggested" button appears
- One-click to update the email recipients to match current rules
- Manual editing is still available if you need to customize recipients

### 4. Recipient Editing
- Full manual control: you can still edit recipients directly in the text field
- Format: comma-separated email addresses
- Changes are saved when you click "Save Changes"

## Supported Email Types

### Event Request Emails
- **Super User Notifications**: Fetches all active super users from database
- **Zone Approver Notifications**: Fetches zone approvers for specific zone
- **Requester Confirmation**: Includes the original requester's email

### Committee Nomination Emails
- Sent to all active super users

### Event Approval Emails
- Sent to zone approvers for the relevant zone

### Club Notification Emails
- Uses club admin emails from metadata

## Technical Implementation

### API Endpoint
**POST** `/api/email-queue/reevaluate-recipients`

Request body:
```json
{
  "emailType": "event_request",
  "metadata": {
    "superUserEmail": true,
    "zoneId": "zone-123",
    "requesterEmail": "user@example.com"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "suggestedRecipients": [
      "admin1@example.com",
      "admin2@example.com"
    ],
    "emailType": "event_request",
    "metadata": { ... }
  }
}
```

### Database Queries
- **Super Users**: `UserService.getUsers({ role: 'super_user', isActive: true })`
- **Zone Approvers**: `UserService.getUsers({ role: 'zone_approver', isActive: true, zoneId })`
- Filters for valid email addresses
- Removes duplicates from final recipient list

### UI Components
Located in `src/app/admin/email-queue/page.tsx`:

1. **Recipients Section** in Edit Email dialog
   - Editable input field with current recipients
   - "Reevaluate Recipients" button
   - Loading indicator during fetch

2. **Suggested Recipients Panel**
   - Shows current recipients (as stored in queue)
   - Shows suggested recipients (based on current rules)
   - "Apply Suggested" button (only shown if recipients differ)

3. **Auto-reevaluation Effect**
   - Triggers when edit dialog opens
   - Fetches suggested recipients in background
   - Non-blocking - you can edit while suggestions load

## Example Scenarios

### Scenario 1: Super User Changes
1. Event request email queued for `admin@ponyclub.com.au`
2. New super user `newadmin@ponyclub.com.au` added to system
3. Admin edits queued email
4. System shows:
   - Current: `admin@ponyclub.com.au`
   - Suggested: `admin@ponyclub.com.au, newadmin@ponyclub.com.au`
5. Admin clicks "Apply Suggested" to include new super user

### Scenario 2: Zone Approver Update
1. Event approval email queued for `oldapprover@zone.com`
2. Zone approver role transferred to `newapprover@zone.com`
3. Admin edits queued email
4. System shows:
   - Current: `oldapprover@zone.com`
   - Suggested: `newapprover@zone.com`
5. Admin clicks "Apply Suggested" to update recipient

### Scenario 3: Manual Override
1. System suggests multiple recipients
2. Admin decides to send only to specific person
3. Admin manually edits recipient field
4. Admin saves changes without applying suggestions

## Fallback Behavior

### Super User Emails
If no active super users found in database:
1. Checks `SUPER_USER_EMAILS` environment variable
2. Falls back to `admin@ponyclub.com.au`
3. Logs warning about fallback usage

### Zone Approvers
If no zone approvers found:
- Returns empty array
- Email may not have any recipients (admin should add manually)

### API Errors
If reevaluation API fails:
- Error logged to console
- Suggested recipients not displayed
- Current recipients remain unchanged
- Admin can still manually edit recipients

## Files Modified

### Frontend
- `src/app/admin/email-queue/page.tsx`
  - Added state: `suggestedRecipients`, `isLoadingSuggestions`
  - Added function: `reevaluateRecipients()`
  - Added function: `applySuggestedRecipients()`
  - Updated: `saveEmailChanges()` to include recipient updates
  - Enhanced: Edit Email dialog with recipient section
  - Added: useEffect for auto-reevaluation

### Backend
- `src/app/api/email-queue/reevaluate-recipients/route.ts`
  - New API endpoint for recipient reevaluation
  - Functions: `getSuperUserEmails()`, `getZoneApproverEmails()`
  - Switch logic for different email types
  - Deduplication and validation

## Future Enhancements

### Potential Improvements
1. **Email Preview**: Show what the email will look like with new recipients
2. **Recipient Validation**: Check email addresses are valid before saving
3. **Audit Trail**: Log recipient changes with reason/timestamp
4. **Bulk Reevaluation**: Reevaluate recipients for multiple queued emails at once
5. **Scheduled Reevaluation**: Auto-reevaluate daily/weekly for old queued emails
6. **Recipient Groups**: Support for distribution lists or groups
7. **CC/BCC Support**: Extend reevaluation to CC and BCC fields
8. **Test Mode**: Send test email to verify recipients before updating queue

### Email Type Extensions
Add reevaluation support for:
- Newsletter/announcement emails
- Membership renewal reminders
- Event reminder notifications
- Training completion certificates
- Custom admin notifications

## Testing

### Manual Testing Steps
1. Create event request to queue email
2. Verify email queued to super users
3. Add new super user in User Management
4. Go to Email Queue admin page
5. Click "Edit Email" on queued email
6. Verify suggested recipients includes new super user
7. Click "Apply Suggested"
8. Verify recipients updated in queue
9. Send email and verify both super users receive it

### Test Cases
- [ ] Event request with super user recipients
- [ ] Event approval with zone approver recipients
- [ ] Committee nomination with super user recipients
- [ ] No active super users (fallback behavior)
- [ ] No zone approvers for zone (empty array)
- [ ] API error during reevaluation (graceful failure)
- [ ] Manual recipient editing (overrides suggestions)
- [ ] Duplicate recipients removed
- [ ] Invalid email addresses filtered

## Deployment Checklist
- [ ] Frontend changes deployed
- [ ] Backend API endpoint deployed
- [ ] UserService available in API context
- [ ] Database queries optimized for active users
- [ ] Environment variables configured (SUPER_USER_EMAILS)
- [ ] Error logging configured
- [ ] Performance tested with large recipient lists
- [ ] Documentation updated
- [ ] Admin users trained on new feature
