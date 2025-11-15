import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';
import { invalidateClubsCache } from '@/lib/server-data';

// GET: Get a single club by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const clubId = params.id;
    const clubDoc = await adminDb.collection('clubs').doc(clubId).get();

    if (!clubDoc.exists) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    const clubData = clubDoc.data();
    return NextResponse.json({ id: clubDoc.id, ...clubData });
  } catch (error) {
    console.error('Error fetching club:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club' },
      { status: 500 }
    );
  }
}

// PATCH: Update a club
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const clubId = params.id;
    const body = await request.json();

    // Validate club exists
    const clubDoc = await adminDb.collection('clubs').doc(clubId).get();
    if (!clubDoc.exists) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date()
    };

    // Add fields if they are provided in the request
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.physicalAddress !== undefined) updateData.physicalAddress = body.physicalAddress;
    if (body.postalAddress !== undefined) updateData.postalAddress = body.postalAddress;
    if (body.socialMediaUrl !== undefined) updateData.socialMediaUrl = body.socialMediaUrl;
    
    // Update both image and logoUrl fields for compatibility
    if (body.image !== undefined) {
      updateData.image = body.image;
      updateData.logoUrl = body.image; // Also update logoUrl for calendar compatibility
    }

    // Update the club
    await adminDb.collection('clubs').doc(clubId).update(updateData);

    // Invalidate cache
    invalidateClubsCache();

    // Fetch updated club data
    const updatedClubDoc = await adminDb.collection('clubs').doc(clubId).get();
    const updatedClubData = updatedClubDoc.data();

    return NextResponse.json({
      success: true,
      club: { id: updatedClubDoc.id, ...updatedClubData }
    });
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { error: 'Failed to update club' },
      { status: 500 }
    );
  }
}
