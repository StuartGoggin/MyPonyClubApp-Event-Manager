import { adminDb } from './firebase-admin';
import { QueuedEmail, EmailStatus, EmailQueueStats, EmailQueueConfig, EmailTemplate } from './types';

const EMAIL_QUEUE_COLLECTION = 'emailQueue';
const EMAIL_CONFIG_COLLECTION = 'emailConfig';
const EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';

// Email Queue Operations
export async function addEmailToQueue(email: Omit<QueuedEmail, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const emailData = {
      ...email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    const docRef = await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), emailData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding email to queue:', error);
    throw error;
  }
}

export async function getQueuedEmails(status?: EmailStatus, emailType?: string): Promise<QueuedEmail[]> {
  try {
    let q = query(
      collection(db, EMAIL_QUEUE_COLLECTION), 
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    if (emailType && emailType !== 'all') {
      q = query(q, where('type', '==', emailType));
    }

    const querySnapshot = await getDocs(q);
    const emails: QueuedEmail[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        rejectedAt: data.rejectedAt?.toDate(),
        sentAt: data.sentAt?.toDate(),
        lastRetryAt: data.lastRetryAt?.toDate(),
        lastEditedAt: data.lastEditedAt?.toDate(),
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
    const docRef = doc(db, EMAIL_QUEUE_COLLECTION, emailId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        rejectedAt: data.rejectedAt?.toDate(),
        sentAt: data.sentAt?.toDate(),
        lastRetryAt: data.lastRetryAt?.toDate(),
        lastEditedAt: data.lastEditedAt?.toDate(),
      } as QueuedEmail;
    }
    return null;
  } catch (error) {
    console.error('Error fetching email:', error);
    throw error;
  }
}

export async function updateQueuedEmail(emailId: string, updates: Partial<QueuedEmail>): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_QUEUE_COLLECTION, emailId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert dates to Timestamps
    if (updates.scheduledFor) {
      updateData.scheduledFor = Timestamp.fromDate(updates.scheduledFor);
    }
    if (updates.approvedAt) {
      updateData.approvedAt = Timestamp.fromDate(updates.approvedAt);
    }
    if (updates.rejectedAt) {
      updateData.rejectedAt = Timestamp.fromDate(updates.rejectedAt);
    }
    if (updates.sentAt) {
      updateData.sentAt = Timestamp.fromDate(updates.sentAt);
    }
    if (updates.lastRetryAt) {
      updateData.lastRetryAt = Timestamp.fromDate(updates.lastRetryAt);
    }
    if (updates.lastEditedAt) {
      updateData.lastEditedAt = Timestamp.fromDate(updates.lastEditedAt);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
}

export async function deleteQueuedEmail(emailId: string): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_QUEUE_COLLECTION, emailId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
}

export async function bulkUpdateEmails(emailIds: string[], updates: Partial<QueuedEmail>): Promise<void> {
  try {
    const batch = writeBatch(db);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert dates to Timestamps
    if (updates.scheduledFor) {
      updateData.scheduledFor = Timestamp.fromDate(updates.scheduledFor);
    }
    if (updates.approvedAt) {
      updateData.approvedAt = Timestamp.fromDate(updates.approvedAt);
    }
    if (updates.rejectedAt) {
      updateData.rejectedAt = Timestamp.fromDate(updates.rejectedAt);
    }
    if (updates.sentAt) {
      updateData.sentAt = Timestamp.fromDate(updates.sentAt);
    }

    emailIds.forEach((emailId) => {
      const docRef = doc(db, EMAIL_QUEUE_COLLECTION, emailId);
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
    const batch = writeBatch(db);

    emailIds.forEach((emailId) => {
      const docRef = doc(db, EMAIL_QUEUE_COLLECTION, emailId);
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
      const totalProcessingTime = processedEmails.reduce((total, email) => {
        if (email.sentAt && email.createdAt) {
          return total + (email.sentAt.getTime() - email.createdAt.getTime());
        }
        return total;
      }, 0);
      
      stats.averageProcessingTimeMinutes = Math.round(totalProcessingTime / processedEmails.length / (1000 * 60) * 10) / 10;
      stats.successRate = Math.round((stats.sent / (stats.sent + stats.failed)) * 1000) / 10;
    }

    // Find most recent failure and oldest pending
    const failedEmails = allEmails.filter(e => e.status === 'failed').sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    if (failedEmails.length > 0) {
      stats.mostRecentFailure = failedEmails[0].updatedAt;
    }

    const pendingEmails = allEmails.filter(e => e.status === 'pending').sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (pendingEmails.length > 0) {
      stats.oldestPendingEmail = pendingEmails[0].createdAt;
    }

    return stats;
  } catch (error) {
    console.error('Error calculating email queue stats:', error);
    throw error;
  }
}

// Email Queue Configuration
export async function getEmailQueueConfig(): Promise<EmailQueueConfig | null> {
  try {
    const q = query(collection(db, EMAIL_CONFIG_COLLECTION), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt.toDate(),
      } as EmailQueueConfig;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching email queue config:', error);
    throw error;
  }
}

export async function updateEmailQueueConfig(config: Omit<EmailQueueConfig, 'id' | 'updatedAt'>): Promise<void> {
  try {
    // Try to get existing config
    const existingConfig = await getEmailQueueConfig();
    
    const configData = {
      ...config,
      updatedAt: Timestamp.now(),
    };

    if (existingConfig) {
      // Update existing config
      const docRef = doc(db, EMAIL_CONFIG_COLLECTION, existingConfig.id);
      await updateDoc(docRef, configData);
    } else {
      // Create new config
      await addDoc(collection(db, EMAIL_CONFIG_COLLECTION), configData);
    }
  } catch (error) {
    console.error('Error updating email queue config:', error);
    throw error;
  }
}

// Email Templates
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    const q = query(
      collection(db, EMAIL_TEMPLATES_COLLECTION),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const querySnapshot = await getDocs(q);
    const templates: EmailTemplate[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as EmailTemplate);
    });

    return templates;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
}

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
  try {
    const docRef = doc(db, EMAIL_TEMPLATES_COLLECTION, templateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as EmailTemplate;
    }
    return null;
  } catch (error) {
    console.error('Error fetching email template:', error);
    throw error;
  }
}

export async function saveEmailTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const templateData = {
      ...template,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, EMAIL_TEMPLATES_COLLECTION), templateData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving email template:', error);
    throw error;
  }
}

export async function updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_TEMPLATES_COLLECTION, templateId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
}

// Helper function to get emails that are ready to be sent
export async function getEmailsReadyToSend(): Promise<QueuedEmail[]> {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, EMAIL_QUEUE_COLLECTION),
      where('status', '==', 'pending'),
      where('scheduledFor', '<=', now),
      orderBy('scheduledFor'),
      orderBy('createdAt')
    );

    const querySnapshot = await getDocs(q);
    const emails: QueuedEmail[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      emails.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        rejectedAt: data.rejectedAt?.toDate(),
        sentAt: data.sentAt?.toDate(),
        lastRetryAt: data.lastRetryAt?.toDate(),
        lastEditedAt: data.lastEditedAt?.toDate(),
      } as QueuedEmail);
    });

    return emails;
  } catch (error) {
    console.error('Error fetching emails ready to send:', error);
    throw error;
  }
}

// Helper function to mark email as failed with error message
export async function markEmailAsFailed(emailId: string, errorMessage: string): Promise<void> {
  try {
    await updateQueuedEmail(emailId, {
      status: 'failed',
      errorMessage,
      lastRetryAt: new Date(),
    });
  } catch (error) {
    console.error('Error marking email as failed:', error);
    throw error;
  }
}

// Helper function to mark email as sent
export async function markEmailAsSent(emailId: string, sentById: string, externalEmailId?: string): Promise<void> {
  try {
    await updateQueuedEmail(emailId, {
      status: 'sent',
      sentAt: new Date(),
      sentById,
      externalEmailId,
    });
  } catch (error) {
    console.error('Error marking email as sent:', error);
    throw error;
  }
}