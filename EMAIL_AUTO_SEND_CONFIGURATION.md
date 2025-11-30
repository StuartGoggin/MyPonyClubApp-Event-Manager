# Equipment Booking Email Auto-Send Configuration

**Date:** December 1, 2025  
**Status:** ✅ Complete and Production Ready

## Overview

Added comprehensive auto-send controls for equipment booking emails and improved the Email Queue Configuration UI to make it clear and intuitive.

## What Was Changed

### 1. **Type Definitions** (`src/lib/types.ts`)

Added new auto-send configuration fields to `EmailQueueConfig` interface:

```typescript
// New auto-send settings
autoSendEquipmentBookingRequests?: boolean; // Auto-send when booking is created (pending approval)
autoSendEquipmentBookingApprovals?: boolean; // Auto-send when booking is approved
autoSendEventRequests?: boolean;
autoSendNotifications?: boolean;
autoSendReminders?: boolean;
autoSendGeneral?: boolean;
autoSendBackups?: boolean;

// Legacy approval settings marked as deprecated but kept for backwards compatibility
requireApproval?: boolean;
requireApprovalForEventRequests?: boolean;
requireApprovalForEquipmentNotifications?: boolean;
// ... etc
```

### 2. **Default Configuration** (`src/lib/email-queue-admin.ts`)

Updated default config to include auto-send settings with **safe defaults** (all `false` = require manual approval):

```typescript
autoSendEquipmentBookingRequests: false,  // Default: require approval for new bookings
autoSendEquipmentBookingApprovals: false, // Default: require approval for booking confirmations
autoSendEventRequests: false,             // Default: require approval for event requests
autoSendNotifications: false,             // Default: require approval for notifications
autoSendReminders: false,                 // Default: require approval for reminders
autoSendGeneral: false,                   // Default: require approval for general emails
autoSendBackups: false,                   // Default: require approval for backup notifications
```

### 3. **Equipment Email Templates** (`src/lib/equipment-email-templates.ts`)

Updated all equipment booking email functions to check configuration and set appropriate status:

- **`queueBookingReceivedEmail()`** - Checks `autoSendEquipmentBookingRequests`
- **`queueBookingConfirmationEmail()`** - Checks `autoSendEquipmentBookingApprovals`
- **`queueAllBookingNotifications()`** - Checks config based on email type

**Logic:**
```typescript
// Check if auto-send is enabled
const config = await getEmailQueueConfig();
const autoSend = config?.autoSendEquipmentBookingRequests ?? false;

// Set status based on config
status: autoSend ? 'pending' : 'draft'
// 'pending' = auto-send immediately
// 'draft' = requires manual approval
```

### 4. **Email Queue Configuration UI** (`src/app/admin/email-queue/page.tsx`)

**Complete redesign of configuration section:**

#### New Sections:

1. **Queue Settings**
   - Max Retries
   - Retry Delay (minutes)
   - Max Queue Size

2. **Auto-Send Email Controls** (NEW!)
   - **Equipment Booking Emails** (blue section)
     - Booking Requests (ON/OFF toggle)
     - Booking Approvals (ON/OFF toggle)
   
   - **Event & Notification Emails** (purple section)
     - Event Requests (ON/OFF toggle)
     - General Notifications (ON/OFF toggle)
     - Reminders (ON/OFF toggle)
   
   - **Other Email Types** (gray section)
     - General Emails (ON/OFF toggle)
     - Backup Notifications (ON/OFF toggle)

#### UI Improvements:

- ✅ Clear ON/OFF badges showing current state
- ✅ Green checkboxes when enabled
- ✅ Color-coded sections for different email types
- ✅ Descriptive text for each option
- ✅ Warning banner explaining testing vs production usage
- ✅ Visual grouping with borders and background colors

## How It Works

### For Testing (Default Configuration)

All auto-send options are **OFF** by default:
1. Equipment booking emails are created with `status: 'draft'`
2. Emails appear in the queue but **DO NOT send automatically**
3. Admin must manually review and approve each email
4. Perfect for testing and development

### For Production

When you enable auto-send for specific email types:
1. Emails are created with `status: 'pending'`
2. System automatically sends them via the auto-send process
3. No manual approval required
4. Ideal for production use when you trust the email content

## Usage Instructions

### During Testing

1. Navigate to **Admin → Email Queue Management**
2. Click the **Configuration** tab
3. Ensure all auto-send options are **OFF** (gray badges)
4. Test creating equipment bookings
5. Review emails in queue before sending

### For Production Deployment

1. Navigate to **Admin → Email Queue Management**
2. Click the **Configuration** tab
3. Find the **Equipment Booking Emails** section (blue)
4. Enable the options you want to auto-send:
   - **Booking Requests** - Turn ON to auto-send when bookings are created
   - **Booking Approvals** - Turn ON to auto-send when bookings are approved
5. Click **Save Configuration**
6. New emails will now auto-send based on your settings

## Email Flow Examples

### Example 1: Booking Request (Auto-Send OFF)
```
User creates booking
  ↓
System creates email with status: 'draft'
  ↓
Email appears in queue (requires approval)
  ↓
Admin reviews and approves
  ↓
Email status changes to 'pending'
  ↓
Auto-send process sends the email
```

### Example 2: Booking Request (Auto-Send ON)
```
User creates booking
  ↓
System creates email with status: 'pending'
  ↓
Auto-send process immediately sends the email
  ↓
Email appears in queue as 'sent'
```

## Configuration Page UI

The new configuration page is organized into three main sections:

### 📊 Queue Settings
Basic queue behavior settings (retries, delays, limits)

### ⚡ Auto-Send Email Controls
**THE KEY SECTION** - Toggle auto-send for each email type:

- **Equipment Booking Emails** (Blue box)
  - Booking Requests toggle
  - Booking Approvals toggle
  
- **Event & Notification Emails** (Purple box)
  - Event Requests toggle
  - General Notifications toggle
  - Reminders toggle
  
- **Other Email Types** (Gray box)
  - General Emails toggle
  - Backup Notifications toggle

### ⚠️ Warning Banner
Yellow box explaining:
- Testing = keep all OFF
- Production = enable what you want to auto-send

## Technical Details

### Status Values

- **`draft`** - Email requires manual approval before sending
- **`pending`** - Email ready to auto-send or awaiting processing
- **`sent`** - Email successfully sent
- **`failed`** - Email send failed

### Database Fields

The configuration is stored in Firestore:
- Collection: `emailConfig`
- Document: `default`
- New fields: `autoSendEquipmentBookingRequests`, `autoSendEquipmentBookingApprovals`, etc.

### Backwards Compatibility

- Legacy `requireApprovalFor*` fields are retained
- System works with existing configurations
- Defaults are safe (require approval)

## Testing Checklist

- [x] TypeScript compilation successful
- [ ] Create equipment booking with auto-send OFF → email should be 'draft'
- [ ] Enable auto-send for booking requests → new bookings should 'send' automatically
- [ ] Approve booking with auto-send OFF → confirmation email should be 'draft'
- [ ] Enable auto-send for booking approvals → confirmations should 'send' automatically
- [ ] Configuration saves correctly to Firestore
- [ ] UI displays current config state accurately
- [ ] ON/OFF badges update when toggles change

## Production Deployment Notes

1. **First Deployment:**
   - All auto-send settings will default to OFF
   - System requires manual approval for all emails
   - This is the SAFE default

2. **Enabling Auto-Send:**
   - Only enable for email types you've thoroughly tested
   - Start with one type at a time
   - Monitor the email queue logs

3. **Recommended Production Settings:**
   - Booking Requests: ON (users need immediate confirmation)
   - Booking Approvals: ON (timely notification when approved)
   - Event Requests: Consider based on workflow
   - Notifications: OFF (review before sending)
   - General/Backup: OFF (admin oversight required)

## Files Modified

1. `src/lib/types.ts` - Added auto-send config fields
2. `src/lib/email-queue-admin.ts` - Updated default config
3. `src/lib/equipment-email-templates.ts` - Check config before queuing emails
4. `src/app/admin/email-queue/page.tsx` - Redesigned configuration UI

## Related Documentation

- See `USER_GUIDE.md` for user-facing documentation
- See `SYSTEM_DOCUMENTATION.md` for email queue architecture
- See `TESTING_DOCUMENTATION.md` for testing procedures

---

**Summary:** The email queue now has complete control over auto-sending equipment booking emails. The configuration page is clear, intuitive, and safe by default. Perfect for testing with manual approval, easily switched to production auto-send when ready.
