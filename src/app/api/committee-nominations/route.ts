import { NextRequest, NextResponse } from 'next/server';
import { getClubCommitteeNominations } from '@/lib/committee-nominations';

/**
 * GET /api/committee-nominations
 * 
 * Get committee nominations for a club (optionally filtered by status)
 * Returns the most recent nomination by default
 * 
 * Query params:
 * - clubId: Club ID (required)
 * - status: Optional filter by approval status ('pending', 'approved', 'rejected')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clubId = searchParams.get('clubId');
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      );
    }

    const nominations = await getClubCommitteeNominations(clubId);

    // If status filter is provided, filter the results
    let filteredNominations = nominations;
    if (status) {
      filteredNominations = nominations.filter(
        n => n.districtCommissioner.approvalStatus === status
      );
    }

    // Return the most recent nomination (first in array, since sorted by submittedAt desc)
    const latestNomination = filteredNominations.length > 0 ? filteredNominations[0] : null;

    return NextResponse.json(latestNomination);

  } catch (error) {
    console.error('Error fetching committee nominations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch committee nominations' },
      { status: 500 }
    );
  }
}
