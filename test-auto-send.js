// Test script to diagnose auto-send issues
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5001/ponyclub-events/australia-southeast1/api',
  authToken: 'admin-token'
};

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAutoSend() {
  console.log('🧪 Testing Auto-Send Functionality\n');

  // 1. Check current configuration
  console.log('1. Checking email queue configuration...');
  const configResult = await makeRequest('/email-queue/config');
  if (configResult.success) {
    console.log('✅ Configuration retrieved:', JSON.stringify(configResult.data, null, 2));
    
    const config = configResult.data;
    console.log('\n📋 Key Settings:');
    console.log(`   requireApprovalForEventRequests: ${config.requireApprovalForEventRequests}`);
    console.log(`   requireApprovalForNotifications: ${config.requireApprovalForNotifications}`);
    console.log(`   General requireApproval: ${config.requireApproval}`);
  } else {
    console.log('❌ Failed to get configuration:', configResult);
    return;
  }

  // 2. Check current email queue
  console.log('\n2. Checking current email queue...');
  const queueResult = await makeRequest('/email-queue');
  if (queueResult.success) {
    const emails = queueResult.data;
    console.log(`✅ Found ${emails.length} emails in queue`);
    
    // Show pending emails
    const pendingEmails = emails.filter(e => e.status === 'pending');
    console.log(`📧 Pending emails: ${pendingEmails.length}`);
    
    if (pendingEmails.length > 0) {
      pendingEmails.forEach((email, i) => {
        console.log(`   ${i + 1}. ID: ${email.id}`);
        console.log(`      Subject: ${email.subject}`);
        console.log(`      Type: ${email.type}`);
        console.log(`      Status: ${email.status}`);
        console.log(`      Created: ${new Date(email.createdAt).toLocaleString()}`);
        console.log();
      });

      // Test sending the first pending email
      if (pendingEmails.length > 0) {
        const testEmail = pendingEmails[0];
        console.log(`3. Testing manual send of email: ${testEmail.id}`);
        
        const sendResult = await makeRequest('/email-queue/send', 'POST', {
          emailId: testEmail.id
        });
        
        if (sendResult.success) {
          console.log('✅ Email sent successfully:', sendResult.data);
        } else {
          console.log('❌ Email send failed:', sendResult);
        }
      }
    }
  } else {
    console.log('❌ Failed to get queue:', queueResult);
  }

  // 3. Test creating a notification email (should auto-send)
  console.log('\n4. Testing notification email creation (should auto-send)...');
  const notificationEmail = {
    to: ['test@example.com'],
    subject: 'Test Auto-Send Notification',
    htmlContent: '<p>This should auto-send immediately.</p>',
    textContent: 'This should auto-send immediately.',
    type: 'notification',
    status: 'pending'
  };

  const createResult = await makeRequest('/email-queue', 'POST', notificationEmail);
  if (createResult.success) {
    console.log('✅ Notification email created:', createResult.data);
    
    // Check if it was auto-sent
    setTimeout(async () => {
      const checkResult = await makeRequest(`/email-queue`);
      if (checkResult.success) {
        const createdEmail = checkResult.data.find(e => e.id === createResult.data.id);
        if (createdEmail) {
          console.log(`📧 Created email status: ${createdEmail.status}`);
          if (createdEmail.status === 'sent') {
            console.log('✅ Notification email was auto-sent!');
          } else {
            console.log('❌ Notification email was NOT auto-sent');
          }
        }
      }
    }, 2000);
  } else {
    console.log('❌ Failed to create notification email:', createResult);
  }
}

// Run the test
testAutoSend().catch(console.error);
