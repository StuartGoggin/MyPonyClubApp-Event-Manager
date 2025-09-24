import { onRequest } from 'firebase-functions/v2/https';
// logger removed as not used
import express from 'express';
import cors from 'cors';

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
    service: 'api-simple'
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
}, app);