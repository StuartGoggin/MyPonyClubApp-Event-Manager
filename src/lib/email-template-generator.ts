import { EmailTemplateService } from '@/lib/email-template-service';
import { EmailTemplateVariableData, EmailTemplateType } from '@/lib/types-email-templates';
import { EmailAttachmentService } from '@/lib/email-attachment-service';
import { generateEventRequestEmailHTML, generateEventRequestEmailText } from '@/lib/event-request-email-template';

/**
 * Shared email template generation function
 * Used by both event submission and email resend endpoints
 * 
 * Uses templates from event-request-email-template.ts which are the single source of truth
 */
export async function generateEmailFromTemplate(
  templateType: EmailTemplateType, 
  variables: EmailTemplateVariableData
) {
  try {
    console.log(`[EMAIL TEMPLATE] Generating template for type: ${templateType}`);
    
    // Try to get custom template from database first (if admin has customized templates)
    const customTemplate = await EmailTemplateService.getDefaultTemplate(templateType);
    
    console.log(`[EMAIL TEMPLATE] Custom template found:`, customTemplate ? 'YES' : 'NO');
    
    if (customTemplate) {
      console.log(`[EMAIL TEMPLATE] Using CUSTOM template from database (ID: ${customTemplate.id})`);
      // Use custom template from database
      const rendered = await EmailTemplateService.renderTemplate({
        templateId: customTemplate.id,
        variables,
        recipientType: templateType.split('-').pop() as any
      });
      
      if (rendered) {
        console.log(`[EMAIL TEMPLATE] Custom template HTML preview:`, rendered.htmlBody.substring(0, 500));
        console.log(`[EMAIL TEMPLATE] Custom contains green box:`, rendered.htmlBody.includes('#ecfdf5'));
        console.log(`[EMAIL TEMPLATE] Custom contains "Important:":`, rendered.htmlBody.includes('Important:'));
        
        // Generate attachments based on template settings
        const attachmentFiles = await EmailAttachmentService.generateAttachments(
          rendered.attachments,
          variables
        );

        // Convert attachment files to Resend format
        const resendAttachments = attachmentFiles.map(file => ({
          filename: file.filename,
          content: file.content instanceof Buffer ? file.content : Buffer.from(String(file.content), 'utf-8')
        }));

        return {
          subject: rendered.subject,
          html: rendered.htmlBody,
          text: rendered.textBody,
          attachments: resendAttachments
        };
      }
    }
    
    // Use default templates from event-request-email-template.ts
    // This is the single source of truth for all email templates
    console.log(`[EMAIL TEMPLATE] Using DEFAULT template from file`);
    const referenceNumber = variables.referenceNumber || 'N/A';
    
    const templateData = {
      ...variables,
      organizationName: variables.organizationName || 'MyPonyClub Events',
      supportEmail: variables.supportEmail || 'support@myponyclub.events',
      isForSuperUser: templateType.includes('super-user')
    };
    
    const html = generateEventRequestEmailHTML(templateData);
    console.log('[EMAIL TEMPLATE] Default template HTML preview:', html.substring(0, 500));
    console.log('[EMAIL TEMPLATE] Default contains green box:', html.includes('#ecfdf5'));
    console.log('[EMAIL TEMPLATE] Default contains "Important:":', html.includes('Important:'));
    
    return {
      subject: templateType.includes('requester') 
        ? `Event Request Submitted - ${referenceNumber}`
        : templateType.includes('zone-manager')
        ? `Zone Approval Required - Event Request ${referenceNumber}`
        : templateType.includes('super-user')
        ? `Super User Notification - Event Request ${referenceNumber}`
        : `Event Request Notification - ${referenceNumber}`,
      html,
      text: generateEventRequestEmailText(templateData),
      attachments: []
    };
  } catch (error) {
    console.error('Error generating email from template:', error);
    throw error;
  }
}

