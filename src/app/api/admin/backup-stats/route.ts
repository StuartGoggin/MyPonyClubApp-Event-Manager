import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduleService } from '@/lib/backup-schedule-service';

// GET: Get backup statistics
export async function GET() {
  try {
    const stats = await BackupScheduleService.getBackupStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching backup stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch backup statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}