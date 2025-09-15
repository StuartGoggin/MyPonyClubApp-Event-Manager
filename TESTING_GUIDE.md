# Email Queue Management & Notification System - Testing Guide

## 🚀 Quick Start Testing

### 📧 **Phase 1 Notification System Testing** (NEW)

#### 1. Test Event Request Notification Flow
1. **Navigate to Event Request Form**: `http://localhost:9002/request-event`
2. **Fill out complete form** with multiple events
3. **Submit form** and watch for notification triggers
4. **Check console output** for detailed email logs (development mode)

#### 2. Development Mode Testing (No Resend API Key)
- **Email Simulation**: All emails logged to browser console and server logs
- **Multi-Recipient Testing**: See all three notification types:
  - Requester confirmation email
  - Zone approver notification
  - Super user administrative email
- **Attachment Verification**: Console shows PDF and JSON attachment details
- **Template Testing**: View complete HTML and text email content

#### 3. Production Mode Testing (With Resend API Key)
```bash
# Set your Resend API key in .env.local
RESEND_API_KEY=re_your_actual_key_here
```
- **Real Email Delivery**: Actual emails sent to recipients
- **PDF Attachments**: Verify PDF attachment delivery
- **JSON Exports**: Super users receive administrative JSON data
- **Error Handling**: Test with invalid email addresses

#### 4. API Testing for Notification System
```bash
# Test notification endpoint directly
curl -X POST "http://localhost:9002/api/send-event-request-email" \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {
      "clubId": "test-club",
      "submittedByEmail": "test@example.com",
      "submittedByName": "Test User",
      "submittedByPhone": "0412345678",
      "events": [{
        "eventType": "Test Event",
        "preferredDate": "2025-12-15",
        "location": "Test Location",
        "description": "Test event description",
        "traditionalEvent": false,
        "priority": 1
      }]
    },
    "queue": false
  }'

# Test with queue=true to add to email queue instead of immediate send
curl -X POST "http://localhost:9002/api/send-event-request-email" \
  -H "Content-Type: application/json" \
  -d '{
    "formData": {...},
    "queue": true
  }'
```

#### 5. Email Queue Integration Testing
1. **Submit form with queue=true**: Emails added to queue instead of immediate send
2. **Check Email Queue UI**: `http://localhost:9002/admin/email-queue`
3. **Verify email details**: Recipients, attachments, and content
4. **Test queue send**: Use "Send Email" button to deliver queued notifications

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

### 📧 **Notification System Testing Checklist**

#### Core Notification Features
- [ ] **Multi-Recipient Emails**: Test all three recipient types (requester, zone approver, super user)
- [ ] **PDF Attachment Generation**: Verify PDF creation and attachment to emails
- [ ] **JSON Export Attachment**: Confirm super users receive JSON data export
- [ ] **Reference Number Generation**: Check unique reference number creation (ER-timestamp format)
- [ ] **Zone Approver Lookup**: Test automatic zone coordinator identification based on club selection
- [ ] **Professional Email Templates**: Verify HTML formatting and responsive design

#### Development vs Production Mode
- [ ] **Development Mode** (No `RESEND_API_KEY`):
  - [ ] Email content logged to console
  - [ ] No actual emails sent
  - [ ] All attachments shown in logs
  - [ ] Form submission completes successfully
- [ ] **Production Mode** (With `RESEND_API_KEY`):
  - [ ] Real emails delivered to recipients
  - [ ] PDF attachments received correctly
  - [ ] JSON exports delivered to super users
  - [ ] Error handling for failed email delivery

#### Queue Integration Testing
- [ ] **Queue Mode** (`queue: true`): Emails added to queue for admin review
- [ ] **Direct Mode** (`queue: false`): Immediate email delivery
- [ ] **Queue Management**: Test send/edit/delete from email queue UI
- [ ] **ID Compatibility**: Verify queue-generated IDs work with admin interface

#### Error Scenarios
- [ ] **Missing Zone Approvers**: Test clubs without configured approvers
- [ ] **Invalid Email Addresses**: Test notification system with bad email data
- [ ] **PDF Generation Failure**: Test fallback when PDF creation fails
- [ ] **Network Issues**: Test behavior when Resend API unavailable
- [ ] **Missing Club Data**: Test with invalid or non-existent club IDs

#### Email Content Validation
- [ ] **Requester Email**: Confirmation with PDF attachment and reference number
- [ ] **Zone Approver Email**: Complete event details with club information
- [ ] **Super User Email**: Administrative view with both PDF and JSON attachments
- [ ] **Subject Lines**: Verify proper subject formatting with reference numbers
- [ ] **Email Templates**: Check HTML rendering and text alternatives

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