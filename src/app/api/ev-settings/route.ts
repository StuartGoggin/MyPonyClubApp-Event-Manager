import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isDatabaseConnected } from '@/lib/firebase-admin';

const EV_SETTINGS_DOC_ID = 'equestrian_victoria';

// GET: Get Equestrian Victoria settings
export async function GET(request: NextRequest) {
  try {
    if (!adminDb || !isDatabaseConnected()) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 503 }
      );
    }

    const settingsDoc = await adminDb
      .collection('ev_settings')
      .doc(EV_SETTINGS_DOC_ID)
      .get();

    if (!settingsDoc.exists) {
      // Return default settings if not found
      return NextResponse.json({
        name: 'Equestrian Victoria',
        streetAddress: '',
        imageUrl: '',
        contactName: '',
        contactEmail: '',
        contactMobile: '',
        websiteUrl: 'https://www.vic.equestrian.org.au'
      });
    }

    const data = settingsDoc.data();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching EV settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EV settings' },
      { status: 500 }
    );
  }
}

// POST: Update Equestrian Victoria settings
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
      name: body.name || 'Equestrian Victoria',
      streetAddress: body.streetAddress || '',
      imageUrl: body.imageUrl || '',
      contactName: body.contactName || '',
      contactEmail: body.contactEmail || '',
      contactMobile: body.contactMobile || '',
      websiteUrl: body.websiteUrl || 'https://www.vic.equestrian.org.au',
      updatedAt: new Date()
    };

    // Create or update the settings document
    await adminDb
      .collection('ev_settings')
      .doc(EV_SETTINGS_DOC_ID)
      .set(updateData, { merge: true });

    return NextResponse.json({
      success: true,
      settings: updateData
    });
  } catch (error) {
    console.error('Error updating EV settings:', error);
    return NextResponse.json(
      { error: 'Failed to update EV settings' },
      { status: 500 }
    );
  }
}
