import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduleService } from '@/lib/backup-schedule-service';
import { BackupSchedule } from '@/lib/types-backup';

// GET: Get all backup schedules
export async function GET() {
  try {
    const schedules = await BackupScheduleService.getSchedules();
    
    return NextResponse.json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('Error fetching backup schedules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch backup schedules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Create a new backup schedule
export async function POST(request: NextRequest) {
  try {
    const scheduleData = await request.json();
    
    // TODO: Add proper authentication check
    const createdBy = 'admin'; // Replace with actual user from auth token
    
    // Validate required fields
    if (!scheduleData.name || !scheduleData.schedule || !scheduleData.deliveryOptions || !scheduleData.exportConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          details: 'name, schedule, deliveryOptions, and exportConfig are required'
        },
        { status: 400 }
      );
    }

    const schedule = await BackupScheduleService.createSchedule(scheduleData, createdBy);
    
    return NextResponse.json({
      success: true,
      message: 'Backup schedule created successfully',
      schedule
    });
  } catch (error) {
    console.error('Error creating backup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create backup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}