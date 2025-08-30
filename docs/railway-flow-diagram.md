# Event Approval Railway Flow Map

## Main Railway Line (Linear Progress)

```
1. Date Submitted → 2. Date Approved → 3. Schedule Required → 4. Schedule Submitted → 5. Fully Approved
   ●───────────────●────────────────●─────────────────●──────────────────●
  📅              ✅               📄                📄                  🎉
(proposed)      (approved)    (missing schedule)  (schedule pending)  (schedule approved)
```

## Rejection Loops (Side Tracks)

### Date Rejection Loop:
```
1. Date Submitted → 2. Date Review → ❌ Date Rejected → 🔄 Update Required
   ●───────────────●──────────────── ↓                    ↑
                                    └────────────────────────┘
```

### Schedule Rejection Loop:
```
4. Schedule Submitted → Schedule Review → ❌ Schedule Rejected → 🔄 Update Required
   ●──────────────────●─────────────────── ↓                      ↑
                                           └──────────────────────────┘
```

## Complete Flow with All Possible Paths:

```
START → Date Submitted → Date Review
           ●──────────────●
                          ├─→ ✅ Date Approved → Schedule Required
                          │      ●──────────────────●
                          │                         │
                          │                         ↓
                          │                    Schedule Submitted → Schedule Review
                          │                         ●──────────────────●
                          │                                            ├─→ ✅ Schedule Approved → 🎉 FULLY APPROVED
                          │                                            │
                          │                                            └─→ ❌ Schedule Rejected
                          │                                                      ↓
                          │                                                 🔄 Schedule Update
                          │                                                      ↑
                          │                                                      └─────────┘
                          │
                          └─→ ❌ Date Rejected
                                    ↓
                               🔄 Date Update
                                    ↑
                                    └─────────┘
```

## Railway Progress Indicators:

### Station Types:
- ● **Completed Station** (Green) - Process finished successfully
- ● **Current Station** (Blue/Amber/Red) - Process currently here
- ○ **Future Station** (Gray) - Process not yet reached
- 🔄 **Loop Station** (Red, spinning) - Rejection requiring revision

### Track Segments:
- ═══ **Green Track** - Completed segment
- ─── **Gray Track** - Pending segment
- ↓↑ **Loop Track** - Rejection/revision cycle

### Station Icons:
- 📅 Calendar - Date submission/approval
- ✅ CheckCircle - Approval steps
- ❌ XCircle - Rejection steps
- 📄 FileText - Schedule related
- ⏰ Clock - Review/pending states
- 🔄 RefreshCw - Update/revision required
- 🎉 Celebration - Final approval

## Interactive Elements:

### Current Status Display:
Shows where the event currently is in the process

### Next Action Guide:
Tells the user what they need to do next:
- "Awaiting zone manager approval"
- "Upload event schedule document"
- "Update event date and resubmit"
- "Update schedule and resubmit"
- "Event approved - ready to proceed"

### Visual Feedback:
- Pulsing animation for current station
- Color coding (green=done, blue=current, red=rejected, gray=pending)
- Progress bar showing completion percentage
- Loop indicators for rejection cycles
