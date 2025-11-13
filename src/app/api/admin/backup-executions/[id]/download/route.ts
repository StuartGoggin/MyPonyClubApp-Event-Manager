import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduleService } from '@/lib/backup-schedule-service';
import { bucket } from '@/lib/firebase-admin';

/**
 * GET /api/admin/backup-executions/[id]/download
 * Generate a fresh download URL for a backup file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const executionId = params.id;

    // Get the execution record to retrieve the storage path
    const executions = await BackupScheduleService.getExecutions(undefined, 1000);
    const execution = executions.find(e => e.id === executionId);

    if (!execution) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backup execution not found'
        },
        { status: 404 }
      );
    }

    if (execution.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Backup is not completed or failed'
        },
        { status: 400 }
      );
    }

    if (!execution.storagePath) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backup file path not found. This backup may have been delivered via email only.'
        },
        { status: 404 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase Storage not initialized'
        },
        { status: 500 }
      );
    }

    // Generate a new signed URL (valid for 1 hour)
    const file = bucket.file(execution.storagePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Backup file no longer exists in storage'
        },
        { status: 404 }
      );
    }

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 3600, // seconds
      fileName: execution.storagePath.split('/').pop(),
      fileSize: execution.exportSize
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate download URL'
      },
      { status: 500 }
    );
  }
}
