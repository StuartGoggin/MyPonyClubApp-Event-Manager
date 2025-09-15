# Environment Setup Guide

This guide provides comprehensive instructions for setting up the PonyClub Event Manager development and production environments.

## 📋 **Quick Setup Checklist**

- [ ] Clone repository and install dependencies
- [ ] Configure Firebase Admin SDK
- [ ] Set up Resend API key (for email notifications)
- [ ] Configure optional services (Gemini AI)
- [ ] Test the application

## 🔧 **Required Environment Variables**

### Firebase Configuration (Required)
The application requires Firebase Admin SDK for database operations:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxx%40your-project.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'
```

**Setup Instructions:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project or create a new one
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Copy the entire JSON content
6. **Important**: Replace actual newlines in the `private_key` field with `\\n`

### Email Notifications (Phase 1) - Resend API
Required for event request email notifications:

```env
RESEND_API_KEY=re_your_actual_api_key_here
```

**Setup Instructions:**
1. Sign up at [resend.com](https://resend.com)
2. Navigate to **API Keys** in your dashboard
3. Click **"Create API Key"**
4. Copy the generated key (starts with `re_`)
5. Add to your `.env.local` file

**Development vs Production:**
- **Without API Key**: Emails are simulated and logged to console (perfect for development)
- **With API Key**: Real emails are sent to recipients (production mode)

## 🤖 **Optional Environment Variables**

### Gemini AI Integration (Optional)
For AI-powered event suggestions and conflict detection:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
```

**Setup Instructions:**
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Generate an API key
3. Add both variables with the same key

## 📁 **Environment File Setup**

### 1. Create `.env.local` File
Copy the template and fill in your values:

```bash
# Copy from repository template
cp .env.example .env.local

# Edit with your values
# Replace all placeholder values with actual credentials
```

### 2. Complete `.env.local` Example
Here's a complete example with all variables:

```env
# Firebase Configuration for PonyClub Events
FIREBASE_SERVICE_ACCOUNT_KEY='{...your firebase config...}'

# Email Notifications (Phase 1)
RESEND_API_KEY=re_your_actual_api_key_here

# Optional: AI Features
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here
```

## 🧪 **Testing Your Setup**

### 1. Install Dependencies
```bash
npm install
```

### 2. Test Database Connection
```bash
npm run dev
# Visit: http://localhost:9002/api/health
# Should show: {"status": "healthy", "database": "connected"}
```

### 3. Test Email System
```bash
# Visit the event request form
http://localhost:9002/request-event

# Fill out and submit form
# Check console for email logs (development mode)
# Or check your email inbox (production mode)
```

### 4. Test Admin Features
```bash
# Access email queue management
http://localhost:9002/admin/email-queue

# Use admin token: admin-token
```

## 🔒 **Security Considerations**

### Environment File Security
- **Never commit** `.env.local` to version control
- **Add to .gitignore**: Ensure `.env.local` is ignored
- **Use different keys** for development and production
- **Rotate keys regularly** for production environments

### Firebase Security
- **Service Account Permissions**: Use least privilege principle
- **Firestore Rules**: Configure appropriate database rules
- **API Key Restrictions**: Limit API key usage by domain/IP

### Email Security
- **Resend Domain Verification**: Verify your sending domain
- **Rate Limiting**: Monitor email sending limits
- **Recipient Validation**: Validate all email addresses

## 🔧 **Development vs Production**

### Development Environment
- **Firebase**: Use development project
- **Resend**: Optional (emails simulated)
- **Database**: Development Firestore instance
- **Logging**: Verbose console output

### Production Environment
- **Firebase**: Production project with proper security rules
- **Resend**: Required for email delivery
- **Database**: Production Firestore with backups
- **Monitoring**: Error tracking and performance monitoring

## 🐛 **Troubleshooting**

### Firebase Issues
```bash
# Error: Firebase Admin SDK initialization failed
# Solution: Check FIREBASE_SERVICE_ACCOUNT_KEY format
# Ensure newlines are properly escaped as \\n
```

### Email Issues
```bash
# Error: Resend API authentication failed
# Solution: Verify RESEND_API_KEY is correct
# Check API key hasn't expired or been revoked
```

### Application Issues
```bash
# Error: Module not found
# Solution: Run npm install
npm install

# Error: Port already in use
# Solution: Kill existing process or use different port
npm run dev -- -p 9003
```

## 📖 **Additional Resources**

- **Firebase Setup**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **API Documentation**: [docs/API.md](./docs/API.md)
- **System Documentation**: [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)

## 🆘 **Getting Help**

If you encounter issues:

1. **Check the logs**: Console output often shows the root cause
2. **Verify environment variables**: Ensure all required variables are set correctly
3. **Test individual components**: Use the health endpoint and admin interface
4. **Check Firebase Console**: Verify permissions and quotas
5. **Review documentation**: Check specific setup guides for detailed instructions

## 📝 **Environment Validation Script**

Create this simple validation script to check your setup:

```javascript
// scripts/validate-env.js
const requiredVars = ['FIREBASE_SERVICE_ACCOUNT_KEY'];
const optionalVars = ['RESEND_API_KEY', 'GEMINI_API_KEY'];

console.log('🔍 Environment Validation');
console.log('========================');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing (Required)'}`);
});

optionalVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Set' : '⚠️ Not set (Optional)'}`);
});
```

Run with: `node scripts/validate-env.js`