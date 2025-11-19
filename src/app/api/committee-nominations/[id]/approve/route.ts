import { NextRequest, NextResponse } from 'next/server';
import { approveDC, getCommitteeNomination } from '@/lib/committee-nominations';
import { sendDCApprovedEmail } from '@/lib/committee-nomination-emails';

/**
 * POST /api/committee-nominations/[id]/approve
 * 
 * Approve the District Commissioner for a committee nomination
 * Only zone representatives can approve nominations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nominationId = params.id;
    const body = await request.json();
    const { zoneRepId, zoneRepName, message } = body;

    // Validate required fields
    if (!zoneRepId || !zoneRepName) {
      return NextResponse.json(
        { error: 'Zone representative details are required' },
        { status: 400 }
      );
    }

    // Approve the DC
    await approveDC(
      nominationId,
      zoneRepName,
      message
    );

    // Fetch the updated nomination
    const nomination = await getCommitteeNomination(nominationId);
    
    if (nomination) {
      // Send approval email notification
      try {
        await sendDCApprovedEmail(nomination);
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'District Commissioner approved successfully',
    });

  } catch (error) {
    console.error('Error approving committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to approve committee nomination' },
      { status: 500 }
    );
  }
}
