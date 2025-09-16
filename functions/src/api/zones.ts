import { Router } from 'express';
import { getAllZones } from '../lib/server-data';
import { logger } from 'firebase-functions/v2';

const router = Router();

/**
 * GET /zones
 * Retrieves all zones from the database
 */
router.get('/', async (req, res) => {
  try {
    logger.info('Zones API: Fetching all zones');
    
    const zones = await getAllZones();
    
    logger.info('Zones API: Successfully retrieved zones', { count: zones.length });
    
    return res.json({ zones });
  } catch (error: any) {
    logger.error('Zones API: Error fetching zones', { error: error.message, stack: error.stack });
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      logger.warn('Zones API: Database connection timeout or unavailable');
      return res.status(503).json({
        error: 'Database connection timeout', 
        message: 'Unable to connect to the database. Please check your network connection and try again.',
        zones: [] 
      });
    }
    
    return res.status(500).json({
      error: 'Failed to fetch zones', 
      zones: []
    });
  }
});

export default router;