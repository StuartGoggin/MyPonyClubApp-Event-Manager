/**
 * Equipment Automations API
 * GET /api/equipment-automations?zoneId={zoneId} - Get automation settings and history
 * POST /api/equipment-automations - Update automation settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireZoneManager } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';

const AUTOMATIONS_COLLECTION = 'equipment_automation_settings';
const BOOKINGS_COLLECTION = 'equipment_bookings';

/**
 * GET /api/equipment-automations
 * Get automation settings and history for a zone
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: 'Zone ID is required' },
        { status: 400 }
      );
    }

    // Get automation settings for zone
    const settingsDoc = await adminDb
      .collection(AUTOMATIONS_COLLECTION)
      .doc(zoneId)
      .get();

    const settings = settingsDoc.exists ? settingsDoc.data() : {};
    
    const autoApproval = {
      enabled: settings?.autoApproval?.enabled || false
    };
    
    const autoEmail = {
      enabled: settings?.autoEmail?.enabled || false
    };

    // Get auto-approved bookings for this zone
    const autoApprovedSnapshot = await adminDb
      .collection(BOOKINGS_COLLECTION)
      .where('zoneId', '==', zoneId)
      .where('autoApproved', '==', true)
      .orderBy('approvedAt', 'desc')
      .limit(100)
      .get();

    const autoApprovedBookings = autoApprovedSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      autoApproval,
      autoEmail,
      autoApprovedBookings
    });
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch automation settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment-automations
 * Update automation settings for a zone
 */
export async function POST(request: NextRequest) {
  try {
    const { zoneId, type, enabled } = await request.json();

    if (!zoneId || !type || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Zone ID, type, and enabled status are required' },
        { status: 400 }
      );
    }

    // Validate automation type
    if (!['autoApproval', 'autoEmail'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid automation type' },
        { status: 400 }
      );
    }

    // Verify user has access to this zone
    const authResult = await requireZoneManager(request, zoneId);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Update automation settings
    const settingsRef = adminDb.collection(AUTOMATIONS_COLLECTION).doc(zoneId);
    
    await settingsRef.set(
      {
        [type]: {
          enabled,
          updatedAt: new Date().toISOString(),
          updatedBy: user.email || 'system'
        }
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: `${type} ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error updating automation settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update automation settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
