import * as XLSX from 'xlsx';
import { UserImportRow } from './types';

export interface SpreadsheetParseResult {
  success: boolean;
  data: UserImportRow[];
  errors: string[];
  totalRows: number;
}

export class SpreadsheetParser {
  
  /**
   * Expected column headers (case-insensitive)
   */
  private static readonly EXPECTED_HEADERS = {
    ponyClubId: ['pony club id', 'ponyclubid', 'pc id', 'id', 'pcid', 'pony_club_id', 'mid'],
    mobileNumber: ['mobile number', 'mobile', 'phone', 'cell phone', 'cellular', 'mobile_number', 'phone_number', 'contact', 'contact number'],
    clubName: ['club name', 'club', 'pony club', 'club_name', 'pony_club', 'club name', 'ponyclub'],
    zoneName: ['zone name', 'zone', 'zone_name', 'region', 'area'],
    role: ['role', 'user role', 'access level', 'permission', 'user_role', 'access_level', 'level'],
    membershipStatus: ['membership', 'membership status', 'membership_status', 'member status', 'status', 'membership type'],
    firstName: ['first name', 'firstname', 'given name', 'first_name', 'fname', 'forename'],
    lastName: ['last name', 'lastname', 'surname', 'family name', 'last_name', 'lname', 'family_name'],
    email: ['email address', 'primary email', 'user email', 'member email', 'personal email', 'email', 'e-mail', 'email_address', 'e_mail', 'mail']
  };
  
  /**
   * Parse Excel/CSV file buffer into user import data
   */
  static parseFile(fileBuffer: Buffer, filename: string): SpreadsheetParseResult {
    const errors: string[] = [];
    
    try {
      console.log(`[SpreadsheetParser] Starting to parse file: ${filename}, size: ${fileBuffer.length} bytes`);
      
      // Validate file extension
      const fileValidation = this.validateFileType(filename);
      if (!fileValidation.valid) {
        return {
          success: false,
          data: [],
          errors: [fileValidation.error || 'Invalid file type'],
          totalRows: 0
        };
      }
      
      // Read workbook from buffer with enhanced options
      console.log(`[SpreadsheetParser] Reading workbook for ${filename}`);
      const workbook = XLSX.read(fileBuffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      console.log(`[SpreadsheetParser] Workbook read successfully. Sheet names: [${workbook.SheetNames.join(', ')}]`);
      
      // Get first worksheet
      const worksheetName = workbook.SheetNames[0];
      if (!worksheetName) {
        return {
          success: false,
          data: [],
          errors: ['No worksheets found in file. Please ensure the file contains at least one worksheet.'],
          totalRows: 0
        };
      }
      
      console.log(`[SpreadsheetParser] Using worksheet: ${worksheetName}`);
      const worksheet = workbook.Sheets[worksheetName];
      
      if (!worksheet) {
        return {
          success: false,
          data: [],
          errors: [`Worksheet "${worksheetName}" could not be read. The file may be corrupted.`],
          totalRows: 0
        };
      }
      
      // Get worksheet range for debugging
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      console.log(`[SpreadsheetParser] Worksheet range: ${worksheet['!ref']}, rows: ${range.e.r + 1}, cols: ${range.e.c + 1}`);
      
      // Convert to JSON array
      console.log(`[SpreadsheetParser] Converting worksheet to JSON array`);
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false,
        raw: false // This ensures we get string values, not Excel serial dates
      }) as string[][];
      
      console.log(`[SpreadsheetParser] Raw data extracted: ${rawData.length} rows`);
      
      if (rawData.length === 0) {
        return {
          success: false,
          data: [],
          errors: ['File appears to be empty. Please check that the file contains data.'],
          totalRows: 0
        };
      }
      
      // Log first few rows for debugging
      console.log(`[SpreadsheetParser] First 3 rows:`, rawData.slice(0, 3));
      
      // Parse headers and data
      console.log(`[SpreadsheetParser] Starting to parse row data`);
      const parseResult = this.parseRowData(rawData);
      console.log(`[SpreadsheetParser] Parse completed. Valid rows: ${parseResult.data.length}, Errors: ${parseResult.errors.length}`);
      
      // Consider successful if we have valid data, even if some rows were filtered out
      const hasValidData = parseResult.data.length > 0;
      const hasOnlyFilteringErrors = parseResult.errors.every(error => 
        error.includes('blank membership') || error.includes('Historical Membership')
      );
      
      return {
        success: hasValidData || hasOnlyFilteringErrors || parseResult.errors.length === 0,
        data: parseResult.data,
        errors: parseResult.errors,
        totalRows: rawData.length - 1 // Exclude header row
      };
      
    } catch (error) {
      console.error(`[SpreadsheetParser] Error parsing file ${filename}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: [],
        errors: [
          `Failed to parse file "${filename}": ${errorMessage}`,
          'This may be due to:',
          '• Unsupported file format (only .xlsx, .xls, .csv are supported)',
          '• Corrupted or password-protected file',
          '• File contains no readable data',
          '• File structure is incompatible with the expected format',
          `Technical details: ${errorMessage}`
        ],
        totalRows: 0
      };
    }
  }
  
  /**
   * Parse CSV string into user import data
   */
  static parseCSV(csvContent: string): SpreadsheetParseResult {
    try {
      console.log(`[SpreadsheetParser] parseCSV: Content length: ${csvContent.length} characters`);
      
      // Convert CSV to workbook
      const workbook = XLSX.read(csvContent, { 
        type: 'string',
        raw: false // Ensure string values
      });
      
      console.log(`[SpreadsheetParser] CSV workbook created, sheets: [${workbook.SheetNames.join(', ')}]`);
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      if (!worksheet) {
        return {
          success: false,
          data: [],
          errors: ['Could not read CSV data. Please check the file format.'],
          totalRows: 0
        };
      }
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false,
        raw: false
      }) as string[][];
      
      console.log(`[SpreadsheetParser] CSV raw data: ${rawData.length} rows`);
      console.log(`[SpreadsheetParser] CSV first 3 rows:`, rawData.slice(0, 3));
      
      const parseResult = this.parseRowData(rawData);
      
      // Consider successful if we have valid data, even if some rows were filtered out
      const hasValidData = parseResult.data.length > 0;
      const hasOnlyFilteringErrors = parseResult.errors.every(error => 
        error.includes('blank membership') || error.includes('Historical Membership')
      );
      
      return {
        success: hasValidData || hasOnlyFilteringErrors || parseResult.errors.length === 0,
        data: parseResult.data,
        errors: parseResult.errors,
        totalRows: rawData.length - 1
      };
      
    } catch (error) {
      console.error(`[SpreadsheetParser] Error parsing CSV:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        data: [],
        errors: [
          `Failed to parse CSV: ${errorMessage}`,
          'This may be due to:',
          '• Invalid CSV format or encoding',
          '• Special characters that need escaping',
          '• Inconsistent row structure',
          `Technical details: ${errorMessage}`
        ],
        totalRows: 0
      };
    }
  }
  
  /**
   * Parse raw row data with header mapping
   */
  private static parseRowData(rawData: string[][]): { data: UserImportRow[]; errors: string[] } {
    const errors: string[] = [];
    const data: UserImportRow[] = [];
    
    console.log(`[SpreadsheetParser] parseRowData: Processing ${rawData.length} total rows`);
    
    if (rawData.length < 2) {
      errors.push('File must contain at least a header row and one data row. Current file has ' + rawData.length + ' rows.');
      return { data, errors };
    }
    
    // Parse headers
    const headers = rawData[0].map(h => (h || '').toString().toLowerCase().trim());
    console.log(`[SpreadsheetParser] Headers found:`, headers);
    
    const columnMapping = this.mapHeaders(headers);
    console.log(`[SpreadsheetParser] Column mapping:`, columnMapping);
    
    // Check for missing required columns
    const missingColumns = this.validateRequiredColumns(columnMapping);
    if (missingColumns.length > 0) {
      errors.push(
        `Missing required columns: ${missingColumns.join(', ')}.`,
        `Expected columns (case-insensitive): ${Object.keys(this.EXPECTED_HEADERS).join(', ')}.`,
        `Found headers: ${headers.join(', ')}.`,
        'Please ensure your spreadsheet has the correct column headers.'
      );
      return { data, errors };
    }
    
    console.log(`[SpreadsheetParser] Processing ${rawData.length - 1} data rows`);
    
    // Parse data rows
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      console.log(`[SpreadsheetParser] Processing row ${i + 1}:`, row);
      
      // Skip empty rows
      if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
        console.log(`[SpreadsheetParser] Skipping empty row ${i + 1}`);
        continue;
      }
      
      try {
        const userRow = this.parseDataRow(row, columnMapping, i + 1);
        data.push(userRow);
        console.log(`[SpreadsheetParser] Successfully parsed row ${i + 1}:`, userRow);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Parse error';
        console.log(`[SpreadsheetParser] Skipping row ${i + 1} due to validation error:`, errorMessage);
        
        // Log the specific type of error for filtering
        if (errorMessage.includes('blank membership') || errorMessage.includes('Historical Membership')) {
          console.log(`[SpreadsheetParser] Row ${i + 1} filtered out due to membership type: ${errorMessage}`);
        }
        
        errors.push(`Row ${i + 1}: ${errorMessage}. Row data: [${row.join(', ')}]`);
      }
    }
    
    console.log(`[SpreadsheetParser] parseRowData completed: ${data.length} valid rows, ${errors.length} errors`);
    return { data, errors };
  }
  
  /**
   * Map spreadsheet headers to expected field names
   */
  private static mapHeaders(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    console.log(`[SpreadsheetParser] mapHeaders: Input headers:`, headers);
    
    for (const [fieldName, variants] of Object.entries(this.EXPECTED_HEADERS)) {
      console.log(`[SpreadsheetParser] Looking for field "${fieldName}" with variants:`, variants);
      
      const columnIndex = headers.findIndex(header => {
        const headerLower = header.toLowerCase();
        
        // For email field, explicitly exclude emergency email columns
        if (fieldName === 'email' && (
          headerLower.includes('emergency') || 
          headerLower.includes('emergency email') ||
          headerLower.includes('emergency_email') ||
          headerLower.includes('emerg email') ||
          headerLower.includes('emerg_email') ||
          headerLower.includes('emergency contact') ||
          headerLower.includes('emergency_contact') ||
          headerLower.includes('next of kin') ||
          headerLower.includes('nok email') ||
          headerLower.includes('nok_email') ||
          headerLower.includes('contact email') ||
          headerLower.includes('contact_email') ||
          headerLower.includes('parent email') ||
          headerLower.includes('parent_email') ||
          headerLower.includes('guardian email') ||
          headerLower.includes('guardian_email')
        )) {
          console.log(`[SpreadsheetParser] Excluding emergency/contact email column: "${header}"`);
          return false;
        }
        
        const found = variants.some(variant => {
          const matches = headerLower.includes(variant.toLowerCase());
          if (matches) {
            console.log(`[SpreadsheetParser] Found match: "${header}" matches variant "${variant}"`);
          }
          return matches;
        });
        return found;
      });
      
      if (columnIndex !== -1) {
        mapping[fieldName] = columnIndex;
        console.log(`[SpreadsheetParser] Mapped "${fieldName}" to column ${columnIndex} ("${headers[columnIndex]}")`);
      } else {
        console.log(`[SpreadsheetParser] No match found for field "${fieldName}"`);
      }
    }
    
    return mapping;
  }
  
  /**
   * Validate that all required columns are present
   */
  private static validateRequiredColumns(columnMapping: Record<string, number>): string[] {
    const requiredFields = ['ponyClubId']; // Only ponyClubId is truly required - role will be validated for content
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!(field in columnMapping)) {
        missingFields.push(field);
      }
    }
    
    return missingFields;
  }
  
  /**
   * Parse a single data row into UserImportRow
   */
  private static parseDataRow(
    row: string[], 
    columnMapping: Record<string, number>, 
    rowNumber: number
  ): UserImportRow {
    
    const getValue = (field: string): string => {
      const columnIndex = columnMapping[field];
      if (columnIndex === undefined) return '';
      
      const value = row[columnIndex];
      if (value === null || value === undefined) return '';
      
      // Clean the value - trim whitespace and handle various empty representations
      const cleaned = value.toString().trim();
      if (cleaned === '' || cleaned.toLowerCase() === 'null' || cleaned === 'undefined' || cleaned === 'n/a') {
        return '';
      }
      
      return cleaned;
    };
    
    // Check for required fields (minimum required for a valid user)
    const requiredFields = ['ponyClubId']; // Only ponyClubId is truly required
    for (const field of requiredFields) {
      const value = getValue(field);
      if (!value) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Additional validation for data quality (warnings, not errors)
    const mobileNumber = getValue('mobileNumber');
    const clubName = getValue('clubName');
    const zoneName = getValue('zoneName');
    
    if (!mobileNumber) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: No mobile number provided`);
    }
    if (!clubName) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: No club name provided`);
    }
    if (!zoneName) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: No zone name provided, will use default`);
    }
    
    // Handle role - make it optional, skip if not present
    let role: string | undefined = getValue('role');
    
    // If role column doesn't exist, that's fine - we'll skip role data
    if (columnMapping['role'] === undefined) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: No role column found, skipping role import`);
      role = undefined;
    } else if (!role || role.trim() === '') {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: Empty role, skipping role import`);
      role = undefined;
    } else {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: Role found: '${role}'`);
    }

    // Handle membership status - check for historical membership
    let membershipStatus: string | undefined = getValue('membershipStatus');
    
    console.log(`[SpreadsheetParser] Row ${rowNumber}: Initial role: '${role}', membershipStatus: '${membershipStatus}'`);
    
    // If no dedicated membership column, check if role contains membership info
    if (columnMapping['membershipStatus'] === undefined && role) {
      // Check if role field actually contains membership status
      if (role.toLowerCase().includes('membership') || role.toLowerCase().includes('historical')) {
        membershipStatus = role;
        role = undefined; // Clear role since it's actually membership status
        console.log(`[SpreadsheetParser] Row ${rowNumber}: Detected membership status in role column: '${membershipStatus}'`);
      }
    } else if (membershipStatus) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: Membership status found: '${membershipStatus}'`);
    }

    console.log(`[SpreadsheetParser] Row ${rowNumber}: Final values - role: '${role}', membershipStatus: '${membershipStatus}'`);
    console.log(`[SpreadsheetParser] Row ${rowNumber}: Column mapping for membershipStatus: ${columnMapping['membershipStatus']}`);

    // Check for historical membership - these will be processed for account deactivation
    if (membershipStatus && (
      membershipStatus.toLowerCase().includes('historical') ||
      membershipStatus.toLowerCase().includes('inactive') ||
      membershipStatus.toLowerCase().includes('former') ||
      membershipStatus.toLowerCase().includes('expired') ||
      membershipStatus.toLowerCase().includes('lapsed') ||
      membershipStatus.toLowerCase() === 'nil' ||
      membershipStatus.toLowerCase() === 'none'
    )) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: Historical/inactive membership detected - will process for account deactivation`);
    } else if (membershipStatus) {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: Active membership detected: '${membershipStatus}'`);
    } else {
      console.log(`[SpreadsheetParser] Row ${rowNumber}: No membership status found`);
    }
    
    // Ensure at least one of firstName/lastName is provided if either is present
    const firstName = getValue('firstName');
    const lastName = getValue('lastName');
    
    return {
      ponyClubId: getValue('ponyClubId'),
      mobileNumber: getValue('mobileNumber'),
      clubName: getValue('clubName'),
      zoneName: getValue('zoneName'),
      role: role,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: getValue('email') || undefined,
      membershipStatus: membershipStatus
    };
  }
  
  /**
   * Generate a sample CSV template for user import
   */
  static generateTemplate(): string {
    const headers = [
      'Pony Club ID',
      'Mobile Number',
      'Club Name',
      'Zone Name',
      'Role',
      'First Name',
      'Last Name',
      'Email Address'
    ];
    
    const sampleData = [
      [
        'PC123456',
        '+61412345678',
        'Melbourne Pony Club',
        'Victoria',
        'Standard',
        'John',
        'Smith',
        'john.smith@example.com'
      ],
      [
        'PC789012',
        '0423456789',
        'Geelong Pony Club',
        'Victoria',
        'Zone Rep',
        'Jane',
        'Doe',
        'jane.doe@example.com'
      ],
      [
        'PC345678',
        '+61434567890',
        'ballarat pony club',
        'victoria',
        'super user',
        'bob',
        'johnson',
        'bob.johnson@example.com'
      ]
    ];
    
    // Create CSV content
    const csvLines = [headers.join(',')];
    sampleData.forEach(row => {
      // Properly escape CSV values with commas
      const escapedRow = row.map(value => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(escapedRow.join(','));
    });
    
    return csvLines.join('\n');
  }
  
  /**
   * Validate file type
   */
  static validateFileType(filename: string): { valid: boolean; error?: string } {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Supported formats: ${validExtensions.join(', ')}`
      };
    }
    
    return { valid: true };
  }
}
