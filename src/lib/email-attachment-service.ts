import { EmailTemplateAttachmentSettings, EmailTemplateVariableData } from './types-email-templates';

export interface AttachmentFile {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export class EmailAttachmentService {
  /**
   * Generate all enabled attachments for a template
   */
  static async generateAttachments(
    attachmentSettings: EmailTemplateAttachmentSettings | undefined,
    variables: EmailTemplateVariableData
  ): Promise<AttachmentFile[]> {
    if (!attachmentSettings) {
      return [];
    }

    const attachments: AttachmentFile[] = [];

    try {
      // Generate PDF attachment if enabled
      if (attachmentSettings.eventRequestPdf?.enabled) {
        const pdfAttachment = await this.generateEventRequestPdf(
          attachmentSettings.eventRequestPdf,
          variables
        );
        if (pdfAttachment) {
          attachments.push(pdfAttachment);
        }
      }

      // Generate JSON attachment if enabled
      if (attachmentSettings.eventDataJson?.enabled) {
        const jsonAttachment = await this.generateEventDataJson(
          attachmentSettings.eventDataJson,
          variables
        );
        if (jsonAttachment) {
          attachments.push(jsonAttachment);
        }
      }

      // Generate custom attachments if any
      if (attachmentSettings.customAttachments) {
        for (const customAttachment of attachmentSettings.customAttachments) {
          if (customAttachment.enabled) {
            const attachment = await this.generateCustomAttachment(
              customAttachment,
              variables
            );
            if (attachment) {
              attachments.push(attachment);
            }
          }
        }
      }

      return attachments;
    } catch (error) {
      console.error('Error generating attachments:', error);
      return [];
    }
  }

  /**
   * Generate PDF form for event request
   */
  private static async generateEventRequestPdf(
    attachment: NonNullable<EmailTemplateAttachmentSettings['eventRequestPdf']>,
    variables: EmailTemplateVariableData
  ): Promise<AttachmentFile | null> {
    try {
      // Replace variables in filename
      const filename = this.replaceVariablesInString(
        attachment.filename || 'Event_Request_{{referenceNumber}}.pdf',
        variables
      );

      // Generate PDF content
      const pdfContent = await this.createEventRequestPdfContent(variables);

      return {
        filename,
        content: pdfContent,
        contentType: 'application/pdf',
      };
    } catch (error) {
      console.error('Error generating PDF attachment:', error);
      return null;
    }
  }

  /**
   * Generate JSON data export
   */
  private static async generateEventDataJson(
    attachment: NonNullable<EmailTemplateAttachmentSettings['eventDataJson']>,
    variables: EmailTemplateVariableData
  ): Promise<AttachmentFile | null> {
    try {
      // Replace variables in filename
      const filename = this.replaceVariablesInString(
        attachment.filename || 'Event_Data_{{referenceNumber}}.json',
        variables
      );

      // Create structured JSON export
      const jsonData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          referenceNumber: variables.referenceNumber,
          submissionDate: variables.submissionDate,
          version: '1.0',
        },
        requester: {
          name: variables.requesterName,
          email: variables.requesterEmail,
          phone: variables.requesterPhone,
        },
        organization: {
          club: {
            name: variables.clubName,
            id: variables.clubId,
          },
          zone: {
            name: variables.zoneName,
            id: variables.zoneId,
          },
        },
        events: variables.events,
        generalNotes: variables.generalNotes,
        systemInfo: {
          organizationName: variables.organizationName,
          systemUrl: variables.systemUrl,
          supportEmail: variables.supportEmail,
        },
      };

      return {
        filename,
        content: JSON.stringify(jsonData, null, 2),
        contentType: 'application/json',
      };
    } catch (error) {
      console.error('Error generating JSON attachment:', error);
      return null;
    }
  }

  /**
   * Generate custom attachment (placeholder for future implementation)
   */
  private static async generateCustomAttachment(
    attachment: any,
    variables: EmailTemplateVariableData
  ): Promise<AttachmentFile | null> {
    // Placeholder for custom attachment generation
    // This could be extended to handle various custom attachment types
    console.log('Custom attachment generation not yet implemented:', attachment);
    return null;
  }

  /**
   * Create PDF content for event request form
   */
  private static async createEventRequestPdfContent(
    variables: EmailTemplateVariableData
  ): Promise<Buffer> {
    try {
      // This is a placeholder implementation
      // In a real application, you would use a PDF generation library like PDFKit or jsPDF
      
      const htmlContent = this.generateEventRequestHtml(variables);
      
      // For now, we'll create a simple text-based PDF placeholder
      // In production, replace this with actual PDF generation
      const textContent = this.convertHtmlToPdfText(htmlContent);
      
      // Create a simple PDF-like structure (this is just for demo)
      // In production, use a proper PDF library like PDFKit or puppeteer
      const pdfHeader = '%PDF-1.4\n';
      const contentLength = textContent.length;
      const cleanedText = textContent.replace(/\n/g, ') Tj T* (');
      
      const pdfBody = [
        '1 0 obj',
        '<<',
        '/Type /Catalog',
        '/Pages 2 0 R',
        '>>',
        'endobj',
        '',
        '2 0 obj',
        '<<',
        '/Type /Pages',
        '/Kids [3 0 R]',
        '/Count 1',
        '>>',
        'endobj',
        '',
        '3 0 obj',
        '<<',
        '/Type /Page',
        '/Parent 2 0 R',
        '/MediaBox [0 0 612 792]',
        '/Contents 4 0 R',
        '>>',
        'endobj',
        '',
        '4 0 obj',
        '<<',
        `/Length ${contentLength}`,
        '>>',
        'stream',
        'BT',
        '/F1 12 Tf',
        '72 720 Td',
        `(${cleanedText}) Tj`,
        'ET',
        'endstream',
        'endobj',
        '',
        'xref',
        '0 5',
        '0000000000 65535 f ',
        '0000000009 00000 n ',
        '0000000058 00000 n ',
        '0000000115 00000 n ',
        '0000000204 00000 n ',
        'trailer',
        '<<',
        '/Size 5',
        '/Root 1 0 R',
        '>>',
        'startxref',
        '500',
        '%%EOF'
      ].join('\n');

      return Buffer.from(pdfHeader + pdfBody, 'utf-8');
    } catch (error) {
      console.error('Error creating PDF content:', error);
      throw error;
    }
  }

  /**
   * Generate HTML content for the event request
   */
  private static generateEventRequestHtml(variables: EmailTemplateVariableData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Event Request Form - ${variables.referenceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; }
          .events { margin-top: 20px; }
          .event { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${variables.organizationName}</h1>
          <h2>Event Request Form</h2>
          <p>Reference: ${variables.referenceNumber}</p>
        </div>

        <div class="section">
          <h3>Requester Information</h3>
          <div class="field"><span class="label">Name:</span> ${variables.requesterName}</div>
          <div class="field"><span class="label">Email:</span> ${variables.requesterEmail}</div>
          <div class="field"><span class="label">Phone:</span> ${variables.requesterPhone}</div>
          <div class="field"><span class="label">Club:</span> ${variables.clubName}</div>
          <div class="field"><span class="label">Zone:</span> ${variables.zoneName}</div>
        </div>

        <div class="section">
          <h3>Submission Details</h3>
          <div class="field"><span class="label">Submitted:</span> ${new Date(variables.submissionDate).toLocaleString()}</div>
          <div class="field"><span class="label">Reference Number:</span> ${variables.referenceNumber}</div>
        </div>

        <div class="events">
          <h3>Requested Events</h3>
          ${variables.events.map((event, index) => `
            <div class="event">
              <h4>Event ${event.priority || index + 1}: ${event.name}</h4>
              <div class="field"><span class="label">Type:</span> ${event.eventTypeName}</div>
              <div class="field"><span class="label">Date:</span> ${event.date}</div>
              <div class="field"><span class="label">Location:</span> ${event.location}</div>
              ${event.isQualifier ? '<div class="field"><span class="label">Qualifier:</span> Yes</div>' : ''}
              ${event.isHistoricallyTraditional ? '<div class="field"><span class="label">Traditional Event:</span> Yes</div>' : ''}
              ${event.coordinatorName ? `<div class="field"><span class="label">Coordinator:</span> ${event.coordinatorName}</div>` : ''}
              ${event.coordinatorContact ? `<div class="field"><span class="label">Contact:</span> ${event.coordinatorContact}</div>` : ''}
              ${event.notes ? `<div class="field"><span class="label">Notes:</span> ${event.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>

        ${variables.generalNotes ? `
        <div class="section">
          <h3>General Notes</h3>
          <p>${variables.generalNotes}</p>
        </div>
        ` : ''}

        <div class="section">
          <p><small>Generated on ${new Date().toLocaleString()}</small></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Convert HTML to simple text for PDF (placeholder implementation)
   */
  private static convertHtmlToPdfText(html: string): string {
    // This is a very basic HTML to text conversion
    // In production, you'd use proper HTML parsing or PDF generation
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000); // Limit for demo PDF
  }

  /**
   * Replace variables in string (similar to template variable replacement)
   */
  private static replaceVariablesInString(
    text: string,
    variables: EmailTemplateVariableData
  ): string {
    let result = text;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const replacement = String(value || '');
      result = result.replace(regex, replacement);
    });

    return result;
  }
}