import { NextRequest, NextResponse } from 'next/server';
import { BackupExecutionService } from '@/lib/backup-execution-service';

// POST: Manually trigger a backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const execution = await BackupExecutionService.manualBackup((await params).id);
    
    return NextResponse.json({
      success: true,
      message: 'Backup executed successfully',
      execution
    });
  } catch (error) {
    console.error('Error executing manual backup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute backup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}