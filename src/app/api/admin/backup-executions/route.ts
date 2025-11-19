import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduleService } from '@/lib/backup-schedule-service';

export const dynamic = 'force-dynamic';

// GET: Get backup executions
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const scheduleId = url.searchParams.get('scheduleId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const executions = await BackupScheduleService.getExecutions(
      scheduleId || undefined, 
      limit
    );
    
    return NextResponse.json({
      success: true,
      executions
    });
  } catch (error) {
    console.error('Error fetching backup executions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch backup executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}