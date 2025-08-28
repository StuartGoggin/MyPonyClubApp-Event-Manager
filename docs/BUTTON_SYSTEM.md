# Distinctive Button System for Club Event Manager

## Overview
This system provides consistent, distinctive styling for all buttons across the Club Event Manager interface. Each button type has a unique visual identity while maintaining cohesive design principles.

## Button Types and Usage

### 1. Primary Action Button (`.distinctive-button-primary`)
**Used for:** Main actions like "Add Event"
- **Colors:** Emerald to green gradient
- **Shape:** Rounded-2xl (very rounded corners)
- **Size:** Large padding (px-8 py-4) 
- **Effect:** Scale on hover (105%), strong shadow
- **Example:** Add Event button in main interface

### 2. Secondary Action Button (`.distinctive-button-secondary`)
**Used for:** Edit, View actions, secondary options
- **Colors:** Teal to cyan gradient (light)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Standard padding
- **Effect:** Scale on hover (105%), medium shadow
- **Example:** "Edit Event Details" button in event tiles

### 3. Action Button (`.distinctive-button-action`)
**Used for:** Functional actions like "Update Schedule"
- **Colors:** Blue to indigo gradient (light)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Standard padding
- **Effect:** Scale on hover (105%), medium shadow
- **Example:** "Update Schedule" button in event schedule section

### 4. Upload Button (`.distinctive-button-upload`)
**Used for:** File upload actions
- **Colors:** Orange to amber gradient
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Full width height-12
- **Effect:** Scale on hover (105%), disabled states handled
- **Example:** "Upload Schedule" button in file upload forms

### 5. Submit Button (`.distinctive-button-submit`)
**Used for:** Form submission
- **Colors:** Blue to indigo gradient (darker)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Large padding (px-8 py-4)
- **Effect:** Scale on hover (105%), disabled states handled
- **Example:** "Submit Event Request" button in submission forms

### 6. Save Button (`.distinctive-button-save`)
**Used for:** Save actions in dialogs/forms
- **Colors:** Emerald to green gradient (same as primary but smaller)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Medium padding (px-6 py-3)
- **Effect:** Scale on hover (105%), disabled states handled
- **Example:** "Save Changes" button in edit dialogs

### 7. Cancel Button (`.distinctive-button-cancel`)
**Used for:** Cancel/close actions
- **Colors:** Gray to slate gradient (neutral)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Medium padding (px-6 py-3)
- **Effect:** No scale effect, subtle shadow
- **Example:** "Cancel" button in edit dialogs

### 8. Icon Button (`.distinctive-button-icon`)
**Used for:** Small icon-only buttons
- **Colors:** Blue gradient (light)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Small square (h-9 w-9)
- **Effect:** Scale on hover (110%), compact design
- **Example:** Download button next to schedule files

### 9. Input Button (`.distinctive-button-input`)
**Used for:** Date picker, select buttons
- **Colors:** White to gray gradient (subtle)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Variable based on content
- **Effect:** No scale effect, focus states
- **Example:** Date picker trigger button

### 10. Disabled Button (`.distinctive-button-disabled`)
**Used for:** Non-interactive buttons
- **Colors:** Slate gradient (muted)
- **Shape:** Rounded-xl (rounded corners)
- **Size:** Variable
- **Effect:** No hover effects, cursor-not-allowed
- **Example:** "View Only" button for non-editable events

## Design Principles

1. **Consistent Shape Language:** All buttons use rounded corners (xl or 2xl)
2. **Gradient Backgrounds:** Each button type has a unique gradient for visual distinction
3. **Border Enhancement:** 2px borders with opacity variations for depth
4. **Hover Effects:** Consistent scale and shadow changes on interaction
5. **Accessibility:** Proper disabled states and cursor feedback
6. **Mobile Responsive:** Scale effects disabled on mobile devices
7. **Icon Integration:** Drop shadows on icons for better visibility

## Implementation Notes

- All styles are defined in `/src/styles/distinctive-buttons.css`
- Imported in `/src/app/globals.css`
- Uses Tailwind CSS classes with @apply directive
- Responsive breakpoints handled for mobile devices
- Consistent with existing glass theme and color scheme

## Maintenance

When adding new buttons:
1. Choose the appropriate existing class based on button purpose
2. If no existing class fits, create a new one following the naming convention
3. Ensure the new style follows the established design principles
4. Test on both desktop and mobile devices
5. Update this documentation

## File Locations

- **Main Definition:** `/src/styles/distinctive-buttons.css`
- **Import Location:** `/src/app/globals.css`
- **Usage Examples:** 
  - `/src/app/club-manager/page.tsx`
  - `/src/components/club-manager/club-event-status.tsx`
  - `/src/components/club-manager/edit-event-dialog.tsx`
  - `/src/components/club-manager/club-event-submission.tsx`
  - `/src/components/event-schedule-upload.tsx`
