import { NextRequest, NextResponse } from 'next/server';
import { getPendingDCApprovals } from '@/lib/committee-nominations';

/**
 * GET /api/committee-nominations/pending
 * 
 * Get all pending DC approvals for a specific zone
 * Used by zone representatives to view nominations needing approval
 * 
 * Query params:
 * - zoneRepId: ID of the zone representative
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zoneRepId = searchParams.get('zoneRepId');

    console.log('Pending nominations API called with zoneRepId:', zoneRepId);

    if (!zoneRepId) {
      return NextResponse.json(
        { error: 'Zone representative ID is required' },
        { status: 400 }
      );
    }

    const pendingNominations = await getPendingDCApprovals(zoneRepId);

    console.log(`Returning ${pendingNominations.length} pending nominations`);

    return NextResponse.json(pendingNominations);

  } catch (error) {
    console.error('Error fetching pending nominations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending nominations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
