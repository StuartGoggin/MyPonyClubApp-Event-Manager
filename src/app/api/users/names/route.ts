import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';

export const dynamic = 'force-dynamic';

// GET: Retrieve user names for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Get all active users
    const users = await UserService.getUsers({ isActive: true });
    
    // Create names list with associated user data
    const namesWithData = new Map<string, { clubId?: string; zoneId?: string; user: any }>();
    
    users.forEach(user => {
      // Add full name if both first and last name exist
      if (user.firstName && user.lastName) {
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        namesWithData.set(fullName, {
          clubId: user.clubId,
          zoneId: user.zoneId,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            clubId: user.clubId,
            zoneId: user.zoneId
          }
        });
      }
      
      // Add first name only if it exists
      if (user.firstName) {
        const firstName = user.firstName.trim();
        if (!namesWithData.has(firstName)) {
          namesWithData.set(firstName, {
            clubId: user.clubId,
            zoneId: user.zoneId,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              mobileNumber: user.mobileNumber,
              clubId: user.clubId,
              zoneId: user.zoneId
            }
          });
        }
      }
    });
    
    // Filter by search term and convert to array
    let namesList = Array.from(namesWithData.entries())
      .filter(([name]) => name.length > 0);
    
    if (search) {
      namesList = namesList.filter(([name]) => 
        name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort alphabetically and limit to 20 results
    namesList = namesList.sort(([a], [b]) => a.localeCompare(b)).slice(0, 20);
    
    // Convert to response format
    const results = namesList.map(([name, data]) => ({
      name,
      clubId: data.clubId,
      zoneId: data.zoneId,
      user: data.user
    }));
    
    return NextResponse.json({
      success: true,
      results: results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Get user names error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve user names',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}