import { NextResponse } from 'next/server';
import { getAllClubs } from '@/lib/server-data';

export async function GET() {
  try {
    const clubs = await getAllClubs();
    return NextResponse.json(clubs);
  } catch (error: any) {
    console.error('Error fetching clubs:', error);
    
    // Check if it's a database connection error
    if (error.code === 14 || error.message?.includes('ETIMEDOUT') || error.message?.includes('UNAVAILABLE')) {
      console.warn('⚠️ Clubs API: Database connection timeout or unavailable');
      return NextResponse.json(
        { 
          error: 'Database connection timeout', 
          message: 'Unable to connect to the database. Please check your network connection and try again.',
          clubs: [] 
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch clubs', clubs: [] },
      { status: 500 }
    );
  }
}
