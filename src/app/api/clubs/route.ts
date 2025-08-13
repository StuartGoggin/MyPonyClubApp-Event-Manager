import { NextResponse } from 'next/server';
import { getAllClubs } from '@/lib/server-data';

export async function GET() {
  try {
    const clubs = await getAllClubs();
    return NextResponse.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clubs' },
      { status: 500 }
    );
  }
}
