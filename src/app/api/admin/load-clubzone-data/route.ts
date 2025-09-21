import { NextRequest, NextResponse } from 'next/server';
import { loadFromClubZoneData } from '@/lib/actions';
import { type ZoneData } from '@/lib/data-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zonesData }: { zonesData: ZoneData[] } = body;

    if (!zonesData || !Array.isArray(zonesData)) {
      return NextResponse.json(
        { error: 'Invalid request: zonesData array is required' },
        { status: 400 }
      );
    }

    if (zonesData.length === 0) {
      return NextResponse.json(
        { error: 'No zones data provided for import' },
        { status: 400 }
      );
    }

    // Perform the ClubZoneData import
    const result = await loadFromClubZoneData(zonesData);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      stats: result.stats,
      errors: result.errors
    });

  } catch (error) {
    console.error('ClubZoneData import error:', error);
    
    return NextResponse.json(
      { 
        error: 'ClubZoneData import failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
