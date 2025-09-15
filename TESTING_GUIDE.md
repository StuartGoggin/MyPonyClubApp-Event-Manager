# Email Queue Management System - Testing Guide

## 🚀 Quick Start Testing

### 1. Access the Admin Interface
1. Navigate to: `http://localhost:9002/admin/email-queue`
2. Use admin token: `admin-token` (for development)
3. Explore the email queue dashboard

### 2. Test Email Submission & Queuing
1. Go to: `http://localhost:9002/request-event`
2. Fill out the event request form
3. Submit to see emails queued for review

## 🧪 API Testing Scripts

### Test Email Queue Configuration
```bash
# Get current configuration
curl -X GET "http://localhost:9002/api/email-queue/config" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json"

# Update configuration to enable email queuing
curl -X POST "http://localhost:9002/api/email-queue/config" \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "requireApprovalForEventRequests": true,
    "requireApprovalForNotifications": false,
    "maxRetries": 3,
    "retryDelayMinutes": 30,
    "maxQueueSize": 100
  }'
```

### Test Email Queue Operations
```bash
# Get all queued emails
curl -X GET "http://localhost:9002/api/email-queue" \
  -H "Authorization: Bearer admin-token"

# Get queue statistics
curl -X GET "http://localhost:9002/api/email-queue?action=stats" \
  -H "Authorization: Bearer admin-token"

# Get emails by status
curl -X GET "http://localhost:9002/api/email-queue?status=draft" \
  -H "Authorization: Bearer admin-token"
```

## 📋 Testing Checklist

### ✅ Authentication Testing
- [ ] Access admin page without token (should be blocked)
- [ ] Access admin page with valid token (should work)
- [ ] API calls without auth header (should return 401)
- [ ] API calls with invalid token (should return 403)

### ✅ Email Queuing Flow
- [ ] Submit event request with queuing enabled
- [ ] Verify email appears in draft status
- [ ] Edit queued email content
- [ ] Approve email (draft → pending)
- [ ] Send email (pending → sent)
- [ ] Check email statistics update

### ✅ Admin Interface Testing
- [ ] View email queue dashboard
- [ ] Filter emails by status/type
- [ ] Search emails by subject/recipient
- [ ] Bulk select and approve multiple emails
- [ ] Edit individual email content
- [ ] Configure queue settings
- [ ] View statistics and metrics

### ✅ Error Handling
- [ ] Test with invalid email data
- [ ] Test sending non-existent email
- [ ] Test bulk operations with mixed valid/invalid IDs
- [ ] Test configuration with invalid values

## 🔧 Development Testing

### Mock Data Testing
Use the browser console on the admin page to add test emails:

```javascript
// Add a test email to the queue
fetch('/api/email-queue', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'add-test-email',
    testEmail: {
      type: 'event_request',
      status: 'draft',
      to: ['test@example.com'],
      subject: 'Test Event Request',
      htmlContent: '<h1>Test Email</h1><p>This is a test email.</p>',
      textContent: 'Test Email\nThis is a test email.',
      createdBy: 'test-user'
    }
  })
})
```

### Environment Variables to Check
Ensure these are set for full functionality:
- `RESEND_API_KEY` (optional - will simulate emails if not set)
- Firebase configuration variables

## 🎯 Key Features to Test

### 1. Email Queue States
Test the email lifecycle: `draft` → `pending` → `sent`

### 2. Configuration Management
- Toggle approval requirements per email type
- Adjust queue size limits and retry settings
- Test auto-send vs manual approval workflows

### 3. Bulk Operations
- Select multiple emails
- Bulk approve, send, or delete
- Verify operations complete successfully

### 4. Real-time Updates
- Open admin interface in two tabs
- Perform actions in one tab
- Verify updates appear in the other tab after refresh

### 5. Error Recovery
- Test sending emails without Resend API key (simulation mode)
- Test handling of malformed email data
- Verify retry mechanisms for failed sends

## 🐛 Troubleshooting

### Common Issues
1. **Authentication Errors**: Use `admin-token` for development
2. **API Not Found**: Ensure development server is running on port 9002
3. **Database Errors**: Check Firebase configuration and permissions
4. **Email Send Failures**: Normal in development without RESEND_API_KEY

### Debug Information
- Check browser console for client-side errors
- Monitor terminal output for server-side logs
- Use browser dev tools to inspect API requests/responses

## 📊 Expected Results

### Successful Email Queue Flow
1. User submits event request → Email queued as "draft"
2. Admin reviews/edits → Email approved to "pending"
3. Admin sends → Email status becomes "sent"
4. Statistics update to reflect new sent email

### Configuration Changes
- Immediate effect on new email submissions
- Existing queued emails unaffected by config changes
- Settings persist across server restarts