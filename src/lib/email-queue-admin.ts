import { adminDb } from './firebase-admin';
import { QueuedEmail, EmailStatus, EmailQueueStats, EmailQueueConfig, EmailTemplate, EmailLog } from './types';

const EMAIL_QUEUE_COLLECTION = 'emailQueue';
const EMAIL_CONFIG_COLLECTION = 'emailConfig';
const EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';

// Email Queue Operations
export async function addEmailToQueue(email: Omit<QueuedEmail, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const emailData = {
      ...email,
      // Ensure 'to' is always an array
      to: Array.isArray(email.to) ? email.to : [email.to],
      // Ensure other optional array fields are arrays if present
      cc: email.cc ? (Array.isArray(email.cc) ? email.cc : [email.cc]) : undefined,
      bcc: email.bcc ? (Array.isArray(email.bcc) ? email.bcc : [email.bcc]) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      // Set default status to pending if not provided
      status: email.status || 'pending',
    };

    const docRef = await adminDb.collection(EMAIL_QUEUE_COLLECTION).add(emailData);
    const emailId = docRef.id;
    
    // Note: Auto-send logic is handled in the calling function to avoid circular imports
    // This keeps the queue admin functions focused on data management
    
    return emailId;
  } catch (error) {
    console.error('Error adding email to queue:', error);
    throw error;
  }
}

export async function getQueuedEmails(
  status?: EmailStatus, 
  emailType?: string,
  limit?: number,
  summaryOnly: boolean = true
): Promise<QueuedEmail[]> {
  try {
    let query = adminDb.collection(EMAIL_QUEUE_COLLECTION).orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (emailType) {
      query = query.where('type', '==', emailType);
    }

    // Apply limit if provided, otherwise default to 500 for performance
    const effectiveLimit = limit || 500;
    query = query.limit(effectiveLimit);

    // For list views, only fetch essential fields to reduce data transfer
    if (summaryOnly) {
      query = query.select(
        'to', 'cc', 'subject', 'type', 'status', 'priority',
        'createdAt', 'updatedAt', 'sentAt', 'scheduledFor',
        'retryCount', 'lastError', 'metadata'
      );
    }

    const querySnapshot = await query.get();
    const emails: QueuedEmail[] = [];

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledFor: data.scheduledFor?.toDate(),
        sentAt: data.sentAt?.toDate(),
      } as QueuedEmail);
    });

    return emails;
  } catch (error) {
    console.error('Error fetching queued emails:', error);
    throw error;
  }
}

export async function getQueuedEmailById(emailId: string): Promise<QueuedEmail | null> {
  try {
    const docRef = adminDb.collection(EMAIL_QUEUE_COLLECTION).doc(emailId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data()!;
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledFor: data.scheduledFor?.toDate(),
        sentAt: data.sentAt?.toDate(),
      } as QueuedEmail;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching queued email:', error);
    throw error;
  }
}

export async function duplicateEmail(emailId: string, updates?: Partial<QueuedEmail>, resetStatus: boolean = false): Promise<string> {
  try {
    const originalEmail = await getQueuedEmailById(emailId);
    if (!originalEmail) {
      throw new Error('Original email not found');
    }

    // Create new email data based on original
    const newEmailData = {
      to: originalEmail.to,
      cc: originalEmail.cc,
      bcc: originalEmail.bcc,
      subject: originalEmail.subject,
      textContent: originalEmail.textContent,
      htmlContent: originalEmail.htmlContent,
      type: originalEmail.type,
      priority: originalEmail.priority,
      attachments: originalEmail.attachments,
      metadata: originalEmail.metadata,
      // Apply any updates
      ...updates,
      // Reset status and timestamps if requested
      status: resetStatus ? 'pending' : originalEmail.status,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: originalEmail.maxRetries || 3,
      // Clear sent/scheduled info for resend
      sentAt: undefined,
      sentBy: undefined,
      scheduledFor: resetStatus ? undefined : originalEmail.scheduledFor,
      // Add metadata about duplication
      duplicatedFrom: emailId,
      duplicatedAt: new Date()
    };

    const docRef = await adminDb.collection(EMAIL_QUEUE_COLLECTION).add(newEmailData);
    return docRef.id;
  } catch (error) {
    console.error('Error duplicating email:', error);
    throw error;
  }
}

export async function updateQueuedEmail(emailId: string, updates: Partial<QueuedEmail>): Promise<void> {
  try {
    const docRef = adminDb.collection(EMAIL_QUEUE_COLLECTION).doc(emailId);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    // Convert Date objects to Firestore Timestamps for specific fields
    if (updates.scheduledFor) {
      updateData.scheduledFor = updates.scheduledFor;
    }
    if (updates.sentAt) {
      updateData.sentAt = updates.sentAt;
    }

    await docRef.update(updateData);
  } catch (error) {
    console.error('Error updating queued email:', error);
    throw error;
  }
}

export async function deleteQueuedEmail(emailId: string): Promise<void> {
  try {
    const docRef = adminDb.collection(EMAIL_QUEUE_COLLECTION).doc(emailId);
    await docRef.delete();
  } catch (error) {
    console.error('Error deleting queued email:', error);
    throw error;
  }
}

export async function markEmailAsSent(emailId: string, sentAt?: Date): Promise<void> {
  try {
    await updateQueuedEmail(emailId, {
      status: 'sent',
      sentAt: sentAt || new Date(),
    });
  } catch (error) {
    console.error('Error marking email as sent:', error);
    throw error;
  }
}

export async function markEmailAsFailed(emailId: string, errorMessage?: string): Promise<void> {
  try {
    const email = await getQueuedEmailById(emailId);
    if (!email) throw new Error('Email not found');

    await updateQueuedEmail(emailId, {
      status: 'failed',
      retryCount: (email.retryCount || 0) + 1,
      lastError: errorMessage,
    });
  } catch (error) {
    console.error('Error marking email as failed:', error);
    throw error;
  }
}

// Bulk Operations
export async function bulkUpdateEmails(emailIds: string[], updates: Partial<QueuedEmail>): Promise<void> {
  try {
    const batch = adminDb.batch();
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    emailIds.forEach((emailId) => {
      const docRef = adminDb.collection(EMAIL_QUEUE_COLLECTION).doc(emailId);
      batch.update(docRef, updateData);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error bulk updating emails:', error);
    throw error;
  }
}

export async function bulkDeleteEmails(emailIds: string[]): Promise<void> {
  try {
    const batch = adminDb.batch();

    emailIds.forEach((emailId) => {
      const docRef = adminDb.collection(EMAIL_QUEUE_COLLECTION).doc(emailId);
      batch.delete(docRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error bulk deleting emails:', error);
    throw error;
  }
}

// Email Queue Statistics
export async function getEmailQueueStats(): Promise<EmailQueueStats> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const collection = adminDb.collection(EMAIL_QUEUE_COLLECTION);

    // Use Promise.all to run all count queries in parallel
    const [
      totalSnapshot,
      draftSnapshot,
      pendingSnapshot,
      sentSnapshot,
      failedSnapshot,
      cancelledSnapshot,
      sentTodaySnapshot,
      sentThisWeekSnapshot,
      sentThisMonthSnapshot,
      recentSentEmails // For calculating processing time
    ] = await Promise.all([
      collection.count().get(),
      collection.where('status', '==', 'draft').count().get(),
      collection.where('status', '==', 'pending').count().get(),
      collection.where('status', '==', 'sent').count().get(),
      collection.where('status', '==', 'failed').count().get(),
      collection.where('status', '==', 'cancelled').count().get(),
      collection.where('status', '==', 'sent').where('sentAt', '>=', today).count().get(),
      collection.where('status', '==', 'sent').where('sentAt', '>=', weekStart).count().get(),
      collection.where('status', '==', 'sent').where('sentAt', '>=', monthStart).count().get(),
      // Get a sample of recent sent emails for processing time calculation
      collection.where('status', '==', 'sent')
        .orderBy('sentAt', 'desc')
        .limit(100)
        .select('createdAt', 'sentAt')
        .get()
    ]);

    const stats: EmailQueueStats = {
      total: totalSnapshot.data().count,
      draft: draftSnapshot.data().count,
      pending: pendingSnapshot.data().count,
      sent: sentSnapshot.data().count,
      failed: failedSnapshot.data().count,
      cancelled: cancelledSnapshot.data().count,
      sentToday: sentTodaySnapshot.data().count,
      sentThisWeek: sentThisWeekSnapshot.data().count,
      sentThisMonth: sentThisMonthSnapshot.data().count,
      averageProcessingTimeMinutes: 0,
      successRate: 0,
    };

    // Calculate average processing time from recent emails
    if (!recentSentEmails.empty) {
      let totalProcessingTime = 0;
      let validCount = 0;
      
      recentSentEmails.forEach((doc: any) => {
        const data = doc.data();
        if (data.sentAt && data.createdAt) {
          const sentAt = data.sentAt.toDate();
          const createdAt = data.createdAt.toDate();
          totalProcessingTime += sentAt.getTime() - createdAt.getTime();
          validCount++;
        }
      });
      
      if (validCount > 0) {
        stats.averageProcessingTimeMinutes = Math.round(totalProcessingTime / validCount / 60000);
      }
    }

    // Calculate success rate
    const totalProcessed = stats.sent + stats.failed;
    if (totalProcessed > 0) {
      stats.successRate = Math.round((stats.sent / totalProcessed) * 100);
    }

    return stats;
  } catch (error) {
    console.error('Error calculating email queue stats:', error);
    throw error;
  }
}

// Configuration Management
export async function getEmailQueueConfig(): Promise<EmailQueueConfig> {
  try {
    const configDoc = await adminDb.collection(EMAIL_CONFIG_COLLECTION).doc('default').get();
    
    if (configDoc.exists) {
      return configDoc.data() as EmailQueueConfig;
    }
    
    // Return default config if none exists
    const defaultConfig: EmailQueueConfig = {
      requireApproval: true,
      maxRetries: 3,
      retryDelayMinutes: 15,
      defaultPriority: 'normal',
      enableScheduling: true,
      emailTemplatesEnabled: true,
      adminNotificationEmails: [],
      smtpSettings: {
        host: '',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: ''
        }
      },
      // Auto-send defaults (false = require manual approval, true = send automatically)
      autoSendEquipmentBookingRequests: false, // Default: require approval for new bookings
      autoSendEquipmentBookingApprovals: false, // Default: require approval for booking confirmations
      autoSendEventRequests: false, // Default: require approval for event requests
      autoSendNotifications: false, // Default: require approval for notifications
      autoSendReminders: false, // Default: require approval for reminders
      autoSendGeneral: false, // Default: require approval for general emails
      autoSendBackups: false, // Default: require approval for backup notifications
      // Legacy approval settings (kept for backwards compatibility)
      requireApprovalForEventRequests: true,
      requireApprovalForEquipmentNotifications: true,
      requireApprovalForNotifications: false,
      requireApprovalForGeneral: true,
      requireApprovalForReminders: true
    };
    
    // Save default config
    await adminDb.collection(EMAIL_CONFIG_COLLECTION).doc('default').set(defaultConfig);
    return defaultConfig;
  } catch (error) {
    console.error('Error fetching email queue config:', error);
    throw error;
  }
}

export async function updateEmailQueueConfig(config: Partial<EmailQueueConfig>): Promise<void> {
  try {
    const configRef = adminDb.collection(EMAIL_CONFIG_COLLECTION).doc('default');
    await configRef.update({
      ...config,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating email queue config:', error);
    throw error;
  }
}

// Email Templates
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const querySnapshot = await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).orderBy('name').get();
    const templates: EmailTemplate[] = [];

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EmailTemplate);
    });

    return templates;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
}

export async function createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const templateData = {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).add(templateData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating email template:', error);
    throw error;
  }
}

export async function updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<void> {
  try {
    const templateRef = adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(templateId);
    await templateRef.update({
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
}

export async function deleteEmailTemplate(templateId: string): Promise<void> {
  try {
    const templateRef = adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(templateId);
    await templateRef.delete();
  } catch (error) {
    console.error('Error deleting email template:', error);
    throw error;
  }
}

// Queue Processing Functions
export async function getEmailsToProcess(): Promise<QueuedEmail[]> {
  try {
    const now = new Date();
    const query = adminDb.collection(EMAIL_QUEUE_COLLECTION)
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .orderBy('scheduledFor')
      .orderBy('priority', 'desc');

    const querySnapshot = await query.get();
    const emails: QueuedEmail[] = [];

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledFor: data.scheduledFor?.toDate(),
        sentAt: data.sentAt?.toDate(),
      } as QueuedEmail);
    });

    return emails;
  } catch (error) {
    console.error('Error fetching emails to process:', error);
    throw error;
  }
}

export async function getFailedEmailsForRetry(): Promise<QueuedEmail[]> {
  try {
    const config = await getEmailQueueConfig();
    const query = adminDb.collection(EMAIL_QUEUE_COLLECTION)
      .where('status', '==', 'failed')
      .where('retryCount', '<', config.maxRetries);

    const querySnapshot = await query.get();
    const emails: QueuedEmail[] = [];

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        scheduledFor: data.scheduledFor?.toDate(),
        sentAt: data.sentAt?.toDate(),
      } as QueuedEmail);
    });

    return emails;
  } catch (error) {
    console.error('Error fetching failed emails for retry:', error);
    throw error;
  }
}

// Email Logs Collection
const EMAIL_LOGS_COLLECTION = 'emailLogs';

export async function addEmailLog(log: Omit<EmailLog, 'id' | 'timestamp'>): Promise<string> {
  try {
    const logData = {
      ...log,
      timestamp: new Date(),
    };

    const docRef = await adminDb.collection(EMAIL_LOGS_COLLECTION).add(logData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding email log:', error);
    throw error;
  }
}

export async function getEmailLogs(limit: number = 100, status?: 'success' | 'error' | 'retry' | 'pending'): Promise<EmailLog[]> {
  try {
    let query = adminDb.collection(EMAIL_LOGS_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const querySnapshot = await query.get();
    const logs: EmailLog[] = [];

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as EmailLog);
    });

    return logs;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    throw error;
  }
}