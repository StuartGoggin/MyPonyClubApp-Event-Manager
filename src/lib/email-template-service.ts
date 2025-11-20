import { adminDb, isDatabaseConnected, getDatabaseErrorMessage } from './firebase-admin';
import {
  EmailTemplate,
  EmailTemplateType,
  EmailTemplateStatus,
  EmailTemplateFilters,
  EmailTemplateSortOptions,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  EmailTemplateVariableData,
  EmailTemplateRenderOptions,
  EmailTemplateRenderResult,
  EmailTemplateVariable,
  EmailTemplateAttachment,
  EmailTemplateAttachmentSettings
} from './types-email-templates';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

const EMAIL_TEMPLATES_COLLECTION = 'emailTemplates';

export class EmailTemplateService {
  /**
   * Get all email templates with optional filtering and sorting
   */
  static async getAllTemplates(
    filters?: EmailTemplateFilters,
    sort?: EmailTemplateSortOptions
  ): Promise<EmailTemplate[]> {
    try {
      if (!adminDb || !isDatabaseConnected()) {
        console.warn('Database not connected, returning empty templates array');
        return [];
      }

      let query = adminDb.collection(EMAIL_TEMPLATES_COLLECTION);

      // Apply filters
      if (filters?.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters?.isDefault !== undefined) {
        query = query.where('isDefault', '==', filters.isDefault);
      }

      // Apply sorting
      if (sort?.field) {
        query = query.orderBy(sort.field, sort.direction || 'asc');
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      const snapshot = await query.get();
      const templates: EmailTemplate[] = [];

      snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        if (doc.exists) {
          const data = doc.data();
          templates.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as EmailTemplate);
        }
      });

      // Apply text search filter if provided (client-side for now)
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        return templates.filter(template => 
          template.name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm)
        );
      }

      return templates;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return [];
    }
  }

  /**
   * Get a specific email template by ID
   */
  static async getTemplateById(id: string): Promise<EmailTemplate | null> {
    try {
      if (!adminDb || !isDatabaseConnected()) {
        console.warn('Database not connected');
        return null;
      }

      const doc = await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EmailTemplate;
    } catch (error) {
      console.error('Error fetching email template:', error);
      return null;
    }
  }

  /**
   * Get the default template for a specific type
   */
  static async getDefaultTemplate(type: EmailTemplateType): Promise<EmailTemplate | null> {
    try {
      if (!adminDb || !isDatabaseConnected()) {
        console.warn('Database not connected');
        return null;
      }

      const snapshot = await adminDb
        .collection(EMAIL_TEMPLATES_COLLECTION)
        .where('type', '==', type)
        .where('isDefault', '==', true)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EmailTemplate;
    } catch (error) {
      console.error('Error fetching default template:', error);
      return null;
    }
  }

  /**
   * Create a new email template
   */
  static async createTemplate(
    request: CreateEmailTemplateRequest,
    createdBy: string
  ): Promise<EmailTemplate | null> {
    try {
      if (!adminDb || !isDatabaseConnected()) {
        throw new Error(getDatabaseErrorMessage() || 'Database not available');
      }

      // If this is set as default, unset any existing defaults for this type
      if (request.isDefault) {
        await this.clearDefaultTemplate(request.type);
      }

      const now = new Date();
      const templateData: Omit<EmailTemplate, 'id'> = {
        name: request.name,
        description: request.description,
        type: request.type,
        status: 'active' as EmailTemplateStatus,
        content: request.content,
        variables: request.variables || this.getDefaultVariablesForType(request.type),
        createdAt: now,
        updatedAt: now,
        createdBy,
        lastModifiedBy: createdBy,
        version: 1,
        isDefault: request.isDefault || false,
        attachments: request.attachments || this.getDefaultAttachments(request.type),
        sendSettings: request.sendSettings || {
          sendImmediately: true,
          maxRetries: 3,
        },
      };

      const docRef = await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).add(templateData);
      
      return {
        id: docRef.id,
        ...templateData,
      };
    } catch (error) {
      console.error('Error creating email template:', error);
      return null;
    }
  }

  /**
   * Update an existing email template
   */
  static async updateTemplate(
    id: string,
    request: UpdateEmailTemplateRequest,
    modifiedBy: string
  ): Promise<EmailTemplate | null> {
    try {
      if (!adminDb || !isDatabaseConnected()) {
        throw new Error(getDatabaseErrorMessage() || 'Database not available');
      }

      const templateRef = adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(id);
      const existingDoc = await templateRef.get();
      
      if (!existingDoc.exists) {
        throw new Error('Template not found');
      }

      const existingData = existingDoc.data()!;

      // If setting as default, unset existing defaults
      if (request.isDefault && !existingData.isDefault) {
        await this.clearDefaultTemplate(existingData.type);
      }

      const updateData: Partial<EmailTemplate> = {
        ...request,
        updatedAt: new Date(),
        lastModifiedBy: modifiedBy,
        version: existingData.version + 1,
      };

      await templateRef.update(updateData);

      // Return updated template
      const updatedDoc = await templateRef.get();
      const data = updatedDoc.data()!;
      
      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as EmailTemplate;
    } catch (error) {
      console.error('Error updating email template:', error);
      return null;
    }
  }

  /**
   * Delete an email template
   */
  static async deleteTemplate(id: string): Promise<boolean> {
    try {
      if (!adminDb || !isDatabaseConnected()) {
        throw new Error(getDatabaseErrorMessage() || 'Database not available');
      }

      await adminDb.collection(EMAIL_TEMPLATES_COLLECTION).doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting email template:', error);
      return false;
    }
  }

  /**
   * Render a template with provided variables
   */
  static async renderTemplate(
    options: EmailTemplateRenderOptions
  ): Promise<EmailTemplateRenderResult | null> {
    try {
      const template = await this.getTemplateById(options.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Replace variables in content
      const renderedContent = this.replaceTemplateVariables(
        template.content,
        options.variables
      );

      return {
        subject: renderedContent.subject,
        htmlBody: renderedContent.htmlBody,
        textBody: renderedContent.textBody,
        previewText: renderedContent.previewText,
        attachments: template.attachments,
      };
    } catch (error) {
      console.error('Error rendering template:', error);
      return null;
    }
  }

  /**
   * Replace template variables in content
   */
  private static replaceTemplateVariables(
    content: EmailTemplate['content'],
    variables: EmailTemplateVariableData
  ): EmailTemplate['content'] {
    const replaceInString = (text: string): string => {
      let result = text;
      
      // Replace simple variables like {{variableName}}
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        const replacement = this.formatVariableValue(value);
        result = result.replace(regex, replacement);
      });

      // Handle array variables like {{#each events}}
      result = this.handleArrayVariables(result, variables);

      return result;
    };

    return {
      subject: replaceInString(content.subject),
      htmlBody: replaceInString(content.htmlBody),
      textBody: replaceInString(content.textBody),
      previewText: content.previewText ? replaceInString(content.previewText) : undefined,
    };
  }

  /**
   * Format variable values for display
   */
  private static formatVariableValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    if (value instanceof Date) return value.toLocaleDateString('en-AU');
    return String(value);
  }

  /**
   * Handle array variables in templates (simple implementation)
   */
  private static handleArrayVariables(
    text: string,
    variables: EmailTemplateVariableData
  ): string {
    let result = text;

    // Handle events array
    if (variables.events && Array.isArray(variables.events)) {
      const eventsRegex = /{{#each events}}([\s\S]*?){{\/each}}/g;
      result = result.replace(eventsRegex, (match, template) => {
        return variables.events.map(event => {
          let eventText = template;
          Object.entries(event).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            eventText = eventText.replace(regex, this.formatVariableValue(value));
          });
          return eventText;
        }).join('');
      });
    }

    return result;
  }

  /**
   * Clear default status for all templates of a specific type
   */
  private static async clearDefaultTemplate(type: EmailTemplateType): Promise<void> {
    try {
      const snapshot = await adminDb
        .collection(EMAIL_TEMPLATES_COLLECTION)
        .where('type', '==', type)
        .where('isDefault', '==', true)
        .get();

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        batch.update(doc.ref, { isDefault: false });
      });

      if (!snapshot.empty) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error clearing default templates:', error);
    }
  }

  /**
   * Get default variables for a template type
   */
  private static getDefaultVariablesForType(type: EmailTemplateType): EmailTemplateVariable[] {
    const baseVariables: EmailTemplateVariable[] = [
      {
        key: 'requesterName',
        name: 'Requester Name',
        description: 'Name of the person who submitted the event request',
        type: 'string',
        required: true,
      },
      {
        key: 'requesterEmail',
        name: 'Requester Email',
        description: 'Email address of the requester',
        type: 'string',
        required: true,
      },
      {
        key: 'requesterPhone',
        name: 'Requester Phone',
        description: 'Phone number of the requester',
        type: 'string',
        required: false,
      },
      {
        key: 'clubName',
        name: 'Club Name',
        description: 'Name of the club requesting the event',
        type: 'string',
        required: true,
      },
      {
        key: 'zoneName',
        name: 'Zone Name',
        description: 'Name of the zone containing the club',
        type: 'string',
        required: true,
      },
      {
        key: 'referenceNumber',
        name: 'Reference Number',
        description: 'Unique reference number for the event request',
        type: 'string',
        required: true,
      },
      {
        key: 'submissionDate',
        name: 'Submission Date',
        description: 'Date when the request was submitted',
        type: 'date',
        required: true,
      },
      {
        key: 'events',
        name: 'Event Details',
        description: 'Array of event details including dates, locations, and priorities',
        type: 'array',
        required: true,
      },
      {
        key: 'systemUrl',
        name: 'System URL',
        description: 'URL to the event management system',
        type: 'string',
        required: false,
        defaultValue: 'https://events.ponyclub.com.au',
      },
      {
        key: 'supportEmail',
        name: 'Support Email',
        description: 'Contact email for support',
        type: 'string',
        required: false,
        defaultValue: 'support@ponyclub.com.au',
      },
      {
        key: 'organizationName',
        name: 'Organization Name',
        description: 'Name of the organization',
        type: 'string',
        required: false,
        defaultValue: 'Pony Club Australia',
      },
    ];

    // Add type-specific variables
    switch (type) {
      case 'event-request-super-user':
        baseVariables.push({
          key: 'isForSuperUser',
          name: 'Super User Flag',
          description: 'Flag indicating this is a super user notification',
          type: 'boolean',
          required: true,
          defaultValue: 'true',
        });
        break;
      case 'event-request-zone-manager':
        baseVariables.push({
          key: 'recipientRole',
          name: 'Recipient Role',
          description: 'Role of the email recipient',
          type: 'string',
          required: false,
          defaultValue: 'Zone Manager',
        });
        break;
      case 'event-request-club-admin':
        baseVariables.push({
          key: 'recipientRole',
          name: 'Recipient Role',
          description: 'Role of the email recipient',
          type: 'string',
          required: false,
          defaultValue: 'Club Administrator',
        });
        break;
    }

    return baseVariables;
  }

  /**
   * Get default attachment settings for a template type
   */
  static getDefaultAttachments(type: EmailTemplateType): EmailTemplateAttachmentSettings {
    const defaultPdfAttachment: EmailTemplateAttachment = {
      id: 'event-request-pdf',
      name: 'Event Request PDF',
      type: 'pdf-form',
      description: 'PDF form containing the complete event request details',
      enabled: true,
      filename: 'Event_Request_{{referenceNumber}}.pdf',
    };

    const defaultJsonAttachment: EmailTemplateAttachment = {
      id: 'event-data-json',
      name: 'Event Data Export',
      type: 'json-data', 
      description: 'JSON export containing all event request data for processing',
      enabled: true,
      filename: 'Event_Data_{{referenceNumber}}.json',
    };

    switch (type) {
      case 'event-request-requester':
        return {
          eventRequestPdf: { ...defaultPdfAttachment, enabled: true },
        };
      
      case 'event-request-zone-manager':
        return {
          eventRequestPdf: { ...defaultPdfAttachment, enabled: true },
          eventDataJson: { ...defaultJsonAttachment, enabled: false },
        };
      
      case 'event-request-club-admin':
        return {
          eventRequestPdf: { ...defaultPdfAttachment, enabled: true },
        };
      
      case 'event-request-super-user':
        return {
          eventRequestPdf: { ...defaultPdfAttachment, enabled: true },
          eventDataJson: { ...defaultJsonAttachment, enabled: true },
        };
      
      default:
        return {
          eventRequestPdf: { ...defaultPdfAttachment, enabled: true },
        };
    }
  }

  /**
   * Initialize default templates if they don't exist
   */
  static async initializeDefaultTemplates(): Promise<void> {
    try {
      const templateTypes: EmailTemplateType[] = [
        'event-request-requester',
        'event-request-zone-manager',
        'event-request-club-admin',
        'event-request-super-user',
      ];

      for (const type of templateTypes) {
        const existing = await this.getDefaultTemplate(type);
        if (!existing) {
          console.log(`Creating default template for type: ${type}`);
          await this.createDefaultTemplate(type);
        }
      }
    } catch (error) {
      console.error('Error initializing default templates:', error);
    }
  }

  /**
   * Create a default template for a specific type
   */
  private static async createDefaultTemplate(type: EmailTemplateType): Promise<void> {
    const templateConfigs = {
      'event-request-requester': {
        name: 'Event Request Confirmation (Requester)',
        description: 'Confirmation email sent to the person who submitted an event request',
        content: {
          subject: 'Event Request Submitted - {{referenceNumber}}',
          previewText: 'Your event request has been successfully submitted for review',
          htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Request Confirmation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .reference { background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 12px; font-weight: 600; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; margin-bottom: 20px; color: #1e293b; }
        .summary { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .event-grid { margin: 20px 0; }
        .event-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .event-title { font-weight: 600; color: #1e293b; }
        .priority-badge { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .detail-value { color: #1e293b; margin-top: 4px; }
        .next-steps { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://myponyclub.events/Logo.png" alt="MyPonyClub Events" style="max-width: 200px; height: auto; margin-bottom: 16px;" />
            <h1>🏇 Event Request Confirmation</h1>
            <div class="reference">Reference: {{referenceNumber}}</div>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{requesterName}},
            </div>
            
            <p>Thank you for submitting your event request. We have received your submission and it is now being reviewed by the {{zoneName}} coordination team.</p>
            
            <div class="summary">
                <h3 style="margin: 0 0 16px 0; color: #1e293b;">📋 Submission Summary</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div><strong>Club:</strong> {{clubName}}</div>
                    <div><strong>Zone:</strong> {{zoneName}}</div>
                    <div><strong>Submitted:</strong> {{submissionDate}}</div>
                    <div><strong>Contact:</strong> {{requesterEmail}}</div>
                </div>
            </div>

            <h3>📅 Requested Events</h3>
            <div class="event-grid">
                {{#each events}}
                <div class="event-item">
                    <div class="event-header">
                        <div class="event-title">{{name}}</div>
                        <div class="priority-badge">Priority {{priority}}</div>
                    </div>
                    <div class="event-details">
                        <div class="detail-item">
                            <div class="detail-label">Date</div>
                            <div class="detail-value">{{date}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Location</div>
                            <div class="detail-value">{{location}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Event Type</div>
                            <div class="detail-value">{{eventTypeName}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Coordinator</div>
                            <div class="detail-value">{{coordinatorName}} ({{coordinatorContact}})</div>
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>

            <div class="next-steps">
                <h3 style="margin: 0 0 12px 0; color: #059669;">✅ Next Steps</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Your request will be reviewed by the {{zoneName}} coordination team</li>
                    <li>You will receive email notifications about approval status</li>
                    <li>Approved events will appear in the public calendar</li>
                    <li>Contact {{supportEmail}} if you have any questions</li>
                </ul>
            </div>

            <p style="margin-top: 30px;">
                <strong>Important:</strong> Please retain this reference number ({{referenceNumber}}) for your records and any future correspondence about this request.
            </p>
        </div>

        <div class="footer">
            <p><strong>{{organizationName}} Event Management System</strong></p>
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>For support, contact: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`,
          textBody: `Event Request Confirmation

Dear {{requesterName}},

Thank you for submitting your event request (Reference: {{referenceNumber}}).

SUBMISSION SUMMARY
Club: {{clubName}}
Zone: {{zoneName}}
Submitted: {{submissionDate}}
Contact: {{requesterEmail}}

REQUESTED EVENTS
{{#each events}}
Priority {{priority}}: {{name}}
Date: {{date}}
Location: {{location}}
Event Type: {{eventTypeName}}
Coordinator: {{coordinatorName}} ({{coordinatorContact}})

{{/each}}

NEXT STEPS
- Your request will be reviewed by the {{zoneName}} coordination team
- You will receive email notifications about approval status
- Approved events will appear in the public calendar
- Contact {{supportEmail}} if you have any questions

Important: Please retain reference number {{referenceNumber}} for your records.

{{organizationName}} Event Management System
For support, contact: {{supportEmail}}`
        }
      },

      'event-request-zone-manager': {
        name: 'Event Request for Review (Zone Manager)',
        description: 'Notification email sent to zone managers when a new event request requires approval',
        content: {
          subject: 'Zone Approval Required - Event Request {{referenceNumber}}',
          previewText: 'New event request from {{clubName}} requires your review and approval',
          htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Request for Approval</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .urgent { background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 12px; font-weight: 600; }
        .content { padding: 30px; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .alert-title { color: #dc2626; font-weight: 600; margin: 0 0 8px 0; }
        .summary { background: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .event-grid { margin: 20px 0; }
        .event-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; position: relative; }
        .event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .event-title { font-weight: 600; color: #1e293b; }
        .priority-badge { background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .priority-1 { background: #dc2626; }
        .priority-2 { background: #ea580c; }
        .priority-3 { background: #ca8a04; }
        .priority-4 { background: #16a34a; }
        .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .detail-value { color: #1e293b; margin-top: 4px; }
        .action-section { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center; }
        .action-button { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 0 10px; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://myponyclub.events/Logo.png" alt="MyPonyClub Events" style="max-width: 200px; height: auto; margin-bottom: 16px;" />
            <h1>⚡ Zone Approval Required</h1>
            <div class="urgent">Reference: {{referenceNumber}}</div>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <div class="alert-title">🚨 Action Required</div>
                <p style="margin: 0;">A new event request from <strong>{{clubName}}</strong> requires your review and approval as {{zoneName}} coordinator.</p>
            </div>

            <div class="summary">
                <h3 style="margin: 0 0 16px 0; color: #1e293b;">📋 Request Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div><strong>Requester:</strong> {{requesterName}}</div>
                    <div><strong>Email:</strong> {{requesterEmail}}</div>
                    <div><strong>Phone:</strong> {{requesterPhone}}</div>
                    <div><strong>Club:</strong> {{clubName}}</div>
                    <div><strong>Zone:</strong> {{zoneName}}</div>
                    <div><strong>Submitted:</strong> {{submissionDate}}</div>
                </div>
            </div>

            <h3>📅 Events Requiring Approval</h3>
            <div class="event-grid">
                {{#each events}}
                <div class="event-item">
                    <div class="event-header">
                        <div class="event-title">{{name}} ({{eventTypeName}})</div>
                        <div class="priority-badge priority-{{priority}}">Priority {{priority}}</div>
                    </div>
                    <div class="event-details">
                        <div class="detail-item">
                            <div class="detail-label">Requested Date</div>
                            <div class="detail-value">{{date}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Location</div>
                            <div class="detail-value">{{location}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Coordinator</div>
                            <div class="detail-value">{{coordinatorName}} ({{coordinatorContact}})</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Special Notes</div>
                            <div class="detail-value">
                                {{#if isQualifier}}🏆 Qualifier Event{{/if}}
                                {{#if isHistoricallyTraditional}}📜 Traditional Event{{/if}}
                                {{#if notes}}{{notes}}{{/if}}
                            </div>
                        </div>
                    </div>
                </div>
                {{/each}}
            </div>

            <div class="action-section">
                <h3 style="color: #059669; margin: 0 0 16px 0;">💼 Review Actions</h3>
                <p style="margin: 0 0 20px 0;">Please review the attached event request PDF and take appropriate action:</p>
                <a href="{{systemUrl}}" class="action-button">Access Event Management System</a>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #92400e; margin: 0 0 12px 0;">📎 Attachments</h4>
                <ul style="margin: 0; color: #92400e;">
                    <li>Event Request PDF (complete details)</li>
                    <li>Contact information for follow-up</li>
                </ul>
            </div>

            <p><strong>Timeline:</strong> Please review and respond within 2-4 weeks to maintain efficient event scheduling.</p>
        </div>

        <div class="footer">
            <p><strong>{{organizationName}} Event Management System</strong></p>
            <p>Zone Coordinator: {{recipientRole}} | Support: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`,
          textBody: `Zone Approval Required - {{referenceNumber}}

ACTION REQUIRED: New event request from {{clubName}} requires your review.

REQUEST DETAILS
Requester: {{requesterName}} ({{requesterEmail}})
Phone: {{requesterPhone}}
Club: {{clubName}}
Zone: {{zoneName}}
Submitted: {{submissionDate}}

EVENTS FOR APPROVAL
{{#each events}}
Priority {{priority}}: {{name}} ({{eventTypeName}})
Date: {{date}}
Location: {{location}}
Coordinator: {{coordinatorName}} ({{coordinatorContact}})
{{#if isQualifier}}🏆 Qualifier Event{{/if}}
{{#if isHistoricallyTraditional}}📜 Traditional Event{{/if}}
{{#if notes}}Notes: {{notes}}{{/if}}

{{/each}}

NEXT STEPS
1. Review attached event request PDF
2. Access the Event Management System: {{systemUrl}}
3. Approve or provide feedback within 2-4 weeks

ATTACHMENTS
- Event Request PDF (complete details)
- Contact information for follow-up

{{organizationName}} Event Management System
Zone Coordinator Support: {{supportEmail}}`
        }
      },

      'event-request-club-admin': {
        name: 'Event Request Notification (Club Admin)',
        description: 'Notification email sent to club administrators when an event request is submitted from their club',
        content: {
          subject: 'Club Event Request Submitted - {{referenceNumber}}',
          previewText: 'Event request submitted by {{requesterName}} from {{clubName}}',
          htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Club Event Request Notification</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .club-badge { background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 12px; font-weight: 600; }
        .content { padding: 30px; }
        .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .summary { background: #f8fafc; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .event-grid { margin: 20px 0; }
        .event-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .event-title { font-weight: 600; color: #1e293b; }
        .priority-badge { background: #7c3aed; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .event-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .detail-value { color: #1e293b; margin-top: 4px; }
        .oversight-section { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://myponyclub.events/Logo.png" alt="MyPonyClub Events" style="max-width: 200px; height: auto; margin-bottom: 16px;" />
            <h1>🏇 Club Event Request</h1>
            <div class="club-badge">{{clubName}} | {{referenceNumber}}</div>
        </div>
        
        <div class="content">
            <div class="info-box">
                <h3 style="color: #0ea5e9; margin: 0 0 12px 0;">📢 Club Administrative Notice</h3>
                <p style="margin: 0;">An event request has been submitted by a member of <strong>{{clubName}}</strong>. This notification is for your awareness and records.</p>
            </div>

            <div class="summary">
                <h3 style="margin: 0 0 16px 0; color: #1e293b;">👤 Submission Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div><strong>Submitted By:</strong> {{requesterName}}</div>
                    <div><strong>Email:</strong> {{requesterEmail}}</div>
                    <div><strong>Phone:</strong> {{requesterPhone}}</div>
                    <div><strong>Club:</strong> {{clubName}}</div>
                    <div><strong>Zone:</strong> {{zoneName}}</div>
                    <div><strong>Date Submitted:</strong> {{submissionDate}}</div>
                </div>
            </div>

            <h3>📅 Events Requested</h3>
            <div class="event-grid">
                {{#each events}}
                <div class="event-item">
                    <div class="event-header">
                        <div class="event-title">{{name}} ({{eventTypeName}})</div>
                        <div class="priority-badge">Priority {{priority}}</div>
                    </div>
                    <div class="event-details">
                        <div class="detail-item">
                            <div class="detail-label">Requested Date</div>
                            <div class="detail-value">{{date}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Venue</div>
                            <div class="detail-value">{{location}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Event Coordinator</div>
                            <div class="detail-value">{{coordinatorName}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Contact</div>
                            <div class="detail-value">{{coordinatorContact}}</div>
                        </div>
                        {{#if isQualifier}}
                        <div class="detail-item">
                            <div class="detail-label">Special Type</div>
                            <div class="detail-value">🏆 Qualifier Event</div>
                        </div>
                        {{/if}}
                        {{#if isHistoricallyTraditional}}
                        <div class="detail-item">
                            <div class="detail-label">Event History</div>
                            <div class="detail-value">📜 Traditionally Held</div>
                        </div>
                        {{/if}}
                    </div>
                    {{#if notes}}
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 14px;">
                        <strong>Notes:</strong> {{notes}}
                    </div>
                    {{/if}}
                </div>
                {{/each}}
            </div>

            <div class="oversight-section">
                <h3 style="color: #059669; margin: 0 0 12px 0;">📋 Administrative Process</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Request has been forwarded to {{zoneName}} coordinators for approval</li>
                    <li>Requester will be notified of approval decisions directly</li>
                    <li>Approved events will appear in the club calendar automatically</li>
                    <li>You may contact the requester directly for any club-specific coordination</li>
                </ul>
            </div>

            {{#if generalNotes}}
            <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #92400e; margin: 0 0 12px 0;">💬 Additional Notes</h4>
                <p style="margin: 0; color: #92400e;">{{generalNotes}}</p>
            </div>
            {{/if}}

            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                <strong>No action required.</strong> This is an informational notification to keep you aware of event requests from your club members.
            </p>
        </div>

        <div class="footer">
            <p><strong>{{organizationName}} Event Management System</strong></p>
            <p>Club Administration | Reference: {{referenceNumber}} | Support: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>`,
          textBody: `Club Event Request Notification - {{referenceNumber}}

CLUB ADMINISTRATIVE NOTICE
An event request has been submitted by a member of {{clubName}}.

SUBMISSION DETAILS
Submitted By: {{requesterName}} ({{requesterEmail}})
Phone: {{requesterPhone}}
Club: {{clubName}}
Zone: {{zoneName}}
Date Submitted: {{submissionDate}}

EVENTS REQUESTED
{{#each events}}
Priority {{priority}}: {{name}} ({{eventTypeName}})
Date: {{date}}
Location: {{location}}
Coordinator: {{coordinatorName}} ({{coordinatorContact}})
{{#if isQualifier}}🏆 Qualifier Event{{/if}}
{{#if isHistoricallyTraditional}}📜 Traditional Event{{/if}}
{{#if notes}}Notes: {{notes}}{{/if}}

{{/each}}

ADMINISTRATIVE PROCESS
- Request forwarded to {{zoneName}} coordinators for approval
- Requester will be notified of approval decisions directly  
- Approved events will appear in club calendar automatically
- You may contact requester directly for club-specific coordination

{{#if generalNotes}}
ADDITIONAL NOTES
{{generalNotes}}
{{/if}}

No action required - this is an informational notification.

{{organizationName}} Event Management System
Reference: {{referenceNumber}} | Support: {{supportEmail}}`
        }
      },

      'event-request-super-user': {
        name: 'Event Request Super User Alert',
        description: 'Administrative notification sent to super users with full system access and JSON export data',
        content: {
          subject: 'Super User Notification - Event Request {{referenceNumber}}',
          previewText: 'Administrative alert: New event request requires super user awareness',
          htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super User Event Request Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .admin-badge { background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 6px; display: inline-block; margin-top: 12px; font-weight: 600; }
        .content { padding: 30px; }
        .super-user-alert { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .alert-title { color: #dc2626; font-weight: 700; margin: 0 0 8px 0; font-size: 16px; }
        .summary { background: #f8fafc; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .admin-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
        .admin-card { background: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; }
        .admin-card h4 { margin: 0 0 8px 0; color: #374151; font-size: 14px; }
        .admin-value { color: #111827; font-weight: 600; }
        .event-grid { margin: 20px 0; }
        .event-item { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
        .event-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .event-title { font-weight: 600; color: #1e293b; }
        .priority-badge { background: #dc2626; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .event-details { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; font-size: 14px; }
        .detail-item { display: flex; flex-direction: column; }
        .detail-label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .detail-value { color: #1e293b; margin-top: 4px; }
        .attachments-section { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .system-section { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://myponyclub.events/Logo.png" alt="MyPonyClub Events" style="max-width: 200px; height: auto; margin-bottom: 16px;" />
            <h1>🔒 Super User Alert</h1>
            <div class="admin-badge">Administrative Access | {{referenceNumber}}</div>
        </div>
        
        <div class="content">
            <div class="super-user-alert">
                <div class="alert-title">🚨 SUPER USER NOTIFICATION</div>
                <p style="margin: 0;">This email includes administrative data and JSON export. Please coordinate with zone approvers as needed.</p>
            </div>

            <div class="summary">
                <h3 style="margin: 0 0 16px 0; color: #1e293b;">📊 Administrative Overview</h3>
                <div class="admin-grid">
                    <div class="admin-card">
                        <h4>Requester Information</h4>
                        <div class="admin-value">{{requesterName}}</div>
                        <div style="font-size: 12px; color: #6b7280;">{{requesterEmail}}</div>
                        <div style="font-size: 12px; color: #6b7280;">{{requesterPhone}}</div>
                    </div>
                    <div class="admin-card">
                        <h4>Organization Details</h4>
                        <div class="admin-value">{{clubName}}</div>
                        <div style="font-size: 12px; color: #6b7280;">Zone: {{zoneName}}</div>
                        <div style="font-size: 12px; color: #6b7280;">Club ID: {{clubId}}</div>
                    </div>
                    <div class="admin-card">
                        <h4>System Information</h4>
                        <div class="admin-value">{{referenceNumber}}</div>
                        <div style="font-size: 12px; color: #6b7280;">{{submissionDate}}</div>
                        <div style="font-size: 12px; color: #6b7280;">Zone ID: {{zoneId}}</div>
                    </div>
                </div>
            </div>

            <h3>📅 Event Requests ({{events.length}} events)</h3>
            <div class="event-grid">
                {{#each events}}
                <div class="event-item">
                    <div class="event-header">
                        <div class="event-title">{{name}} ({{eventTypeName}})</div>
                        <div class="priority-badge">Priority {{priority}}</div>
                    </div>
                    <div class="event-details">
                        <div class="detail-item">
                            <div class="detail-label">Requested Date</div>
                            <div class="detail-value">{{date}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Location/Venue</div>
                            <div class="detail-value">{{location}}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Event Coordinator</div>
                            <div class="detail-value">{{coordinatorName}} ({{coordinatorContact}})</div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap;">
                        {{#if isQualifier}}<span style="background: #fbbf24; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">🏆 Qualifier</span>{{/if}}
                        {{#if isHistoricallyTraditional}}<span style="background: #8b5cf6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">📜 Traditional</span>{{/if}}
                    </div>
                    {{#if notes}}
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 14px;">
                        <strong>Notes:</strong> {{notes}}
                    </div>
                    {{/if}}
                </div>
                {{/each}}
            </div>

            <div class="attachments-section">
                <h3 style="color: #059669; margin: 0 0 16px 0;">📎 Administrative Attachments</h3>
                <ul style="margin: 0; padding-left: 20px; color: #059669;">
                    <li><strong>Event Request PDF</strong> - Complete formatted submission</li>
                    <li><strong>JSON Export Data</strong> - Machine-readable administrative data</li>
                    <li><strong>System Metadata</strong> - Reference numbers and tracking information</li>
                </ul>
            </div>

            <div class="system-section">
                <h3 style="color: #d97706; margin: 0 0 16px 0;">⚙️ Administrative Actions</h3>
                <p style="margin: 0 0 12px 0;">As a super user, please review this submission and coordinate with the zone approver for processing.</p>
                <ul style="margin: 0; padding-left: 20px; color: #d97706;">
                    <li>Review attached JSON data for system integration needs</li>
                    <li>Coordinate with {{zoneName}} zone approvers as required</li>
                    <li>Monitor approval workflow and resolution</li>
                    <li>Contact requester directly if administrative clarification needed</li>
                </ul>
            </div>

            {{#if generalNotes}}
            <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #374151; margin: 0 0 12px 0;">💬 Submission Notes</h4>
                <p style="margin: 0; color: #374151;">{{generalNotes}}</p>
            </div>
            {{/if}}

            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Super User Access:</strong> This notification includes enhanced administrative data and system access capabilities. 
                Use the attached JSON export for system integration and administrative oversight as needed.
            </p>
        </div>

        <div class="footer">
            <p><strong>{{organizationName}} Event Management System</strong></p>
            <p>Super User Administrative Access | Reference: {{referenceNumber}}</p>
            <p>System Support: {{supportEmail}} | Admin Portal: {{systemUrl}}</p>
        </div>
    </div>
</body>
</html>`,
          textBody: `SUPER USER NOTIFICATION - {{referenceNumber}}

🔒 ADMINISTRATIVE ALERT
This email includes administrative data and JSON export for system oversight.

ADMINISTRATIVE OVERVIEW
Requester: {{requesterName}} ({{requesterEmail}}, {{requesterPhone}})
Club: {{clubName}} (ID: {{clubId}})
Zone: {{zoneName}} (ID: {{zoneId}})
Submitted: {{submissionDate}}
Reference: {{referenceNumber}}

EVENT REQUESTS ({{events.length}} events)
{{#each events}}
Priority {{priority}}: {{name}} ({{eventTypeName}})
Date: {{date}}
Location: {{location}}
Coordinator: {{coordinatorName}} ({{coordinatorContact}})
{{#if isQualifier}}🏆 Qualifier Event{{/if}}
{{#if isHistoricallyTraditional}}📜 Traditional Event{{/if}}
{{#if notes}}Notes: {{notes}}{{/if}}

{{/each}}

ADMINISTRATIVE ATTACHMENTS
- Event Request PDF (complete formatted submission)
- JSON Export Data (machine-readable administrative data)  
- System Metadata (reference numbers and tracking information)

ADMINISTRATIVE ACTIONS REQUIRED
- Review attached JSON data for system integration needs
- Coordinate with {{zoneName}} zone approvers as required
- Monitor approval workflow and resolution
- Contact requester directly if administrative clarification needed

{{#if generalNotes}}
SUBMISSION NOTES
{{generalNotes}}
{{/if}}

SUPER USER ACCESS
This notification includes enhanced administrative data and system access capabilities.
Use attached JSON export for system integration and administrative oversight.

{{organizationName}} Event Management System
Super User Administrative Access | Reference: {{referenceNumber}}
System Support: {{supportEmail}} | Admin Portal: {{systemUrl}}`
        }
      }
    };

    const config = templateConfigs[type];
    if (!config) {
      throw new Error(`No template configuration found for type: ${type}`);
    }

    const request: CreateEmailTemplateRequest = {
      name: config.name,
      description: config.description,
      type,
      content: config.content,
      isDefault: true,
      attachments: this.getDefaultAttachments(type),
      sendSettings: {
        sendImmediately: true,
        maxRetries: 3,
      }
    };

    await this.createTemplate(request, 'system-init');
  }
}