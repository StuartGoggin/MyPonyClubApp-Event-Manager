import { Request, Response } from 'express';
import { logger } from 'firebase-functions/v2';
import { checkAdminAccess } from '../../../lib/auth-middleware';
import { callSeedData } from '../../../lib/serverActions';

export async function seedDatabase(req: Request, res: Response) {
  try {
    // Check admin authentication
    const { authorized, user } = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn('Unauthorized access attempt to admin database seeding');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    logger.info('Admin database seeding requested', { 
      adminUser: user?.email 
    });

    console.log('🌱 Starting database seeding...');
    const result = await callSeedData();
    
    if (result.success) {
      logger.info('Database seeding completed successfully', { 
        adminUser: user?.email,
        message: result.message 
      });
      
      return res.json({
        success: true,
        message: result.message
      });
    } else {
      logger.error('Database seeding failed', { 
        adminUser: user?.email,
        message: result.message 
      });
      
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error: any) {
    logger.error('Database seeding error', { 
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined 
    });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function getSeedInfo(req: Request, res: Response) {
  try {
    // Check admin authentication
    const { authorized } = await checkAdminAccess(req);
    if (!authorized) {
      logger.warn('Unauthorized access attempt to admin seed info');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    return res.json({
      message: 'Use POST method to seed the database',
      method: 'POST',
      description: 'Seeds the database with initial data including clubs, zones, event types, and sample events'
    });
  } catch (error) {
    logger.error('Seed info error', { 
      error: error instanceof Error ? error.message : error 
    });
    
    return res.status(500).json({
      error: 'Failed to get seed information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}