import { NextRequest, NextResponse } from 'next/server';
import { SpreadsheetParser } from '@/lib/spreadsheet-parser';
import { validateUserImportRows } from '@/lib/user-validation';
import { mapImportData } from '@/lib/import-mappings';

export interface ImportPreviewResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  errorRows: number;
  summary: {
    clubsFound: string[];
    zonesFound: string[];
    rolesFound: string[];
    missingMobileNumbers: number;
    missingClubNames: number;
    usersWithEmail: number;
    duplicatePonyClubIds: string[];
    // Mapping statistics
    mappedClubs: string[];
    mappedZones: string[];
    successfulClubMappings: number;
    successfulZoneMappings: number;
    totalClubsWithMappings: number;
    totalZonesWithMappings: number;
  };
  sampleData: Array<{
    ponyClubId: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    originalClubName?: string;
    mappedClubName?: string;
    originalZoneName?: string;
    mappedZoneName?: string;
    role: string;
    email?: string;
  }>;
  validRowsData: Array<{
    ponyClubId: string;
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    clubName?: string;
    zoneName?: string;
    role: string;
    email?: string;
  }>;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
  parseErrors: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('[ImportPreview] Starting import preview process');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('[ImportPreview] No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`[ImportPreview] Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Validate file type
    const fileValidation = SpreadsheetParser.validateFileType(file.name);
    if (!fileValidation.valid) {
      console.log(`[ImportPreview] File validation failed: ${fileValidation.error}`);
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
    console.log('[ImportPreview] Starting file parsing');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const parseResult = SpreadsheetParser.parseFile(fileBuffer, file.name);
    
    console.log(`[ImportPreview] Parse result: success=${parseResult.success}, data rows=${parseResult.data.length}, errors=${parseResult.errors.length}`);
    
    // Check if the parsing completely failed or if we just have some filtered rows
    const hasValidData = parseResult.data.length > 0;
    const allErrorsAreFiltering = parseResult.errors.every(error => 
      error.includes('blank membership') || error.includes('Historical Membership')
    );
    
    if (!parseResult.success && !hasValidData && !allErrorsAreFiltering) {
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
    
    // Validate rows and generate preview
    const { validRows, errors: validationErrors } = validateUserImportRows(parseResult.data);
    
    // Generate summary statistics with mapping information
    const clubsFound = new Set<string>();
    const zonesFound = new Set<string>();
    const rolesFound = new Set<string>();
    const ponyClubIds = new Set<string>();
    const duplicatePonyClubIds = new Set<string>();
    const mappedClubs = new Set<string>();
    const mappedZones = new Set<string>();
    let missingMobileNumbers = 0;
    let missingClubNames = 0;
    let usersWithEmail = 0;
    let successfulClubMappings = 0;
    let successfulZoneMappings = 0;
    
    validRows.forEach(row => {
      // Track original data
      if (row.clubName) clubsFound.add(row.clubName);
      if (row.zoneName) zonesFound.add(row.zoneName);
      if (row.role) rolesFound.add(row.role);
      
      // For preview, we'll show basic stats (actual mapping happens during import)
      if (row.clubName) {
        mappedClubs.add(row.clubName); // Simplified for preview
        successfulClubMappings++;
      }
      
      if (row.zoneName) {
        mappedZones.add(row.zoneName); // Simplified for preview  
        successfulZoneMappings++;
      }
      
      // Check for duplicates
      if (ponyClubIds.has(row.ponyClubId)) {
        duplicatePonyClubIds.add(row.ponyClubId);
      } else {
        ponyClubIds.add(row.ponyClubId);
      }
      
      // Count missing fields and email presence
      if (!row.mobileNumber) missingMobileNumbers++;
      if (!row.clubName) missingClubNames++;
      if (row.email && row.email.trim() !== '') usersWithEmail++;
    });
    
    // Generate sample data (first 10 valid rows) with mapping applied
    const sampleData = validRows.slice(0, 10).map(row => {
      return {
        ponyClubId: row.ponyClubId,
        firstName: row.firstName,
        lastName: row.lastName,
        mobileNumber: row.mobileNumber || '(Not provided)',
        originalClubName: row.clubName || '(Not provided)',
        mappedClubName: '(Applied during import)',
        originalZoneName: row.zoneName || '(Not provided)',
        mappedZoneName: row.zoneName || '(Not provided)',
        role: row.role || 'standard',
        email: row.email
      };
    });

    // Generate complete valid rows data for import
    const validRowsData = validRows.map(row => ({
      ponyClubId: row.ponyClubId,
      firstName: row.firstName,
      lastName: row.lastName,
      mobileNumber: row.mobileNumber,
      clubName: row.clubName,
      zoneName: row.zoneName,
      role: row.role || 'standard',
      email: row.email
    }));
    
    const result: ImportPreviewResult = {
      success: true,
      fileName: file.name,
      fileSize: file.size,
      totalRows: parseResult.totalRows,
      validRows: validRows.length,
      errorRows: validationErrors.length,
      summary: {
        clubsFound: Array.from(clubsFound).sort(),
        zonesFound: Array.from(zonesFound).sort(),
        rolesFound: Array.from(rolesFound).sort(),
        missingMobileNumbers,
        missingClubNames,
        usersWithEmail,
        duplicatePonyClubIds: Array.from(duplicatePonyClubIds).sort(),
        // Add mapping statistics
        mappedClubs: Array.from(mappedClubs).sort(),
        mappedZones: Array.from(mappedZones).sort(),
        successfulClubMappings,
        successfulZoneMappings,
        totalClubsWithMappings: clubsFound.size,
        totalZonesWithMappings: zonesFound.size
      },
      sampleData,
      validRowsData,
      errors: validationErrors.map(e => ({
        row: e.row,
        error: e.error,
        data: e.data
      })),
      parseErrors: parseResult.errors
    };
    
    console.log(`[ImportPreview] Preview generated: ${validRows.length} valid rows, ${validationErrors.length} errors`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[ImportPreview] Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during preview',
        details: [
          error instanceof Error ? error.message : 'Unknown error',
          'Please check the server logs for more details'
        ]
      },
      { status: 500 }
    );
  }
}
