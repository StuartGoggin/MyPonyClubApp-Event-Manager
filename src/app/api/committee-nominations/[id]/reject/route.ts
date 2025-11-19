import { NextRequest, NextResponse } from 'next/server';
import { rejectDC, getCommitteeNomination } from '@/lib/committee-nominations';
import { sendDCRejectedEmail } from '@/lib/committee-nomination-emails';

/**
 * POST /api/committee-nominations/[id]/reject
 * 
 * Reject the District Commissioner for a committee nomination
 * Only zone representatives can reject nominations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nominationId = params.id;
    const body = await request.json();
    const { zoneRepName, reason } = body;

    // Validate required fields
    if (!zoneRepName) {
      return NextResponse.json(
        { error: 'Zone representative name is required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Reject the DC
    await rejectDC(
      nominationId,
      zoneRepName,
      reason
    );

    // Fetch the updated nomination
    const nomination = await getCommitteeNomination(nominationId);
    
    if (nomination) {
      // Send rejection email notification
      try {
        await sendDCRejectedEmail(nomination);
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'District Commissioner nomination rejected',
    });

  } catch (error) {
    console.error('Error rejecting committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to reject committee nomination' },
      { status: 500 }
    );
  }
}
