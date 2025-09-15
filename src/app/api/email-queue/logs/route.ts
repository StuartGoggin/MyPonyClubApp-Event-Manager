import { NextRequest, NextResponse } from 'next/server';
import { getEmailLogs } from '@/lib/email-queue-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status') || undefined;
    
    const logs = await getEmailLogs(limit, status as any);
    
    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch email logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}