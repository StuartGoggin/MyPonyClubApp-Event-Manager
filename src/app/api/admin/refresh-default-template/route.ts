import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { generateEventRequestEmailHTML, generateEventRequestEmailText } from '@/lib/event-request-email-template';

/**
 * Endpoint to refresh the default email template stored in database
 * with the latest content from the template file
 */
export async function POST(request: NextRequest) {
  try {
    const templateId = 'TJy23zGhomXucefppEpe'; // The custom template ID
    
    console.log(`Refreshing email template: ${templateId}`);
    
    // Sample template data with placeholder variables
    const sampleData = {
      requesterName: '{{requesterName}}',
      requesterEmail: '{{requesterEmail}}',
      requesterPhone: '{{requesterPhone}}',
      clubName: '{{clubName}}',
      zoneName: '{{zoneName}}',
      submissionDate: '{{submissionDate}}',
      referenceNumber: '{{referenceNumber}}',
      events: [
        {
          priority: 1,
          name: '{{eventName}}',
          eventTypeName: '{{eventType}}',
          date: '{{eventDate}}',
          location: '{{location}}',
          isQualifier: false,
          isHistoricallyTraditional: false,
          coordinatorName: '{{coordinatorName}}',
          coordinatorContact: '{{coordinatorContact}}',
          notes: '{{notes}}'
        }
      ],
      generalNotes: '{{generalNotes}}',
      isForSuperUser: false
    };
    
    const htmlContent = generateEventRequestEmailHTML(sampleData);
    const textContent = generateEventRequestEmailText(sampleData);
    
    console.log('Generated HTML contains green box (#ecfdf5):', htmlContent.includes('#ecfdf5'));
    console.log('Generated HTML contains "Important:":', htmlContent.includes('Important:'));
    console.log('HTML preview (first 1000 chars):', htmlContent.substring(0, 1000));
    
    await adminDb.collection('emailTemplates').doc(templateId).update({
      htmlContent,
      textContent,
      updatedAt: new Date(),
      updatedBy: 'system-refresh'
    });
    
    console.log('✅ Template refreshed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Template refreshed successfully',
      templateId,
      checks: {
        containsGreenBox: htmlContent.includes('#ecfdf5'),
        containsImportant: htmlContent.includes('Important:'),
        nextStepsSection: htmlContent.includes('Next Steps')
      }
    });
  } catch (error) {
    console.error('Error refreshing template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
