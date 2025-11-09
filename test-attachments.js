import { EmailTemplateService } from '../src/lib/email-template-service';
import { EmailAttachmentService } from '../src/lib/email-attachment-service';
import { EmailTemplateVariableData } from '../src/lib/types-email-templates';

// Test script to verify attachment system functionality
async function testAttachmentSystem() {
  console.log('🚀 Testing Email Attachment System...\n');

  // Sample test data
  const testVariables: EmailTemplateVariableData = {
    requesterName: 'John Smith',
    requesterEmail: 'john.smith@example.com',
    requesterPhone: '0412 345 678',
    clubName: 'Melbourne Pony Club',
    clubId: 'club-melbourne',
    zoneName: 'Metropolitan Zone',
    zoneId: 'zone-metropolitan',
    submissionDate: new Date().toISOString(),
    referenceNumber: 'ER-20251109-001',
    events: [{
      priority: 1,
      name: 'Spring Championship',
      eventTypeName: 'Show Jumping',
      date: '2025-12-15',
      location: 'Melbourne Showgrounds',
      isQualifier: true,
      isHistoricallyTraditional: false,
      coordinatorName: 'Jane Doe',
      coordinatorContact: 'jane.doe@example.com',
      notes: 'Test event for attachment system'
    }],
    generalNotes: 'This is a test of the attachment system',
    systemUrl: 'https://events.ponyclub.com.au',
    supportEmail: 'support@ponyclub.com.au',
    organizationName: 'Pony Club Australia',
    recipientName: 'Test User',
    recipientRole: 'Test Role',
  };

  try {
    // Test 1: Initialize default templates
    console.log('📋 Step 1: Initializing default templates...');
    await EmailTemplateService.initializeDefaultTemplates();
    console.log('✅ Default templates initialized\n');

    // Test 2: Get default template for super users (should have both PDF and JSON attachments)
    console.log('📧 Step 2: Testing super user template with attachments...');
    const superUserTemplate = await EmailTemplateService.getDefaultTemplate('event-request-super-user');
    
    if (superUserTemplate && superUserTemplate.attachments) {
      console.log('✅ Super user template found with attachments:');
      console.log('   - PDF attachment enabled:', superUserTemplate.attachments.eventRequestPdf?.enabled);
      console.log('   - JSON attachment enabled:', superUserTemplate.attachments.eventDataJson?.enabled);
      
      // Test 3: Generate attachments
      console.log('\n📎 Step 3: Generating attachments...');
      const attachments = await EmailAttachmentService.generateAttachments(
        superUserTemplate.attachments,
        testVariables
      );
      
      console.log(`✅ Generated ${attachments.length} attachments:`);
      attachments.forEach((attachment, index) => {
        console.log(`   ${index + 1}. ${attachment.filename} (${attachment.contentType})`);
        console.log(`      Size: ${attachment.content instanceof Buffer ? attachment.content.length : attachment.content.toString().length} bytes`);
      });
    } else {
      console.log('❌ No super user template found or no attachments configured');
    }

    // Test 4: Test different template types
    console.log('\n🎯 Step 4: Testing attachment settings for different template types...');
    const templateTypes = ['event-request-requester', 'event-request-zone-manager', 'event-request-club-admin', 'event-request-super-user'] as const;
    
    for (const templateType of templateTypes) {
      const defaultAttachments = EmailTemplateService.getDefaultAttachments(templateType);
      console.log(`\n📋 ${templateType}:`);
      console.log(`   PDF enabled: ${defaultAttachments.eventRequestPdf?.enabled || false}`);
      console.log(`   JSON enabled: ${defaultAttachments.eventDataJson?.enabled || false}`);
    }

    console.log('\n🎉 Attachment system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export the test function for use in scripts
export { testAttachmentSystem };

// Run the test if this file is executed directly
if (require.main === module) {
  testAttachmentSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}