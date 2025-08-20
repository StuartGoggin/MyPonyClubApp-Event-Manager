import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface UpdateLocationRequest {
  clubId: string;
  latitude: number;
  longitude: number;
  address: string;
}

export async function POST(request: NextRequest) {
  try {
    const { clubId, latitude, longitude, address }: UpdateLocationRequest = await request.json();

    // Validate inputs
    if (!clubId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid club ID or coordinates' },
        { status: 400 }
      );
    }

    // Update club in Firestore
    const clubRef = adminDb.collection('clubs').doc(clubId);
    
    const updateData: any = {
      latitude,
      longitude,
      updatedAt: new Date().toISOString()
    };

    // Update physical address if provided
    if (address && address.trim()) {
      updateData.physicalAddress = address.trim();
    }

    await clubRef.update(updateData);

    console.log(`Updated location for club ${clubId}: ${latitude}, ${longitude}`);

    return NextResponse.json({
      success: true,
      clubId,
      latitude,
      longitude,
      address
    });

  } catch (error) {
    console.error('Error updating club location:', error);
    return NextResponse.json(
      { error: 'Failed to update club location' },
      { status: 500 }
    );
  }
}
