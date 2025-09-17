/**
 * Firebase Functions for PonyClub Event Manager
 * 
 * This file sets up the main Express application that handles all API routes
 * for the PonyClub Event Manager system. All routes are prefixed with /api/
 * and are served as Firebase Functions.
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from 'firebase-functions/v2';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Create Express application
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API endpoints
  crossOriginEmbedderPolicy: false
}));

// Compression middleware for better performance
app.use(compression());

// CORS configuration for cross-origin requests
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:9002',
    'https://ponyclub-events.web.app',
    'https://ponyclub-events.firebaseapp.com',
    /\.web\.app$/,
    /\.firebaseapp\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request details
  logger.info('API Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  });

  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PonyClub Event Manager API',
    version: '1.3.0',
    environment: process.env.NODE_ENV || 'development',
    region: process.env.FUNCTION_REGION || 'australia-southeast1'
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'PonyClub Event Manager API',
    version: '1.3.0',
    documentation: 'https://github.com/StuartGoggin/MyPonyClubApp-Event-Manager',
    endpoints: [
      'GET /health - Health check',
      'GET /clubs - Get all clubs',
      'GET /zones - Get all zones',
      'GET /events - Get all events',
      'POST /send-event-request-email - Send notification emails',
      'POST /pdf/event-request - Generate event request PDF',
      'GET /pdf/calendar - Generate calendar PDF'
    ],
    timestamp: new Date().toISOString()
  });
});

// API route imports (will be added as routes are migrated)
import healthRouter from './api/health';
import clubsRouter from './api/clubs';
import zonesRouter from './api/zones';
import eventsRouter from './api/events';
import emailRouter from './api/send-event-request-email';

// Email queue routes
import emailQueueRouter from './api/email-queue/index';
import emailQueueLogsRouter from './api/email-queue/logs';
import emailQueueSendRouter from './api/email-queue/send';
import emailQueueConfigRouter from './api/email-queue/config';

// PDF generation routes
import pdfRouter from './api/pdf';

// Admin route imports
import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from './api/admin/users';
import { updateUserRole } from './api/admin/users/role';
import { importData } from './api/admin/import';
import { exportData } from './api/admin/export';
import { testFirebase } from './api/admin/testing/test-firebase';
import { seedDatabase, getSeedInfo } from './api/admin/testing/seed-database';

// Register API routes (uncomment as routes are migrated)
app.use('/health', healthRouter);
app.use('/clubs', clubsRouter);
app.use('/zones', zonesRouter);
app.use('/events', eventsRouter);
app.use('/send-event-request-email', emailRouter);
app.use('/email-queue', emailQueueRouter);
app.use('/email-queue/logs', emailQueueLogsRouter);
app.use('/email-queue/send', emailQueueSendRouter);
app.use('/email-queue/config', emailQueueConfigRouter);
app.use('/pdf', pdfRouter);

// Create admin router
const adminRouter = Router();

// Admin user management routes
adminRouter.get('/users', getUsers);
adminRouter.post('/users', createUser);
adminRouter.put('/users', updateUser);
adminRouter.delete('/users', deleteUser);
adminRouter.patch('/users/role', updateUserRole);

// Admin data management routes
adminRouter.post('/import', importData);
adminRouter.post('/export', exportData);

// Admin testing routes
adminRouter.get('/test-firebase', testFirebase);
adminRouter.post('/seed-database', seedDatabase);
adminRouter.get('/seed-database', getSeedInfo);

// Register admin routes
app.use('/admin', adminRouter);

// Global error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  });
});

// 404 handler for unknown routes
app.use('*', (req: Request, res: Response) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Set global options for all functions
setGlobalOptions({
  region: 'australia-southeast1',
  maxInstances: 10,
});

// Export the Express app as a Firebase Function
export const api = onRequest({
  timeoutSeconds: 540,
  memory: '1GiB',
  region: 'australia-southeast1',
}, app);

// Export additional utility functions for Firebase Functions
export const initializeApp = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.app();
};

// Export database helper
export const getFirestore = () => admin.firestore();

// Export authentication helper
export const getAuth = () => admin.auth();

// Export storage helper
export const getStorage = () => admin.storage();

// Development server for local testing
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    logger.info(`Development server running on port ${port}`);
    console.log(`🚀 PonyClub API Server running on http://localhost:${port}`);
    console.log(`📋 Health check: http://localhost:${port}/health`);
  });
}