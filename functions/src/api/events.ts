import { Router } from 'express';
import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Event } from '../lib/types';
import { logger } from 'firebase-functions/v2';

const router = Router();

/**
 * GET /events
 * Retrieves events from the database with optional filtering
 * Query parameters:
 * - zoneId: Filter events by zone (through clubs)
 * - clubId: Filter events by specific club
 * - status: Filter events by status
 */
router.get('/', async (req, res) => {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      logger.warn('Events API: Database connection issue', { error: errorMessage });
      return res.status(503).json({
        error: 'Database connection unavailable', 
        message: errorMessage,
        events: [] 
      });
    }

    const { zoneId, status, clubId } = req.query;
    
    logger.info('Events API: Fetching events', { 
      zoneId: zoneId as string, 
      status: status as string, 
      clubId: clubId as string 
    });

    let query = adminDb.collection('events');

    // Filter by zone through clubs if zoneId is provided
    if (zoneId) {
      // First get clubs in the zone
      const clubsSnapshot = await adminDb.collection('clubs').where('zoneId', '==', zoneId).get();
      const clubIds = clubsSnapshot.docs.map((doc: any) => doc.id);
      
      if (clubIds.length === 0) {
        logger.info('Events API: No clubs found for zone', { zoneId });
        return res.json({ events: [] });
      }
      
      // Filter events by clubs in the zone
      query = query.where('clubId', 'in', clubIds);
    }

    // Filter by specific club if provided
    if (clubId && !zoneId) {
      query = query.where('clubId', '==', clubId);
    }

    // Filter by status if provided
    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by date
    query = query.orderBy('date', 'desc');

    const snapshot = await query.get();
    const events: Event[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      
      // Handle date conversion with error handling
      let eventDate: Date;
      try {
        if (data.date && typeof data.date.toDate === 'function') {
          eventDate = data.date.toDate();
        } else if (data.date instanceof Date) {
          eventDate = data.date;
        } else if (typeof data.date === 'string') {
          eventDate = new Date(data.date);
        } else {
          logger.warn('Events API: Invalid date format', { eventId: doc.id, date: data.date });
          eventDate = new Date(); // Fallback to current date
        }
      } catch (error) {
        logger.error('Events API: Error converting date', { eventId: doc.id, error: error });
        eventDate = new Date(); // Fallback to current date
      }
      
      events.push({
        id: doc.id,
        name: data.name,
        date: eventDate,
        clubId: data.clubId,
        eventTypeId: data.eventTypeId,
        status: data.status,
        location: data.location,
        source: data.source,
        coordinatorName: data.coordinatorName,
        coordinatorContact: data.coordinatorContact,
        isQualifier: data.isQualifier,
        notes: data.notes,
        submittedBy: data.submittedBy,
        submittedByContact: data.submittedByContact,
        schedule: data.schedule,
        priority: data.priority,
        isHistoricallyTraditional: data.isHistoricallyTraditional
      });
    });

    logger.info('Events API: Successfully retrieved events', { count: events.length });
    return res.json({ events });

  } catch (error: any) {
    logger.error('Events API: Error fetching events', { error: error.message, stack: error.stack });
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      logger.warn('Events API: Database connection timeout or unavailable');
      return res.status(503).json({
        error: 'Database connection timeout', 
        message: 'Unable to connect to the database. Please check your network connection and try again.',
        events: [] 
      });
    }
    
    return res.status(500).json({
      error: 'Failed to fetch events', 
      events: []
    });
  }
});

/**
 * POST /events
 * Creates a new event in the database
 */
router.post('/', async (req, res) => {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      const errorMessage = getDatabaseErrorMessage() || 'Database connection not available';
      logger.warn('Events API POST: Database connection issue', { error: errorMessage });
      return res.status(503).json({
        error: 'Database connection unavailable', 
        message: errorMessage
      });
    }

    const eventData = req.body;
    
    logger.info('Events API: Creating new event', { eventName: eventData.name });
    
    // Convert date string to Firestore Timestamp
    const eventDate = new Date(eventData.date);
    if (isNaN(eventDate.getTime())) {
      logger.warn('Events API: Invalid date provided', { date: eventData.date });
      return res.status(400).json({
        error: 'Invalid date provided'
      });
    }
    
    // Add timestamps using Firestore Timestamp
    const newEvent = {
      ...eventData,
      date: Timestamp.fromDate(eventDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await adminDb.collection('events').add(newEvent);
    
    logger.info('Events API: Event created successfully', { eventId: docRef.id });
    return res.json({ 
      success: true, 
      eventId: docRef.id 
    });

  } catch (error: any) {
    logger.error('Events API: Error creating event', { error: error.message, stack: error.stack });
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      logger.warn('Events API POST: Database connection timeout or unavailable');
      return res.status(503).json({
        error: 'Database connection timeout', 
        message: 'Unable to connect to the database. Please check your network connection and try again.'
      });
    }
    
    return res.status(500).json({
      error: 'Failed to create event'
    });
  }
});

export default router;