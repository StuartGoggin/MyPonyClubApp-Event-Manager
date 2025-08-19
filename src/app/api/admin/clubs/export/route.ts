import { NextRequest, NextResponse } from 'next/server';
import { DataExporter } from '@/lib/data-export-import';

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'clubs';

    let exportData;
    
    switch (type) {
      case 'zones':
        exportData = await DataExporter.exportZones();
        break;
      case 'clubs':
      default:
        exportData = await DataExporter.exportClubs();
        break;
      case 'zones-clubs':
        exportData = await DataExporter.exportZonesAndClubs();
        break;
    }

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    return new Response(JSON.stringify(exportData.data, null, 2), {
      headers
    });

  } catch (error) {
    console.error('Export error:', error);
    
    return NextResponse.json(
      { 
        error: 'Export failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
