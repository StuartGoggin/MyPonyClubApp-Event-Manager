# Event Request Form - Debug Instructions

## Issue
The "Submit Event Requests" button appears to do nothing when clicked.

## Changes Made
I've added extensive error logging and visual feedback to identify the issue:

### 1. Console Error Logging
- Form validation errors will now be logged to the browser console
- You'll see exactly which fields are failing validation

### 2. Toast Notifications
- When validation fails, you'll see a red toast notification saying "Form Validation Failed"
- This will appear in the top-right corner of the screen

### 3. Visual Error Display
- Events array errors (like duplicate priorities) will show as red alert boxes below the event cards

## How to Debug

### Step 1: Open Browser Console
1. Press **F12** (or right-click → Inspect)
2. Click the "Console" tab
3. Keep this open while testing

### Step 2: Fill Out the Form
Make sure all required fields are filled:
- [x] Your Name *
- [x] Club *
- [x] Your Email Address *
- [x] Your Phone Number *
- [x] At least one event with all required fields:
  - Event name (min 3 characters)
  - Event type
  - Location (min 3 characters)
  - Date (must be in the future)

### Step 3: Click Submit
1. Click the "Submit X Event Requests" button
2. Check the console for error messages
3. Look for red toast notification in top-right corner
4. Look for red alert boxes near the form fields

## Common Validation Issues

### Event Date Validation
- Date must be in the future (not today or past dates)
- Check the calendar picker disabled dates

### Event Priorities
- Each event must have unique priority (1-4)
- Priorities must be consecutive starting from 1
- If you have 2 events, use priorities 1 and 2 (not 1 and 3)

### Required Fields
- Event name: minimum 3 characters
- Location: minimum 3 characters
- Event type: must be selected from dropdown
- Date: must be selected

## What to Report Back
After clicking submit, please share:
1. **Console errors** - Screenshot or copy the red error messages
2. **Toast notification** - Does the "Form Validation Failed" message appear?
3. **Alert boxes** - Are there any red alert boxes showing validation errors?
4. **Form state** - Which fields are filled out in your form?

## Next Steps
Once we see the console errors, we can pinpoint the exact validation issue and fix it.
