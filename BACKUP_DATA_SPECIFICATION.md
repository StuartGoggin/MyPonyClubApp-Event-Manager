# Backup Data Specification

## Overview
This document describes all data that is included in automated backups of the Pony Club Event Manager system.

## Data Collections Exported

### Core Data Collections

#### 1. **Events** (`events.json`)
- All event records with complete details
- Current status (pending, approved, rejected, cancelled)
- Event dates, locations, and coordinator information
- Club and zone associations
- Priority flags and historical markers

#### 2. **Users** (`users.json`)
- All user accounts (active and inactive)
- Authentication details
- Role assignments (Admin, Club Admin, Zone Admin, Member)
- Contact information
- Account creation and update timestamps

#### 3. **Clubs** (`clubs.json`)
- Complete club registry
- Club names, locations, and contact details
- Zone memberships
- Active/inactive status

#### 4. **Zones** (`zones.json`)
- All zone definitions
- Zone names and boundaries
- Associated clubs

#### 5. **Event Types** (`event-types.json`)
- Event type definitions
- Categories and classifications
- Configuration settings

### Approval Workflow & Transaction History

#### 6. **Email Queue** (`email-queue.json`) ⭐ **NEW**
Contains the complete approval workflow history including:
- **Status tracking**: draft, pending, sent, failed, cancelled
- **Approval metadata**:
  - `approvedBy`: Who approved the request
  - `approvedAt`: When it was approved
  - `rejectedBy`: Who rejected the request
  - `rejectedAt`: When it was rejected
  - `rejectionReason`: Explanation for rejection
- **Event request communications**: All emails sent for event approvals
- **Notification history**: System-generated notifications
- **Email content**: Subject, HTML content, recipients (to/cc/bcc)
- **Attachments**: References to attached files
- **Scheduling**: When emails were scheduled/sent
- **Retry information**: Failed delivery attempts and retry count
- **Priority levels**: Email urgency classification

#### 7. **Email Logs** (`email-logs.json`) ⭐ **NEW**
Complete audit trail of email activity:
- **Log entries**: Up to 10,000 most recent email events
- **Status tracking**: success, error, retry, pending
- **Timestamps**: When each action occurred
- **Error details**: Failed delivery information
- **Provider details**: Email service provider used
- **External IDs**: Email provider tracking IDs

#### 8. **Email Templates** (`email-templates.json`) ⭐ **NEW**
Email template definitions:
- **Template names**: Template identifiers
- **Content**: HTML and text versions
- **Variables**: Dynamic field placeholders
- **Usage tracking**: When templates were last used
- **Active status**: Whether template is currently in use

#### 9. **Email Configuration** (`email-config.json`) ⭐ **NEW**
System email settings:
- **Approval requirements**: Which email types require approval
- **Retry settings**: Maximum retry attempts and delays
- **SMTP configuration**: Email server settings
- **Admin notifications**: Admin email addresses
- **Priority defaults**: Default email priority levels

### Metadata & Manifest

#### 10. **Export Information** (`export-info.json`)
- Export timestamp
- System version
- Schedule information
- Total record counts
- Export configuration used

#### 11. **Manifest** (`manifest.json`)
- File checksums and sizes
- Record counts per collection
- Data structure information
- Compression details

#### 12. **README** (`README.md`)
- Human-readable backup summary
- Data contents overview
- Restoration instructions
- Delivery method details

## Data Completeness

### What IS Included ✅
- ✅ All core entity data (events, users, clubs, zones, event types)
- ✅ Complete approval workflow history (who/when/why)
- ✅ Full email communication history
- ✅ Audit trail of all email activity
- ✅ Email templates and configuration
- ✅ System metadata and timestamps
- ✅ All Date fields (serialized as ISO 8601 strings)

### What is NOT Included ❌
- ❌ Firebase Authentication user passwords (security best practice)
- ❌ File attachments binary data (references only)
- ❌ Real-time session data
- ❌ Temporary cache data
- ❌ System logs (separate from email logs)

## Data Format

All data is exported in JSON format with the following considerations:

### Date Serialization
```json
{
  "createdAt": "2025-01-15T10:30:00.000Z",  // ISO 8601 format
  "updatedAt": "2025-01-15T14:45:00.000Z"
}
```

### Record Structure
Each collection maintains its original Firestore structure:
- Document IDs preserved
- Nested objects maintained
- Arrays preserved
- Null values retained

### File Organization
```
backup-YYYY-MM-DD-HHMMSS.zip
├── clubs.json                 # Club records
├── zones.json                 # Zone records
├── event-types.json           # Event type definitions
├── events.json                # Event records with status
├── users.json                 # User accounts
├── email-queue.json           # Approval workflow & emails (NEW)
├── email-logs.json            # Email audit trail (NEW)
├── email-templates.json       # Email templates (NEW)
├── email-config.json          # Email configuration (NEW)
├── export-info.json           # Export metadata
├── manifest.json              # File manifest
└── README.md                  # Human-readable summary
```

## Approval Workflow Tracking

The backup system now captures complete approval workflow history:

### Event Approval Flow
1. Event submitted → Email queued (status: 'draft' or 'pending')
2. Email sent to approvers → Email logs updated
3. Approval/rejection recorded → Email queue updated with:
   - `approvedBy` / `rejectedBy`
   - `approvedAt` / `rejectedAt`
   - `rejectionReason` (if rejected)
4. Notification emails sent → Additional email queue entries
5. All actions logged → Email logs entries

### Audit Trail
Every approval action is traceable through:
- **Email Queue**: Who performed the action and when
- **Email Logs**: Technical details of email delivery
- **Event Status**: Current state of the event
- **Timestamps**: Complete timeline of actions

## Use Cases for Transaction History

### Compliance & Auditing
- Track who approved/rejected events
- Verify approval timelines
- Investigate disputed decisions
- Regulatory compliance reporting

### System Recovery
- Restore complete approval state
- Recreate communication history
- Verify delivered vs pending emails
- Resume failed email delivery

### Analytics & Reporting
- Approval response times
- Email delivery success rates
- Template usage statistics
- Communication patterns

## Backup File Size Estimates

Approximate sizes per 1000 records:

| Collection | Size (1000 records) |
|------------|-------------------|
| Events | ~500 KB |
| Users | ~300 KB |
| Clubs | ~150 KB |
| Zones | ~50 KB |
| Event Types | ~100 KB |
| Email Queue | ~800 KB |
| Email Logs | ~400 KB |
| Email Templates | ~50 KB |

**Total estimate**: ~2.4 MB per 1000 events with full approval history

## Restoration Considerations

When restoring from backup:

1. **Data Order**: Restore in this order:
   - Zones → Clubs → Event Types → Users → Events → Email data

2. **Email Queue**: 
   - Consider which pending emails should be re-sent
   - Update `sentAt` timestamps as needed
   - Review approval states before restoring

3. **User Authentication**:
   - Firebase Authentication passwords NOT included
   - Users may need to reset passwords
   - Consider using Firebase Auth import tool separately

4. **File Attachments**:
   - Only references included in backup
   - Restore Firebase Storage separately
   - Update attachment URLs as needed

## Security Considerations

- Backups contain sensitive data (emails, user info)
- Encrypt backup files if stored long-term
- Restrict access to backup storage
- Consider GDPR/privacy implications
- Password hashes NOT included for security

## Version History

- **v1.0.0** (2025-01-15): Initial specification
  - Core data exports
  - Email queue and approval workflow
  - Email logs and templates
  - Complete audit trail

---

**Last Updated**: November 13, 2025  
**System Version**: 1.0.0
