import { NextRequest, NextResponse } from 'next/server';
import { UserImportDebugger } from '@/lib/user-import-debugger';

export async function GET() {
  try {
    console.log('Running historical membership detection test...');
    
    const testResult = UserImportDebugger.testHistoricalMembershipDetection();
    
    // Test specific status values that might be in your spreadsheets
    const testStatuses = [
      'Historical Membership',
      'historical membership',
      'Historical',
      'historical',
      'Active Membership',
      'Inactive Membership',
      'Standard',
      'Member'
    ];
    
    UserImportDebugger.testMembershipStatusValues(testStatuses);
    
    return NextResponse.json({
      success: true,
      message: 'Debug test completed - check server console for detailed output',
      summary: {
        parseSuccess: testResult.parseResult.success,
        validRows: testResult.validRows.length,
        validationErrors: testResult.validationErrors.length,
        historicalMembershipsDetected: testResult.historicalCount
      },
      testData: {
        validRows: testResult.validRows.map(row => ({
          ponyClubId: row.ponyClubId,
          membershipStatus: row.membershipStatus,
          role: row.role,
          isHistorical: row.membershipStatus && row.membershipStatus.toLowerCase().includes('historical')
        }))
      }
    });
    
  } catch (error) {
    console.error('Debug test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Debug test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}