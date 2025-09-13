import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';
import { SpreadsheetParser } from '@/lib/spreadsheet-parser';
import { validateUserImportRows } from '@/lib/user-validation';

export async function POST(request: NextRequest) {
  try {
    console.log('[UserImport] Starting user import process');
    
    const contentType = request.headers.get('content-type');
    
    // Check if this is a confirmed import with pre-parsed data
    if (contentType?.includes('application/json')) {
      console.log('[UserImport] Processing confirmed import with pre-parsed data');
      
      const { validRows, fileName, isReImport = false } = await request.json();
      
      if (!validRows || !Array.isArray(validRows)) {
        return NextResponse.json(
          { error: 'Invalid data format - validRows array required' },
          { status: 400 }
        );
      }
      
      console.log(`[UserImport] Confirmed import for ${fileName}: ${validRows.length} valid rows, re-import: ${isReImport}`);
      
      // Import users with enhanced change detection
      const importResult = await UserService.importUsersWithChangeDetection(validRows, isReImport);
      
      console.log(`[UserImport] Import complete: created=${importResult.createdUsers}, updated=${importResult.updatedUsers}, deactivated=${importResult.deactivatedUsers || 0}, errors=${importResult.errors.length}`);
      
      // Include changes summary in response for re-imports
      const deactivatedCount = importResult.deactivatedUsers || 0;
      const message = deactivatedCount > 0 
        ? `Import completed: ${importResult.createdUsers} users created, ${importResult.updatedUsers} users updated, ${deactivatedCount} users deactivated`
        : `Import completed: ${importResult.createdUsers} users created, ${importResult.updatedUsers} users updated`;
      
      const responseData: any = {
        success: true,
        message,
        results: {
          validRows: validRows.length,
          createdUsers: importResult.createdUsers,
          updatedUsers: importResult.updatedUsers,
          deactivatedUsers: deactivatedCount,
          importErrors: importResult.errors.length
        },
        importErrors: importResult.errors
      };

      if (isReImport && importResult.changesSummary) {
        responseData.changesSummary = importResult.changesSummary;
      }

      return NextResponse.json(responseData);
    }
    
    // Legacy file upload mode (fallback for compatibility)
    console.log('[UserImport] Processing legacy file upload mode');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('[UserImport] No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`[UserImport] Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Validate file type
    const fileValidation = SpreadsheetParser.validateFileType(file.name);
    if (!fileValidation.valid) {
      console.log(`[UserImport] File validation failed: ${fileValidation.error}`);
      return NextResponse.json(
        { 
          error: fileValidation.error,
          details: [
            'Supported file formats are: .xlsx, .xls, .csv',
            `Received file: ${file.name} (${file.type})`
          ]
        },
        { status: 400 }
      );
    }
    
    // Parse file
    console.log('[UserImport] Starting file parsing');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const parseResult = SpreadsheetParser.parseFile(fileBuffer, file.name);
    
    console.log(`[UserImport] Parse result: success=${parseResult.success}, data rows=${parseResult.data.length}, errors=${parseResult.errors.length}`);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { 
          error: 'Failed to parse file',
          details: parseResult.errors,
          totalRows: parseResult.totalRows,
          debug: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        },
        { status: 400 }
      );
    }
    
    // Import users with enhanced change detection (legacy mode defaults to new import)
    console.log(`[UserImport] Starting user import for ${parseResult.data.length} records`);
    const importResult = await UserService.importUsersWithChangeDetection(parseResult.data, false);
    
    console.log(`[UserImport] Import completed: success=${importResult.success}, successful=${importResult.successfulImports}, failed=${importResult.failedImports}`);
    
    return NextResponse.json({
      success: importResult.success,
      message: `Import completed. ${importResult.successfulImports} users processed (${importResult.createdUsers || 0} created, ${importResult.updatedUsers || 0} updated).`,
      result: importResult,
      debug: {
        fileName: file.name,
        fileSize: file.size,
        parsedRows: parseResult.data.length,
        totalRows: parseResult.totalRows
      }
    });
    
  } catch (error) {
    console.error('[UserImport] Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during import',
        details: [
          error instanceof Error ? error.message : 'Unknown error',
          'Please check the server logs for more details',
          'If the problem persists, contact system administrator'
        ],
        technicalDetails: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          stack: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return CSV template for user import
    const template = SpreadsheetParser.generateTemplate();
    
    return new NextResponse(template, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="user_import_template.csv"'
      }
    });
    
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
