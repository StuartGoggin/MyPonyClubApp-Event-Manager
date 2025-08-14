import { NextResponse } from 'next/server';
import { getAllClubs, updateClub, createClub } from '@/lib/server-data';
import type { Club } from '@/lib/types';

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
