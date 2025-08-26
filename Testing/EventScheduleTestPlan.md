# Event Schedule Workflow Test Plan

This document outlines the key manual and future automated tests for the Event Schedule feature.

## Test Areas & Checklist

### 1. Event Schedule Upload ✅ COMPLETED
- [x] As an organiser, upload a schedule document (PDF, DOCX, etc.) to an event.
- [x] Confirm the document is stored and associated with the event.
- [x] **Firebase Storage Integration**: Files successfully uploaded to cloud storage
- [x] **Public URL Generation**: Download URLs automatically generated
- [x] **API Endpoint**: `/api/events/[id]/schedule/upload` working correctly
- [x] **Multi-Format Support**: Tested with PDF, TXT, and DOCX files
- [x] **Error Handling**: Proper validation and error messages

### 2. Schedule Status Display ⏳ PENDING
- [ ] Check that the event dialog shows the correct status flag (pending, approved, rejected) and download link for the schedule.

### 3. Conditional UI ⏳ PENDING
- [ ] Verify that only organisers see the upload option when no schedule exists.
- [ ] Confirm that only zone approvers see the review/approve/reject options when a schedule is pending.

### 4. Review & Approval
- [ ] As a zone approver, review a submitted schedule, approve or reject it, and add notes.
- [ ] Confirm the status updates and is reflected in the UI.

### 5. Download Functionality
- [ ] Download the schedule document from the event dialog when approved.

## Notes
- Test with different user roles and schedule states.
- Record results and issues for each test.
- This checklist can be expanded into automated tests in future development.
