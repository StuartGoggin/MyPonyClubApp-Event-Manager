import express, { Request, Response } from 'express';
import { logger } from 'firebase-functions/v2';
import { getEmailQueueConfig, updateEmailQueueConfig } from '../../lib/email-queue-admin';
import { withAdminAuth, requireAdminAuth } from '../../lib/auth-middleware';

interface User {
  id: string;
  email: string;
  displayName?: string;
  role: string;
}

const router = express.Router();

/**
 * GET /email-queue/config
 * Retrieve email queue configuration
 */
router.get('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    logger.info('Email Queue Config API: GET request', { 
      userEmail: (req as any).user?.email 
    });

    const config = await getEmailQueueConfig();
    
    if (!config) {
      // Return default configuration if none exists
      const defaultConfig = {
        maxRetries: 3,
        retryDelayMinutes: 30,
        maxQueueSize: 100,
        requireApprovalForEventRequests: true,
        requireApprovalForNotifications: false,
        requireApprovalForReminders: true,
        requireApprovalForGeneral: true,
        autoSendScheduledEmails: true,
        autoSendAfterApprovalMinutes: 5,
        notifyAdminsOnFailure: true,
        notifyAdminsOnLargeQueue: true,
        largeQueueThreshold: 50,
        archiveSuccessfulAfterDays: 30,
        archiveFailedAfterDays: 90,
        preferredProvider: 'resend' as const,
        fallbackOnFailure: true,
        updatedBy: 'system',
      };
      
      logger.info('Email Queue Config API: Returning default configuration');
      res.json({ success: true, data: defaultConfig });
      return;
    }

    logger.info('Email Queue Config API: Configuration retrieved successfully', {
      hasConfig: !!config,
      updatedBy: config.updatedBy
    });

    res.json({ success: true, data: config });
  } catch (error: any) {
    logger.error('Email Queue Config API: Error fetching configuration', { 
      error: error.message, 
      stack: error.stack 
    });
    
    res.status(500).json({
      error: 'Failed to fetch configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /email-queue/config
 * Update email queue configuration
 */
router.post('/', withAdminAuth(async (req: Request, res: Response, user: User) => {
  try {
    const config = req.body;
    
    logger.info('Email Queue Config API: POST request', { 
      userEmail: user.email,
      hasConfig: !!config
    });
    
    // Add updatedBy from authenticated user
    const { id, updatedAt, ...configWithoutIdAndDate } = config;
    const configToSave = {
      ...configWithoutIdAndDate,
      updatedBy: user.email || user.id,
    };

    logger.info('Email Queue Config API: Saving configuration', {
      updatedBy: configToSave.updatedBy,
      configKeys: Object.keys(configToSave)
    });

    await updateEmailQueueConfig(configToSave);
    
    logger.info('Email Queue Config API: Configuration updated successfully', {
      userEmail: user.email
    });
    
    res.json({ 
      success: true, 
      message: 'Configuration updated successfully' 
    });
  } catch (error: any) {
    logger.error('Email Queue Config API: Error updating configuration', { 
      error: error.message, 
      stack: error.stack,
      userEmail: user.email
    });
    
    res.status(500).json({
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;