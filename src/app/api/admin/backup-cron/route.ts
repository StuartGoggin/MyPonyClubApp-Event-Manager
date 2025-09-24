import { NextRequest, NextResponse } from 'next/server';
import { BackupExecutionService } from '@/lib/backup-execution-service';
import { BackupScheduleService } from '@/lib/backup-schedule-service';
import { BackupSchedule } from '@/lib/types-backup';

// POST: Run all scheduled backups that are due
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check for cron jobs
    // This endpoint should only be accessible by the system or authenticated admin users
    
    const executions = await BackupExecutionService.runScheduledBackups();
    
    return NextResponse.json({
      success: true,
      message: `Executed ${executions.length} scheduled backup(s)`,
      executions: executions.map(exec => ({
        id: exec.id,
        scheduleName: exec.scheduleName,
        status: exec.status,
        startTime: exec.startTime,
        endTime: exec.endTime,
        errorMessage: exec.errorMessage
      }))
    });
  } catch (error) {
    console.error('Error running scheduled backups:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run scheduled backups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }

}

// GET: Check if any backups are due (for monitoring)
export async function GET() {
  try {
    // This is a lightweight check to see what schedules are due
    // without actually executing them
    const dueSchedules = await BackupScheduleService.getSchedulesDueForExecution();
    
    return NextResponse.json({
      success: true,
      dueSchedules: dueSchedules.length,
      schedules: dueSchedules.map((schedule: BackupSchedule) => ({
        id: schedule.id,
        name: schedule.name,
        nextRun: schedule.nextRun,
        frequency: schedule.schedule.frequency
      }))
    });
  } catch (error) {
    console.error('Error checking due schedules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check due schedules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}