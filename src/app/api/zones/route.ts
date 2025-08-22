import { NextResponse } from 'next/server';
import { getAllZones } from '@/lib/server-data';

export async function GET() {
  try {
    const zones = await getAllZones();
    return NextResponse.json({ zones });
  } catch (error: any) {
    console.error('Error fetching zones:', error);
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ Zones API: Database connection timeout or unavailable');
      return NextResponse.json(
        { 
          error: 'Database connection timeout', 
          message: 'Unable to connect to the database. Please check your network connection and try again.',
          zones: [] 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch zones', zones: [] },
      { status: 500 }
    );
  }
}
