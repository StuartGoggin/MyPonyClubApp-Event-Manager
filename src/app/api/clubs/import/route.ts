import { NextRequest, NextResponse } from 'next/server';
import { importClubsFromJson } from '@/lib/club-import';
import { ClubJsonData } from '@/lib/club-data-utils';
import { invalidateClubsCache } from '@/lib/server-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clubs }: { clubs: ClubJsonData[] } = body;

    if (!clubs || !Array.isArray(clubs)) {
      return NextResponse.json(
        { error: 'Invalid request: clubs array is required' },
        { status: 400 }
      );
    }

    if (clubs.length === 0) {
      return NextResponse.json(
        { error: 'No clubs provided for import' },
        { status: 400 }
      );
    }

    // Perform the import
    const result = await importClubsFromJson(clubs);

    // Invalidate cache after bulk import
    invalidateClubsCache();

    return NextResponse.json({
      success: true,
      message: `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`,
      ...result
    });

  } catch (error) {
    console.error('Club import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
