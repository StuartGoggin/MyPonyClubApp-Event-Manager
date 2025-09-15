/**
 * Test script to verify the notification system's email queue integration
 * after fixing the ID mismatch issue
 */

import { addEmailToQueue, getQueuedEmailById } from './email-queue-admin';

export async function testNotificationQueueFix() {
  console.log('🧪 Testing notification system email queue integration...');
  
  try {
    // Test 1: Add an email to queue using the corrected format
    const testEmailData = {
      to: ['test@example.com'],
      subject: 'Test Event Request Notification',
      htmlContent: '<h1>Test HTML Content</h1>',
      textContent: 'Test text content',
      attachments: [],
      status: 'pending' as const,
      type: 'event_request' as const,
      metadata: {
        requesterId: 'test@example.com',
        clubId: 'test-club',
        referenceNumber: 'TEST-123',
      },
    };

    console.log('📧 Adding test email to queue...');
    const emailId = await addEmailToQueue(testEmailData);
    console.log('✅ Email added with ID:', emailId);

    // Test 2: Retrieve the email by the Firestore-generated ID
    console.log('🔍 Retrieving email by ID...');
    const retrievedEmail = await getQueuedEmailById(emailId);
    
    if (retrievedEmail) {
      console.log('✅ Email successfully retrieved!');
      console.log('📄 Email details:', {
        id: retrievedEmail.id,
        to: retrievedEmail.to,
        subject: retrievedEmail.subject,
        status: retrievedEmail.status,
        type: retrievedEmail.type,
      });
      
      return {
        success: true,
        emailId,
        retrievedEmail: {
          id: retrievedEmail.id,
          to: retrievedEmail.to,
          subject: retrievedEmail.subject,
          status: retrievedEmail.status,
          type: retrievedEmail.type,
        }
      };
    } else {
      console.log('❌ Failed to retrieve email by ID');
      return {
        success: false,
        error: 'Email not found after creation',
        emailId
      };
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test the notification system with queue=true
 */
export async function testEventRequestNotificationQueue() {
  console.log('🧪 Testing event request notification with queue=true...');
  
  try {
    // Simulate a POST to the notification endpoint with queue=true
    const testFormData = {
      clubId: 'test-club',
      submittedByEmail: 'test@example.com',
      eventTitle: 'Test Event',
      events: [
        {
          eventType: 'Test Event Type',
          preferredDate: '2025-02-15',
          alternativeDate1: '2025-02-16',
          location: 'Test Location',
          description: 'Test event description'
        }
      ]
    };

    const response = await fetch('/api/send-event-request-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        formData: testFormData,
        queue: true, // This should use our fixed queue system
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Notification API call successful:', result);
      return { success: true, result };
    } else {
      const error = await response.text();
      console.log('❌ Notification API call failed:', error);
      return { success: false, error };
    }

  } catch (error) {
    console.error('❌ Notification test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}