import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';

const STATE_SETTINGS_DOC_ID = 'victoria';

// GET: Get state settings
export async function GET(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const settingsDoc = await adminDb
      .collection('state_settings')
      .doc(STATE_SETTINGS_DOC_ID)
      .get();

    if (!settingsDoc.exists) {
      // Return default settings if not found
      return NextResponse.json({
        name: 'Victoria',
        streetAddress: '',
        imageUrl: '',
        contactName: '',
        contactEmail: '',
        contactMobile: '',
        websiteUrl: ''
      });
    }

    const data = settingsDoc.data();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching state settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch state settings' },
      { status: 500 }
    );
  }
}

// POST: Update state settings
export async function POST(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Prepare update data
    const updateData: any = {
      name: body.name || 'Victoria',
      streetAddress: body.streetAddress || '',
      imageUrl: body.imageUrl || '',
      contactName: body.contactName || '',
      contactEmail: body.contactEmail || '',
      contactMobile: body.contactMobile || '',
      websiteUrl: body.websiteUrl || '',
      updatedAt: new Date()
    };

    // Create or update the settings document
    await adminDb
      .collection('state_settings')
      .doc(STATE_SETTINGS_DOC_ID)
      .set(updateData, { merge: true });

    return NextResponse.json({
      success: true,
      settings: updateData
    });
  } catch (error) {
    console.error('Error updating state settings:', error);
    return NextResponse.json(
      { error: 'Failed to update state settings' },
      { status: 500 }
    );
  }
}
