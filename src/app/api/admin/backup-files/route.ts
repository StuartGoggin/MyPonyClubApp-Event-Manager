import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/firebase-admin';

/**
 * GET /api/admin/backup-files
 * List all backup files in Firebase Storage
 */
export async function GET(request: NextRequest) {
  try {
    if (!bucket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase Storage not initialized'
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix') || 'backups/';

    // List all files in the backups directory
    const [files] = await bucket.getFiles({
      prefix: prefix,
      autoPaginate: true
    });

    const fileList = await Promise.all(
      files.map(async (file: any) => {
        const [metadata] = await file.getMetadata();
        return {
          name: file.name,
          size: parseInt(metadata.size || '0'),
          contentType: metadata.contentType,
          created: metadata.timeCreated,
          updated: metadata.updated,
          scheduleName: metadata.metadata?.scheduleName,
          scheduleId: metadata.metadata?.scheduleId,
          uploadedBy: metadata.metadata?.uploadedBy
        };
      })
    );

    return NextResponse.json({
      success: true,
      files: fileList,
      totalFiles: fileList.length,
      totalSize: fileList.reduce((sum, file) => sum + file.size, 0)
    });
  } catch (error) {
    console.error('Error listing backup files:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list backup files'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/backup-files
 * Delete old backup files based on retention policy
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!bucket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase Storage not initialized'
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const retentionDays = parseInt(searchParams.get('retentionDays') || '30');
    const dryRun = searchParams.get('dryRun') === 'true';

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // List all backup files
    const [files] = await bucket.getFiles({
      prefix: 'backups/',
      autoPaginate: true
    });

    const filesToDelete: any[] = [];
    const filesToKeep: any[] = [];

    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const fileDate = new Date(metadata.timeCreated);

      if (fileDate < cutoffDate) {
        filesToDelete.push({
          name: file.name,
          size: parseInt(metadata.size || '0'),
          created: metadata.timeCreated
        });

        if (!dryRun) {
          await file.delete();
          console.log(`🗑️ Deleted old backup: ${file.name}`);
        }
      } else {
        filesToKeep.push({
          name: file.name,
          size: parseInt(metadata.size || '0'),
          created: metadata.timeCreated
        });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      deletedCount: filesToDelete.length,
      deletedFiles: filesToDelete,
      keptCount: filesToKeep.length,
      freedSpace: filesToDelete.reduce((sum, file) => sum + file.size, 0)
    });
  } catch (error) {
    console.error('Error cleaning up backup files:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clean up backup files'
      },
      { status: 500 }
    );
  }
}
