// Quick script to update the custom email template in Firestore
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateEmailTemplate() {
  try {
    const templateId = 'TJy23zGhomXucefppEpe';
    const templateRef = db.collection('emailTemplates').doc(templateId);
    
    // Get the current template
    const doc = await templateRef.get();
    if (!doc.exists) {
      console.error('Template not found');
      return;
    }
    
    const template = doc.data();
    console.log('Current template type:', template.type);
    console.log('Current template name:', template.name);
    
    // Read the updated template content from our file
    const { generateEventRequestEmailHTML, generateEventRequestEmailText } = require('./src/lib/event-request-email-template.ts');
    
    // Create sample data to generate the template
    const sampleData = {
      referenceNumber: '{{referenceNumber}}',
      clubName: '{{clubName}}',
      zoneName: '{{zoneName}}',
      eventName: '{{eventName}}',
      eventDate: '{{eventDate}}',
      eventType: '{{eventType}}',
      location: '{{location}}',
      coordinatorName: '{{coordinatorName}}',
      coordinatorContact: '{{coordinatorContact}}',
      priority: '{{priority}}',
      isQualifier: false,
      organizationName: 'MyPonyClub Events',
      supportEmail: 'support@myponyclub.events',
      isForSuperUser: false
    };
    
    // Update the template
    await templateRef.update({
      htmlContent: generateEventRequestEmailHTML(sampleData),
      textContent: generateEventRequestEmailText(sampleData),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'system-update'
    });
    
    console.log('✅ Template updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating template:', error);
    process.exit(1);
  }
}

updateEmailTemplate();
