import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
// logger removed as not used
import express from 'express';
import cors from 'cors';

// Define the RESEND_API_KEY secret
const resendApiKey = defineSecret('RESEND_API_KEY');

// Create a simple Express app without complex Firebase initialization
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-simple',
    hasResendKey: !!process.env.RESEND_API_KEY
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Simple API is working',
    timestamp: new Date().toISOString()
  });
});

// Catch all for other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

export const apiSimple = onRequest({
  timeoutSeconds: 60,
  memory: "512MiB",
  region: "australia-southeast1",
  secrets: [resendApiKey], // Grant access to RESEND_API_KEY secret
}, app);