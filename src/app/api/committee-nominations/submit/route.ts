import { NextRequest, NextResponse } from 'next/server';
import { createCommitteeNomination, getCommitteeNomination } from '@/lib/committee-nominations';
import { CommitteeNominationFormData } from '@/types/committee-nomination';
import { sendCommitteeNominationSubmittedEmail } from '@/lib/committee-nomination-emails';

/**
 * POST /api/committee-nominations/submit
 * 
 * Submit a new committee nomination after club AGM
 * Creates nomination record and sends notifications to zone rep
 */
export async function POST(request: NextRequest) {
  try {
    const formData: CommitteeNominationFormData = await request.json();

    // Validate required fields
    if (!formData.clubId || !formData.clubName) {
      return NextResponse.json(
        { error: 'Club ID and name are required' },
        { status: 400 }
      );
    }

    if (!formData.agmDate) {
      return NextResponse.json(
        { error: 'AGM date is required' },
        { status: 400 }
      );
    }

    // All committee positions are now optional
    // Zone Representative is optional (can select from dropdown or enter manually)

    // Create the nomination
    const nominationId = await createCommitteeNomination(formData);

    // Fetch the created nomination to get zone rep details
    const nomination = await getCommitteeNomination(nominationId);
    
    if (nomination) {
      // Send email notification to zone rep
      try {
        await sendCommitteeNominationSubmittedEmail(nomination);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      nominationId,
      message: 'Committee nomination submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to submit committee nomination' },
      { status: 500 }
    );
  }
}
