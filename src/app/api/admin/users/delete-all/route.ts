import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';

export async function DELETE(request: NextRequest) {
  try {
    // Check database connection
    if (!isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { confirmations, timestamp } = body;

    // Validate confirmations
    if (!confirmations) {
      return NextResponse.json(
        { error: 'Missing confirmations' },
        { status: 400 }
      );
    }

    // Verify all required confirmations
    const requiredConfirmations = [
      'understanding',
      'testingOnly', 
      'irreversible',
      'backupTaken'
    ];

    for (const confirmation of requiredConfirmations) {
      if (!confirmations[confirmation]) {
        return NextResponse.json(
          { error: `Missing confirmation: ${confirmation}` },
          { status: 400 }
        );
      }
    }

    // Verify delete command
    if (confirmations.deleteCommand !== 'DELETE ALL USER DATA') {
      return NextResponse.json(
        { error: 'Invalid delete command' },
        { status: 400 }
      );
    }

    console.log(`[UserDeletion] Starting user data deletion at ${timestamp}`);
    console.log(`[UserDeletion] Confirmations received:`, confirmations);

    // Additional safety check - ensure this is not production
    const environment = process.env.NODE_ENV;
    if (environment === 'production') {
      console.error('[UserDeletion] Attempted to delete users in production environment!');
      return NextResponse.json(
        { error: 'User deletion is not allowed in production environment' },
        { status: 403 }
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    try {
      // Get all users from the 'users' collection
      console.log('[UserDeletion] Fetching all users...');
      const usersSnapshot = await adminDb.collection('users').get();
      
      if (usersSnapshot.empty) {
        console.log('[UserDeletion] No users found to delete');
        return NextResponse.json({
          success: true,
          deletedCount: 0,
          message: 'No users found to delete',
          errors: []
        });
      }

      console.log(`[UserDeletion] Found ${usersSnapshot.size} users to delete`);

      // Delete users in batches (Firestore batch limit is 500)
      const batchSize = 100;
      const batches: any[] = [];
      let currentBatch = adminDb.batch();
      let currentBatchCount = 0;

      usersSnapshot.docs.forEach((doc: any) => {
        if (currentBatchCount >= batchSize) {
          batches.push(currentBatch);
          currentBatch = adminDb.batch();
          currentBatchCount = 0;
        }

        currentBatch.delete(doc.ref);
        currentBatchCount++;
        deletedCount++;
      });

      // Add the final batch if it has documents
      if (currentBatchCount > 0) {
        batches.push(currentBatch);
      }

      // Execute all batches
      console.log(`[UserDeletion] Executing ${batches.length} batches...`);
      for (let i = 0; i < batches.length; i++) {
        try {
          await batches[i].commit();
          console.log(`[UserDeletion] Batch ${i + 1}/${batches.length} completed`);
        } catch (error) {
          const errorMessage = `Failed to execute batch ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[UserDeletion] ${errorMessage}`);
          errors.push(errorMessage);
        }
      }

      // Also check for and delete any user-related subcollections or documents
      // (Add more collections here if your app has user-specific data in other collections)
      try {
        // Example: Delete user preferences if they exist in a separate collection
        const userPrefsSnapshot = await adminDb.collection('userPreferences').get();
        if (!userPrefsSnapshot.empty) {
          console.log(`[UserDeletion] Deleting ${userPrefsSnapshot.size} user preferences...`);
          const prefsBatch = adminDb.batch();
          userPrefsSnapshot.docs.forEach((doc: any) => prefsBatch.delete(doc.ref));
          await prefsBatch.commit();
          console.log('[UserDeletion] User preferences deleted');
        }
      } catch (error) {
        const errorMessage = `Failed to delete user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[UserDeletion] ${errorMessage}`);
        errors.push(errorMessage);
      }

      console.log(`[UserDeletion] Deletion completed. ${deletedCount} users deleted with ${errors.length} errors`);

      return NextResponse.json({
        success: errors.length === 0,
        deletedCount,
        errors,
        message: errors.length === 0 
          ? `Successfully deleted ${deletedCount} user records`
          : `Deleted ${deletedCount} users with ${errors.length} errors`
      });

    } catch (error) {
      console.error('[UserDeletion] Critical error during deletion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during deletion';
      
      return NextResponse.json(
        { 
          error: 'Failed to delete user data',
          details: errorMessage,
          deletedCount,
          success: false
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[UserDeletion] Error processing request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
