import { NextRequest, NextResponse } from 'next/server';
import { BackupScheduleService } from '@/lib/backup-schedule-service';

// GET: Get a specific backup schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const schedule = await BackupScheduleService.getScheduleById((await params).id);
    
    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'Schedule not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      schedule
    });
  } catch (error) {
    console.error('Error fetching backup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch backup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update a backup schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updates = await request.json();
    
    const schedule = await BackupScheduleService.updateSchedule((await params).id, updates);
    
    return NextResponse.json({
      success: true,
      message: 'Backup schedule updated successfully',
      schedule
    });
  } catch (error) {
    console.error('Error updating backup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update backup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a backup schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await BackupScheduleService.deleteSchedule((await params).id);
    
    return NextResponse.json({
      success: true,
      message: 'Backup schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting backup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete backup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}