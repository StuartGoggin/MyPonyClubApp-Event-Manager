# Vercel Deployment Setup

## Why Vercel is Recommended

Your app uses Next.js API routes extensively for:
- Email notifications (`/api/send-event-request-email`)
- Database operations (`/api/clubs`, `/api/zones`, etc.)
- Admin functions (`/api/email-queue/*`)

Vercel provides native Next.js support with secure environment variables.

## Quick Vercel Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (unless you have one)
# - What's your project's name? MyPonyClubApp-Event-Manager
# - In which directory is your code located? ./
```

### 3. Set Environment Variables
Via Vercel dashboard (https://vercel.com/dashboard):
1. Go to your project
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add these variables:

```
FIREBASE_SERVICE_ACCOUNT_KEY = {your firebase json}
RESEND_API_KEY = re_your_production_key
GEMINI_API_KEY = your_gemini_key (optional)
GOOGLE_GENAI_API_KEY = your_gemini_key (optional)
```

### 4. Redeploy
```bash
vercel --prod
```

## Environment Variable Security

✅ **Secure on Vercel**: Environment variables are server-side only
✅ **Not exposed**: Variables never sent to client browser
✅ **Per environment**: Different values for preview vs production

## Alternative: CLI Environment Setup
```bash
# Set via CLI (more secure for sensitive keys)
vercel env add RESEND_API_KEY production
# Paste your key when prompted

vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
# Paste your entire Firebase JSON when prompted
```

## Verify Deployment
After deployment, test:
- Main app: https://your-app.vercel.app
- Health check: https://your-app.vercel.app/api/health
- Email form: https://your-app.vercel.app/request-event

## Deployment Benefits
- ✅ All API routes work perfectly
- ✅ Environment variables secure
- ✅ Automatic SSL/HTTPS
- ✅ Global CDN
- ✅ Preview deployments for testing
- ✅ Git integration for automatic deployments