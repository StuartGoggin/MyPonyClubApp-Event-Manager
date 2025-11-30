/**
 * Purge Test Emails Script
 * 
 * Deletes all emails from the email queue that have stuart.goggin@gmail.com in the 'to' array.
 * This is useful for clearing test data before production use.
 * 
 * Usage: node scripts/purge-test-emails.js
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountStr) {
    console.error('❌ Error: FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set');
    process.exit(1);
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    // Handle private key formatting
    let formattedPrivateKey = serviceAccount.private_key;
    if (formattedPrivateKey.includes('\\n')) {
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: formattedPrivateKey,
      }),
    });
  } catch (error) {
    console.error('❌ Error parsing service account credentials:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function purgeTestEmails() {
  try {
    console.log('🔍 Searching for emails with stuart.goggin@gmail.com in the "to" field...\n');
    
    // Query all emails where 'to' array contains stuart.goggin@gmail.com
    const snapshot = await db.collection('emailQueue')
      .where('to', 'array-contains', 'stuart.goggin@gmail.com')
      .get();
    
    if (snapshot.empty) {
      console.log('✅ No test emails found. Queue is already clean!\n');
      return;
    }
    
    console.log(`📧 Found ${snapshot.size} email(s) to delete\n`);
    
    // Display summary of emails to be deleted
    const emailsToDelete = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      emailsToDelete.push({
        id: doc.id,
        subject: data.subject,
        status: data.status,
        type: data.type,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });
    });
    
    // Show details
    console.log('Emails to be deleted:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    emailsToDelete.forEach((email, idx) => {
      console.log(`${idx + 1}. [${email.status}] ${email.subject}`);
      console.log(`   Type: ${email.type} | ID: ${email.id}`);
      console.log(`   Created: ${email.createdAt}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Delete in batches (Firestore limit: 500 operations per batch)
    const batchSize = 500;
    let deletedCount = 0;
    
    for (let i = 0; i < emailsToDelete.length; i += batchSize) {
      const batch = db.batch();
      const batchEmails = emailsToDelete.slice(i, i + batchSize);
      
      batchEmails.forEach(email => {
        const docRef = db.collection('emailQueue').doc(email.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      deletedCount += batchEmails.length;
      console.log(`🗑️  Deleted batch ${Math.floor(i / batchSize) + 1}: ${batchEmails.length} emails`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully deleted ${deletedCount} test email(s)!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Verify cleanup
    const verifySnapshot = await db.collection('emailQueue')
      .where('to', 'array-contains', 'stuart.goggin@gmail.com')
      .get();
    
    if (verifySnapshot.empty) {
      console.log('✅ Verification: Email queue is now clean!\n');
    } else {
      console.warn(`⚠️  Warning: ${verifySnapshot.size} email(s) still found. You may need to run this script again.\n`);
    }
    
  } catch (error) {
    console.error('❌ Error purging test emails:', error);
    throw error;
  }
}

// Run the purge
purgeTestEmails()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
