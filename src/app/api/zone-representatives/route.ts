import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/zone-representatives
 * 
 * Get all zone representatives
 * Returns list of zone reps with their ID, name, and zone
 */
export async function GET() {
  try {
    const usersSnapshot = await adminDb
      .collection('users')
      .where('role', '==', 'zoneRep')
      .get();

    const zoneReps = usersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        zone: data.zone || '',
        email: data.email || '',
      };
    });

    // Sort by zone, then name
    zoneReps.sort((a: any, b: any) => {
      const zoneCompare = a.zone.localeCompare(b.zone);
      if (zoneCompare !== 0) return zoneCompare;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(zoneReps);

  } catch (error) {
    console.error('Error fetching zone representatives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zone representatives' },
      { status: 500 }
    );
  }
}
