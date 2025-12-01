# MyPonyClub Event Manager - Functional Specification

Version 1.0  
Last Updated: December 2, 2025

---

## 1. Purpose and Scope

### 1.1 Purpose

The **MyPonyClub Event Manager** is a comprehensive web-based event management platform designed to streamline the coordination, approval, and communication of equestrian events across the Victorian Pony Club Association network. The system addresses the critical operational challenges faced by multi-tiered pony club organizations in managing events across 171+ clubs organized into 11 geographic zones.

#### 1.1.1 Problems Solved

**1. Event Coordination Complexity**
- **Problem**: Manual coordination of events across 171+ clubs, 11 zones, and state-level administrators creates bottlenecks, miscommunication, and scheduling conflicts
- **Solution**: Centralized event management system with role-based access control enabling club members, zone representatives, and state administrators to collaborate efficiently within defined approval workflows

**2. Timezone and Date Display Inconsistencies**
- **Problem**: Events created in Australian timezone (UTC+10/+11) display incorrect dates in PDF exports when servers run in UTC, causing confusion and scheduling errors (e.g., July 25th events showing as July 24th)
- **Solution**: Timezone-aware date handling using UTC normalization throughout the system, ensuring consistent date display regardless of server timezone or user location

**3. Equipment Booking Conflicts**
- **Problem**: Multiple clubs attempting to book limited shared equipment without visibility into existing reservations leads to double-bookings and scheduling conflicts
- **Solution**: Real-time equipment availability system with visual calendar indicators showing booked dates, preventing conflicts before they occur through proactive feedback

**4. Communication Fragmentation**
- **Problem**: Event notifications scattered across email, phone calls, and manual processes result in missed approvals, delayed responses, and incomplete communication trails
- **Solution**: Automated email queue system with multi-recipient notifications (requesters, zone approvers, super users) providing comprehensive audit trails and guaranteed delivery

**5. Data Import and Migration Challenges**
- **Problem**: Importing user data from spreadsheets with inconsistent club/zone naming, optional role columns, and varying data quality creates data integrity issues and manual reconciliation work
- **Solution**: Intelligent import system with fuzzy matching for club/zone names, optional column handling, role preservation logic, and comprehensive preview/validation workflows

**6. Calendar Export and Integration Limitations**
- **Problem**: External websites and stakeholders unable to embed or access event calendars, requiring manual copy-paste and increasing data staleness
- **Solution**: Embeddable calendar widgets, PDF generation with proper timezone handling, iCal export, and REST API endpoints enabling seamless integration with external systems

### 1.2 Target Audience

#### 1.2.1 Primary Users

**Club Members** (End Users)
- **Count**: 500+ active members across 171 clubs
- **Primary Needs**: Submit event requests, book equipment, view calendar
- **Technical Proficiency**: Basic web navigation skills
- **Access Pattern**: Occasional use (monthly event submissions)
- **Key Features Used**: Event request form with autocomplete, equipment booking calendar, event calendar viewing

**Zone Representatives** (Zone Managers)
- **Count**: 30-40 zone coordinators across 11 zones
- **Primary Needs**: Review and approve club event requests, manage zone-level events, coordinate equipment bookings
- **Technical Proficiency**: Intermediate web application usage
- **Access Pattern**: Weekly review and approval sessions
- **Key Features Used**: Zone approval dashboard, event management, equipment booking approval, email queue review

**State Administrators** (Super Users)
- **Count**: 5-10 state-level administrators
- **Primary Needs**: Oversight of all events, user management, system configuration, data import/export, backup management
- **Technical Proficiency**: Advanced system administration
- **Access Pattern**: Daily system monitoring and administration
- **Key Features Used**: Admin dashboard, user import system, API management, backup scheduler, email queue administration, event type management

#### 1.2.2 Secondary Users

**External Website Visitors**
- Embed calendar widgets on club/association websites
- View public event calendars without authentication
- Submit event requests through embedded forms

**System Integrators**
- Consume REST APIs for event data
- Export iCal feeds for external calendar systems
- Integrate event notifications with external systems

### 1.3 Scope Definition

#### 1.3.1 In Scope

**Event Management**
- ✅ Event creation, editing, and deletion with role-based permissions
- ✅ Multi-tier approval workflow (club → zone → state)
- ✅ Event status management (proposed, approved, rejected, public_holiday, ev_event)
- ✅ Event conflict detection based on geographic proximity
- ✅ Traditional event designation and priority system (1-4 levels)
- ✅ Event schedule document management (PDF, DOCX upload/download)
- ✅ Calendar views with filtering (zone, club, date range, event sources)
- ✅ PDF calendar generation with timezone-correct date display
- ✅ iCal export for external calendar integration

**Equipment Booking System**
- ✅ Equipment reservation creation and management
- ✅ Visual availability calendar with date conflict indicators
- ✅ Two-tier approval workflow (pending → approved)
- ✅ Conflict detection and prevention
- ✅ Email notifications (booking received, booking confirmed)
- ✅ Zone and club-level equipment booking dashboards

**User Management**
- ✅ Role-based access control (standard, zone_rep, state_admin, super_user)
- ✅ User import from CSV/Excel with optional role handling
- ✅ Club and zone association management
- ✅ Historical membership processing with automatic deactivation
- ✅ User directory with autocomplete for event request forms
- ✅ Contact information management (email, phone)

**Communication System**
- ✅ Email queue with approval workflow
- ✅ Multi-recipient notifications (requester, zone approvers, super users)
- ✅ HTML email templates with responsive design
- ✅ PDF and JSON attachment support via Firebase Storage
- ✅ Email status tracking (pending, approved, sent, failed)
- ✅ Resend API integration for production email delivery
- ✅ Development mode with console logging for testing

**Data Management**
- ✅ Automated backup system with Firebase Cloud Scheduler
- ✅ ZIP archive creation with comprehensive data export
- ✅ Event import/export with conflict resolution
- ✅ Club/zone data management with geolocation
- ✅ Event type administration
- ✅ Firebase Firestore database integration
- ✅ Firebase Storage for large file attachments

**Integration Features**
- ✅ Embeddable calendar widgets (full, compact views)
- ✅ Embeddable event request forms
- ✅ REST API endpoints (35+ registered endpoints)
- ✅ API management dashboard with enable/disable controls
- ✅ Multi-environment support (development, production)
- ✅ Health monitoring endpoints

**Technical Infrastructure**
- ✅ Next.js 14 with App Router architecture
- ✅ TypeScript for type safety throughout application
- ✅ Firebase Admin SDK for server-side operations
- ✅ Timezone-aware date handling (UTC normalization)
- ✅ PDF generation with jsPDF library
- ✅ Modern UI with glass morphism design system
- ✅ Responsive design (mobile, tablet, desktop)

#### 1.3.2 Out of Scope

**Payment Processing**
- ❌ Online payment for event registration fees
- ❌ Equipment booking payment collection
- ❌ Membership fee processing
- *Rationale*: Financial transactions require PCI compliance infrastructure beyond current scope

**Real-Time Collaboration**
- ❌ Live chat between users
- ❌ Real-time collaborative document editing
- ❌ WebSocket-based instant notifications
- *Rationale*: Asynchronous email-based workflow sufficient for event management use cases

**Mobile Native Applications**
- ❌ iOS native app
- ❌ Android native app
- *Rationale*: Responsive web application provides mobile access without platform-specific development overhead

**Advanced Event Features**
- ❌ Online event registration forms
- ❌ Participant management and attendance tracking
- ❌ Competition scoring and results management
- ❌ Certificate generation and issuance
- *Rationale*: Focus remains on event coordination and approval, not event execution

**External System Integration**
- ❌ Social media auto-posting
- ❌ SMS notifications
- ❌ Integration with third-party equestrian management systems
- *Rationale*: Email notifications and embeddable widgets provide sufficient external communication channels

**Advanced Analytics**
- ❌ Business intelligence dashboards
- ❌ Predictive analytics for event attendance
- ❌ Machine learning-based conflict prediction
- *Rationale*: Current AI-powered date suggestions provide adequate intelligent scheduling support

**Content Management**
- ❌ Public website content management system
- ❌ Blog or news posting functionality
- ❌ Document library beyond event schedules
- *Rationale*: System focuses on operational event management, not content publishing

**Multi-Organization Support**
- ❌ Multiple association instances from single deployment
- ❌ White-label customization for other associations
- ❌ Cross-association event sharing
- *Rationale*: Application tailored specifically to Victorian Pony Club Association structure

#### 1.3.3 Future Considerations

**Phase 2 Enhancements** (Under Evaluation)
- Event registration and participant management
- Mobile native apps for offline access
- SMS notification integration
- Advanced analytics dashboard
- Competition results management

**Technical Debt Items**
- Migration of remaining API routes to Firebase Functions
- Enhanced test coverage and automated testing
- Performance optimization for large datasets
- Accessibility (WCAG 2.1 AA) compliance audit

### 1.4 Success Criteria

**Operational Metrics**
- ✅ 95%+ reduction in manual event coordination time
- ✅ Zero timezone-related date display errors in production
- ✅ 100% equipment booking conflict prevention rate
- ✅ Email delivery success rate >98%
- ✅ User import success rate >95% with fuzzy matching

**User Satisfaction**
- ✅ Event request form completion time <5 minutes
- ✅ Zone approval workflow completion time <48 hours
- ✅ System uptime >99.5%
- ✅ Mobile responsiveness across all major devices

**Technical Quality**
- ✅ Zero critical security vulnerabilities
- ✅ TypeScript type safety across 100% of codebase
- ✅ Comprehensive error handling with graceful degradation
- ✅ Documentation coverage for all major features

---

## 2. Stakeholders and Users

### 2.1 Primary Stakeholders

#### 2.1.1 Victorian Pony Club Association (Organization)
- **Role**: System owner and primary beneficiary
- **Responsibilities**: Strategic direction, policy setting, system governance
- **Key Interests**: Operational efficiency, data accuracy, member satisfaction, compliance with association rules
- **Decision Authority**: Final approval on feature additions, user access policies, data retention
- **Success Metrics**: Reduced administrative overhead, improved event coordination, enhanced member engagement

#### 2.1.2 State-Level Management
- **Role**: Executive oversight and strategic coordination
- **Responsibilities**: Association-wide policy enforcement, inter-zone coordination, strategic event planning
- **Key Interests**: State-level event visibility, cross-zone conflict resolution, data integrity
- **Representative Count**: 5-10 executive committee members
- **System Interaction**: Monthly strategic reviews, quarterly data analysis, annual planning cycles

#### 2.1.3 Zone Coordinators
- **Role**: Regional event management and approval authority
- **Responsibilities**: Zone event coordination, club request review, equipment allocation oversight
- **Key Interests**: Efficient approval workflows, clear communication channels, conflict-free scheduling
- **Representative Count**: 30-40 coordinators across 11 geographic zones
- **System Interaction**: Weekly approval sessions, bi-weekly zone event planning, continuous email monitoring

#### 2.1.4 Club Committees
- **Role**: Local event organizers and primary content creators
- **Responsibilities**: Event request submission, schedule management, member coordination
- **Key Interests**: Simple event submission, quick approval turnaround, clear communication
- **Representative Count**: 171 clubs with 3-5 committee members each (500+ individuals)
- **System Interaction**: Monthly event submissions, weekly calendar consultations, ongoing equipment bookings

### 2.2 Primary Users

#### 2.2.1 Club Members (Standard Users)
**Profile**
- **User Count**: 500+ active members
- **Demographics**: Ages 18-65, varying technical proficiency (basic to intermediate)
- **Primary Devices**: Desktop (60%), Mobile (30%), Tablet (10%)
- **Usage Frequency**: Monthly for event submissions, weekly for calendar viewing

**Primary Responsibilities**
- Submit event requests on behalf of their clubs
- Book shared equipment for club activities
- View event calendars for planning purposes
- Maintain personal contact information

**Key Features Used**
- Event Request Form with intelligent autocomplete
- Equipment Booking Calendar with availability indicators
- Event Calendar viewing with filtering
- User profile management

**Success Criteria**
- Complete event request in <5 minutes
- Zero booking conflicts due to visibility issues
- Mobile-responsive forms accessible from any device
- Intuitive interface requiring minimal training

**Pain Points Addressed**
- Previously: Manual form filling with no autocomplete → Now: Intelligent user directory integration
- Previously: No equipment availability visibility → Now: Real-time visual calendar indicators
- Previously: Unclear approval status → Now: Email notifications at each workflow stage

#### 2.2.2 Zone Representatives (Zone Managers)
**Profile**
- **User Count**: 30-40 zone coordinators
- **Demographics**: Experienced volunteers, ages 35-60, intermediate to advanced technical skills
- **Primary Devices**: Desktop (80%), Tablet (15%), Mobile (5%)
- **Usage Frequency**: Daily for email monitoring, 2-3x weekly for approval workflows

**Primary Responsibilities**
- Review and approve/reject club event requests
- Create and manage zone-level events
- Approve equipment booking requests
- Coordinate with multiple clubs within zone
- Monitor zone calendar for conflicts

**Key Features Used**
- Zone Approval Dashboard with pending request queue
- Event Management interface for zone events
- Equipment Booking Approval workflow
- Email Queue for multi-club notifications
- Zone Calendar with club filtering

**Success Criteria**
- Process event requests within 48 hours
- Zero missed approval notifications
- Clear visibility of all zone club activities
- Efficient bulk approval capabilities

**Pain Points Addressed**
- Previously: Email scattered across personal accounts → Now: Centralized email queue system
- Previously: Manual conflict checking → Now: Automated geographic proximity detection
- Previously: No approval audit trail → Now: Complete status tracking and email history

#### 2.2.3 State Administrators (Super Users)
**Profile**
- **User Count**: 5-10 state administrators
- **Demographics**: Association staff and senior volunteers, ages 40-65, advanced technical skills
- **Primary Devices**: Desktop (90%), Tablet (10%)
- **Usage Frequency**: Daily system monitoring and administration

**Primary Responsibilities**
- System configuration and maintenance
- User account management and role assignment
- Data import/export operations
- Backup management and data integrity
- Email queue oversight and administration
- API endpoint management
- Event type and zone/club data management
- System health monitoring

**Key Features Used**
- Admin Dashboard with comprehensive controls
- User Import System with CSV/Excel support
- Automated Backup Scheduler
- Email Queue Administration
- API Management Dashboard (35+ endpoints)
- Event Type Management
- Club/Zone Geolocation Management
- System Health Monitoring

**Success Criteria**
- User import success rate >95% with minimal manual intervention
- Automated daily backups with email delivery
- System uptime >99.5%
- Email delivery success rate >98%
- Complete audit trails for all administrative actions

**Pain Points Addressed**
- Previously: Manual user data entry → Now: Intelligent CSV import with fuzzy matching
- Previously: No automated backups → Now: Scheduled backups with Firebase Storage integration
- Previously: Email failures difficult to track → Now: Comprehensive queue management with retry logic
- Previously: Manual timezone corrections in PDFs → Now: Automated UTC normalization

### 2.3 Secondary Users

#### 2.3.1 External Website Visitors (Public Users)
**Profile**
- **User Count**: Unlimited public access
- **Demographics**: Parents, prospective members, community stakeholders
- **Primary Devices**: Mobile (50%), Desktop (40%), Tablet (10%)
- **Usage Frequency**: Ad-hoc calendar viewing, occasional event request submissions

**Primary Needs**
- View public event calendars without authentication
- Access embeddable calendar widgets on club websites
- Submit event requests through embedded forms
- Download calendar exports (iCal format)

**Key Features Used**
- Embeddable Calendar Widgets (full and compact views)
- Embeddable Event Request Forms
- Public Calendar API endpoints
- iCal export functionality

**Integration Points**
- Club websites via iframe embedding
- Google Sites integration
- External calendar applications (Google Calendar, Outlook)

#### 2.3.2 System Integrators (Technical Users)
**Profile**
- **User Count**: 5-10 technical staff or contractors
- **Demographics**: Web developers, system administrators
- **Primary Focus**: External system integration and data synchronization

**Primary Needs**
- Programmatic access to event data
- Calendar feed integration
- Custom report generation
- Data synchronization with external systems

**Key Features Used**
- REST API endpoints (35+ registered)
- JSON data export
- iCal feed generation
- Webhook capabilities (future enhancement)

**Integration Points**
- Association website integration
- Third-party reporting tools
- Email marketing platforms
- External calendar services

### 2.4 External Systems and Integrations

#### 2.4.1 Firebase Platform (Critical Infrastructure)
**Service**: Google Firebase - Backend-as-a-Service Platform

**Components Used**
- **Firestore Database**: Primary data storage for all application entities
  - Collections: events, users, clubs, zones, eventTypes, emailQueue, backupSchedules, equipmentBookings
  - Usage: Real-time data synchronization, offline persistence support
  - Scale: 293 events, 171 clubs, 500+ users, unlimited email queue entries

- **Firebase Storage**: Cloud file storage for large attachments and documents
  - Bucket: ponyclub-events.firebasestorage.app
  - Usage: Event schedule PDFs, backup ZIP archives (8+ MB files), email attachments
  - Retention: 30-day automatic cleanup for backup files

- **Firebase Authentication**: (Planned - currently using custom auth)
  - Future: Secure user authentication with email/password and social providers
  - Current: Development tokens (admin-token, dev-admin-token) for API access

- **Firebase Cloud Scheduler**: (Planned for Phase 2)
  - Automated backup execution (daily, weekly, monthly schedules)
  - Email queue processing automation

**Integration Type**: Direct SDK integration (Admin SDK for server-side, Client SDK for browser)

**Critical Dependencies**: 
- All data persistence operations
- File upload/download functionality
- Email attachment storage for large files
- Future: User authentication, scheduled tasks

**Fallback Strategy**: Local development with Firebase Emulator Suite; production requires active Firebase project

#### 2.4.2 Resend Email Service (Communication Infrastructure)
**Service**: Resend - Modern Email API Platform

**Configuration**
- **API Key**: re_hbMtXjCA_5pkVZWAKFQ6JruJ3WfrJ4TME (production)
- **Sender Domain**: noreply@myponyclub.com (verified domain)
- **Email Templates**: HTML-formatted responsive templates with professional branding

**Usage Patterns**
- Event request notifications (multi-recipient: requester, zone approvers, super users)
- Equipment booking confirmations
- Backup delivery emails with ZIP attachments
- System notifications and alerts

**Email Types**
- **Event Request Notifications**: PDF + JSON attachments, multiple recipients
- **Equipment Booking Received**: Confirmation to requester with booking details
- **Equipment Booking Confirmed**: Approval notification with calendar integration
- **Backup Delivery**: ZIP archive attachment with backup manifest
- **System Alerts**: Administrative notifications for errors or warnings

**Integration Type**: REST API via HTTPS
- Development Mode: Console logging (no API key required)
- Production Mode: Direct Resend API calls with error handling and retry logic

**Fallback Strategy**: Email queue persistence ensures no message loss; failed sends captured for manual retry

**Volume Estimates**
- Event notifications: 50-100/month
- Equipment bookings: 20-40/month
- Backup deliveries: 30-50/month (daily backups to admins)
- Total: ~150-200 emails/month

#### 2.4.3 Google Maps Platform (Geolocation Services)
**Service**: Google Maps JavaScript API and Geocoding API

**Components Used**
- **Maps JavaScript API**: Interactive map display for club location management
- **Geocoding API**: Address-to-coordinates conversion for club geolocation
- **Places API**: Location search and autocomplete for club addresses

**Usage Patterns**
- Batch geolocation of 171+ clubs by zone
- Individual club location setting and adjustment
- Distance calculation for event conflict detection (Haversine formula)
- Visual map display in admin interface

**Integration Type**: Client-side JavaScript API with API key authentication

**Data Flow**
1. Admin initiates club geolocation for zone or individual club
2. System constructs search query: "{clubName}, {suburb}, Victoria, Australia"
3. Google Maps Geocoding API returns latitude/longitude coordinates
4. Coordinates stored in Firestore club records
5. Distance calculations performed server-side using stored coordinates

**Fallback Strategy**: Manual coordinate entry via click-and-drag map interface

**Rate Limits**: Google Maps free tier (up to 28,000 requests/month)

**Critical Features Dependent**
- Event conflict detection based on geographic proximity (<100km radius)
- Club location visualization in admin interface
- Distance display in event dialogs

#### 2.4.4 jsPDF Library (Document Generation)
**Service**: Open-source JavaScript PDF generation library

**Usage Patterns**
- Event request form PDF generation (hybrid approach: original policy page + dynamic form)
- Calendar PDF export (month/year views with timezone-correct dates)
- Zone calendar tabular format PDFs
- Event summary PDFs for administrative reports

**PDF Types Generated**
1. **Event Request PDFs**: 2-page documents with policy + request details
2. **Calendar PDFs**: Professional calendar layouts with event listings
3. **Zone Format PDFs**: Tabular event listings by month
4. **JSON Exports**: Structured data exports for administrative purposes

**Integration Type**: Client-side and server-side JavaScript library (bundled dependency)

**Technical Approach**
- Timezone-aware date formatting using UTC normalization
- Professional typography with Helvetica font family
- Responsive layouts with proper page breaks
- Smart text truncation with ellipsis
- Efficient file size optimization (11KB average)

**Critical Features**
- PDF attachment generation for email notifications
- Downloadable calendar exports for offline viewing
- Printable event documentation for meetings

#### 2.4.5 Next.js Framework (Application Platform)
**Service**: Vercel Next.js - React Framework for Production

**Version**: Next.js 14 with App Router architecture

**Integration Points**
- **App Router**: File-based routing with server and client components
- **API Routes**: RESTful endpoints for all backend operations (35+ registered)
- **Server Actions**: Form submissions and server-side data mutations
- **Image Optimization**: Automatic image optimization and lazy loading
- **Static Site Generation**: Pre-rendered public pages for performance

**Deployment**
- **Development**: Local development server (port 9002)
- **Production**: Cloud hosting platform (Vercel, Firebase Hosting, or similar)

**Build Process**
- TypeScript compilation with full type checking
- CSS optimization with Tailwind CSS
- Bundle optimization and code splitting
- Environment variable injection

**Critical Dependencies**: All application functionality relies on Next.js framework

### 2.5 User Interaction Matrix

| User Type | Event Creation | Event Approval | Equipment Booking | User Management | System Admin | API Access |
|-----------|---------------|----------------|-------------------|-----------------|--------------|------------|
| Club Member | ✅ Submit requests | ❌ | ✅ Create bookings | ❌ | ❌ | ❌ |
| Zone Rep | ✅ Zone events | ✅ Club events | ✅ Approve bookings | ❌ | ❌ | ❌ |
| State Admin | ✅ State events | ✅ All events | ✅ All bookings | ✅ Full access | ✅ Full access | ✅ Read/Write |
| Super User | ✅ All levels | ✅ All events | ✅ All bookings | ✅ Full access | ✅ Full access | ✅ Full control |
| External Visitor | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Read-only |
| System Integrator | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Read-only |

### 2.6 Communication Channels

#### 2.6.1 Internal System Communications
- **Email Queue System**: Centralized email management with approval workflow
- **Status Notifications**: Automatic email updates at each workflow stage
- **Admin Alerts**: System health notifications and error reporting
- **Audit Trails**: Complete logging of all administrative actions

#### 2.6.2 External Communications
- **Event Request Notifications**: Multi-recipient emails (requester, zone approvers, super users)
- **Equipment Booking Confirmations**: Two-stage notification (received, confirmed)
- **Backup Delivery**: Automated email with ZIP attachment to administrators
- **System Downtime Notifications**: Email alerts for maintenance windows

#### 2.6.3 Inter-User Communication (Out of Scope)
- ❌ Direct messaging between users
- ❌ Discussion forums or comment threads
- ❌ Real-time chat functionality
- *Note*: All user communication occurs through email system with proper approval workflows

---

*This stakeholder and user documentation defines all individuals, roles, and external systems involved in the MyPonyClub Event Manager ecosystem, establishing clear responsibilities, interaction patterns, and integration requirements.*

---

## 3. Functional Requirements

### 3.1 Event Management

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **Event Request Submission** | Club members submit new event requests with comprehensive details | • Organizer name (autocomplete from user directory)<br>• Club selection<br>• Event date<br>• Event type<br>• Location<br>• Priority (1-4)<br>• Traditional event flag<br>• Zone qualifier flag<br>• Coordinator details<br>• Event description | 1. User selects organizer name from autocomplete dropdown<br>2. System auto-populates club, email, phone from user directory<br>3. User fills remaining event details with inline validation<br>4. System validates all required fields<br>5. User submits form<br>6. System creates event with 'proposed' status<br>7. System generates PDF attachment<br>8. System queues multi-recipient notifications | • Event record in Firestore (status: 'proposed')<br>• PDF event request document<br>• Email notifications to requester, zone approvers, super users<br>• Unique reference number<br>• Success confirmation message |
| **Event Approval Workflow** | Zone representatives review and approve/reject club event requests | • Event ID<br>• Approval decision (approve/reject)<br>• Optional rejection reason<br>• Zone rep authentication token | 1. Zone rep views pending events in approval dashboard<br>2. System displays event details with conflict detection<br>3. Zone rep selects approve or reject action<br>4. System validates zone rep has authority for event's zone<br>5. System updates event status to 'approved' or 'rejected'<br>6. System generates status change timestamp<br>7. System queues notification emails | • Updated event status<br>• Timestamp of approval/rejection<br>• Email notification to event requester<br>• Updated zone calendar<br>• Audit trail entry |
| **State Event Creation** | State administrators create state-level events that auto-approve | • Event name<br>• Event date<br>• Event type<br>• Location<br>• Description<br>• Contact details | 1. State admin accesses state event management<br>2. System validates admin permissions<br>3. Admin fills event details form<br>4. System automatically sets status to 'approved'<br>5. System sets source to 'state'<br>6. System creates event without zone/club association<br>7. Event immediately visible on all calendars | • Event record with 'approved' status<br>• Source marked as 'state'<br>• No zone/club association<br>• Immediate calendar visibility<br>• Success notification |
| **Zone Event Creation** | Zone reps create zone-wide events for their assigned zones | • Event name<br>• Event date<br>• Event type<br>• Zone selection<br>• Location<br>• Description | 1. Zone rep accesses zone event management<br>2. System filters zones to rep's assigned zone(s)<br>3. Rep fills event form<br>4. System sets status to 'approved' (zone events auto-approve)<br>5. System associates event with zoneId only (no clubId)<br>6. Event visible to all clubs in zone | • Zone event record<br>• Status: 'approved'<br>• Zone association (no club association)<br>• Visible on zone and state calendars<br>• Email notifications to zone clubs |
| **Event Editing** | Authorized users modify existing event details | • Event ID<br>• Updated field values<br>• User authentication<br>• Edit permissions | 1. User accesses event detail view<br>2. System validates edit permissions based on role and event ownership<br>3. User modifies allowed fields in inline edit form<br>4. System validates changes<br>5. System updates event record with timestamp<br>6. If status changes, trigger notification workflow | • Updated event record<br>• Change timestamp<br>• Updated calendar displays<br>• Conditional email notifications<br>• Audit trail of changes |
| **Event Deletion** | Authorized users remove events from the system | • Event ID<br>• User authentication<br>• Deletion confirmation | 1. User selects delete action from event management interface<br>2. System displays confirmation dialog<br>3. User confirms deletion<br>4. System validates deletion permissions<br>5. System removes event from Firestore<br>6. System updates calendar caches | • Event record deleted<br>• Calendar automatically updated<br>• Success confirmation<br>• Audit log entry |
| **Event Conflict Detection** | AI-powered detection of scheduling conflicts based on geographic proximity | • Proposed event date<br>• Event club location (lat/long)<br>• Proximity radius (100km)<br>• Existing events database | 1. System retrieves club coordinates from geolocation data<br>2. System queries events ±1 day from proposed date<br>3. For each nearby event, calculate Haversine distance<br>4. Events within 100km flagged as conflicts<br>5. AI suggests alternative dates based on local event density<br>6. Display conflict warnings in event dialog | • List of conflicting events with distances<br>• AI-suggested alternative dates<br>• Visual conflict indicators<br>• Proximity calculations<br>• Warning messages to user |
| **Event Schedule Upload** | Users attach PDF/DOCX schedule documents to events | • Event ID<br>• Schedule file (PDF, DOCX, TXT)<br>• File size ≤10MB<br>• User authentication | 1. User selects file from local system<br>2. System validates file type and size<br>3. System generates unique filename to prevent conflicts<br>4. Upload to Firebase Storage bucket<br>5. Generate public download URL<br>6. Store URL in event record<br>7. Display schedule in event details panel | • File stored in Firebase Storage<br>• Public download URL<br>• Event record updated with scheduleUrl<br>• Schedule visible in event details<br>• Download link available to authorized users |
| **Traditional Event Designation** | Mark recurring annual events as traditional for priority handling | • Event ID<br>• Traditional event flag (boolean)<br>• User authentication | 1. User checks "Traditional Event" in event form<br>2. System stores isTraditional flag in event record<br>3. Traditional events displayed with special badge<br>4. Higher priority in conflict resolution<br>5. Historical tracking for annual recurrence | • isTraditional flag stored<br>• Visual badge on event cards<br>• Enhanced priority in approvals<br>• Historical pattern recognition |

### 3.2 Calendar Management

| Feature Name | Description | Inputs | Outputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|---------|
| **Monthly Calendar View** | Interactive calendar displaying all events with status indicators | • Selected month/year<br>• Filter options (zone, club, event sources)<br>• User authentication (optional) | 1. System queries events for selected month<br>2. Apply user-selected filters (zone/club/sources)<br>3. Group events by date<br>4. Render calendar grid with weekday headers<br>5. Populate dates with event badges<br>6. Apply status-based color coding<br>7. Highlight weekends with darker background | • Calendar grid (7 columns × 5-6 rows)<br>• Event badges with truncated names<br>• Status color indicators (green=approved, yellow=pending)<br>• Weekend highlighting<br>• Event count rollups for dates with 4+ events |
| **Yearly Calendar View** | 12-month overview showing annual event distribution | • Selected year<br>• Filter options | 1. System generates 12 mini-calendars<br>2. Query events for entire year<br>3. Distribute events across month grids<br>4. Apply compact styling for year view<br>5. Enable month click-through to monthly view | • 12 mini calendar grids<br>• Event indicators on dates<br>• Navigation to monthly detail<br>• Annual event summary statistics |
| **Event Filtering** | Dynamic filtering of calendar events by multiple criteria | • Zone selection<br>• Club selection<br>• Event source toggles (PCA, zone, state, EV, public holidays)<br>• Date range | 1. User selects filter criteria from sidebar<br>2. System builds Firestore query with compound filters<br>3. Apply client-side filtering for sources<br>4. Re-render calendar with filtered events<br>5. Update event count badges<br>6. Persist filter preferences in session | • Filtered event list<br>• Updated calendar display<br>• Filter state indicators<br>• Event count per filter<br>• Responsive filter UI |
| **Calendar PDF Export** | Generate printable PDF calendars with timezone-correct dates | • Calendar scope (month/year/custom)<br>• Year and optional month<br>• Start/end dates (custom range)<br>• Filter scope (all/zone/club)<br>• Zone/club ID<br>• Format (standard/zone)<br>• Event sources filter | 1. System validates export parameters<br>2. Query events with filters applied<br>3. Parse dates using UTC normalization to prevent timezone shifts<br>4. Group events by month using parseDateString()<br>5. Generate PDF using jsPDF library<br>6. Apply format-specific layout (standard or zone tabular)<br>7. Format dates as "25th July 2026" using local date components<br>8. Return PDF buffer with proper headers | • PDF file (11-50KB depending on event count)<br>• Timezone-correct date display<br>• Professional typography (Helvetica)<br>• Event listings with club names<br>• Status indicators and zone qualifier badges<br>• Filename: "{Zone} Calendar {Year} as of {Date}.pdf" |
| **iCal Export** | Generate iCalendar (.ics) format for external calendar integration | • Filter parameters<br>• Date range | 1. Query filtered events<br>2. Transform to iCal VEVENT format<br>3. Generate VCALENDAR wrapper<br>4. Format dates in iCal syntax<br>5. Include event metadata (location, description, organizer) | • .ics file download<br>• Compatible with Google Calendar, Outlook, Apple Calendar<br>• Event metadata preserved |
| **Event Detail Dialog** | Modal displaying comprehensive event information | • Event ID<br>• Click event on calendar | 1. User clicks event on calendar<br>2. System retrieves full event record<br>3. Fetch related data (club, event type, zone)<br>4. Calculate distance to nearby events (if applicable)<br>5. Display dialog with all details and actions<br>6. Load schedule document if available | • Modal dialog with event details<br>• Event date, location, type, status<br>• Club and zone information<br>• Coordinator contact details<br>• Schedule download link<br>• Distance calculations<br>• Edit/delete action buttons (if authorized) |

### 3.3 Equipment Booking System

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **Equipment Booking Creation** | Club members create equipment reservation requests | • Equipment type<br>• Booking date<br>• Club ID<br>• Requester details (name, email, phone)<br>• Purpose/notes | 1. User fills equipment booking form<br>2. System validates date availability<br>3. Check for existing bookings on selected date<br>4. Auto-detect conflicts<br>5. Create booking with 'pending' status if conflicts exist<br>6. Auto-approve if no conflicts detected<br>7. Generate booking reference number<br>8. Queue "booking received" email | • Booking record in Firestore<br>• Status: 'pending' or 'approved'<br>• Unique booking reference<br>• Email to requester (booking received)<br>• Calendar reservation entry |
| **Equipment Availability Calendar** | Visual calendar showing equipment booking availability | • Equipment type<br>• Date range<br>• Zone/club filter | 1. Query existing bookings for equipment type<br>2. Query approved events that may conflict<br>3. Build availability map by date<br>4. Render calendar with visual indicators<br>5. Apply red strikethrough for booked dates<br>6. Enable date selection only for available dates<br>7. Update availability on booking changes | • Interactive calendar picker<br>• Red strikethrough on booked dates<br>• Disabled date selections for conflicts<br>• Real-time availability updates<br>• Visual feedback during date selection |
| **Booking Approval Workflow** | Zone reps approve or reject equipment booking requests | • Booking ID<br>• Approval decision<br>• Zone rep authentication | 1. Zone rep views pending bookings dashboard<br>2. System displays booking details with calendar context<br>3. Zone rep selects approve/reject action<br>4. System validates zone authority<br>5. Update booking status<br>6. Generate approval timestamp<br>7. Queue "booking confirmed" email<br>8. Update equipment availability calendar | • Updated booking status<br>• Approval timestamp<br>• Email to requester (booking confirmed)<br>• Updated availability calendar<br>• Audit trail entry |
| **Booking Cancellation** | Users cancel existing equipment bookings | • Booking ID<br>• Cancellation reason<br>• User authentication | 1. User selects cancel action<br>2. System validates cancellation permissions<br>3. Display confirmation dialog<br>4. User confirms cancellation<br>5. Update booking status to 'cancelled'<br>6. Release date on availability calendar<br>7. Queue cancellation notification email | • Booking status: 'cancelled'<br>• Availability calendar updated<br>• Email notification<br>• Date released for other bookings |
| **Booking Conflict Detection** | Automatic detection of equipment double-booking conflicts | • Requested booking date<br>• Equipment type<br>• Existing bookings database | 1. System queries bookings for same equipment and date<br>2. Check for approved or pending status<br>3. Flag conflicts with warning badge<br>4. Display conflict details to requester<br>5. Automatically set status to 'pending' if conflict exists<br>6. Require zone rep manual approval | • Conflict warning messages<br>• Automatic 'pending' status<br>• Visual conflict indicators<br>• Approval requirement trigger |
| **Zone Equipment Dashboard** | Zone rep interface for managing all equipment bookings | • Zone ID<br>• Date filter<br>• Status filter | 1. Query all bookings for zone's clubs<br>2. Apply date and status filters<br>3. Display in tabular format with key details<br>4. Show booking status with badges<br>5. Provide bulk action capabilities<br>6. Enable inline editing of bookings<br>7. Display calendar availability view | • Booking list with filters<br>• Status badges (pending, approved, cancelled)<br>• Bulk action buttons<br>• Calendar availability view<br>• Edit/approve/reject actions |
| **Club Equipment Dashboard** | Club member interface for managing own club's bookings | • Club ID<br>• User authentication | 1. Query bookings for user's club<br>2. Display current and upcoming bookings<br>3. Show booking history<br>4. Enable creation of new bookings<br>5. Provide edit/cancel actions<br>6. Display availability calendar | • Club's booking list<br>• Create new booking button<br>• Edit/cancel actions<br>• Availability calendar<br>• Booking status indicators |

### 3.4 User Management

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **User Import from CSV/Excel** | Bulk import of user data with intelligent mapping | • CSV or Excel file<br>• Column headers (optional role column)<br>• User confirmation | 1. Parse uploaded file (CSV or Excel)<br>2. Validate required columns (name, email, club)<br>3. Detect optional role column<br>4. Map club names using fuzzy matching algorithm<br>5. Map zone names with normalization<br>6. Validate email formats and data quality<br>7. Detect duplicate IDs<br>8. Process historical membership (auto-deactivate)<br>9. Generate preview summary<br>10. User confirms import<br>11. Batch create/update users in Firestore<br>12. Preserve existing roles if role column absent | • Preview summary with statistics<br>• User records created/updated<br>• Import success report<br>• Error log for failed rows<br>• Club/zone mapping results<br>• Role preservation confirmation |
| **Club/Zone Name Mapping** | Intelligent fuzzy matching of club and zone names during import | • Raw club/zone names from spreadsheet<br>• Database of canonical names | 1. Normalize input text (lowercase, trim, remove punctuation)<br>2. Apply static mapping library for known variations<br>3. Calculate similarity scores using Levenshtein distance<br>4. Check pattern matching for common abbreviations<br>5. Query Firestore for club/zone lookups<br>6. Apply caching to reduce database calls<br>7. Return best match with confidence score<br>8. Flag low-confidence matches for manual review | • Matched club/zone IDs<br>• Confidence scores<br>• Mapping suggestions for review<br>• Failed matches for manual intervention<br>• Mapping statistics |
| **Role Management** | Assignment and modification of user roles with preservation logic | • User ID<br>• New role (standard, zone_rep, state_admin, super_user)<br>• Admin authentication | 1. Admin selects user from user management interface<br>2. Admin chooses new role from dropdown<br>3. System validates admin has authority to assign role<br>4. System updates user role in Firestore<br>5. If role changes impact permissions, trigger cache invalidation<br>6. Log role change in audit trail<br>7. Preserve super_user roles during import if role column missing | • Updated user role<br>• Audit log entry<br>• Permission cache invalidation<br>• Role change confirmation |
| **User Directory Autocomplete** | Intelligent user search for event request forms | • Search query (partial name)<br>• Active users only | 1. User types name in organizer field<br>2. System searches users by first name, last name, full name<br>3. Apply fuzzy matching for typos<br>4. Filter to active users only<br>5. Rank results by match quality<br>6. Display top 10 matches in dropdown<br>7. On selection, auto-populate club, email, phone | • Autocomplete dropdown list<br>• User profile preview<br>• Auto-populated contact fields<br>• Matched user record |
| **User Deactivation** | Marking users as inactive for historical memberships | • User ID or historical membership flag<br>• Admin authentication | 1. System detects "Historical Membership" in import data<br>2. Set user status to 'inactive'<br>3. Preserve user record in database<br>4. Exclude from active user lists<br>5. Prevent login (when auth implemented)<br>6. Preserve role for audit purposes | • User status: 'inactive'<br>• User preserved in database<br>• Excluded from active user queries<br>• Role preserved for history |
| **User Profile Management** | Users update their own contact information | • User ID<br>• Updated email, phone, address<br>• User authentication | 1. User accesses profile settings<br>2. System displays current information<br>3. User edits allowed fields<br>4. System validates email format and phone number<br>5. Update user record in Firestore<br>6. Update any cached user data | • Updated user profile<br>• Validation confirmation<br>• Success message<br>• Updated autocomplete data |

### 3.5 Email Queue and Notifications

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **Email Queue Creation** | Add emails to queue for admin review or immediate sending | • Recipients (to, cc, bcc arrays)<br>• Subject<br>• HTML body<br>• Plain text body<br>• Attachments (optional)<br>• Email type<br>• Metadata<br>• Priority<br>• Send mode (queue/immediate) | 1. Normalize recipient arrays (handle string or array input)<br>2. Validate email addresses<br>3. Process attachments (base64 encode or Firebase Storage URL)<br>4. Generate unique email ID<br>5. Set status based on send mode ('pending' or 'approved')<br>6. Add to Firestore emailQueue collection<br>7. If immediate send, trigger delivery process<br>8. Store metadata for filtering and reporting | • Email record in queue<br>• Status: 'pending' or 'approved'<br>• Unique email ID<br>• Timestamp created<br>• Attachment references |
| **Email Queue Approval** | Admin reviews and approves queued emails before sending | • Email ID<br>• Admin authentication<br>• Approval decision | 1. Admin views email queue dashboard<br>2. System displays pending emails with preview<br>3. Admin reviews email content and recipients<br>4. Admin clicks approve or reject<br>5. System validates admin permissions<br>6. Update email status to 'approved' or 'rejected'<br>7. If approved, trigger send process<br>8. Log approval action | • Email status updated<br>• Approval timestamp<br>• Approver ID logged<br>• Send triggered (if approved)<br>• Audit trail entry |
| **Email Delivery** | Send approved emails via Resend API | • Email ID<br>• Email content<br>• Recipient list<br>• Attachments | 1. Retrieve email record from queue<br>2. Download attachments from Firebase Storage if needed<br>3. Construct Resend API request payload<br>4. Set sender domain (noreply@myponyclub.com)<br>5. Call Resend API with retry logic<br>6. Handle API response<br>7. Update email status to 'sent' or 'failed'<br>8. Store sent timestamp and message ID<br>9. Log delivery result | • Email delivered to recipients<br>• Status: 'sent' or 'failed'<br>• Resend message ID<br>• Sent timestamp<br>• Delivery confirmation<br>• Error details (if failed) |
| **Event Request Notifications** | Multi-recipient email notifications for event submissions | • Event request data<br>• PDF attachment<br>• JSON export<br>• Recipient roles | 1. Generate event request PDF<br>2. Create JSON export for admins<br>3. Identify recipients:<br>&nbsp;&nbsp;&nbsp;- Requester email<br>&nbsp;&nbsp;&nbsp;- Zone approver emails (lookup by zone)<br>&nbsp;&nbsp;&nbsp;- Super user emails<br>4. Create separate emails for each recipient type<br>5. Attach PDF to all emails<br>6. Attach JSON to super user emails only<br>7. Queue emails with appropriate metadata<br>8. Set priority and email type | • 3+ emails queued:<br>&nbsp;&nbsp;&nbsp;- Requester confirmation<br>&nbsp;&nbsp;&nbsp;- Zone approver notification(s)<br>&nbsp;&nbsp;&nbsp;- Super user notification(s)<br>• PDF attached to all<br>• JSON attached to admin emails<br>• Reference number in all emails |
| **Equipment Booking Notifications** | Two-stage email notifications for equipment bookings | • Booking data<br>• Requester contact<br>• Booking status | **Stage 1 - Booking Received:**<br>1. Generate booking received email<br>2. Include booking details and reference number<br>3. Send to requester immediately<br><br>**Stage 2 - Booking Confirmed:**<br>1. Trigger on booking approval<br>2. Generate booking confirmed email<br>3. Include approval details and calendar integration<br>4. Send to requester | • "Booking Received" email (immediate)<br>• "Booking Confirmed" email (on approval)<br>• Booking reference in both emails<br>• Calendar invite attachment (optional) |
| **Backup Delivery Emails** | Automated emails delivering backup ZIP archives to administrators | • Backup ZIP file (8+ MB)<br>• Backup manifest<br>• Admin email list<br>• Backup metadata | 1. Upload large ZIP to Firebase Storage<br>2. Generate time-limited download URL (30-day expiry)<br>3. Create HTML email with backup details:<br>&nbsp;&nbsp;&nbsp;- Backup timestamp<br>&nbsp;&nbsp;&nbsp;- File size<br>&nbsp;&nbsp;&nbsp;- Event count<br>&nbsp;&nbsp;&nbsp;- Download link<br>4. Set high priority<br>5. Bypass approval (auto-approved)<br>6. Queue for immediate sending | • HTML email to all admins<br>• Firebase Storage download URL<br>• Backup statistics<br>• 30-day file expiry notice<br>• Professional branding |
| **Email Queue Dashboard** | Admin interface for managing all queued emails | • Admin authentication<br>• Filter criteria (status, type, date) | 1. Query emailQueue collection with filters<br>2. Display emails in tabular format<br>3. Show status badges (pending, approved, sent, failed)<br>4. Enable bulk selection<br>5. Provide bulk approve/delete actions<br>6. Display email preview on click<br>7. Show attachment indicators<br>8. Calculate queue statistics | • Email list with filters<br>• Status badges<br>• Bulk action buttons<br>• Email preview modal<br>• Queue statistics (total, pending, sent, failed) |
| **Email Retry Mechanism** | Automatic retry of failed email deliveries | • Failed email ID<br>• Error details<br>• Retry count | 1. Detect email send failure<br>2. Check retry count (max 3 attempts)<br>3. Wait exponential backoff (1m, 5m, 15m)<br>4. Retry delivery via Resend API<br>5. Update retry count<br>6. If still failing after max retries, mark as 'failed'<br>7. Log all retry attempts | • Retry attempt logged<br>• Updated retry count<br>• Final status (sent/failed)<br>• Error history preserved |

### 3.6 Data Import/Export and Backup

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **Event Export to ZIP** | Comprehensive event data export with schedule files | • Filter criteria (event types, date range)<br>• Export configuration<br>• Admin authentication | 1. Query events matching filters<br>2. Fetch related data (clubs, zones, event types)<br>3. Download schedule PDFs from Firebase Storage<br>4. Create JSON export with all event data<br>5. Generate export manifest with metadata<br>6. Calculate SHA-256 checksums for verification<br>7. Create ZIP archive with JSZip library<br>8. Include manifest, events JSON, schedule PDFs<br>9. Return ZIP as downloadable file | • ZIP archive download<br>• events.json (structured data)<br>• manifest.json (metadata + checksums)<br>• schedule/*.pdf (event documents)<br>• Filename: "events_export_{timestamp}.zip" |
| **Event Import from ZIP** | Data restoration with conflict detection and resolution | • ZIP file upload<br>• Conflict resolution strategy<br>• Import configuration<br>• Admin authentication | 1. Extract and parse ZIP archive<br>2. Validate manifest and checksums<br>3. Parse events.json<br>4. Detect conflicts (duplicate IDs, names, dates)<br>5. Display conflict resolution UI<br>6. User selects strategy (skip, overwrite, rename)<br>7. Import events to Firestore<br>8. Upload schedule PDFs to Firebase Storage<br>9. Update event records with storage URLs<br>10. Generate import report | • Import summary report<br>• Events created/updated count<br>• Schedule files restored<br>• Conflict resolution log<br>• Error report for failed imports |
| **Automated Backup System** | Scheduled database backups with email delivery | • Backup schedule configuration<br>• Recipient email list<br>• Backup frequency (daily/weekly/monthly) | 1. Firebase Cloud Scheduler triggers backup function<br>2. Export all critical collections (events, users, clubs, zones, eventTypes)<br>3. Generate comprehensive data JSON<br>4. Create ZIP archive with JSZip<br>5. If file >8MB, upload to Firebase Storage<br>6. Generate download URL with 30-day expiry<br>7. Create backup email with statistics<br>8. Queue email with high priority (auto-approved)<br>9. Send to all administrators<br>10. Log backup execution | • ZIP backup file (Firebase Storage)<br>• Email to admins with download link<br>• Backup manifest with statistics<br>• Execution log<br>• 30-day file retention |
| **Manual Backup Trigger** | On-demand backup execution from admin dashboard | • Admin authentication<br>• Backup configuration (optional) | 1. Admin clicks "Backup Now" button<br>2. System validates admin permissions<br>3. Execute backup process (same as scheduled)<br>4. Display real-time progress indicators<br>5. Complete backup generation<br>6. Send immediate email notification<br>7. Provide download link in UI | • Backup ZIP file<br>• Email notification<br>• Download link in admin UI<br>• Success confirmation<br>• Backup metadata |
| **Calendar Import** | Import events from CSV/Excel/PDF/DOCX files | • File upload (CSV, XLSX, PDF, DOCX, TXT)<br>• Club selection<br>• Import configuration | 1. Parse uploaded file based on type<br>2. Extract date, event name, location<br>3. Apply intelligent date parsing (Pony Club formats)<br>4. Match club names with database<br>5. Validate event data quality<br>6. Display import preview with match confidence<br>7. User confirms import<br>8. Batch create events in Firestore<br>9. Generate import report | • Events created in database<br>• Import success/failure report<br>• Club match results<br>• Data quality warnings<br>• Rollback option available |

### 3.7 Administration and Configuration

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **API Endpoint Management** | Enable/disable API endpoints dynamically | • Endpoint ID<br>• Enable/disable action<br>• Admin authentication | 1. Admin accesses API management dashboard<br>2. View 35+ registered endpoints organized by category<br>3. Select endpoint to modify<br>4. Toggle enable/disable switch<br>5. System updates endpoint configuration<br>6. Apply changes immediately (no restart required)<br>7. Log configuration change | • Endpoint enabled/disabled<br>• Configuration updated<br>• Change logged<br>• Immediate effect on API availability |
| **Event Type Management** | Define and manage event type categories | • Event type name<br>• Description<br>• Category<br>• Admin authentication | 1. Admin accesses event type management<br>2. Create new event type or edit existing<br>3. System validates unique name<br>4. Save to eventTypes collection<br>5. Update event type pick-lists throughout application<br>6. Invalidate related caches | • New event type created<br>• Available in event forms<br>• Pick-list updated<br>• Cache invalidated |
| **Club Geolocation Management** | Set geographic coordinates for clubs | • Club ID(s)<br>• Manual coordinates or address<br>• Google Maps interaction | 1. Admin selects zone or individual club<br>2. For batch: iterate through clubs in zone<br>3. Construct search query: "{club name}, {suburb}, VIC, Australia"<br>4. Call Google Maps Geocoding API<br>5. Receive latitude/longitude coordinates<br>6. Display on interactive map for verification<br>7. Admin confirms or manually adjusts via drag<br>8. Save coordinates to club record | • Club latitude/longitude stored<br>• Visual map confirmation<br>• Batch geolocation report<br>• Distance calculation enabled for conflicts |
| **Zone Management** | Configure geographic zones and boundaries | • Zone name<br>• Zone abbreviation<br>• Geographic boundaries<br>• Club assignments | 1. Admin creates or edits zone<br>2. Define zone name and abbreviation<br>3. Set geographic boundaries (optional)<br>4. Assign clubs to zone<br>5. Save zone configuration<br>6. Update zone-based filtering throughout app | • Zone created/updated<br>• Club assignments saved<br>• Zone filters updated<br>• Calendar filtering enabled |
| **System Health Monitoring** | Real-time monitoring of system components | • Monitoring request<br>• Component identifiers | 1. Execute health check endpoint<br>2. Test database connectivity (Firestore)<br>3. Verify Firebase Storage access<br>4. Check email service availability<br>5. Test API endpoint responsiveness<br>6. Aggregate health status<br>7. Return comprehensive status report | • JSON health report<br>• Component status (ok/degraded/down)<br>• Response time metrics<br>• Error details (if any)<br>• Timestamp |
| **Base URL Configuration** | Switch between development and production environments | • Environment selection (dev/prod)<br>• Base URL | 1. Admin selects environment from dropdown<br>2. System updates API base URL configuration<br>3. All API calls use new base URL<br>4. Session persists environment preference<br>5. Display current environment indicator | • Base URL updated<br>• Environment indicator visible<br>• API calls route to selected environment |

### 3.8 Embeddable Widgets and Public Access

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **Embeddable Full Calendar** | Complete calendar view for external websites | • Filter parameters (zone, club, sources)<br>• Date range<br>• iframe embed code | 1. External site includes iframe with calendar URL<br>2. System suppresses navigation sidebar for embed mode<br>3. Render full calendar with filter controls<br>4. Apply responsive styling for iframe container<br>5. Enable event click interactions<br>6. Load events via public API | • Interactive calendar iframe<br>• Full filtering capabilities<br>• Event detail dialogs<br>• Responsive layout<br>• No authentication required |
| **Embeddable Compact Calendar** | Streamlined calendar for smaller spaces | • Filter parameters<br>• Date range<br>• Compact mode flag | 1. Detect compact mode from URL parameter<br>2. Render calendar with reduced controls<br>3. Hide advanced filters<br>4. Apply mobile-optimized styling<br>5. Limit event display per date<br>6. Optimize for small iframe sizes | • Compact calendar iframe<br>• Simplified controls<br>• Mobile-optimized layout<br>• Minimal UI chrome |
| **Embeddable Event Request Form** | Standalone event submission form for external sites | • Club parameter (optional)<br>• Prefill data (optional) | 1. External site embeds form via iframe<br>2. System detects embed mode<br>3. Render event request form<br>4. Prefill club if provided in URL<br>5. User completes form<br>6. Submit via API<br>7. Display success message in iframe | • Event request form iframe<br>• Prefilled club data (optional)<br>• Form submission handling<br>• Success confirmation in iframe |
| **Public Calendar API** | JSON endpoint for external calendar integration | • Filter parameters<br>• Date range<br>• Format (json/ical) | 1. External system calls public API endpoint<br>2. System validates parameters<br>3. Query public events (approved status only)<br>4. Apply filters and date range<br>5. Transform to requested format<br>6. Return JSON or iCal response<br>7. Enable CORS for cross-origin requests | • JSON event array or iCal feed<br>• Public events only<br>• CORS headers enabled<br>• Cacheable responses |
| **iCal Feed Generation** | Calendar subscription feed for external calendar apps | • Filter parameters<br>• Feed URL | 1. User subscribes to iCal feed URL<br>2. Calendar app polls endpoint periodically<br>3. System generates VCALENDAR format<br>4. Include VEVENT entries for all events<br>5. Format dates in iCal syntax<br>6. Return .ics file with proper MIME type | • .ics calendar feed<br>• Compatible with Google Calendar, Outlook, Apple Calendar<br>• Auto-updating subscription<br>• Event metadata included |

### 3.9 Reporting and Analytics

| Feature Name | Description | Inputs | Process | Outputs |
|-------------|-------------|---------|---------|---------|
| **Event Statistics Dashboard** | Summary statistics for event management | • Date range<br>• Filter criteria | 1. Query events within date range<br>2. Calculate totals by status<br>3. Group by zone and club<br>4. Count events by type<br>5. Calculate approval rates<br>6. Identify busiest months<br>7. Generate visual charts | • Total event counts<br>• Events by status breakdown<br>• Zone/club distribution<br>• Event type popularity<br>• Approval rate percentage<br>• Monthly trends |
| **Equipment Booking Reports** | Analysis of equipment usage and availability | • Date range<br>• Equipment type<br>• Zone filter | 1. Query bookings within range<br>2. Calculate utilization rates<br>3. Identify peak booking periods<br>4. Analyze conflict frequency<br>5. Generate availability heatmap<br>6. Calculate average approval time | • Utilization percentage<br>• Peak booking periods<br>• Conflict frequency<br>• Approval time metrics<br>• Availability heatmap |
| **User Activity Reports** | Track user engagement and system usage | • Date range<br>• User role filter | 1. Query user activity logs<br>2. Calculate login frequency<br>3. Track event submissions per user<br>4. Measure approval workflow timing<br>5. Identify inactive users<br>6. Generate engagement metrics | • Active user count<br>• Submissions per user<br>• Average approval time<br>• Inactive user list<br>• Engagement trends |

---

*This comprehensive functional requirements table documents all features built into the MyPonyClub Event Manager system, providing complete visibility into inputs, processes, and outputs for each capability.*

---

## 4. User Stories and Process Flows

### 4.1 Club Member User Stories

#### 4.1.1 Event Request Submission

**User Story:**  
*As a club member, I want to submit event requests with minimal data entry so that I can quickly propose events without searching for information I've already provided.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Request Event Form]
  ↓
[Enter/Select Organizer Name] ← Autocomplete from user directory
  ↓
[System Auto-Populates] → Club, Email, Phone
  ↓
[Fill Event Details]
  ├─ Event Date (calendar picker)
  ├─ Event Type (dropdown)
  ├─ Location
  ├─ Priority (1-4)
  ├─ Traditional Event? (checkbox)
  └─ Zone Qualifier? (checkbox)
  ↓
[Review Form Completion] ← Progress indicators show status
  ↓
[Submit Request]
  ↓
[System Validates] → All required fields present?
  ├─ NO → Display validation errors → [Return to form]
  └─ YES → Continue
       ↓
[Generate Event Record] → Status: 'proposed'
       ↓
[Generate PDF Attachment]
       ↓
[Queue Notifications]
  ├─ Email to Requester (confirmation)
  ├─ Email to Zone Approvers
  └─ Email to Super Users
       ↓
[Display Success Message] → Reference number shown
  ↓
END
```

**Acceptance Criteria:**
- Form completion time < 5 minutes
- Auto-population reduces manual data entry by 60%
- All notifications queued successfully
- Reference number provided immediately
- PDF generated with correct timezone dates

---

#### 4.1.2 Equipment Booking Request

**User Story:**  
*As a club member, I want to see equipment availability before selecting dates so that I don't request unavailable time slots.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Equipment Booking]
  ↓
[Select Equipment Type] → Dropdown of available equipment
  ↓
[View Availability Calendar]
  ├─ Visual indicators:
  │  ├─ RED STRIKETHROUGH = Booked
  │  ├─ ENABLED = Available
  │  └─ DISABLED = Past dates
  ↓
[Select Available Date] → Only enabled dates clickable
  ↓
[Fill Booking Details]
  ├─ Requester name
  ├─ Contact email
  ├─ Contact phone
  └─ Purpose/notes
  ↓
[Submit Booking Request]
  ↓
[System Checks Conflicts]
  ├─ CONFLICT DETECTED
  │   ├─ Set status: 'pending'
  │   ├─ Display warning
  │   └─ Require zone rep approval
  └─ NO CONFLICT
      ├─ Set status: 'approved'
      └─ Auto-approve booking
       ↓
[Queue "Booking Received" Email] → Immediate to requester
  ↓
[Display Confirmation] → Booking reference number
  ↓
END
```

**Acceptance Criteria:**
- Real-time availability visible on calendar
- Conflicts prevented before submission
- Auto-approval if no conflicts (< 2 seconds)
- Confirmation email within 30 seconds
- Calendar updated immediately

---

#### 4.1.3 View Event Calendar

**User Story:**  
*As a club member, I want to filter the calendar to show only events relevant to my club and zone so that I can plan activities without information overload.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Calendar View]
  ↓
[Default View] → All approved events, current month
  ↓
[Apply Filters] (Optional)
  ├─ Zone filter → Select specific zone
  ├─ Club filter → Select specific club
  ├─ Event sources → Toggle PCA/Zone/State/EV/Holidays
  └─ Date range → Select month/year or custom range
  ↓
[Calendar Re-renders] → Filtered events displayed
  ↓
[View Event Details] → Click event on calendar
  ↓
[Event Detail Dialog Opens]
  ├─ Event date, time, location
  ├─ Club and zone information
  ├─ Coordinator contact
  ├─ Event status
  ├─ Distance to nearby events (if applicable)
  └─ Schedule document download (if available)
  ↓
[Close Dialog] OR [Export Calendar]
  ↓
END
```

**Acceptance Criteria:**
- Calendar loads in < 3 seconds
- Filters apply instantly (< 500ms)
- Event count updates dynamically
- Export PDF shows correct timezone dates
- Mobile responsive on all devices

---

### 4.2 Zone Representative User Stories

#### 4.2.1 Event Approval Workflow

**User Story:**  
*As a zone representative, I want to review all pending event requests from my zone's clubs with conflict detection so that I can approve events that don't create scheduling problems.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Zone Approval Dashboard]
  ↓
[View Pending Events] → Filtered to my zone automatically
  ↓
[List of Pending Requests]
  ├─ Event name, date, club
  ├─ Status badges
  ├─ Conflict warnings (if any)
  └─ Time since submission
  ↓
[Select Event to Review]
  ↓
[View Event Details Panel]
  ├─ Complete event information
  ├─ Requester contact details
  ├─ AI conflict detection results
  │   └─ Events within 100km ± 1 day
  ├─ Distance calculations shown
  └─ Alternative date suggestions (if conflicts)
  ↓
[Make Decision]
  ├─ APPROVE
  │   ↓
  │ [Update Event Status] → 'approved'
  │   ↓
  │ [Queue Approval Email] → To requester
  │   ↓
  │ [Add to Public Calendars]
  │   ↓
  │ [Log Approval Action] → Timestamp, approver ID
  │
  └─ REJECT
      ↓
    [Enter Rejection Reason] → Optional notes
      ↓
    [Update Event Status] → 'rejected'
      ↓
    [Queue Rejection Email] → To requester with reason
      ↓
    [Log Rejection Action]
  ↓
[Return to Pending List] OR [Review Next Event]
  ↓
END
```

**Acceptance Criteria:**
- Pending events visible within seconds of submission
- Conflict detection accurate within 100km radius
- Approval/rejection completes in < 2 seconds
- Email notification sent within 1 minute
- Audit trail captures all actions

---

#### 4.2.2 Equipment Booking Approval

**User Story:**  
*As a zone representative, I want to approve equipment bookings that have conflicts so that I can resolve scheduling issues manually.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Equipment Booking Dashboard]
  ↓
[View Pending Bookings] → Zone filter applied
  ↓
[Pending Bookings List]
  ├─ Equipment type
  ├─ Requested date
  ├─ Requesting club
  ├─ Conflict indicator
  └─ Requester contact
  ↓
[Select Booking to Review]
  ↓
[View Booking Details]
  ├─ Full booking information
  ├─ Calendar context (nearby bookings)
  ├─ Conflict details (if any)
  └─ Requester notes
  ↓
[Check Calendar Availability] → Visual calendar view
  ↓
[Make Decision]
  ├─ APPROVE
  │   ↓
  │ [Update Status] → 'approved'
  │   ↓
  │ [Block Date on Calendar]
  │   ↓
  │ [Queue "Booking Confirmed" Email]
  │   ↓
  │ [Log Approval]
  │
  └─ REJECT
      ↓
    [Enter Rejection Reason]
      ↓
    [Update Status] → 'rejected'
      ↓
    [Release Date on Calendar]
      ↓
    [Queue Rejection Email]
      ↓
    [Log Rejection]
  ↓
[Return to Pending List]
  ↓
END
```

**Acceptance Criteria:**
- Conflict details clearly visible
- Calendar shows all bookings for context
- Approval updates availability immediately
- Confirmation email sent automatically
- Rejection reason communicated to requester

---

#### 4.2.3 Create Zone Event

**User Story:**  
*As a zone representative, I want to create zone-wide events that auto-approve so that I can coordinate activities across all clubs in my zone without waiting for approval.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Zone Event Management]
  ↓
[Click "Create Zone Event"]
  ↓
[Zone Event Form]
  ├─ Event name
  ├─ Event date
  ├─ Event type (dropdown)
  ├─ Location
  ├─ Description
  └─ Coordinator details
  ↓
[System Pre-fills]
  ├─ Zone ID (my assigned zone)
  ├─ Source: 'zone'
  └─ Status: 'approved' (auto-approve)
  ↓
[Submit Zone Event]
  ↓
[Validate Form]
  ├─ NO → Display errors → [Return to form]
  └─ YES → Continue
       ↓
[Create Event Record]
  ├─ No clubId (zone-wide)
  ├─ ZoneId set
  └─ Status: 'approved'
       ↓
[Immediately Visible]
  ├─ State calendar
  ├─ Zone calendar
  └─ All club calendars in zone
       ↓
[Queue Notifications] → To all clubs in zone
  ↓
[Display Success Confirmation]
  ↓
END
```

**Acceptance Criteria:**
- Event auto-approves (no pending state)
- Visible immediately on all relevant calendars
- All clubs in zone receive notification
- No state approval required
- Zone rep can edit/delete own zone events

---

### 4.3 State Administrator User Stories

#### 4.3.1 User Import with Role Management

**User Story:**  
*As a state administrator, I want to import user data from spreadsheets with optional role columns so that I can update membership without accidentally changing existing user roles.*

**Flow Diagram:**
```
START
  ↓
[Navigate to User Management]
  ↓
[Click "Import Users"]
  ↓
[Upload CSV/Excel File]
  ↓
[System Parses File]
  ├─ Detect columns (name, email, club, role?)
  ├─ Validate data format
  └─ Check for role column presence
  ↓
[Perform Data Analysis]
  ├─ Map club names (fuzzy matching)
  │   ├─ Static mapping library
  │   ├─ Levenshtein distance
  │   └─ Pattern matching
  ├─ Map zone names
  ├─ Validate email formats
  ├─ Detect duplicates
  └─ Identify historical memberships
  ↓
[Generate Import Preview]
  ├─ Total rows processed
  ├─ Valid vs invalid rows
  ├─ Club/zone mapping results
  ├─ Contact data quality
  ├─ Duplicate warnings
  └─ Role preservation details
  ↓
[Display Preview to Admin]
  ├─ 3-column summary layout
  ├─ Statistics and warnings
  ├─ Mapping confidence scores
  └─ Import rules explanation
  ↓
[Admin Reviews Preview]
  ├─ ABORT → [Cancel import] → END
  └─ CONFIRM → Continue
       ↓
[Execute Import with Progress Tracking]
  ├─ Phase 1: Upload (10%)
  ├─ Phase 2: Validation (20%)
  ├─ Phase 3: Club/Zone Mapping (60%)
  │   └─ Detailed progress: "Mapping club 45/171..."
  └─ Phase 4: Database Import (10%)
       ↓
[Process Each User]
  ├─ User exists?
  │   ├─ YES → Update data
  │   │   ├─ Role column present?
  │   │   │   ├─ YES → Update role
  │   │   │   └─ NO → PRESERVE existing role
  │   │   └─ Update contact info
  │   └─ NO → Create new user
  │       ├─ Role column present?
  │       │   ├─ YES → Use provided role
  │       │   └─ NO → Default to 'standard'
  │       └─ Set status based on membership
  │           ├─ "Historical Membership" → inactive
  │           └─ Active membership → active
  ↓
[Generate Import Report]
  ├─ Users created: X
  ├─ Users updated: Y
  ├─ Roles preserved: Z
  ├─ Failed rows: N
  └─ Error details
  ↓
[Display Success Summary]
  ↓
END
```

**Acceptance Criteria:**
- Import success rate >95% with fuzzy matching
- Existing super_user roles never overwritten
- Historical memberships auto-deactivated
- Preview shows all changes before execution
- Detailed progress for 5+ minute operations
- Complete error reporting for failed rows

---

#### 4.3.2 Automated Backup Configuration

**User Story:**  
*As a state administrator, I want to schedule automated daily backups with email delivery so that I have reliable disaster recovery without manual intervention.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Admin Dashboard]
  ↓
[Click "Backup Schedule" Tile]
  ↓
[Backup Configuration Interface]
  ├─ Existing schedules listed
  └─ "Create Schedule" button
  ↓
[Click "Create Schedule"]
  ↓
[Schedule Configuration Form]
  ├─ Schedule name
  ├─ Frequency (daily/weekly/monthly)
  ├─ Time of day (HH:MM)
  ├─ Recipient email addresses (array)
  └─ Include collections (checkboxes)
  ↓
[Submit Configuration]
  ↓
[Validate Settings]
  ├─ Valid email addresses?
  ├─ Valid cron schedule?
  └─ Firebase Scheduler available?
       ↓
[Create Firebase Cloud Scheduler Job]
  ├─ Configure trigger time
  ├─ Set HTTP endpoint
  └─ Pass configuration as payload
       ↓
[Save Schedule to Firestore]
  ↓
[Display Success Confirmation]
  ↓
[Schedule Begins Executing]
  ↓
[At Scheduled Time:]
    ↓
  [Firebase Scheduler Triggers]
    ↓
  [Backup Function Executes]
    ├─ Export all collections
    ├─ Generate JSON files
    ├─ Create ZIP archive
    └─ Calculate file size
    ↓
  [File Size Check]
    ├─ < 8MB → Embed in email
    └─ ≥ 8MB → Upload to Firebase Storage
        ↓
      [Generate Download URL] → 30-day expiry
        ↓
  [Create Backup Email]
    ├─ HTML template with statistics
    ├─ Backup metadata (size, event count, timestamp)
    ├─ Download link (if Storage)
    └─ Professional branding
    ↓
  [Queue Email]
    ├─ Priority: HIGH
    ├─ Status: 'approved' (bypass review)
    └─ To: All recipients in schedule
    ↓
  [Send via Resend API]
    ↓
  [Log Execution]
    ├─ Success/failure
    ├─ File size
    ├─ Recipient count
    └─ Timestamp
    ↓
  [Admin Receives Email] → Within 5 minutes
  ↓
END
```

**Acceptance Criteria:**
- Schedule created in < 30 seconds
- Backups execute reliably at configured time
- Large files (>8MB) handled via Firebase Storage
- Email delivery success rate >98%
- 30-day file retention enforced
- Complete execution logging

---

#### 4.3.3 Manual Backup Execution

**User Story:**  
*As a state administrator, I want to trigger on-demand backups before making major changes so that I can restore data if something goes wrong.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Admin Dashboard]
  ↓
[Click "Backup Now" Button]
  ↓
[Confirm Backup Action] → Dialog confirmation
  ↓
[Execute Backup Process]
  ├─ Show progress indicator
  └─ Real-time status updates
      ↓
[Export Database Collections]
  ├─ Events collection
  ├─ Users collection
  ├─ Clubs collection
  ├─ Zones collection
  ├─ Event types collection
  └─ Email queue (optional)
      ↓
[Create ZIP Archive]
  ├─ Generate JSON files
  ├─ Add manifest with metadata
  ├─ Calculate SHA-256 checksums
  └─ Compress with JSZip
      ↓
[Store Backup]
  ├─ Upload to Firebase Storage
  ├─ Generate download URL
  └─ Set 30-day expiry
      ↓
[Queue Backup Email]
  ├─ High priority
  ├─ Auto-approved
  └─ Include download link
      ↓
[Display Download Link in UI]
  ├─ Immediate download available
  ├─ File size shown
  └─ Expiry date visible
      ↓
[Send Email Notification]
  ↓
[Display Success Message]
  ├─ Backup completed timestamp
  ├─ File size
  ├─ Download link
  └─ Email confirmation
  ↓
END
```

**Acceptance Criteria:**
- Backup completes in < 2 minutes for standard dataset
- Download link available immediately
- Email notification sent within 30 seconds
- UI shows real-time progress
- Backup file includes all critical data

---

#### 4.3.4 Event Import with Conflict Resolution

**User Story:**  
*As a state administrator, I want to import event data from ZIP archives with manual conflict resolution so that I can restore backups or migrate data without duplicates.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Testing Section]
  ↓
[Click "Import Events"]
  ↓
[Upload ZIP Archive]
  ↓
[Extract and Validate]
  ├─ Parse ZIP contents
  ├─ Validate manifest.json
  ├─ Verify checksums
  └─ Parse events.json
      ↓
[Analyze Import Data]
  ├─ Count total events
  ├─ Detect conflicts:
  │   ├─ Duplicate IDs
  │   ├─ Duplicate names + dates
  │   └─ Duplicate locations + dates
  └─ Categorize events
      ↓
[Display Conflict Resolution UI]
  ├─ Conflict summary statistics
  ├─ Side-by-side comparison:
  │   ├─ Existing event data
  │   └─ Import event data
  └─ Resolution options:
      ├─ SKIP (keep existing)
      ├─ OVERWRITE (replace)
      └─ RENAME (create new)
      ↓
[Admin Selects Resolution Strategy]
  ├─ Can apply globally or per-conflict
  └─ Review each conflict individually
      ↓
[Execute Import]
  ├─ Phase 1: Validation (10%)
  ├─ Phase 2: Conflict Resolution (20%)
  ├─ Phase 3: Event Import (50%)
  └─ Phase 4: Schedule Upload (20%)
      ↓
[Process Each Event]
  ├─ Apply resolution strategy
  ├─ Create/update event in Firestore
  ├─ Upload schedule PDF (if exists)
  └─ Update event with storage URL
      ↓
[Generate Import Report]
  ├─ Events created: X
  ├─ Events updated: Y
  ├─ Events skipped: Z
  ├─ Conflicts resolved: N
  └─ Errors: M (with details)
      ↓
[Display Success Summary]
  ├─ Import statistics
  ├─ Error log (if any)
  └─ Rollback option (if needed)
  ↓
END
```

**Acceptance Criteria:**
- Conflicts detected accurately
- Side-by-side comparison clear
- Resolution strategies work correctly
- Schedule files restored successfully
- Detailed import report provided
- Rollback available if needed

---

#### 4.3.5 API Endpoint Management

**User Story:**  
*As a state administrator, I want to enable/disable API endpoints dynamically so that I can control system access without deployments or restarts.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Admin Dashboard]
  ↓
[Click "API Management" Tile]
  ↓
[API Endpoint Registry Display]
  ├─ 35+ endpoints organized by category
  ├─ Categories:
  │   ├─ Public APIs
  │   ├─ Admin APIs
  │   ├─ Embed APIs
  │   ├─ Data APIs
  │   ├─ Storage APIs
  │   ├─ Documents APIs
  │   └─ Testing APIs
  └─ For each endpoint:
      ├─ Name
      ├─ Path
      ├─ Method
      ├─ Status (enabled/disabled)
      └─ Toggle switch
      ↓
[Select Endpoint to Modify]
  ↓
[Click Toggle Switch]
  ↓
[Confirm Action] → Dialog confirmation
  ↓
[Update Configuration]
  ├─ Update endpoint status in config
  ├─ Apply changes immediately (no restart)
  └─ Log configuration change
      ↓
[Display Success Notification]
  ├─ Endpoint status updated
  ├─ Change timestamp
  └─ Effective immediately
      ↓
[API Endpoint Behavior Changes]
  ├─ DISABLED → Returns 503 Service Unavailable
  └─ ENABLED → Functions normally
  ↓
[Audit Log Updated]
  ├─ Admin user ID
  ├─ Endpoint modified
  ├─ Action (enable/disable)
  └─ Timestamp
  ↓
END
```

**Acceptance Criteria:**
- Changes apply immediately (< 1 second)
- No server restart required
- Complete audit trail
- Clear visual status indicators
- Disabled endpoints return proper HTTP status

---

#### 4.3.6 Club Geolocation Management

**User Story:**  
*As a state administrator, I want to batch-geolocate all clubs in a zone using Google Maps so that distance-based conflict detection works accurately.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Admin Dashboard]
  ↓
[Click "Geolocation Management"]
  ↓
[Geolocation Interface]
  ├─ Zone selector dropdown
  ├─ Individual club selector
  └─ Map display
      ↓
[Select Geolocation Scope]
  ├─ BATCH (entire zone)
  └─ INDIVIDUAL (single club)
      ↓
[BATCH GEOLOCATION:]
  ↓
[Select Zone] → Dropdown of all zones
  ↓
[Click "Geolocate Zone"]
  ↓
[Confirm Batch Operation]
  ↓
[Iterate Through Clubs in Zone]
  ├─ For each club:
  │   ├─ Construct search query:
  │   │   "{club name}, {suburb}, Victoria, Australia"
  │   ├─ Call Google Maps Geocoding API
  │   ├─ Receive lat/long coordinates
  │   ├─ Display on map with marker
  │   ├─ Show progress: "Processing 15/23 clubs..."
  │   └─ Save coordinates to club record
  └─ Handle API errors gracefully
      ↓
[Display Batch Results]
  ├─ Total clubs processed
  ├─ Successful geolocations
  ├─ Failed geolocations (with reasons)
  └─ Map with all markers
      ↓
[OR: INDIVIDUAL GEOLOCATION:]
  ↓
[Select Club] → Dropdown or map click
  ↓
[Search Options]
  ├─ AUTO → Use club name + address
  └─ MANUAL → Click map to set coordinates
      ↓
[AUTO SEARCH:]
  ├─ Call Google Maps Geocoding API
  ├─ Display marker on map
  ├─ Show coordinates
  └─ Confirm accuracy
      ↓
[MANUAL ADJUSTMENT:]
  ├─ Drag marker to correct position
  ├─ Coordinates update in real-time
  └─ Click "Save Location"
      ↓
[Save Coordinates]
  ├─ Update club record with lat/long
  ├─ Validate coordinates (within Victoria)
  └─ Display success confirmation
      ↓
[Enable Distance Calculations]
  ├─ Event conflict detection now functional
  └─ Distance shown in event dialogs
  ↓
END
```

**Acceptance Criteria:**
- Google Maps API integration working
- Batch processing handles 171+ clubs
- Manual adjustment available for corrections
- Coordinates saved persist correctly
- Distance calculations accurate (Haversine formula)
- Failed geolocations reported clearly

---

### 4.4 Super User Administrative Stories

#### 4.4.1 Email Queue Administration

**User Story:**  
*As a super user, I want to review and manage all queued emails before they're sent so that I can ensure communication quality and prevent errors.*

**Flow Diagram:**
```
START
  ↓
[Navigate to Email Queue Dashboard]
  ↓
[View Email Queue]
  ├─ Filters:
  │   ├─ Status (pending/approved/sent/failed)
  │   ├─ Email type
  │   ├─ Date range
  │   └─ Recipient
  ├─ Queue statistics:
  │   ├─ Total emails
  │   ├─ Pending count
  │   ├─ Sent count
  │   └─ Failed count
  └─ Email list table:
      ├─ Subject
      ├─ Recipients
      ├─ Status badge
      ├─ Created date
      ├─ Email type
      └─ Actions
      ↓
[Select Email to Review]
  ↓
[Email Detail Preview Opens]
  ├─ Full subject line
  ├─ All recipients (to, cc, bcc)
  ├─ HTML preview
  ├─ Plain text version
  ├─ Attachment list
  ├─ Email metadata
  └─ Creation timestamp
      ↓
[Review Email Content]
  ├─ Check for errors
  ├─ Verify recipients
  ├─ Validate attachments
  └─ Review message content
      ↓
[Take Action]
  ├─ APPROVE
  │   ↓
  │ [Update Status] → 'approved'
  │   ↓
  │ [Trigger Send Process]
  │   ├─ Download attachments from Storage
  │   ├─ Construct Resend API payload
  │   ├─ Call Resend API
  │   ├─ Handle response
  │   └─ Update status → 'sent' or 'failed'
  │       ↓
  │     [Log Send Result]
  │
  ├─ EDIT
  │   ↓
  │ [Inline Edit Mode]
  │   ├─ Modify recipients
  │   ├─ Edit subject
  │   ├─ Update body (HTML/text)
  │   └─ Save changes
  │       ↓
  │     [Return to pending status]
  │
  ├─ DELETE
  │   ↓
  │ [Confirm Deletion]
  │   ↓
  │ [Remove from Queue]
  │   ↓
  │ [Log Deletion Action]
  │
  └─ RETRY (if failed)
      ↓
    [Reset Status] → 'approved'
      ↓
    [Trigger Send Process Again]
      ↓
[Return to Queue List]
  ↓
[Bulk Operations] (Optional)
  ├─ Select multiple emails
  ├─ Bulk approve
  ├─ Bulk delete
  └─ Export email log
  ↓
END
```

**Acceptance Criteria:**
- All queued emails visible
- Email preview shows complete content
- Inline editing functional
- Bulk operations work correctly
- Failed emails can be retried
- Complete audit trail maintained

---

### 4.5 External Visitor User Stories

#### 4.5.1 Embed Calendar on External Website

**User Story:**  
*As a website administrator, I want to embed the event calendar on my club's website so that visitors can view events without navigating away.*

**Flow Diagram:**
```
START
  ↓
[Website Admin Accesses Embed Documentation]
  ↓
[Copy Embed Code]
  ├─ Full Calendar:
  │   <iframe src="https://app.example.com/embed/calendar?zone=X&club=Y">
  └─ Compact Calendar:
      <iframe src="https://app.example.com/embed/calendar/compact?club=Y">
  ↓
[Paste into Website HTML]
  ↓
[Configure Parameters]
  ├─ Zone filter (optional)
  ├─ Club filter (optional)
  ├─ Event sources (optional)
  └─ Height/width (CSS)
  ↓
[Publish Website]
  ↓
[VISITOR EXPERIENCE:]
  ↓
[Visitor Loads Website]
  ↓
[Iframe Loads Calendar]
  ├─ System detects embed mode
  ├─ Suppresses navigation sidebar
  ├─ Applies responsive styling
  └─ Loads filtered events
      ↓
[Interactive Calendar Displayed]
  ├─ Current month view
  ├─ Event badges on dates
  ├─ Status color coding
  └─ Filter controls (full mode only)
      ↓
[Visitor Clicks Event]
  ↓
[Event Detail Dialog Opens in Iframe]
  ├─ Event information
  ├─ Contact details
  ├─ Schedule download (if public)
  └─ No authentication required
      ↓
[Visitor Closes Dialog]
  ↓
[Visitor Navigates Calendar]
  ├─ Change months
  ├─ Apply filters
  └─ View different events
  ↓
END
```

**Acceptance Criteria:**
- Iframe embeds without errors
- No authentication required for public events
- Responsive within iframe container
- Event details accessible
- Filter parameters work correctly
- Navigation hidden in embed mode

---

#### 4.5.2 Submit Event Request via Embedded Form

**User Story:**  
*As an external website visitor, I want to submit event requests through an embedded form so that I don't need to navigate to the main application.*

**Flow Diagram:**
```
START
  ↓
[Visitor Accesses External Website]
  ↓
[Embedded Event Request Form Loads]
  ├─ System detects embed mode
  ├─ Suppresses application chrome
  └─ Displays form in iframe
      ↓
[Visitor Fills Form]
  ├─ Organizer name (autocomplete)
  ├─ Event details
  ├─ Contact information
  └─ Club selection (may be pre-filled)
      ↓
[Submit Form]
  ↓
[SAME VALIDATION AS FULL APP]
  ├─ Validate required fields
  ├─ Create event record
  ├─ Generate PDF
  ├─ Queue notifications
  └─ Generate reference number
      ↓
[Display Success Message in Iframe]
  ├─ Reference number
  ├─ Confirmation message
  ├─ Next steps explanation
  └─ No page redirect
      ↓
[Visitor Remains on External Website]
  ↓
END
```

**Acceptance Criteria:**
- Form fully functional in iframe
- Autocomplete works across domains
- Validation same as full app
- Success confirmation clear
- No page redirects
- Reference number provided

---

### 4.6 System Integration User Stories

#### 4.6.1 External Calendar Integration

**User Story:**  
*As a system integrator, I want to consume the public calendar API so that I can display PonyClub events in third-party calendar applications.*

**Flow Diagram:**
```
START
  ↓
[External System Makes API Request]
  ├─ Endpoint: GET /api/calendar
  ├─ Format: ?format=json OR ?format=ical
  └─ Filters: ?zone=X&club=Y&sources=pca,zone,state
      ↓
[API Validates Parameters]
  ├─ Check format validity
  ├─ Validate filter values
  └─ Set CORS headers
      ↓
[Query Public Events]
  ├─ Status: 'approved' only
  ├─ Apply date range filter
  ├─ Apply zone/club filter
  └─ Apply event sources filter
      ↓
[Transform Data]
  ├─ JSON Format:
  │   ├─ Convert to JSON array
  │   ├─ Include event metadata
  │   └─ Format dates as ISO strings
  └─ iCal Format:
      ├─ Create VCALENDAR wrapper
      ├─ Generate VEVENT entries
      ├─ Format dates in iCal syntax
      └─ Include event properties
      ↓
[Return Response]
  ├─ Content-Type header set
  ├─ Cache-Control headers
  └─ CORS headers enabled
      ↓
[External System Receives Data]
  ↓
[Process and Display]
  ├─ Parse response
  ├─ Import events
  ├─ Display in external calendar
  └─ Set up periodic refresh
  ↓
END
```

**Acceptance Criteria:**
- API returns approved events only
- JSON and iCal formats both work
- CORS enabled for cross-origin requests
- Proper cache headers set
- Filters apply correctly
- Response time < 2 seconds

---

### 4.7 Multi-User Collaboration Flows

#### 4.7.1 Cross-Zone Event Coordination

**Flow Diagram:**
```
[Club A Member] → Submit Event Request
         ↓
  [Event Created: Status='proposed']
         ↓
  [System AI Detects Conflict]
    ├─ Club B has event within 100km
    ├─ Same date ± 1 day
    └─ Both in different zones
         ↓
  [Zone A Rep Reviews]
    ├─ Sees conflict warning
    ├─ Views distance calculation
    └─ Checks alternative dates
         ↓
  [Zone A Rep Contacts Zone B Rep] (External)
         ↓
  [Zone B Rep Checks Their Calendar]
         ↓
  [Coordination Decision]
    ├─ BOTH APPROVE → Both events proceed
    ├─ ONE CHANGES DATE → One club adjusts
    └─ TRADITIONAL EVENT PRIORITY → Apply priority rules
         ↓
  [Both Zone Reps Approve]
         ↓
  [Events Appear on Calendars]
         ↓
  [Clubs Notified of Approval]
```

---

#### 4.7.2 Equipment Sharing Between Clubs

**Flow Diagram:**
```
[Club A] → Request equipment for July 15
      ↓
[System Checks Availability]
      ↓
[AVAILABLE] → Auto-approve
      ↓
[Club A Uses Equipment]
      ↓
[Club B] → Views calendar, sees July 15 unavailable
      ↓
[Club B] → Requests alternative date (July 22)
      ↓
[System Checks] → AVAILABLE
      ↓
[Auto-approve Club B]
      ↓
[Zone Rep Monitors]
  ├─ Dashboard shows all bookings
  ├─ Calendar shows utilization
  └─ No manual intervention needed
```

---

### 4.8 Error Handling and Recovery Flows

#### 4.8.1 Failed Email Delivery Recovery

**Flow Diagram:**
```
[Email Queued] → status='approved'
      ↓
[Attempt Send via Resend API]
      ↓
[API Returns Error]
  ├─ Network timeout
  ├─ Invalid recipient
  └─ Service temporarily down
      ↓
[Update Status] → 'failed'
      ↓
[Log Error Details]
  ├─ Error message
  ├─ Timestamp
  └─ Retry count
      ↓
[Automatic Retry Logic]
  ├─ Wait 1 minute
  ├─ Retry attempt #1
  │   ↓
  │ [Still failing?]
  │   ├─ Wait 5 minutes
  │   └─ Retry attempt #2
  │       ↓
  │     [Still failing?]
  │       ├─ Wait 15 minutes
  │       └─ Retry attempt #3
  │           ↓
  │         [FINAL FAILURE]
  │           ↓
  │         [Admin Notification]
  │           ├─ Email to super users
  │           ├─ Dashboard alert
  │           └─ Manual intervention required
  │               ↓
  │             [Super User Reviews]
  │               ├─ Check error details
  │               ├─ Fix recipient/content if needed
  │               └─ Manually retry
```

---

#### 4.8.2 Import Data Validation Failure

**Flow Diagram:**
```
[Admin Uploads CSV]
      ↓
[System Parses File]
      ↓
[Validation Errors Detected]
  ├─ Missing required columns
  ├─ Invalid email formats
  ├─ Club names not found
  └─ Duplicate IDs
      ↓
[Generate Error Report]
  ├─ Row-by-row error list
  ├─ Error types categorized
  ├─ Suggestions for fixes
  └─ Example corrections
      ↓
[Display to Admin]
  ├─ Error summary statistics
  ├─ Downloadable error CSV
  ├─ Fix suggestions
  └─ Option to abort or fix
      ↓
[Admin Options]
  ├─ ABORT → No changes made
  ├─ FIX DATA → Download, fix, re-upload
  └─ IMPORT VALID ROWS → Proceed with partial import
      ↓
[If Partial Import Selected]
  ├─ Import only valid rows
  ├─ Skip error rows
  ├─ Generate success/failure report
  └─ Provide error CSV for manual fixes
```

---

## 4.9 User Story Summary Matrix

| User Type | Total Stories | Primary Actions | Key Benefits |
|-----------|---------------|-----------------|--------------|
| **Club Member** | 3 | Submit events, book equipment, view calendar | Reduced data entry (60%), zero booking conflicts, instant confirmations |
| **Zone Representative** | 3 | Approve events, approve bookings, create zone events | 48-hour approval SLA, automated conflict detection, zone-wide visibility |
| **State Administrator** | 6 | Import users, configure backups, import events, manage APIs, geolocate clubs | 95%+ import success, automated disaster recovery, zero-downtime configuration |
| **Super User** | 1 | Manage email queue | 100% communication quality control, retry failed sends, audit trail |
| **External Visitor** | 2 | View embedded calendar, submit via embedded form | No authentication required, seamless integration, no navigation disruption |
| **System Integrator** | 1 | Consume public API | iCal/JSON formats, CORS enabled, real-time event data |
| **TOTAL** | **16** | **21 primary workflows** | **System-wide efficiency, reliability, integration** |

---

*This comprehensive user story catalog documents all user journeys through the MyPonyClub Event Manager system, providing complete visibility into workflows, decision points, and system behaviors for each user type.*

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

#### 5.1.1 Response Time Targets

| Operation Type | Target Response Time | Maximum Acceptable | Notes |
|----------------|---------------------|-------------------|-------|
| **Page Load (Initial)** | < 2 seconds | < 5 seconds | First Contentful Paint on broadband connection |
| **Page Load (Subsequent)** | < 1 second | < 2 seconds | Cached resources, navigation within app |
| **Calendar Rendering** | < 3 seconds | < 5 seconds | Full month view with all events |
| **Calendar Filter Application** | < 500ms | < 1 second | Client-side filtering, immediate visual feedback |
| **Event Search** | < 1 second | < 2 seconds | Firestore query with filters |
| **Form Submission** | < 2 seconds | < 5 seconds | Event request, equipment booking |
| **PDF Generation (Standard)** | < 5 seconds | < 10 seconds | Calendar PDF with <100 events |
| **PDF Generation (Large)** | < 15 seconds | < 30 seconds | Annual calendar with 500+ events |
| **Email Queue Processing** | < 30 seconds | < 2 minutes | From queue to Resend API delivery |
| **User Import (Small)** | < 1 minute | < 3 minutes | <50 users with validation |
| **User Import (Large)** | < 5 minutes | < 10 minutes | 171+ clubs, 500+ users with fuzzy matching |
| **Event Import** | < 2 minutes | < 5 minutes | Backup restoration, conflict resolution |
| **Backup Generation** | < 2 minutes | < 5 minutes | Full database export and ZIP creation |
| **Geolocation Batch** | < 3 minutes | < 8 minutes | Zone-wide club geolocation (20-30 clubs) |
| **API Response (Public)** | < 500ms | < 2 seconds | Public calendar API, embed endpoints |
| **API Response (Admin)** | < 1 second | < 3 seconds | Administrative operations, data retrieval |

#### 5.1.2 Throughput Requirements

- **Concurrent Users**: Support minimum 50 concurrent users without degradation
- **Peak Load**: Handle 200+ concurrent users during high-activity periods (event request deadlines)
- **API Rate Limits**: 
  - Public APIs: 100 requests/minute per IP
  - Admin APIs: 500 requests/minute per authenticated user
  - Embed endpoints: 1000 requests/minute (cached responses)
- **Database Operations**:
  - Firestore reads: Support 10,000+ reads/day
  - Firestore writes: Support 2,000+ writes/day
  - Batch operations: Process 500+ records without timeout

#### 5.1.3 Scalability Targets

- **Data Volume**:
  - Support 5,000+ events in database
  - Support 1,000+ active users
  - Support 171 clubs across all zones
  - Email queue capacity: 10,000+ queued emails
  - Backup archive size: Handle up to 100MB exports
- **Growth Capacity**:
  - 20% year-over-year user growth
  - 30% year-over-year event volume growth
  - Horizontal scaling via Firebase/Vercel infrastructure

#### 5.1.4 Resource Optimization

- **Client-Side**:
  - JavaScript bundle size: < 500KB gzipped
  - CSS bundle size: < 100KB gzipped
  - Image optimization: WebP format, lazy loading
  - Code splitting: Route-based chunks for faster initial load
  - Tree shaking: Remove unused dependencies
- **Server-Side**:
  - API route cold start: < 2 seconds
  - Memory usage per request: < 256MB
  - Firebase connection pooling for efficiency
  - Minimize Firestore read operations via caching
- **Network**:
  - Enable HTTP/2 for multiplexing
  - Compress all responses (gzip/brotli)
  - CDN utilization for static assets
  - Cache-Control headers for appropriate TTLs

---

### 5.2 Security Requirements

#### 5.2.1 Authentication and Authorization

| Requirement | Implementation | Enforcement |
|-------------|----------------|-------------|
| **User Authentication** | Firebase Authentication with email/password | Required for all protected routes |
| **Session Management** | JWT tokens with 1-hour expiry, refresh token rotation | Automatic token refresh |
| **Role-Based Access Control (RBAC)** | Five roles: `super_user`, `state_admin`, `zone_rep`, `club_member`, `standard` | Enforced at API and UI level |
| **Least Privilege Principle** | Users granted minimum permissions for their role | Default role: `standard` (read-only) |
| **Multi-Factor Authentication** | Optional MFA via Firebase Auth (SMS/TOTP) | Recommended for `super_user` and `state_admin` |
| **Password Requirements** | Minimum 8 characters, complexity enforced by Firebase | Firebase default policy |
| **Account Lockout** | Automatic after 5 failed login attempts within 15 minutes | Firebase Auth built-in protection |

#### 5.2.2 Data Protection

- **Data at Rest**:
  - All Firestore data encrypted using Google-managed encryption keys (AES-256)
  - Backup files encrypted in Firebase Storage
  - No sensitive data stored in client-side localStorage (tokens only in secure httpOnly cookies where possible)
  
- **Data in Transit**:
  - All communications over HTTPS/TLS 1.3
  - Certificate pinning for production domains
  - Strict Transport Security (HSTS) headers enabled
  - No mixed content allowed

- **Personal Identifiable Information (PII)**:
  - Email addresses: Stored in user records, access controlled by role
  - Phone numbers: Optional, encrypted at rest
  - Names: Required for organizers, access controlled
  - Addresses: Club addresses only, no personal addresses stored
  - Data minimization: Collect only necessary information

#### 5.2.3 Input Validation and Sanitization

| Attack Vector | Protection Mechanism | Implementation |
|---------------|---------------------|----------------|
| **SQL Injection** | N/A - NoSQL database (Firestore) | Firestore SDK parameterized queries |
| **Cross-Site Scripting (XSS)** | React auto-escaping, DOMPurify for user content | All user inputs sanitized before render |
| **Cross-Site Request Forgery (CSRF)** | SameSite cookies, CORS restrictions | Next.js CSRF protection |
| **Command Injection** | No shell commands from user input | Server-side validation only |
| **Path Traversal** | Input validation, whitelist allowed paths | File upload restrictions |
| **Email Header Injection** | Email library sanitization (Resend SDK) | Template-based email generation |
| **NoSQL Injection** | Firestore SDK type safety, TypeScript | Strict type checking |

#### 5.2.4 API Security

- **Authentication**:
  - Bearer token authentication for all protected APIs
  - Dev environment: `admin-token` and `dev-admin-token` for testing
  - Production: Firebase ID tokens validated server-side
  
- **Authorization**:
  - Middleware validates user roles before API execution
  - Resource-level permissions (e.g., zone reps can only approve events in their zone)
  - Server-side validation—never trust client-side role claims

- **Rate Limiting**:
  - Public APIs: 100 requests/minute per IP (Vercel Edge protection)
  - Admin APIs: 500 requests/minute per user
  - Backup APIs: 10 requests/hour per admin
  - Automatic temporary IP blocking on abuse detection

- **API Endpoint Control**:
  - Dynamic enable/disable via admin dashboard (no deployment required)
  - Disabled endpoints return HTTP 503
  - Testing endpoints disabled in production by default

#### 5.2.5 Firestore Security Rules

```javascript
// Events collection
match /events/{eventId} {
  // Public read for approved events
  allow read: if resource.data.status == 'approved';
  
  // Authenticated read for all events (filtered by role in application)
  allow read: if request.auth != null;
  
  // Create: authenticated users only
  allow create: if request.auth != null;
  
  // Update: owner, zone rep (for zone events), state admin, or super user
  allow update: if request.auth != null && (
    request.auth.uid == resource.data.createdBy ||
    hasRole('zone_rep') && resource.data.zoneId == getUserZone() ||
    hasRole('state_admin') ||
    hasRole('super_user')
  );
  
  // Delete: state admin or super user only
  allow delete: if hasRole('state_admin') || hasRole('super_user');
}

// Users collection
match /users/{userId} {
  // Users can read their own record
  allow read: if request.auth.uid == userId;
  
  // Admins can read all users
  allow read: if hasRole('state_admin') || hasRole('super_user');
  
  // Users can update their own profile (except role)
  allow update: if request.auth.uid == userId && 
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status']);
  
  // Only super users can modify roles
  allow update: if hasRole('super_user');
}

// Email queue - admin access only
match /emailQueue/{emailId} {
  allow read, write: if hasRole('super_user') || hasRole('state_admin');
}
```

#### 5.2.6 Third-Party Security

| Service | Security Measures | Data Shared |
|---------|------------------|-------------|
| **Firebase** | Google-managed infrastructure, SOC 2 compliant | User auth, all application data |
| **Resend Email** | API key in environment variables, TLS encryption | Email addresses, message content |
| **Google Maps** | API key restrictions (domain + API whitelisting) | Club addresses for geocoding |
| **Vercel Hosting** | Automatic HTTPS, DDoS protection, SOC 2 compliant | All frontend assets, API routes |
| **jsPDF** | Client-side library, no external calls | None (local rendering) |

#### 5.2.7 Audit and Logging

- **Authentication Events**:
  - Successful logins logged with timestamp, IP, user agent
  - Failed login attempts tracked (rate limiting triggers)
  - Password resets logged
  
- **Authorization Events**:
  - Role changes logged with admin user ID and timestamp
  - Permission denials logged for security monitoring
  
- **Data Modifications**:
  - Event approvals/rejections logged with approver ID
  - User imports logged with admin ID and import summary
  - Backup operations logged with timestamp and file size
  - Email queue actions logged (approve, delete, send)
  
- **Security Events**:
  - Rate limit violations logged with IP address
  - API endpoint enable/disable logged
  - Firestore security rule violations logged
  - Suspicious activity patterns flagged

- **Log Retention**:
  - Authentication logs: 90 days
  - Audit logs: 1 year
  - Security incident logs: 2 years
  - Application logs: 30 days

---

### 5.3 Usability Requirements

#### 5.3.1 User Interface Design

| Principle | Implementation | Validation |
|-----------|----------------|------------|
| **Consistency** | Shadcn UI component library, consistent color scheme, typography | Visual regression testing |
| **Simplicity** | Minimal clicks to common actions (max 3 clicks to submit event) | User task completion time |
| **Clarity** | Clear labels, help text on complex fields, progress indicators | User comprehension testing |
| **Feedback** | Toast notifications, loading states, success/error messages | No silent failures |
| **Accessibility** | WCAG 2.1 AA compliance, keyboard navigation, ARIA labels | Automated accessibility audits |

#### 5.3.2 Responsive Design

- **Breakpoints**:
  - Mobile: 320px - 767px (single column, touch-optimized)
  - Tablet: 768px - 1023px (adaptive layout)
  - Desktop: 1024px+ (full feature layout)
  
- **Mobile Optimization**:
  - Touch targets minimum 44x44px
  - Horizontal scrolling for wide tables
  - Simplified navigation (hamburger menu)
  - Optimized calendar view (day/week on mobile)
  - Form fields stacked vertically
  
- **Desktop Optimization**:
  - Multi-column layouts for dashboards
  - Sidebar navigation always visible
  - Larger calendar grid with more details
  - Inline editing capabilities
  - Keyboard shortcuts enabled

#### 5.3.3 Accessibility Standards

| WCAG 2.1 Criterion | Compliance Level | Implementation |
|-------------------|------------------|----------------|
| **Perceivable** | AA | High contrast color scheme (4.5:1 minimum), alt text for images, captions for videos |
| **Operable** | AA | Full keyboard navigation, no keyboard traps, focus indicators visible |
| **Understandable** | AA | Consistent navigation, error identification, input assistance |
| **Robust** | AA | Valid HTML, ARIA landmarks, semantic markup |

- **Keyboard Navigation**:
  - Tab order follows logical flow
  - Escape key closes dialogs
  - Enter/Space activates buttons
  - Arrow keys navigate calendar grid
  
- **Screen Reader Support**:
  - ARIA labels on interactive elements
  - Form field associations (label + input)
  - Status announcements for async operations
  - Table headers properly marked
  
- **Visual Accessibility**:
  - Color not sole information indicator (icons + text)
  - Minimum font size: 14px body, 12px captions
  - Resizable text up to 200% without horizontal scroll
  - Focus indicators clearly visible (2px outline)

#### 5.3.4 Learning Curve

- **First-Time User Experience**:
  - Onboarding wizard for new users (optional)
  - Contextual help tooltips on complex features
  - Example data shown in empty states
  - Guided tour of key features (dismissible)
  
- **Documentation**:
  - Embedded help system with search
  - Video tutorials for complex workflows (user import, backup configuration)
  - FAQ section addressing common questions
  - Quick reference guides (printable PDFs)
  
- **Training Requirements**:
  - Club members: < 30 minutes to submit event request
  - Zone reps: < 2 hours to manage approvals and bookings
  - State admins: < 4 hours for full system administration
  - Self-service documentation reduces support burden

#### 5.3.5 Error Handling and Recovery

- **User-Friendly Error Messages**:
  - No technical jargon in user-facing errors
  - Clear explanation of what went wrong
  - Actionable steps to resolve issue
  - Contact support option if unresolvable
  
- **Validation Feedback**:
  - Inline validation as user types (email format, required fields)
  - Summary validation errors at form top
  - Highlight invalid fields in red with specific messages
  - Preserve user input on validation failure
  
- **Graceful Degradation**:
  - Offline detection with user notification
  - Form data saved to localStorage on network failure
  - Auto-retry on transient errors (3 attempts with exponential backoff)
  - Fallback UI if JavaScript disabled (basic HTML forms)

---

### 5.4 Reliability Requirements

#### 5.4.1 Availability Targets

| Service Level | Target Uptime | Maximum Downtime/Month | Notes |
|---------------|---------------|----------------------|-------|
| **Production Application** | 99.5% | ~3.6 hours | Vercel + Firebase SLA |
| **Public Calendar API** | 99.0% | ~7.2 hours | Includes planned maintenance |
| **Admin Functions** | 98.0% | ~14.4 hours | Lower priority, scheduled maintenance allowed |
| **Email Delivery** | 99.9% | ~43 minutes | Resend SLA, excludes recipient issues |
| **Backup System** | 99.0% | ~7.2 hours | Automated retries on failure |

#### 5.4.2 Fault Tolerance

- **Single Points of Failure (SPOF) Mitigation**:
  - Firebase multi-region replication (automatic)
  - Vercel edge network distribution (global CDN)
  - No single-server dependencies
  - Database backups stored in separate storage region
  
- **Error Recovery**:
  - Automatic retry logic for failed API calls (3 attempts)
  - Email queue retry mechanism (exponential backoff)
  - Form submission retry on network timeout
  - Transaction rollback on partial failures
  
- **Graceful Degradation**:
  - Email system falls back to logging if Resend API unavailable
  - Calendar displays cached data if Firestore unreachable
  - PDF generation queued for later if timeout occurs
  - Import operations resumable from failure point

#### 5.4.3 Data Integrity

- **Backup and Recovery**:
  - **Automated Daily Backups**: Scheduled via Firebase Cloud Scheduler
  - **Retention Policy**: 30 days of daily backups, 12 months of monthly backups
  - **Backup Storage**: Firebase Storage with redundancy
  - **Recovery Time Objective (RTO)**: < 4 hours for full restoration
  - **Recovery Point Objective (RPO)**: < 24 hours (daily backups)
  
- **Data Validation**:
  - Schema validation on all Firestore writes
  - TypeScript type safety prevents type mismatches
  - Date validation prevents timezone-related corruption
  - Referential integrity checks (club/zone existence before event creation)
  
- **Transaction Management**:
  - Firestore transactions for multi-document updates
  - Batch operations for consistency (user imports)
  - Rollback capabilities on import failures
  - Audit trail for all data modifications

#### 5.4.4 Disaster Recovery

- **Backup Procedures**:
  - Daily automated backups at 2:00 AM AEST
  - Manual backup trigger available to admins
  - Backup verification (checksum validation)
  - Off-site storage (Firebase Storage multi-region)
  
- **Recovery Procedures**:
  - Import system supports full database restoration from backup ZIP
  - Conflict resolution UI for handling duplicate data
  - Phased restoration (users → clubs/zones → events → email queue)
  - Smoke testing after restoration
  
- **Business Continuity**:
  - Read-only mode available during critical failures (view calendars, no edits)
  - Embedded calendars continue functioning independently
  - Public API remains operational (cached data served)
  - Communication plan for extended outages (email stakeholders)

#### 5.4.5 Monitoring and Alerting

- **Application Monitoring**:
  - Vercel Analytics for performance metrics
  - Firebase Performance Monitoring
  - Error tracking (console logs aggregated)
  - User session recording for UX analysis
  
- **System Health Checks**:
  - API endpoint health checks every 5 minutes
  - Database connectivity tests
  - Email delivery success rate monitoring
  - Backup execution status checks
  
- **Alerting Thresholds**:
  - Error rate >5% over 15 minutes → Alert admins
  - API response time >5 seconds → Warning
  - Failed backup → Immediate notification
  - Email delivery failure rate >10% → Alert
  - Firestore quota approaching limit → Warning at 80%
  
- **Alert Channels**:
  - Email notifications to super users
  - Dashboard alerts visible on admin panel
  - Slack integration (optional, if configured)
  - SMS for critical failures (optional)

---

### 5.5 Compliance and Legal Requirements

#### 5.5.1 Data Privacy Compliance

| Regulation | Applicability | Implementation |
|------------|---------------|----------------|
| **Australian Privacy Principles (APPs)** | Mandatory | Privacy policy published, consent collected, data minimization |
| **GDPR (EU General Data Protection Regulation)** | If EU users exist | Cookie consent, right to erasure, data portability |
| **Children's Privacy** | Not applicable | System for 18+ users only (club administrators) |

- **Privacy Policy**:
  - Clear disclosure of data collected (name, email, phone, club affiliation)
  - Purpose of data collection explained
  - Data retention periods specified
  - Third-party data sharing disclosed (Firebase, Resend, Google Maps)
  - User rights explained (access, correction, deletion)
  
- **Consent Management**:
  - Explicit consent on user registration
  - Cookie consent banner (analytics cookies)
  - Opt-in for marketing communications
  - Withdrawal of consent mechanism
  
- **Data Subject Rights**:
  - Right to access: Users can view their profile data
  - Right to rectification: Users can edit their information
  - Right to erasure: Admins can deactivate/delete user accounts
  - Data portability: Export user data in JSON format
  - Automated decision-making: None (all approvals manual)

#### 5.5.2 Email Compliance

- **CAN-SPAM Act Compliance** (if US recipients):
  - Accurate "From" information (Pony Club Association official email)
  - Truthful subject lines
  - Unsubscribe mechanism in notification emails
  - Honor unsubscribe requests within 10 business days
  
- **Australian Spam Act 2003**:
  - Consent required for commercial messages
  - Clear sender identification
  - Functional unsubscribe link
  - Transactional emails exempt (event confirmations, approvals)

#### 5.5.3 Accessibility Compliance

- **Australian Disability Discrimination Act 1992**:
  - Web Content Accessibility Guidelines (WCAG) 2.1 Level AA compliance
  - No discrimination against users with disabilities
  - Reasonable adjustments provided (keyboard navigation, screen readers)
  
- **Accessibility Audit**:
  - Annual accessibility review
  - Automated testing tools (Axe, WAVE)
  - Manual testing with screen readers (NVDA, JAWS)
  - User testing with individuals with disabilities

#### 5.5.4 Intellectual Property

- **Copyright**:
  - Original code: Copyright by MyPonyClub Event Manager development team
  - Open-source dependencies: Licenses respected (MIT, Apache 2.0)
  - Third-party assets: Properly licensed or public domain
  
- **Trademarks**:
  - "Pony Club" trademark usage authorized by Victorian Pony Club Association
  - Third-party logos used with permission (Google Maps, Resend)
  
- **User Content**:
  - Users retain copyright to event descriptions, images uploaded
  - System granted license to display, distribute user content
  - User responsible for ensuring they have rights to submitted content

#### 5.5.5 Terms of Service

- **User Obligations**:
  - Accurate information submission
  - No malicious use (spam, unauthorized access)
  - Respect other users' privacy
  - Comply with Pony Club regulations
  
- **System Limitations**:
  - No guarantee of 100% uptime (best effort)
  - Event approval subject to organizational rules
  - System administrators reserve right to remove inappropriate content
  - Accounts may be suspended for policy violations
  
- **Liability Limitations**:
  - System provided "as is" without warranty
  - No liability for data loss (backups recommended)
  - Not responsible for third-party service failures (Resend, Google Maps)
  - Users responsible for event accuracy

#### 5.5.6 Audit and Compliance Reporting

- **Compliance Audits**:
  - Annual privacy compliance review
  - Quarterly security assessment
  - Accessibility audit before major releases
  - Third-party penetration testing (annually)
  
- **Compliance Documentation**:
  - Privacy policy maintained and versioned
  - Terms of service published and acceptance tracked
  - Security incident register maintained
  - Data processing agreements with third parties (Resend, Google)
  
- **Reporting**:
  - Data breach notification (within 72 hours if serious)
  - Privacy complaints handled within 30 days
  - Compliance metrics reported to board (quarterly)
  - Security incidents logged and reviewed

---

### 5.6 Maintainability and Supportability

#### 5.6.1 Code Quality Standards

- **Code Style**:
  - ESLint configuration enforced (Airbnb style guide)
  - Prettier for consistent formatting
  - TypeScript strict mode enabled
  - No unused variables/imports
  
- **Documentation**:
  - JSDoc comments for all public functions
  - README files for each major module
  - Inline comments for complex logic
  - Architecture decision records (ADRs) maintained
  
- **Testing**:
  - Unit tests for utility functions (target: 80% coverage)
  - Integration tests for API routes
  - End-to-end tests for critical workflows (event submission, approval)
  - Manual testing scripts (PowerShell) for key scenarios

#### 5.6.2 Deployment and Updates

- **Continuous Deployment**:
  - Git push to `main` branch triggers automatic deployment
  - Build validation before deployment (TypeScript compilation, linting)
  - Automatic rollback on build failure
  - Zero-downtime deployments via Vercel
  
- **Version Control**:
  - Git for source code management
  - Semantic versioning (MAJOR.MINOR.PATCH)
  - Changelog maintained for all releases
  - Tagged releases for production deployments
  
- **Environment Management**:
  - Separate environments: development, staging (optional), production
  - Environment-specific configuration (.env files)
  - Secrets managed via Vercel environment variables
  - No secrets committed to repository

#### 5.6.3 Support and Troubleshooting

- **Logging**:
  - Structured logging with severity levels (error, warn, info, debug)
  - Request tracing for API calls
  - Error stack traces captured
  - Log aggregation via Vercel logs
  
- **Debugging Tools**:
  - Testing section in admin dashboard (API health checks)
  - PowerShell scripts for system testing
  - Firebase console for database inspection
  - Email queue management interface
  
- **Support Channels**:
  - Email support for users (support@ponyclubvic.org.au or equivalent)
  - Admin help documentation
  - Issue tracking via GitHub (private repository)
  - Escalation path: Club → Zone → State → Super User → Developer

---

*This comprehensive non-functional requirements section establishes performance benchmarks, security standards, usability expectations, reliability targets, and compliance obligations for the MyPonyClub Event Manager system, ensuring a robust, secure, and user-friendly application.*

---

## 6. Assumptions and Constraints

### 6.1 System Assumptions

#### 6.1.1 User Environment Assumptions

| Assumption | Rationale | Impact if Invalid |
|------------|-----------|-------------------|
| **Users have reliable internet access** | Application is cloud-based, requires connectivity for all operations | Offline mode not supported; users cannot access system |
| **Users have modern web browsers** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | Older browsers may have rendering issues, feature incompatibility |
| **Users have JavaScript enabled** | React application requires JavaScript for interactivity | Application non-functional without JavaScript (minimal HTML fallback only) |
| **Users have email access** | Notifications sent via email, password resets via email | Cannot receive important updates, cannot recover accounts |
| **Screen resolution minimum 320px width** | Mobile-first responsive design starts at 320px | Smaller screens may have layout issues |
| **Users understand basic calendar concepts** | Event dates, monthly views, date selection | Training may be required for users unfamiliar with digital calendars |
| **Club administrators are authorized** | Users self-identify club/role during registration | Requires manual verification by state admins to grant elevated permissions |

#### 6.1.2 Data Assumptions

| Assumption | Rationale | Validation |
|------------|-----------|------------|
| **Club names are consistent** | Fuzzy matching library handles variations (e.g., "Bayside PC" vs "Bayside Pony Club") | Import system shows mapping preview for admin verification |
| **Event dates are in the future** | System designed for upcoming event planning | Past events allowed for historical records but flagged in UI |
| **One zone representative per zone** | Approval workflow assumes single point of contact | System supports multiple zone reps, but communication coordination is manual |
| **Equipment is zone-owned** | Booking system scoped to zone-level resources | Club-specific equipment requires separate tracking |
| **Email addresses are valid and monitored** | Critical notifications sent via email only | Invalid emails result in missed notifications; no alternative contact method |
| **Phone numbers are Australian format** | Validation assumes +61 or 04xx format | International numbers may fail validation |
| **Addresses are within Victoria, Australia** | Geolocation assumes Victorian suburbs | Out-of-state clubs require manual coordinate entry |

#### 6.1.3 Operational Assumptions

| Assumption | Rationale | Mitigation if Invalid |
|------------|-----------|----------------------|
| **Peak usage during business hours (AEST)** | Users are club administrators working during daytime | System scales automatically, no time-based restrictions |
| **Event requests submitted weeks in advance** | Approval workflow assumes time for review (48-hour SLA) | Rush requests handled manually via direct contact |
| **Backup recipients monitor email daily** | Daily backups sent via email for download | Also stored in Firebase Storage for 30 days |
| **Zone reps check dashboard regularly** | Pending approvals visible on dashboard | Email notifications also sent to ensure visibility |
| **State admins review email queue weekly** | Queue management prevents spam or errors | Auto-approval available for trusted email types |
| **Users have PDF reader software** | Calendar exports, event request forms, schedules as PDF | Modern browsers have built-in PDF viewers |
| **Google Maps API returns accurate coordinates** | Geolocation relies on Google Maps Geocoding | Manual coordinate adjustment available in admin interface |

---

### 6.2 Technical Constraints

#### 6.2.1 Platform Dependencies

| Dependency | Version/Specification | Constraint Type | Impact |
|------------|----------------------|-----------------|--------|
| **Next.js** | Version 14+ (App Router) | Hard | Breaking changes in routing if downgraded; SSR/SSG features required |
| **React** | Version 18+ | Hard | Hooks, Suspense, Server Components essential to architecture |
| **Node.js** | Version 18+ | Hard | Required for build process, API routes, server-side rendering |
| **TypeScript** | Version 5+ | Hard | Type safety throughout codebase; migration to JavaScript impractical |
| **Firebase SDK** | Version 9+ (Modular) | Hard | Tree-shaking, smaller bundle size; legacy SDK incompatible |
| **Firestore** | Firebase Firestore | Hard | NoSQL document database; migration to SQL requires complete rewrite |
| **Vercel** | Current platform | Soft | Hosting platform; could migrate to other Next.js hosts (AWS Amplify, Netlify) with effort |
| **Resend** | Email delivery service | Soft | Email provider; could swap for SendGrid, Mailgun, AWS SES with code changes |
| **Google Maps API** | Geocoding API | Soft | Could replace with OpenStreetMap/Nominatim but lower accuracy expected |
| **jsPDF** | PDF generation library | Soft | Could replace with pdfmake or puppeteer, requires layout rewrite |

#### 6.2.2 Browser Compatibility Constraints

| Browser | Minimum Version | Known Limitations | Workaround |
|---------|----------------|-------------------|------------|
| **Google Chrome** | 90+ | None | N/A |
| **Mozilla Firefox** | 88+ | None | N/A |
| **Safari (macOS/iOS)** | 14+ | Date picker styling differences | Custom CSS for Safari |
| **Microsoft Edge** | 90+ (Chromium-based) | None | N/A |
| **Internet Explorer 11** | Not supported | No ES6+ support, no React 18 compatibility | Display "unsupported browser" message |
| **Mobile browsers** | iOS Safari 14+, Chrome Mobile 90+ | Smaller screen estate, touch interactions | Responsive design, touch-optimized |
| **Browser features required** | ES6+, Fetch API, LocalStorage, WebSockets | Older browsers lack support | Polyfills not provided; upgrade recommended |

#### 6.2.3 Firebase Service Limits

| Resource | Firestore Limit | Current Usage (Estimate) | Mitigation |
|----------|----------------|-------------------------|------------|
| **Document reads/day** | 50,000 (free tier), unlimited (Blaze plan) | ~5,000 reads/day (50 users × 100 reads) | Blaze plan with usage monitoring |
| **Document writes/day** | 20,000 (free tier), unlimited (Blaze plan) | ~500 writes/day | Blaze plan |
| **Storage (Firestore)** | 1 GB (free tier), unlimited (Blaze plan) | ~100 MB (5,000 events + metadata) | Blaze plan, data archival strategy |
| **Cloud Storage** | 5 GB (free tier), unlimited (Blaze plan) | ~500 MB (backups, PDFs, schedules) | Blaze plan, 30-day retention for backups |
| **Authentication users** | Unlimited | ~1,000 active users | No constraint |
| **Concurrent connections** | 100,000 (free tier), 1,000,000 (Blaze plan) | ~50 concurrent connections | No constraint |
| **Maximum document size** | 1 MB per document | ~5 KB per event, ~2 KB per user | No constraint |
| **Maximum collection depth** | 100 levels | 1 level (flat structure) | No constraint |

#### 6.2.4 Email Service Constraints

| Constraint | Resend Limit | Current Usage | Impact |
|------------|--------------|---------------|--------|
| **Monthly email quota** | 3,000 emails/month (free tier), 50,000+ (paid) | ~1,000 emails/month (notifications + approvals) | Paid plan required for scale |
| **Daily sending limit** | 100 emails/day (free tier), configurable (paid) | ~30-50 emails/day average, spikes during imports | Paid plan recommended |
| **Attachment size** | 8 MB per email | Backup files typically 2-5 MB | Large backups use Firebase Storage links |
| **Recipients per email** | 50 recipients (to + cc + bcc) | Typically 1-5 recipients per notification | No constraint |
| **Rate limiting** | 10 requests/second | System queues emails, processes sequentially | Queue system prevents rate limit violations |
| **Sender domain** | Verified domain required for production | Domain verification completed | No constraint |
| **Email retention** | 30 days in logs | Firestore stores queue history indefinitely | No constraint |

#### 6.2.5 Third-Party API Constraints

| API | Rate Limit | Cost Structure | Constraint Impact |
|-----|-----------|----------------|-------------------|
| **Google Maps Geocoding** | 1,000 requests/day (free tier), paid beyond | $5 per 1,000 requests | Batch geolocation limited; cache coordinates |
| **Google Maps Static API** | 25,000 map loads/day (free $200 credit) | $2 per 1,000 requests after credit | Minimal usage; maps only in admin interface |
| **Vercel Serverless Functions** | 100 GB-hours/month (Hobby), unlimited (Pro) | Pro plan: $20/month | Complex imports may timeout on Hobby plan |
| **Vercel Bandwidth** | 100 GB/month (Hobby), 1 TB (Pro) | Pro plan overage: $40/100GB | PDF downloads consume bandwidth; Pro plan recommended |

---

### 6.3 Functional Limitations

#### 6.3.1 Known System Limitations

| Limitation | Description | Workaround/Mitigation |
|------------|-------------|-----------------------|
| **No offline mode** | Application requires internet connectivity for all operations | Browser caching provides basic offline viewing only; no edits offline |
| **No mobile app** | Web-based only; no native iOS/Android apps | Progressive Web App (PWA) features planned but not implemented |
| **No real-time collaboration** | Multiple users editing same event simultaneously may cause conflicts | Last-write-wins; manual conflict resolution required |
| **Limited bulk operations** | Cannot bulk-approve events (one-by-one only) | Admin can filter and process sequentially; batch approval not implemented |
| **No calendar subscriptions (iCal feed)** | Cannot subscribe to calendar in Outlook/Google Calendar | API provides iCal format on request but no subscription URL |
| **No SMS notifications** | All notifications via email only | Phone numbers collected but not used for notifications |
| **No document version control** | Schedule PDF uploads overwrite previous versions | Manual versioning by filename required (e.g., "Schedule_v2.pdf") |
| **Equipment booking: single date only** | Cannot book equipment for multi-day events (e.g., weekend camps) | Submit separate bookings for each day |
| **Distance calculation: straight-line only** | Haversine formula calculates "as the crow flies" | Road distance via Google Maps API not implemented (cost constraint) |
| **Import file size limit** | CSV/Excel imports limited to ~5,000 rows | Large datasets must be split into multiple files |
| **PDF export: one month max** | Calendar PDF exports limited to single month or custom range (max 31 days) | Generate multiple PDFs for longer periods |
| **No event recurrence** | Cannot create recurring events (e.g., weekly training sessions) | Create individual events or use import for bulk creation |

#### 6.3.2 Role-Based Limitations

| User Role | Restrictions | Justification |
|-----------|--------------|---------------|
| **Standard User** | Read-only access; cannot submit events or bookings | Default role until verified by admin |
| **Club Member** | Cannot approve events; can only submit requests | Separation of duties; prevents self-approval |
| **Zone Rep** | Cannot modify events outside assigned zone | Data isolation; prevents cross-zone interference |
| **State Admin** | Cannot modify super_user roles | Protection against accidental privilege escalation |
| **Super User** | Can modify all data but actions are audited | Accountability for administrative actions |
| **No public access** | All features require authentication | Privacy protection for club/member data |

#### 6.3.3 Data Validation Constraints

| Field | Validation Rule | Constraint |
|-------|----------------|------------|
| **Event name** | Max 200 characters, alphanumeric + spaces/punctuation | Long event names truncated in calendar views |
| **Event date** | Must be valid date; past dates allowed but flagged | No automatic archival of past events |
| **Organizer email** | RFC 5322 email format validation | Custom email domains may fail validation (rare) |
| **Phone number** | Australian format: +61 or 04xx (10 digits) | International numbers not supported |
| **File uploads (schedules)** | Max 10 MB, PDF format only | Multi-file uploads not supported |
| **Import CSV** | Max 5 MB file size, UTF-8 encoding required | Excel files must be saved as CSV first |
| **Club/Zone names** | Must match existing records (fuzzy matching 80%+ confidence) | New clubs require manual creation by admin first |

---

### 6.4 Business and Regulatory Constraints

#### 6.4.1 Organizational Policies

| Policy | Requirement | Implementation |
|--------|-------------|----------------|
| **Pony Club Victoria approval hierarchy** | Zone reps approve club events; state admins approve zone events | Enforced via role-based workflow |
| **48-hour approval SLA** | Event requests should be reviewed within 2 business days | Dashboard notifications, email alerts; SLA not enforced technically |
| **Traditional event priority** | Long-standing annual events receive priority in conflict resolution | Manual policy; system flags conflicts but does not auto-prioritize |
| **Distance policy (100km rule)** | Events within 100km on same date require coordination | System detects and warns; enforcement is manual |
| **Equipment booking priority** | First-come, first-served unless conflict requires zone rep decision | Auto-approval for no conflicts; manual for conflicts |
| **Email communication standards** | Official communications use Pony Club branding and templates | Enforced via HTML email templates |

#### 6.4.2 Legal and Regulatory Requirements

| Regulation | Requirement | Compliance Status |
|------------|-------------|-------------------|
| **Australian Privacy Act 1988** | Collect, store, and use personal information lawfully | ✅ Privacy policy published; consent collected on registration |
| **Australian Privacy Principles (APPs)** | 13 principles governing data handling | ✅ Data minimization, security, access rights implemented |
| **Spam Act 2003** | Consent required for commercial messages; unsubscribe mechanism | ✅ Transactional emails exempt; marketing emails include unsubscribe |
| **Disability Discrimination Act 1992** | Web accessibility for users with disabilities | ✅ WCAG 2.1 AA compliance targeted; keyboard navigation supported |
| **Copyright Act 1968** | Respect intellectual property rights | ✅ Open-source licenses respected; user content ownership clear in ToS |
| **GDPR (if EU users present)** | Right to erasure, data portability, consent management | ⚠️ Partial compliance; full GDPR features not implemented (no EU users expected) |
| **Payment Card Industry DSS** | Not applicable (no payment processing) | N/A |

#### 6.4.3 Service Level Agreements (SLAs)

| Metric | Target | Measured How | Enforcement |
|--------|--------|--------------|-------------|
| **Application uptime** | 99.5% (excluding planned maintenance) | Vercel uptime monitoring | Best effort; no financial penalties |
| **Email delivery time** | <30 minutes from queue approval | Resend delivery timestamps | Best effort; Resend SLA applies |
| **Backup completion** | Daily backup by 3:00 AM AEST | Cloud Scheduler execution logs | Retry on failure; manual intervention if repeated failures |
| **Support response time** | 48 hours for user inquiries | Email ticket tracking | Volunteer-based support; no contractual obligation |
| **Event approval SLA** | 48 business hours (organizational policy) | Dashboard pending time indicator | Not enforced technically; reminder emails sent |

---

### 6.5 Resource Constraints

#### 6.5.1 Budget Constraints

| Resource | Monthly Cost (Estimate) | Annual Cost | Constraint Impact |
|----------|------------------------|-------------|-------------------|
| **Firebase (Blaze Plan)** | $10-30 (usage-based) | $120-360 | Limits data import frequency, backup size |
| **Vercel Pro Plan** | $20 (fixed) | $240 | Required for production; no free tier constraints |
| **Resend Email** | $20 (50k emails/month) | $240 | Limits email volume; queue management required |
| **Google Maps API** | $5-15 (usage-based) | $60-180 | Limits geolocation frequency; coordinates cached |
| **Domain & SSL** | $15 (annual) | $15 | No constraint |
| **Total Infrastructure** | ~$70-100/month | ~$840-1,200/year | Volunteer-run organization; cost minimization important |

#### 6.5.2 Development Resources

| Resource | Availability | Constraint |
|----------|-------------|------------|
| **Developer time** | Part-time volunteer (10-20 hours/month) | Feature development slower; prioritization required |
| **Testing resources** | Manual testing by admins; no dedicated QA team | Automated testing limited; bugs may reach production |
| **Support staff** | Volunteer state admins | Response time varies; no 24/7 support |
| **Training budget** | None (self-service documentation only) | Users rely on written guides, videos; no live training |
| **Hardware** | Cloud-based; no on-premise infrastructure | No control over infrastructure; dependent on providers |

#### 6.5.3 Scalability Constraints

| Dimension | Current Capacity | Maximum Capacity | Bottleneck |
|-----------|------------------|-----------------|------------|
| **Concurrent users** | 50 | 200 (Vercel Hobby limit) | Vercel Pro plan scales automatically |
| **Total users** | 1,000 | 10,000+ (Firebase Auth unlimited) | None |
| **Events in database** | 5,000 | 50,000+ (Firestore storage limit) | Database cost increases linearly |
| **Email queue size** | 1,000 pending | 10,000+ (Firestore collection limit) | No technical constraint; processing time increases |
| **File storage** | 500 MB | 5 GB (Firebase free tier) | Blaze plan required for growth; old backups purged |
| **API requests/day** | 10,000 | 100,000+ (Vercel serverless functions) | Cost increases with volume |

---

### 6.6 Environmental Constraints

#### 6.6.1 Geographic Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| **Victoria, Australia focus** | System designed for Victorian Pony Club Association | State/zone/club structure hard-coded; other states require code changes |
| **Australian timezones** | Primary timezone: AEST/AEDT (UTC+10/+11) | Date handling optimized for Australian timezones; international users may see odd times |
| **Suburban/rural connectivity** | Some clubs in rural areas with limited internet | Slow page loads; offline mode requested but not implemented |
| **Mobile network dependency** | Users at events may rely on mobile data | Mobile-optimized UI; low-bandwidth mode not implemented |

#### 6.6.2 Temporal Constraints

| Constraint | Description | Mitigation |
|------------|-------------|------------|
| **Event planning horizon: 12-18 months** | Calendar focus on current + next year | Historical events retained but not prioritized in UI |
| **Backup retention: 30 days** | Daily backups purged after 1 month | Monthly backups retained for 12 months; older data requires manual archive |
| **Email queue retention: 90 days** | Sent emails archived after 3 months | Export email logs before purge if long-term records needed |
| **Session timeout: 1 hour** | Firebase Auth token expiry (automatic refresh) | Users rarely notice; seamless re-authentication |
| **Password reset link expiry: 1 hour** | Firebase Auth default | Users must request new link if expired |

---

### 6.7 Integration Constraints

#### 6.7.1 External System Dependencies

| System | Integration Type | Dependency Level | Failure Impact |
|--------|------------------|------------------|----------------|
| **Firebase Auth** | Authentication provider | Critical | Complete system inaccessible; no fallback |
| **Firestore** | Database | Critical | No data access; system unusable |
| **Resend API** | Email delivery | High | Emails queued but not sent; fallback to logging |
| **Google Maps API** | Geolocation | Medium | New clubs cannot be geolocated; existing coordinates unaffected |
| **Vercel** | Hosting/deployment | Critical | Application offline; no alternative hosting configured |
| **GitHub** | Source code repository | Medium | Deployments blocked; code safe but cannot deploy updates |

#### 6.7.2 Data Exchange Constraints

| Data Flow | Format | Constraint |
|-----------|--------|------------|
| **User import** | CSV, Excel (XLSX) | Must match expected columns (name, email, club); fuzzy matching for club names |
| **Event import** | JSON (from backup ZIP) | Must include manifest.json; schema validation required |
| **Calendar export** | PDF, JSON, iCal | PDF layout hard-coded; JSON/iCal schema fixed |
| **Email templates** | HTML + plain text | Templates hard-coded; no dynamic template creation |
| **Backup format** | ZIP containing JSON files + manifest | Structured format required for re-import; manual edits may break schema |

---

### 6.8 Assumptions for Future Development

| Assumption | Timeframe | Risk if Invalid |
|------------|-----------|----------------|
| **Firebase remains cost-effective** | 2-5 years | Migration to alternative database (e.g., PostgreSQL) requires major refactor |
| **Vercel continues Next.js hosting** | 2-5 years | Alternative hosts available (AWS Amplify, Netlify) but migration effort required |
| **Resend API stability** | 1-3 years | Email provider swap feasible but requires code changes, DNS updates |
| **No major React/Next.js breaking changes** | 1-2 years | Major version upgrades may require refactoring (e.g., React 19, Next.js 15) |
| **User base remains <10,000 users** | 3-5 years | Current architecture scales; >10,000 users may require optimization |
| **Email-based notifications remain acceptable** | 2-5 years | SMS/push notifications would require new infrastructure |
| **Victorian Pony Club structure stable** | 5+ years | Zone restructuring would require database schema changes |
| **Volunteer developer availability** | Ongoing | Commercial support may be required if volunteer capacity insufficient |

---

*This comprehensive assumptions and constraints section documents all dependencies, limitations, and boundary conditions for the MyPonyClub Event Manager system, providing transparency for stakeholders and guiding future development decisions.*

---

## 7. Versioning and Change Control

### 7.1 Version Numbering System

#### 7.1.1 Semantic Versioning (SemVer)

The MyPonyClub Event Manager follows **Semantic Versioning 2.0.0** for all releases:

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Example: v2.3.1-beta.2+20251202
```

| Component | Increment When | Examples | Impact |
|-----------|---------------|----------|--------|
| **MAJOR** | Breaking changes, incompatible API changes, major architecture shifts | 1.x.x → 2.0.0 | May require user retraining, data migration, or configuration changes |
| **MINOR** | New features added in backward-compatible manner | 2.1.x → 2.2.0 | New functionality available; existing features unchanged |
| **PATCH** | Backward-compatible bug fixes, security patches | 2.2.1 → 2.2.2 | No new features; fixes only |
| **PRERELEASE** | Alpha, beta, release candidate versions | 2.3.0-beta.1 | Not production-ready; testing phase |
| **BUILD** | Build metadata, commit hash, build date | +20251202 | Informational only; no functional difference |

#### 7.1.2 Version Increment Examples

| Change Type | Version Change | Example Scenario |
|-------------|---------------|------------------|
| **Major Breaking Change** | 1.5.3 → 2.0.0 | Migration from Firestore to PostgreSQL; API endpoints restructured |
| **Major Feature Addition** | 2.0.0 → 2.1.0 | SMS notifications added; mobile app released |
| **Minor Feature Addition** | 2.1.0 → 2.2.0 | Bulk event approval added; calendar subscription feed added |
| **Bug Fix** | 2.2.0 → 2.2.1 | Timezone handling fixed; email queue retry logic corrected |
| **Security Patch** | 2.2.1 → 2.2.2 | XSS vulnerability patched; dependency security update |
| **Hotfix** | 2.2.2 → 2.2.3 | Critical production bug fixed; emergency deployment |

#### 7.1.3 Current Version Status

**Production Version:** `v1.0.0` (Initial Release)  
**Development Version:** `v1.1.0-dev`  
**Last Updated:** December 2, 2025

---

### 7.2 Change Control Process

#### 7.2.1 Change Request Workflow

```
[Change Identified]
      ↓
[Documented in GitHub Issue]
  ├─ Bug report template
  ├─ Feature request template
  └─ Enhancement template
      ↓
[Triage and Prioritization]
  ├─ Priority: Critical/High/Medium/Low
  ├─ Impact assessment
  ├─ Effort estimation
  └─ Assigned to milestone
      ↓
[Development]
  ├─ Create feature branch (feature/issue-123-description)
  ├─ Implement changes
  ├─ Write/update tests
  └─ Update documentation
      ↓
[Code Review]
  ├─ Pull request created
  ├─ Automated checks (build, lint, tests)
  ├─ Manual review by maintainer
  └─ Approval required
      ↓
[Testing]
  ├─ Unit tests (automated)
  ├─ Integration tests (automated)
  ├─ Manual testing (checklist)
  └─ User acceptance testing (UAT)
      ↓
[Merge to Main]
  ├─ Squash commits for clean history
  ├─ Update CHANGELOG.md
  └─ Tag with version number
      ↓
[Deployment]
  ├─ Automatic deployment to production (Vercel)
  ├─ Smoke tests
  └─ Monitoring for errors
      ↓
[Post-Deployment]
  ├─ Verify functionality
  ├─ Monitor error rates
  ├─ User communication (if major change)
  └─ Close GitHub issue
```

#### 7.2.2 Change Categorization

| Category | Examples | Review Required | Testing Required | User Communication |
|----------|----------|----------------|------------------|-------------------|
| **Critical Hotfix** | Security vulnerability, data loss bug, system down | Developer + 1 reviewer | Smoke tests only (expedited) | Immediate notification |
| **High Priority Bug** | Incorrect calculations, broken workflows | Developer + 1 reviewer | Full regression tests | Release notes |
| **Medium Priority Enhancement** | UI improvements, performance optimizations | Developer + 1 reviewer | Affected features tested | Release notes |
| **Low Priority Feature** | Nice-to-have additions, experimental features | Developer + 1 reviewer | Full test suite | Release notes |
| **Documentation Update** | README changes, comment updates | Developer review only | N/A | None (unless major) |
| **Dependency Update** | NPM package upgrades | Automated (Dependabot) + review | Automated tests | None (unless breaking) |

#### 7.2.3 Branch Management Strategy

| Branch Type | Naming Convention | Purpose | Lifespan | Merge Target |
|-------------|------------------|---------|----------|--------------|
| **main** | `main` | Production-ready code; auto-deploys to production | Permanent | N/A |
| **development** | `dev` (optional) | Integration branch for features (not currently used) | Permanent | main |
| **feature** | `feature/issue-123-short-description` | New features, enhancements | Until merged | main |
| **bugfix** | `bugfix/issue-456-short-description` | Non-critical bug fixes | Until merged | main |
| **hotfix** | `hotfix/critical-issue-description` | Emergency production fixes | Until merged | main (expedited) |
| **release** | `release/v2.1.0` (optional) | Release preparation, final testing | Until tagged | main |
| **experimental** | `experimental/new-architecture` | Proof-of-concept, major refactors | Until decision made | main or abandoned |

**Branching Rules:**
- All branches created from latest `main`
- Branches deleted after successful merge
- No direct commits to `main` (pull requests required)
- Feature branches rebased before merge to maintain linear history
- Hotfix branches can bypass normal review for critical issues (retrospective review required)

---

### 7.3 Documentation Standards

#### 7.3.1 CHANGELOG.md Format

The `CHANGELOG.md` file follows **Keep a Changelog** format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Feature descriptions for upcoming release

### Changed
- Modifications to existing features

### Deprecated
- Features marked for removal in future versions

### Removed
- Features removed in this version

### Fixed
- Bug fixes

### Security
- Security patches

## [2.2.1] - 2025-12-02

### Fixed
- Fixed timezone handling in PDF generation (dates off by 1 day)
- Corrected parseDateString to use UTC methods for production consistency
- Updated event creation forms to store dates at local midnight

### Changed
- Enhanced parseDateString to handle Date objects, Timestamps, and strings

## [2.2.0] - 2025-11-15

### Added
- Comprehensive functional specification documentation
- User stories and process flow diagrams for all user types
- Non-functional requirements (performance, security, usability)
- Email queue management interface with inline preview

### Changed
- Improved calendar filtering performance with memoization
- Enhanced equipment booking calendar with visual availability indicators

## [2.1.0] - 2025-10-20

### Added
- Automated backup scheduler with email delivery
- Equipment booking system with conflict detection
- Geolocation management for club addresses
- API endpoint registry with dynamic enable/disable

### Fixed
- User import fuzzy matching accuracy improvements
- Email queue retry logic for failed sends

## [2.0.0] - 2025-09-01

### Added
- Complete system rewrite with Next.js 14 App Router
- Firebase integration for authentication and data storage
- Role-based access control (5 user roles)
- Event approval workflow with AI conflict detection

### Changed
- **BREAKING:** Migrated from legacy system to Firebase (data migration required)
- **BREAKING:** New authentication system (users must re-register)

## [1.0.0] - 2025-06-01

### Added
- Initial release of MyPonyClub Event Manager
- Basic event calendar with zone/club filtering
- Event request submission form
- Email notifications for approvals
```

#### 7.3.2 Commit Message Standards

Following **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(calendar): add PDF export for zone calendars` |
| `fix` | Bug fix | `fix(timezone): correct date handling in PDF generation` |
| `docs` | Documentation only | `docs(readme): update deployment instructions` |
| `style` | Code style (formatting, no logic change) | `style(components): apply Prettier formatting` |
| `refactor` | Code restructuring (no feature/bug change) | `refactor(auth): simplify role checking logic` |
| `perf` | Performance improvement | `perf(calendar): optimize event filtering with memoization` |
| `test` | Adding or updating tests | `test(api): add integration tests for email queue` |
| `chore` | Build process, dependencies | `chore(deps): update Next.js to 14.2.0` |
| `ci` | CI/CD configuration | `ci(vercel): add staging environment` |
| `revert` | Revert previous commit | `revert: revert "feat(calendar): add PDF export"` |

**Scope Examples:** `calendar`, `auth`, `email`, `api`, `ui`, `backup`, `import`, `booking`

**Example Commits:**
```
feat(email-queue): add inline email preview with HTML rendering

Implemented dialog-based email preview allowing admins to review
queued emails before approval. Includes HTML/text toggle and
metadata display.

Closes #142

---

fix(pdf): correct timezone handling for event dates

Events displayed in PDFs were showing dates 1 day earlier due to
UTC conversion. Updated parseDateString to use UTC methods for
consistent date extraction across all server timezones.

Fixes #189
Related to #156

---

chore(deps): upgrade React to 18.3.0

Updated React and React-DOM to latest stable version.
No breaking changes; all tests passing.
```

#### 7.3.3 Pull Request Template

```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
Closes #[issue_number]
Related to #[issue_number]

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing Performed
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Tested on Chrome/Firefox/Safari
- [ ] Mobile responsive tested

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Checklist
- [ ] Code follows project style guidelines (ESLint passing)
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (README, CHANGELOG, etc.)
- [ ] No new warnings or errors
- [ ] Dependent changes merged and published

## Deployment Notes
<!-- Special deployment instructions, environment variable changes, etc. -->

## Rollback Plan
<!-- How to rollback if issues arise post-deployment -->
```

---

### 7.4 Release Management

#### 7.4.1 Release Cycle

| Release Type | Frequency | Schedule | Purpose |
|--------------|-----------|----------|---------|
| **Major Release** | Annually or as needed | January (planned) | Breaking changes, major features, architecture updates |
| **Minor Release** | Quarterly | End of each quarter | New features, significant enhancements |
| **Patch Release** | As needed (2-4 weeks) | Ad-hoc | Bug fixes, security patches |
| **Hotfix** | Immediately (critical issues) | Within 24 hours of discovery | Critical bugs, security vulnerabilities, data loss prevention |

#### 7.4.2 Release Checklist

**Pre-Release (1 week before):**
- [ ] Feature freeze (no new features merged)
- [ ] All planned features merged and tested
- [ ] Documentation updated (README, user guides, API docs)
- [ ] CHANGELOG.md finalized with all changes
- [ ] Version number incremented in `package.json`
- [ ] Release notes drafted
- [ ] Stakeholder review (state admins, zone reps)

**Release Day:**
- [ ] Create release branch (`release/vX.Y.Z`)
- [ ] Final integration testing
- [ ] User acceptance testing (UAT) by admins
- [ ] Tag commit with version number (`git tag vX.Y.Z`)
- [ ] Merge release branch to `main`
- [ ] Automatic deployment to production (Vercel)
- [ ] Smoke tests on production
- [ ] Create GitHub Release with notes
- [ ] Announce release to users (email, dashboard notification)

**Post-Release (48 hours):**
- [ ] Monitor error rates and logs
- [ ] Verify critical features functioning
- [ ] Gather user feedback
- [ ] Address any immediate issues
- [ ] Update project roadmap
- [ ] Retrospective meeting (what went well, what to improve)

#### 7.4.3 Release Notes Template

```markdown
# Release Notes: v2.3.0 - "Enhanced Collaboration"

**Release Date:** December 15, 2025  
**Version:** 2.3.0  
**Release Type:** Minor Release

## 🎉 What's New

### Bulk Event Approval
Zone representatives can now approve multiple pending events at once, reducing approval time by up to 70%.

**Benefits:**
- Faster event approvals during peak periods
- Reduced repetitive clicking
- Improved zone rep workflow efficiency

### Calendar Subscription Feed (iCal)
Users can now subscribe to the event calendar in Outlook, Google Calendar, and Apple Calendar.

**How to Use:**
1. Navigate to Calendar Settings
2. Copy your personalized iCal subscription URL
3. Add to your preferred calendar application

### Enhanced Email Templates
Redesigned email notifications with improved readability and mobile responsiveness.

## 🐛 Bug Fixes

- **Fixed:** Timezone issue causing PDF dates to display incorrectly (#189)
- **Fixed:** Equipment booking conflicts not detected for same-day requests (#203)
- **Fixed:** Club member autocomplete showing inactive users (#215)
- **Fixed:** Calendar export failing for date ranges >31 days (#221)

## 🔒 Security Updates

- Updated Firebase SDK to 10.8.0 (security patches)
- Patched XSS vulnerability in event description rendering (CVE-2025-XXXX)
- Enhanced API rate limiting to prevent abuse

## ⚡ Performance Improvements

- Calendar rendering 40% faster with optimized filtering
- Reduced initial page load time from 3.2s to 1.8s
- Compressed JavaScript bundle size by 15% (520KB → 442KB)

## 📝 Documentation

- Added comprehensive functional specification (60+ pages)
- Updated user stories and process flow diagrams
- Expanded troubleshooting guide

## 🔧 Technical Changes

- Migrated to React 18.3.0 (no breaking changes)
- Refactored email queue system for better reliability
- Improved TypeScript type coverage to 95%

## ⚠️ Breaking Changes

None in this release.

## 🚀 Upgrade Instructions

No manual steps required. The system will automatically update upon your next login.

**Recommended Actions:**
- Clear browser cache for best performance
- Review new bulk approval feature in Zone Management dashboard
- Set up calendar subscription if desired

## 📊 Metrics

- **Deployments:** 3 (dev, staging, production)
- **Bug Fixes:** 4
- **New Features:** 3
- **Performance Improvements:** 5
- **Total Commits:** 47
- **Contributors:** 2

## 🙏 Acknowledgments

Special thanks to the zone representatives who participated in UAT and provided valuable feedback during the beta testing phase.

## 📅 Next Release

**v2.4.0** planned for March 2026 will focus on mobile app development and SMS notifications.

---

**Full Changelog:** [v2.2.0...v2.3.0](https://github.com/StuartGoggin/MyPonyClubApp-Event-Manager/compare/v2.2.0...v2.3.0)  
**Download:** Available via automatic update at https://myponyclubevents.com.au
```

---

### 7.5 Deprecation Policy

#### 7.5.1 Deprecation Process

When features or APIs need to be removed, the following process is followed:

1. **Announce Deprecation** (Version X.0.0):
   - Mark feature as deprecated in documentation
   - Add deprecation warnings in UI (yellow banner)
   - Include in release notes with migration path
   - Set sunset date (minimum 6 months notice)

2. **Grace Period** (Versions X.1.0 - X.5.0):
   - Feature remains functional but discouraged
   - Warnings displayed prominently
   - Documentation updated with alternatives
   - User support provided for migration

3. **Final Warning** (Version X.6.0):
   - Stronger deprecation warnings (red banner)
   - Email notifications to affected users
   - 1 month notice before removal
   - Migration guides published

4. **Removal** (Version Y.0.0 - Next Major):
   - Feature removed from codebase
   - Breaking change (major version bump)
   - Comprehensive release notes
   - Support team briefed for user queries

#### 7.5.2 Deprecation Examples

| Feature | Deprecated In | Removal Planned | Reason | Alternative |
|---------|--------------|-----------------|--------|-------------|
| **Legacy Event API v1** | v2.0.0 (Sept 2025) | v3.0.0 (Sept 2026) | Performance, outdated schema | Event API v2 with better filtering |
| **CSV Export (Old Format)** | v2.2.0 (Nov 2025) | v3.0.0 (Sept 2026) | Missing fields, inconsistent dates | Enhanced CSV Export with timezone support |
| **Internet Explorer 11 Support** | v1.0.0 (June 2025) | Already removed | Security, performance, modern features | Upgrade to Chrome, Firefox, Edge, Safari |

---

### 7.6 Version History Tracking

#### 7.6.1 Historical Versions

| Version | Release Date | Key Changes | Migration Required |
|---------|--------------|-------------|-------------------|
| **v1.0.0** | June 1, 2025 | Initial production release | N/A (first version) |
| **v1.1.0** | July 15, 2025 | Equipment booking system added | No |
| **v1.2.0** | August 10, 2025 | User import with fuzzy matching | No |
| **v1.2.1** | August 20, 2025 | Hotfix: email queue retry logic | No |
| **v2.0.0** | September 1, 2025 | Firebase migration, role-based access | Yes (data migration script provided) |
| **v2.1.0** | October 20, 2025 | Backup scheduler, geolocation | No |
| **v2.2.0** | November 15, 2025 | Email queue management, enhanced calendar | No |
| **v2.2.1** | December 2, 2025 | Hotfix: timezone handling in PDFs | No |

#### 7.6.2 Version Metadata

Each version includes the following metadata:

```json
{
  "version": "2.2.1",
  "releaseDate": "2025-12-02",
  "releaseName": "Timezone Fix",
  "releaseType": "patch",
  "breakingChanges": false,
  "features": [],
  "bugFixes": [
    "Fixed timezone handling in PDF generation",
    "Corrected event date storage in forms"
  ],
  "securityUpdates": [],
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.0",
    "firebase": "10.8.0"
  },
  "contributors": ["StuartGoggin"],
  "commits": 12,
  "linesChanged": {
    "added": 245,
    "removed": 189
  }
}
```

---

### 7.7 Change Communication Strategy

#### 7.7.1 User Communication Channels

| Audience | Communication Method | Timing | Content |
|----------|---------------------|--------|---------|
| **All Users** | Dashboard notification banner | On login after release | Summary of new features, bug fixes |
| **State Admins** | Email (detailed release notes) | Release day | Full changelog, admin-specific features |
| **Zone Reps** | Email (curated highlights) | Release day | Features affecting approvals, bookings |
| **Club Members** | Email (brief summary) | 1 day after release | New features they can use |
| **Developers** | GitHub Release notes | Release day | Technical details, breaking changes |
| **Stakeholders** | Quarterly report | End of quarter | Aggregated metrics, roadmap updates |

#### 7.7.2 Change Impact Assessment

Before each release, changes are assessed for user impact:

| Impact Level | Definition | Communication Required | Examples |
|--------------|------------|----------------------|----------|
| **Critical** | Requires immediate user action; breaking changes | Email + banner + training | Authentication system change, data migration |
| **High** | Significant new features or workflow changes | Email + banner | Bulk approval, calendar subscriptions |
| **Medium** | Minor features, UI improvements | Release notes + banner | Enhanced filters, faster loading |
| **Low** | Bug fixes, performance improvements | Release notes only | Timezone fix, email retry logic |
| **None** | Internal changes, technical debt | Developer notes only | Code refactoring, dependency updates |

---

### 7.8 Rollback Procedures

#### 7.8.1 Rollback Decision Criteria

A rollback is initiated if any of the following occur within 24 hours of deployment:

- **Critical Bug:** Data loss, security vulnerability, system completely unusable
- **Performance Degradation:** >50% increase in page load times or API response times
- **Error Rate Spike:** Error rate >10% for core features
- **User Impact:** >25% of users unable to complete critical workflows (event submission, approvals)
- **Data Integrity:** Incorrect data being written to database

#### 7.8.2 Rollback Process

```
[Issue Detected]
      ↓
[Assess Severity] → Critical? → YES → [Immediate Rollback Decision]
      ↓ NO                                    ↓
[Attempt Hotfix]                    [Notify Stakeholders]
      ↓                                       ↓
[Hotfix Successful?]               [Revert to Previous Version]
  ├─ YES → Deploy hotfix                     ├─ Vercel: Revert deployment (1 click)
  └─ NO → [Rollback Decision]                ├─ Git: Revert commit or reset to tag
              ↓                               └─ Duration: ~5 minutes
        [Rollback]                                 ↓
                                          [Verify Rollback]
                                                  ├─ Smoke tests
                                                  ├─ Check error rates
                                                  └─ Monitor for 1 hour
                                                       ↓
                                              [Post-Incident Review]
                                                  ├─ Document what happened
                                                  ├─ Identify root cause
                                                  ├─ Create fix plan
                                                  └─ Schedule re-deployment
```

#### 7.8.3 Rollback Limitations

- **Database Migrations:** If new version included database schema changes, rollback may require data migration reversal
- **User Data:** Any data created between deployment and rollback must be preserved (manual export/import if needed)
- **External Services:** Third-party integrations (email, geolocation) may have state changes that cannot be reversed
- **Caching:** Browser caches may still have new version assets; users advised to hard refresh

---

*This comprehensive versioning and change control section establishes clear processes for tracking updates, managing releases, communicating changes, and ensuring system stability for the MyPonyClub Event Manager.*
