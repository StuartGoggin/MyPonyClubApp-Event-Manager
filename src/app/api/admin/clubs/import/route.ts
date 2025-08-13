import { NextRequest, NextResponse } from 'next/server';
import { DataImporter } from '@/lib/data-export-import';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the import data
    const validation = DataImporter.validateImportData(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid import data', 
          details: validation.errors.join(', '),
          type: validation.type
        },
        { status: 400 }
      );
    }

    let result;

    switch (validation.type) {
      case 'zones':
        result = await DataImporter.importZones(body);
        break;
      case 'clubs':
        result = await DataImporter.importClubs(body);
        break;
      case 'zones-clubs':
        result = await DataImporter.importZonesAndClubs(body);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported import type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Import completed successfully' : 'Import completed with errors',
      type: validation.type,
      imported: 'imported' in result ? result.imported : undefined,
      updated: 'updated' in result ? result.updated : undefined,
      zones: 'zones' in result ? result.zones : undefined,
      clubs: 'clubs' in result ? result.clubs : undefined,
      errors: result.errors
    });

  } catch (error) {
    console.error('Import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
