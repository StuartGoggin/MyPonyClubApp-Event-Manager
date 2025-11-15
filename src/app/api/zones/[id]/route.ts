import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';
import { invalidateZonesCache } from '@/lib/server-data';

// GET: Get a single zone by ID
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

    const zoneId = params.id;
    const zoneDoc = await adminDb.collection('zones').doc(zoneId).get();

    if (!zoneDoc.exists) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    const zoneData = zoneDoc.data();
    return NextResponse.json({ id: zoneDoc.id, ...zoneData });
  } catch (error) {
    console.error('Error fetching zone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone' },
      { status: 500 }
    );
  }
}

// PATCH: Update a zone
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

    const zoneId = params.id;
    const body = await request.json();

    // Validate zone exists
    const zoneDoc = await adminDb.collection('zones').doc(zoneId).get();
    if (!zoneDoc.exists) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      );
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updatedAt: new Date()
    };

    // Add fields if they are provided in the request
    if (body.name !== undefined) updateData.name = body.name;
    if (body.streetAddress !== undefined) updateData.streetAddress = body.streetAddress;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.secretary !== undefined) updateData.secretary = body.secretary;

    // Update the zone
    await adminDb.collection('zones').doc(zoneId).update(updateData);

    // Invalidate cache
    invalidateZonesCache();

    // Fetch updated zone data
    const updatedZoneDoc = await adminDb.collection('zones').doc(zoneId).get();
    const updatedZoneData = updatedZoneDoc.data();

    return NextResponse.json({
      success: true,
      zone: { id: updatedZoneDoc.id, ...updatedZoneData }
    });
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Failed to update zone' },
      { status: 500 }
    );
  }
}
