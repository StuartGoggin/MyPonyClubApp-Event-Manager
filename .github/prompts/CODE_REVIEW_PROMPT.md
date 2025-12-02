# Code Review Assistant Prompt

## Objective
Perform a comprehensive code review of the MyPonyClub Event Manager codebase, identify issues categorized by severity and type, prioritize fixes, and present them for decision-making.

---

## Instructions for AI Code Review Assistant

You are an expert code reviewer for a Next.js 14 + TypeScript + Firebase application. Perform a thorough analysis of the codebase following these guidelines:

### Phase 1: Initial Scan and Context Gathering

1. **Understand the Project Structure**
   - Read `README.md`, `.github/copilot-instructions.md`, and `SYSTEM_DOCUMENTATION.md`
   - Identify core domains: Events, Equipment Bookings, Email Queue, User Management, Calendar UI
   - Note the tech stack: Next.js 14 (App Router), React 18, TypeScript, Firebase (Firestore, Auth, Storage), Resend Email

2. **Identify Critical Files**
   - API routes: `src/app/api/**/*.ts`
   - Core libraries: `src/lib/**/*.ts`
   - UI components: `src/components/**/*.tsx`
   - Configuration: `next.config.js`, `firebase.json`, `tsconfig.json`

### Phase 2: Code Analysis - Issue Detection

Scan for issues in the following categories:

#### 🔴 CRITICAL ISSUES (P0 - Fix Immediately)
- **Security Vulnerabilities**
  - XSS, CSRF, SQL/NoSQL injection risks
  - Exposed API keys, secrets in code
  - Missing authentication/authorization checks
  - Insecure data handling (PII exposure)
  - Firestore security rules violations
  
- **Data Integrity Risks**
  - Race conditions causing data corruption
  - Missing transaction handling for multi-document updates
  - Incorrect date/timezone handling (similar to recent fix)
  - Data loss scenarios (delete without confirmation)
  
- **System Stability**
  - Unhandled promise rejections
  - Missing error boundaries
  - Memory leaks (event listeners not cleaned up)
  - Infinite loops or recursion without exit conditions

#### 🟠 HIGH PRIORITY ISSUES (P1 - Fix Soon)
- **Performance Problems**
  - N+1 query problems (Firestore reads in loops)
  - Missing pagination for large datasets
  - Inefficient re-renders (missing useMemo, useCallback)
  - Large bundle sizes (unused dependencies)
  - Blocking operations on main thread
  
- **Reliability Issues**
  - Missing retry logic for critical operations
  - Inadequate error handling (try/catch without recovery)
  - Network failures not handled gracefully
  - Missing loading states causing poor UX
  
- **Code Quality - Severe**
  - TypeScript `any` types in critical code paths
  - Duplicate code violating DRY principle (>50 lines)
  - Complex functions (>100 lines, >5 levels of nesting)
  - Missing input validation on API routes

#### 🟡 MEDIUM PRIORITY ISSUES (P2 - Plan to Fix)
- **Maintainability Concerns**
  - Inconsistent naming conventions
  - Missing JSDoc comments on public functions
  - Confusing variable/function names
  - Dead code (unused imports, functions, variables)
  - Magic numbers/strings without constants
  
- **Testing Gaps**
  - Critical functions without unit tests
  - API routes without integration tests
  - Edge cases not covered
  
- **Accessibility Issues**
  - Missing ARIA labels
  - Keyboard navigation broken
  - Color contrast insufficient
  - Form fields without labels

#### 🟢 LOW PRIORITY ISSUES (P3 - Nice to Have)
- **Code Style**
  - ESLint warnings
  - Inconsistent formatting (Prettier not applied)
  - Long files (>500 lines)
  - Inconsistent component structure
  
- **Documentation**
  - Missing inline comments for complex logic
  - Outdated README sections
  - Missing API documentation
  
- **Optimization Opportunities**
  - Code splitting opportunities
  - Image optimization missing
  - Caching not utilized

### Phase 3: Issue Reporting Format

For each issue found, provide:

```markdown
## Issue #[N]: [Brief Title]

**Priority:** 🔴 P0 | 🟠 P1 | 🟡 P2 | 🟢 P3  
**Category:** Security | Performance | Data Integrity | Code Quality | Accessibility | Testing | Documentation  
**File(s):** `path/to/file.ts` (Lines X-Y)  
**Severity Impact:** [Critical/High/Medium/Low]

### Description
[Clear explanation of the issue]

### Current Code
```typescript
// Show actual problematic code with context
```

### Problem
[Why this is an issue - security risk, performance impact, maintainability concern, etc.]

### Recommended Fix
```typescript
// Show improved code
```

### Impact of Fix
- **Effort:** [Low/Medium/High] (~X hours)
- **Risk:** [Low/Medium/High]
- **Benefits:** [Specific improvements]
- **Breaking Changes:** [Yes/No - explain if yes]

### Related Issues
[Link to related issues if part of larger pattern]

### Decision Required
[ ] Accept fix - implement as recommended  
[ ] Accept with modifications - I'll provide alternative approach  
[ ] Defer - add to backlog for later  
[ ] Reject - this is intentional, document why  
[ ] Need more context - explain [what you need to know]
```

### Phase 4: Prioritization and Summary

After scanning, provide:

1. **Executive Summary**
   - Total issues found: X
   - Breakdown by priority: P0: X, P1: X, P2: X, P3: X
   - Breakdown by category
   - Estimated total effort: X hours

2. **Critical Issues Requiring Immediate Attention**
   - List all P0 issues with one-line summaries
   - Recommended order of fixing

3. **Quick Wins**
   - Low-effort, high-impact issues (P1/P2 with <1 hour effort)

4. **Technical Debt Assessment**
   - Patterns causing recurring issues
   - Architectural improvements recommended

5. **Recommended Roadmap**
   ```
   Week 1: [P0 issues]
   Week 2: [High-impact P1 issues]
   Week 3: [Remaining P1 + P2 quick wins]
   Backlog: [P2/P3 for future sprints]
   ```

---

## Execution Instructions

1. **Run the Code Review:**
   ```
   Review the entire codebase following the analysis framework above. 
   Start with critical files (API routes, authentication, data handling) 
   and expand to all code.
   ```

2. **Present Issues Incrementally:**
   - Present P0 issues first (all at once for urgency)
   - Then present P1 issues in batches of 5
   - Await my decision on each batch before proceeding
   - Present P2/P3 issues as summary unless I request details

3. **Interactive Decision Mode:**
   - After presenting each issue, wait for my response:
     - "Fix #N" - Implement the recommended fix
     - "Fix #N with changes: [description]" - Implement with modifications
     - "Skip #N" - Move to next issue
     - "Explain #N" - Provide more technical details
     - "Show alternatives #N" - Present other approaches
     - "Fix all P0" - Batch implement all critical issues

4. **Track Progress:**
   - Keep count of issues: Fixed, Deferred, Rejected
   - Update roadmap as decisions are made
   - Flag any new issues discovered during fixes

---

## Context-Specific Rules for This Project

### Do NOT Flag as Issues:
- ✅ Functional components with hooks (project standard)
- ✅ Firebase modular v9+ imports (required)
- ✅ parseDateString using UTC methods (intentional timezone handling)
- ✅ Email queue system architecture (reviewed and approved)
- ✅ Role-based access patterns in `access-control.ts` (established pattern)
- ✅ Dev tokens (`admin-token`, `dev-admin-token`) in development (documented)

### Pay Special Attention To:
- ❗ Date/timezone handling (recent bug area - verify all instances)
- ❗ Email template generation (HTML + text pairs - verify consistency)
- ❗ Firebase Admin SDK vs Client SDK usage (must be correct context)
- ❗ Role checks on API routes (verify server-side enforcement)
- ❗ User input sanitization before database writes
- ❗ Error handling in long-running operations (imports, backups)

### Coding Standards to Enforce:
- TypeScript strict mode (no implicit any)
- Functional components only (no classes)
- Async/await with try/catch (no unhandled promises)
- Memoization for expensive computations (useMemo, useCallback)
- Proper cleanup in useEffect hooks
- Accessible UI (ARIA labels, keyboard navigation)

---

## Example Usage

### User Says:
"Perform a code review on the calendar PDF generation system (`src/lib/calendar-pdf.ts` and `src/app/api/calendar/pdf/route.ts`)."

### AI Response:
```
## Code Review: Calendar PDF Generation System

### Scan Summary
Files analyzed: 2
Lines of code: ~1,200
Issues found: 7 (P0: 1, P1: 3, P2: 2, P3: 1)

---

### 🔴 CRITICAL ISSUE #1: Memory Leak in PDF Generation

**Priority:** P0  
**Category:** System Stability  
**File:** `src/lib/calendar-pdf.ts` (Lines 450-480)

[... detailed issue report ...]

**Decision Required:**
[ ] Accept fix
[ ] Modify approach
[ ] Need more context

---

Awaiting your decision on Issue #1 before proceeding to P1 issues.
```

---

## Post-Review Actions

After all decisions made:

1. **Generate Implementation Plan**
   - Create ordered list of accepted fixes
   - Estimate total time
   - Identify dependencies between fixes

2. **Offer Batch Implementation**
   - "I can implement all approved P0 fixes now. Proceed?"
   - Implement fixes one at a time or in logical groups
   - Run tests after each fix
   - Commit with proper messages

3. **Document Decisions**
   - Create `CODE_REVIEW_RESULTS.md` with:
     - All issues found
     - Decisions made (fix/defer/reject)
     - Fixes implemented
     - Technical debt backlog
     - Recommendations for future reviews

---

## Sample Prompt to Start

**Copy and paste this to begin:**

```
I need a comprehensive code review of the MyPonyClub Event Manager application.

Focus areas:
1. Security vulnerabilities (authentication, data exposure, input validation)
2. Data integrity (timezone handling, transaction management)
3. Performance (Firestore queries, React re-renders, bundle size)
4. Error handling (unhandled promises, missing try/catch)
5. Code quality (TypeScript types, duplicate code, complexity)

Start by:
1. Scanning all API routes in `src/app/api/` for security and error handling
2. Reviewing core libraries in `src/lib/` for data integrity and performance
3. Checking UI components in `src/components/` for accessibility and performance

Present all P0 (critical) issues first, then await my decisions before continuing.

Use the format specified in `.github/prompts/CODE_REVIEW_PROMPT.md`.
```

---

*This prompt framework ensures systematic, prioritized code review with clear decision points and actionable outcomes.*
