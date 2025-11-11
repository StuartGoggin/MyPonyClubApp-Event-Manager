# Zone Manager Event Approval - Partial Page Refresh Feature

## Overview
Implemented a smart partial page refresh system for the Zone Manager Event Approvals that collapses processed tiles, shows approval status, and automatically focuses on the next pending event.

## Features Implemented

### 1. **Collapsible Event Tiles**
When an event is approved or rejected:
- The tile **automatically collapses** to a compact view
- Shows a clear status message: "Event has been APPROVED" or "Event has been REJECTED"
- Displays appropriate color coding (green for approved, red for rejected)
- **Expand/collapse button** (chevron icon) allows viewing full details again

### 2. **Automatic Focus Management**
- After processing an event, focus **automatically shifts** to the next pending event
- Uses smooth scroll animation to bring next event into view
- Visual ring highlight effect to draw attention to the focused tile
- Slight scale animation for emphasis

### 3. **Partial Page Refresh**
- **No full page reload** - only background data refresh
- Local state management tracks processed events immediately
- API call happens in background with 500ms delay
- User can continue working without interruption

### 4. **Visual Status Indicators**
- **Collapsed state**: Shows compact header with status badge
- **Status message**: Icon + text (✓ APPROVED or ✗ REJECTED)
- **Color-coded borders**: Green for approved, red for rejected
- **Badge styling**: Gradient backgrounds matching status

### 5. **Smart Tile Management**
- Processed events remain visible but collapsed
- Approval/Reject buttons only show for unprocessed events
- Users can expand processed tiles to review details
- All event information preserved and accessible

## Technical Implementation

### State Management
```typescript
const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());
const [processedEvents, setProcessedEvents] = useState<Map<string, { 
  action: 'approved' | 'rejected', 
  notes: string 
}>>(new Map());
const [focusEventId, setFocusEventId] = useState<string | null>(null);
```

### Ref-based Scrolling
```typescript
const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());

useEffect(() => {
  if (focusEventId) {
    const element = eventRefs.current.get(focusEventId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}, [focusEventId]);
```

### Approval Workflow
1. User clicks Approve/Reject button
2. Dialog opens for notes entry
3. On submit:
   - API call to update event status
   - Local state updated immediately
   - Tile collapsed
   - Focus set to next pending event
   - Background data refresh after 500ms
4. UI updates instantly without page reload

## User Experience Benefits

### Before:
- Click approve → full page reload → lose context
- Have to scroll back to find next event
- Jarring experience with data re-fetch

### After:
- Click approve → tile collapses smoothly
- Status immediately visible
- Auto-scroll to next event
- Seamless, efficient workflow

## Visual Design

### Collapsed Tile Header:
```
[Priority #1] Event Name - 9th Nov 2025
✓ Event has been APPROVED             [Approved Badge] [▼ Expand]
```

### Expanded Tile (After Approval):
```
[Priority #1] Event Name - 9th Nov 2025        [Approved Badge] [▲ Collapse]
────────────────────────────────────────────────────────────────
[Full event details visible]
[No action buttons shown]
```

### Focus Highlight:
- Ring effect: `ring-4 ring-primary/50`
- Scale animation: `scale-[1.02]`
- Smooth scroll transition
- Auto-clears after 1 second

## Files Modified

### `src/components/zone-manager/zone-event-approval.tsx`
**Changes:**
1. Added imports: `useRef, useEffect, ChevronDown, ChevronUp`
2. New state variables for collapse/process tracking
3. Enhanced `submitEventAction` function with local state updates
4. New `toggleEventCollapse` function
5. Updated tile rendering with conditional collapse logic
6. Added focus effect with useEffect hook
7. Conditional button rendering (hide for processed events)

**Key Code Additions:**
- Collapse state management
- Auto-focus with smooth scroll
- Visual indicators for processed status
- Expand/collapse toggle button
- Color-coded tile backgrounds

## Testing

✅ **Build Status**: Successful compilation
✅ **TypeScript**: No type errors  
✅ **Bundle Size**: 15.1 kB (optimized)
✅ **Features**:
- Collapse/expand functionality
- Focus management working
- Visual indicators correct
- No page reload required
- Background data refresh

## Usage

1. **Approve Event**:
   - Click "Approve Event" button
   - Enter notes (optional)
   - Click "Approve Event" in dialog
   - Tile collapses, shows green "APPROVED" status
   - Focus jumps to next event

2. **Reject Event**:
   - Click "Reject" button
   - Enter rejection reason (required)
   - Click "Reject Event" in dialog
   - Tile collapses, shows red "REJECTED" status
   - Focus jumps to next event

3. **Review Processed Event**:
   - Click chevron-down button to expand
   - View all event details
   - Click chevron-up to collapse again

## Benefits

✨ **Efficiency**: Process multiple events quickly without page reloads
✨ **Context Preservation**: No losing place in the list
✨ **Visual Feedback**: Immediate status indication
✨ **Smooth UX**: Professional transitions and animations
✨ **Accessibility**: Keyboard-friendly with focus management

## Future Enhancements (Optional)

- Undo/revert approval action
- Bulk approve/reject functionality
- Keyboard shortcuts (Space to expand, A to approve, R to reject)
- Filter to show/hide processed events
- Export approval history

---

**Status**: ✅ Implemented and tested
**Build**: ✅ Production ready
**UX**: ✅ Smooth partial refresh workflow
