import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CommitteeNominationFormData } from '@/types/committee-nomination';

/**
 * PUT /api/committee-nominations/[id]
 * 
 * Update an existing committee nomination
 * Only allowed if status is 'pending_dc_approval' or 'rejected'
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData: CommitteeNominationFormData = await request.json();

    // Get the existing nomination
    const nominationRef = adminDb.collection('committee_nominations').doc(id);
    const nominationDoc = await nominationRef.get();

    if (!nominationDoc.exists) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    const existingNomination = nominationDoc.data();

    // Only allow updates to pending or rejected nominations
    if (existingNomination?.status !== 'pending_dc_approval' && existingNomination?.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Can only update pending or rejected nominations' },
        { status: 400 }
      );
    }

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

    // Build zone representative (same logic as create)
    let zoneRepresentative;
    if (formData.zoneRepOption === 'other' && formData.zoneRepOther && formData.zoneRepOther.name) {
      zoneRepresentative = {
        isCommitteeMember: false,
        name: formData.zoneRepOther.name,
        ponyClubId: formData.zoneRepOther.ponyClubId,
        mobile: formData.zoneRepOther.mobile,
        email: formData.zoneRepOther.email,
      };
    }

    // Update the nomination
    await nominationRef.update({
      agmDate: formData.agmDate,
      effectiveDate: formData.effectiveDate,
      
      districtCommissioner: {
        ...formData.districtCommissioner,
        approvalStatus: 'pending', // Reset approval status
      },
      
      president: formData.president,
      vicePresident: formData.vicePresident,
      secretary: formData.secretary,
      treasurer: formData.treasurer,
      
      additionalCommittee: formData.additionalCommittee,
      
      zoneRepresentative: zoneRepresentative || existingNomination.zoneRepresentative,
      
      additionalNotes: formData.additionalNotes,
      
      status: 'pending_dc_approval', // Reset to pending
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      nominationId: id,
      message: 'Committee nomination updated successfully',
    });

  } catch (error) {
    console.error('Error updating committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to update committee nomination' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/committee-nominations/[id]
 * 
 * Get a specific committee nomination by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const nominationDoc = await adminDb.collection('committee_nominations').doc(id).get();

    if (!nominationDoc.exists) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    const nomination = {
      id: nominationDoc.id,
      ...nominationDoc.data(),
    };

    return NextResponse.json(nomination);

  } catch (error) {
    console.error('Error fetching committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nomination' },
      { status: 500 }
    );
  }
}
