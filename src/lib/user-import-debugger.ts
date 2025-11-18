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
    if (process.env.NODE_ENV === 'development') console.log('=== TESTING HISTORICAL MEMBERSHIP DETECTION ===');
    
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
    if (process.env.NODE_ENV === 'development') console.log('\n1. Testing CSV parsing with sample data...');
    const mockCsvContent = testData.map(row => row.join(',')).join('\n');
    const parseResult = SpreadsheetParser.parseCSV(mockCsvContent);
    
    if (process.env.NODE_ENV === 'development') console.log(`Parse success: ${parseResult.success}`);
    if (process.env.NODE_ENV === 'development') console.log(`Data rows: ${parseResult.data.length}`);
    if (process.env.NODE_ENV === 'development') console.log(`Parse errors: ${parseResult.errors.length}`);
    
    if (parseResult.errors.length > 0) {
      if (process.env.NODE_ENV === 'development') console.log('Parse errors:', parseResult.errors);
    }
    
    // Test validation
    if (process.env.NODE_ENV === 'development') console.log('\n2. Testing validation...');
    const { validRows, errors: validationErrors } = validateUserImportRows(parseResult.data);
    
    if (process.env.NODE_ENV === 'development') console.log(`Valid rows: ${validRows.length}`);
    if (process.env.NODE_ENV === 'development') console.log(`Validation errors: ${validationErrors.length}`);
    
    if (validationErrors.length > 0) {
      if (process.env.NODE_ENV === 'development') console.log('Validation errors:', validationErrors);
    }
    
    // Check each valid row for membership status
    if (process.env.NODE_ENV === 'development') console.log('\n3. Checking membership status detection...');
    validRows.forEach((row, index) => {
      const isHistorical = row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical');
      if (process.env.NODE_ENV === 'development') console.log(`Row ${index + 1}: ${row.ponyClubId}`);
      if (process.env.NODE_ENV === 'development') console.log(`  Raw membershipStatus: "${row.membershipStatus}"`);
      if (process.env.NODE_ENV === 'development') console.log(`  Is historical: ${isHistorical}`);
      if (process.env.NODE_ENV === 'development') console.log(`  Role: "${row.role}"`);
      if (process.env.NODE_ENV === 'development') console.log('');
    });
    
    // Count historical memberships
    const historicalCount = validRows.filter(row => 
      row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical')
    ).length;
    
    if (process.env.NODE_ENV === 'development') console.log(`Total historical memberships detected: ${historicalCount}`);
    if (process.env.NODE_ENV === 'development') console.log('=== END TEST ===');
    
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
    if (process.env.NODE_ENV === 'development') console.log('\n=== TESTING MEMBERSHIP STATUS VALUES ===');
    
    statusValues.forEach(status => {
      const isHistorical = status.toLowerCase().includes('historical');
      if (process.env.NODE_ENV === 'development') console.log(`"${status}" -> Historical: ${isHistorical}`);
    });
    
    if (process.env.NODE_ENV === 'development') console.log('=== END TEST ===');
  }
  
  /**
   * Analyze a parsed CSV to understand column mapping
   */
  static analyzeColumnMapping(data: any[]) {
    if (process.env.NODE_ENV === 'development') console.log('\n=== COLUMN MAPPING ANALYSIS ===');
    
    if (data.length === 0) {
      if (process.env.NODE_ENV === 'development') console.log('No data to analyze');
      return;
    }
    
    const firstRow = data[0];
    if (process.env.NODE_ENV === 'development') console.log('First row keys:', Object.keys(firstRow));
    
    // Check for membership-related fields
    const membershipFields = Object.keys(firstRow).filter(key => 
      key.toLowerCase().includes('membership') || 
      key.toLowerCase().includes('status')
    );
    
    if (process.env.NODE_ENV === 'development') console.log('Membership-related fields found:', membershipFields);
    
    // Show first few rows with membership status
    if (process.env.NODE_ENV === 'development') console.log('\nFirst 3 rows with membership status:');
    data.slice(0, 3).forEach((row, index) => {
      if (process.env.NODE_ENV === 'development') console.log(`Row ${index + 1}:`);
      membershipFields.forEach(field => {
        if (process.env.NODE_ENV === 'development') console.log(`  ${field}: "${row[field]}"`);
      });
    });
    
    if (process.env.NODE_ENV === 'development') console.log('=== END ANALYSIS ===');
  }
}
