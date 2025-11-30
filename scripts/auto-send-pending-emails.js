/**
 * Auto-Send Pending Emails Utility
 * 
 * This script finds all emails in the queue with status='pending' and attempts to send them.
 * Useful for processing emails that were queued before the auto-send feature was implemented.
 * 
 * Usage:
 *   node scripts/auto-send-pending-emails.js
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../firebase-service-account.json');

if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const EMAIL_QUEUE_COLLECTION = 'emailQueue';

async function autoSendPendingEmails() {
  try {
    console.log('🔍 Searching for pending emails...\n');
    
    // Fetch all emails with status='pending'
    const snapshot = await db.collection(EMAIL_QUEUE_COLLECTION)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .get();
    
    if (snapshot.empty) {
      console.log('✅ No pending emails found in the queue.\n');
      return;
    }
    
    console.log(`📧 Found ${snapshot.size} pending email(s)\n`);
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      const email = { id: doc.id, ...doc.data() };
      const createdAt = email.createdAt?.toDate ? email.createdAt.toDate() : new Date(email.createdAt);
      
      console.log(`\n📨 Email ID: ${email.id}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   To: ${Array.isArray(email.to) ? email.to.join(', ') : email.to}`);
      console.log(`   Type: ${email.type || 'Unknown'}`);
      console.log(`   Created: ${createdAt.toLocaleString()}`);
      
      // Call the auto-send API endpoint
      try {
        const response = await fetch(`http://localhost:9002/api/email-queue/send/${email.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token', // Dev admin token
          },
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ Sent successfully`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
          failCount++;
        }
      } catch (error) {
        console.log(`   ⚠️  Skipped (API error): ${error.message}`);
        skippedCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Sent successfully: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   📧 Total processed: ${snapshot.size}`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error processing pending emails:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Auto-Send Pending Emails Utility\n');
console.log('This script will attempt to send all emails with status="pending"\n');

autoSendPendingEmails()
  .then(() => {
    console.log('✅ Script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
