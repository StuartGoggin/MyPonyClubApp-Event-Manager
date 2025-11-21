import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import cors from 'cors';
import emailRouter from './api/send-event-request-email';

// Define the secret
const resendApiKey = defineSecret('RESEND_API_KEY');

// Create Express app
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Mount the email router
app.use('/send-event-request-email', emailRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-email',
    hasResendKey: !!process.env.RESEND_API_KEY
  });
});

// Export the function with secret access
export const apiEmail = onRequest({
  timeoutSeconds: 60,
  memory: "512MiB",
  region: "australia-southeast1",
  secrets: [resendApiKey], // Grant access to the secret
}, app);
