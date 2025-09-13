/**
 * Debug utility for testing historical membership detection in user imports
 */

import { SpreadsheetParser } from './spreadsheet-parser';
import { validateUserImportRows } from './user-validation';

export class UserImportDebugger {
  
  /**
   * Test historical membership detection with sample data
   */
  static testHistoricalMembershipDetection() {
    console.log('=== TESTING HISTORICAL MEMBERSHIP DETECTION ===');
    
    // Sample CSV data with historical membership
    const testData = [
      // Headers
      ['Pony Club ID', 'Mobile Number', 'Club Name', 'Zone Name', 'Membership Status', 'Role'],
      // Normal user
      ['PC123456', '0412345678', 'Test Club', 'Test Zone', 'Active Membership', 'standard'],
      // Historical membership user - different variations
      ['PC789012', '0423456789', 'Test Club 2', 'Test Zone', 'Historical Membership', 'standard'],
      ['PC345678', '0434567890', 'Test Club 3', 'Test Zone', 'historical', 'standard'],
      ['PC901234', '0445678901', 'Test Club 4', 'Test Zone', 'Historical', 'standard'],
      ['PC567890', '0456789012', 'Test Club 5', 'Test Zone', 'Inactive Membership', 'standard'],
    ];
    
    // Test parsing
    console.log('\n1. Testing CSV parsing with sample data...');
    const mockCsvContent = testData.map(row => row.join(',')).join('\n');
    const parseResult = SpreadsheetParser.parseCSV(mockCsvContent);
    
    console.log(`Parse success: ${parseResult.success}`);
    console.log(`Data rows: ${parseResult.data.length}`);
    console.log(`Parse errors: ${parseResult.errors.length}`);
    
    if (parseResult.errors.length > 0) {
      console.log('Parse errors:', parseResult.errors);
    }
    
    // Test validation
    console.log('\n2. Testing validation...');
    const { validRows, errors: validationErrors } = validateUserImportRows(parseResult.data);
    
    console.log(`Valid rows: ${validRows.length}`);
    console.log(`Validation errors: ${validationErrors.length}`);
    
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
    }
    
    // Check each valid row for membership status
    console.log('\n3. Checking membership status detection...');
    validRows.forEach((row, index) => {
      const isHistorical = row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical');
      console.log(`Row ${index + 1}: ${row.ponyClubId}`);
      console.log(`  Raw membershipStatus: "${row.membershipStatus}"`);
      console.log(`  Is historical: ${isHistorical}`);
      console.log(`  Role: "${row.role}"`);
      console.log('');
    });
    
    // Count historical memberships
    const historicalCount = validRows.filter(row => 
      row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical')
    ).length;
    
    console.log(`Total historical memberships detected: ${historicalCount}`);
    console.log('=== END TEST ===');
    
    return {
      parseResult,
      validRows,
      validationErrors,
      historicalCount
    };
  }
  
  /**
   * Test specific membership status values
   */
  static testMembershipStatusValues(statusValues: string[]) {
    console.log('\n=== TESTING MEMBERSHIP STATUS VALUES ===');
    
    statusValues.forEach(status => {
      const isHistorical = status.toLowerCase().includes('historical');
      console.log(`"${status}" -> Historical: ${isHistorical}`);
    });
    
    console.log('=== END TEST ===');
  }
  
  /**
   * Analyze a parsed CSV to understand column mapping
   */
  static analyzeColumnMapping(data: any[]) {
    console.log('\n=== COLUMN MAPPING ANALYSIS ===');
    
    if (data.length === 0) {
      console.log('No data to analyze');
      return;
    }
    
    const firstRow = data[0];
    console.log('First row keys:', Object.keys(firstRow));
    
    // Check for membership-related fields
    const membershipFields = Object.keys(firstRow).filter(key => 
      key.toLowerCase().includes('membership') || 
      key.toLowerCase().includes('status')
    );
    
    console.log('Membership-related fields found:', membershipFields);
    
    // Show first few rows with membership status
    console.log('\nFirst 3 rows with membership status:');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      membershipFields.forEach(field => {
        console.log(`  ${field}: "${row[field]}"`);
      });
    });
    
    console.log('=== END ANALYSIS ===');
  }
}