import { NextResponse } from 'next/server';
import { getAllClubs, updateClub, createClub } from '@/lib/server-data';
import type { Club } from '@/lib/types';

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

export async function POST(request: Request) {
  try {
    const clubData = await request.json();
    const newClub = await createClub(clubData);
    
    if (!newClub) {
      return NextResponse.json(
        { error: 'Failed to create club' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(newClub, { status: 201 });
  } catch (error) {
    console.error('Error creating club:', error);
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...clubData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      );
    }
    
    const updatedClub = await updateClub(id, clubData);
    
    if (!updatedClub) {
      return NextResponse.json(
        { error: 'Failed to update club' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedClub);
  } catch (error) {
    console.error('Error updating club:', error);
    return NextResponse.json(
      { error: 'Failed to update club' },
      { status: 500 }
    );
  }
}
