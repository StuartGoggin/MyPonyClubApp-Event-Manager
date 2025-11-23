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

export async function getQueuedEmails(status?: EmailStatus, emailType?: string): Promise<QueuedEmail[]> {
  try {
    let query = adminDb.collection(EMAIL_QUEUE_COLLECTION).orderBy('createdAt', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }

    if (emailType) {
      query = query.where('type', '==', emailType);
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
    const allEmails = await getQueuedEmails();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: EmailQueueStats = {
      total: allEmails.length,
      draft: allEmails.filter(e => e.status === 'draft').length,
      pending: allEmails.filter(e => e.status === 'pending').length,
      sent: allEmails.filter(e => e.status === 'sent').length,
      failed: allEmails.filter(e => e.status === 'failed').length,
      cancelled: allEmails.filter(e => e.status === 'cancelled').length,
      sentToday: allEmails.filter(e => e.status === 'sent' && e.sentAt && e.sentAt >= today).length,
      sentThisWeek: allEmails.filter(e => e.status === 'sent' && e.sentAt && e.sentAt >= weekStart).length,
      sentThisMonth: allEmails.filter(e => e.status === 'sent' && e.sentAt && e.sentAt >= monthStart).length,
      averageProcessingTimeMinutes: 0,
      successRate: 0,
    };

    // Calculate processing time and success rate
    const processedEmails = allEmails.filter(e => e.sentAt && e.createdAt);
    if (processedEmails.length > 0) {
      const totalProcessingTime = processedEmails.reduce((sum, email) => {
        const processingTime = email.sentAt!.getTime() - email.createdAt.getTime();
        return sum + processingTime;
      }, 0);
      stats.averageProcessingTimeMinutes = Math.round(totalProcessingTime / processedEmails.length / 60000);
    }

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
      // Set proper defaults for specific approval requirements
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