import { NextRequest, NextResponse } from 'next/server';
import { getEmailQueueConfig, updateEmailQueueConfig } from '@/lib/email-queue-admin';
import { withAdminAuth } from '@/lib/auth-middleware';

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const config = await getEmailQueueConfig();
    
    if (!config) {
      // Return default configuration if none exists
      const defaultConfig = {
        maxRetries: 3,
        retryDelayMinutes: 30,
        maxQueueSize: 100,
        requireApprovalForEventRequests: true,
        requireApprovalForEquipmentNotifications: true,
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
      
      return NextResponse.json({ success: true, data: defaultConfig });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching email queue config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest, user) => {
  try {
    const config = await request.json();
    
    // Add updatedBy from authenticated user
    const { id, updatedAt, ...configWithoutIdAndDate } = config;
    const configToSave = {
      ...configWithoutIdAndDate,
      updatedBy: user.email || user.ponyClubId,
    };

    await updateEmailQueueConfig(configToSave);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration updated successfully' 
    });
  } catch (error) {
    console.error('Error updating email queue config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});