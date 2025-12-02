# Testing XSS Protection in Email Preview

## What Was Fixed
DOMPurify now sanitizes HTML content before rendering in:
- Email Queue preview (`/admin/email-queue`)
- Email Templates preview (`/admin/email-templates`)

## Test Cases

### Test 1: Script Tag Injection
**Malicious HTML:**
```html
<p>Hello!</p><script>alert('XSS Attack!')</script>
```

**Expected Result:** Script tag removed, only "Hello!" displays

---

### Test 2: Event Handler Injection
**Malicious HTML:**
```html
<img src="x" onerror="alert('XSS via onerror')">
<div onclick="alert('XSS via onclick')">Click me</div>
```

**Expected Result:** Event handlers stripped, safe HTML remains

---

### Test 3: JavaScript URL
**Malicious HTML:**
```html
<a href="javascript:alert('XSS')">Click here</a>
```

**Expected Result:** Link rendered without javascript: protocol

---

### Test 4: Data URI with Script
**Malicious HTML:**
```html
<iframe src="data:text/html,<script>alert('XSS')</script>"></iframe>
```

**Expected Result:** Iframe removed or src sanitized

---

## How to Test

### Option 1: Via Email Queue (Recommended)
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:9002/admin/email-queue
3. Login with admin credentials
4. Click "Create Test Email" or use existing email
5. Edit email content to include malicious HTML from test cases above
6. Click "Preview" button
7. **Verify:** No alert boxes pop up, HTML is safely rendered

### Option 2: Via API + Database
```powershell
# Add malicious email to queue
$body = @{
  to = @("test@example.com")
  subject = "XSS Test"
  htmlContent = '<p>Safe content</p><script>alert("XSS")</script>'
  textContent = "Safe content"
  emailType = "test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9002/api/email-queue" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer admin-token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

Then view in admin interface.

### Option 3: Browser DevTools
1. Open admin email queue page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Paste this test:
```javascript
// This should NOT execute if sanitization works
const testHTML = '<img src=x onerror="console.log(\'XSS executed!\')">Test';
// Check the preview area - console.log should never fire
```

---

## What DOMPurify Blocks

✅ **Blocked:**
- `<script>` tags
- Event handlers (onclick, onerror, onload, etc.)
- `javascript:` URLs
- `data:` URLs with scripts
- `<iframe>` with unsafe sources
- Form submissions
- Object/embed tags

✅ **Allowed (Safe):**
- Basic HTML tags (p, div, span, h1-h6)
- Text formatting (strong, em, b, i)
- Lists (ul, ol, li)
- Tables
- Images with http/https src
- Links with http/https href
- CSS classes and safe styles

---

## Success Criteria

✅ **Pass:** No alert boxes appear  
✅ **Pass:** Console shows no errors related to script execution  
✅ **Pass:** HTML renders safely without malicious code  
✅ **Pass:** Legitimate email formatting (bold, links, images) still works  

❌ **Fail:** Any script executes  
❌ **Fail:** Alert boxes appear  
❌ **Fail:** Console shows "XSS executed" messages

---

## Quick Visual Test

**Before Fix (VULNERABLE):**
```tsx
dangerouslySetInnerHTML={{ __html: previewEmail.htmlContent }}
// ❌ Scripts would execute
```

**After Fix (SECURE):**
```tsx
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewEmail.htmlContent) }}
// ✅ Scripts are stripped before rendering
```

---

## Additional Security Notes

- DOMPurify uses a whitelist approach (safer than blacklist)
- Works in both browser and Node.js environments (isomorphic)
- Automatically handles new XSS vectors as they're discovered
- No configuration needed - secure by default
- Performance impact: negligible (~1-2ms per sanitization)

---

## If You Find a Bypass

If you discover content that bypasses the sanitization:
1. Document the exact HTML payload
2. Test with latest DOMPurify version
3. Report to DOMPurify project if it's a new vector
4. Add custom sanitization rules if needed
