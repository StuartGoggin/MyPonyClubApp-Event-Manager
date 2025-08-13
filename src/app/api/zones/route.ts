import { NextResponse } from 'next/server';
import { getAllZones } from '@/lib/server-data';

export async function GET() {
  try {
    const zones = await getAllZones();
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch zones' },
      { status: 500 }
    );
  }
}
