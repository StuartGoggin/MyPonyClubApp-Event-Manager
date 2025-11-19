import { NextRequest, NextResponse } from 'next/server';
import { getClubCommitteeNominations, getCommitteeNominationByYear, getClubCommitteeYears } from '@/lib/committee-nominations';

export const dynamic = 'force-dynamic';

/**
 * GET /api/committee-nominations
 * 
 * Get committee nominations for a club (optionally filtered by year or status)
 * Returns the most recent nomination by default, or nomination for specific year
 * 
 * Query params:
 * - clubId: Club ID (required)
 * - year: Optional year filter (returns nomination for that specific year)
 * - years: If 'true', returns array of years with nominations instead of nomination data
 * - status: Optional filter by approval status ('pending', 'approved', 'rejected')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clubId = searchParams.get('clubId');
    const yearParam = searchParams.get('year');
    const getYears = searchParams.get('years') === 'true';
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      );
    }

    // If requesting list of years
    if (getYears) {
      const years = await getClubCommitteeYears(clubId);
      return NextResponse.json(years);
    }

    // If year is specified, get nomination for that year
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (isNaN(year)) {
        return NextResponse.json(
          { error: 'Invalid year parameter' },
          { status: 400 }
        );
      }

      const nomination = await getCommitteeNominationByYear(clubId, year);
      return NextResponse.json(nomination);
    }

    // Otherwise get all nominations and return most recent
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
