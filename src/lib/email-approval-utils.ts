import { EmailQueueConfig } from './types';

/**
 * Determine if an email requires approval based on its type and configuration
 * @param emailType - The type of email being sent
 * @param config - The email queue configuration
 * @returns true if approval is required, false if it can be sent automatically
 */
export function requiresApproval(
  emailType: string | undefined,
  config: EmailQueueConfig
): boolean {
  // If no email type specified, default to general approval requirement
  if (!emailType) {
    return config.requireApprovalForGeneral ?? config.requireApproval ?? true;
  }

  // Check specific approval requirements by email type
  switch (emailType) {
    case 'event_request':
      return config.requireApprovalForEventRequests ?? config.requireApproval ?? true;
    
    case 'notification':
      return config.requireApprovalForNotifications ?? config.requireApproval ?? false;
    
    case 'reminder':
      return config.requireApprovalForReminders ?? config.requireApproval ?? true;
    
    case 'backup':
      return config.requireApprovalForBackups ?? false; // Backup emails don't require approval by default
    
    case 'general':
    case 'manual':
    default:
      return config.requireApprovalForGeneral ?? config.requireApproval ?? true;
  }
}

/**
 * Determine the initial status for a queued email based on approval requirements
 * @param emailType - The type of email being sent
 * @param config - The email queue configuration
 * @returns 'draft' if approval required, 'pending' if ready to send
 */
export function getInitialEmailStatus(
  emailType: string | undefined,
  config: EmailQueueConfig
): 'draft' | 'pending' {
  return requiresApproval(emailType, config) ? 'draft' : 'pending';
}

/**
 * Check if an email should be automatically sent when added to queue
 * @param emailType - The type of email being sent
 * @param config - The email queue configuration
 * @returns true if email should be sent immediately, false if it should wait for approval
 */
export function shouldAutoSend(
  emailType: string | undefined,
  config: EmailQueueConfig
): boolean {
  return !requiresApproval(emailType, config);
}
