import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduleService } from '@/lib/backup-schedule-service';

// POST: Toggle schedule active status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const schedule = await BackupScheduleService.toggleScheduleStatus((await params).id);
    
    return NextResponse.json({
      success: true,
      message: `Backup schedule ${schedule.isActive ? 'activated' : 'deactivated'} successfully`,
      schedule
    });
  } catch (error) {
    console.error('Error toggling backup schedule status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to toggle backup schedule status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}