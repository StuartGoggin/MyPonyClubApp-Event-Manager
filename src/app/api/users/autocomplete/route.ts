import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { UserAutocompleteResult } from '@/types/committee-nomination';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60 seconds

// In-memory cache for user data (refreshes every 60 seconds)
let usersCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

/**
 * GET /api/users/autocomplete
 * 
 * Search users by name and return autocomplete suggestions with contact details.
 * Used for committee nomination form to look up members and auto-populate their details.
 * 
 * Query params:
 * - q: Search query (minimum 2 characters)
 * - limit: Maximum results to return (default 10)
 * 
 * Returns: Array of UserAutocompleteResult
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Require minimum 2 characters to search
    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const queryLower = query.toLowerCase();

    // Check cache first
    const now = Date.now();
    if (!usersCache || (now - usersCache.timestamp) > CACHE_TTL) {
      // Refresh cache
      const usersSnapshot = await adminDb
        .collection('users')
        .where('isActive', '==', true) // Only get active users
        .get();
      
      usersCache = {
        data: usersSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })),
        timestamp: now
      };
    }

    // Filter and map results from cache
    const results: UserAutocompleteResult[] = usersCache.data
      .map((user: any) => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return {
          id: user.id,
          name: fullName,
          ponyClubId: user.ponyClubId || '',
          email: user.email || '',
          mobile: user.mobileNumber || '',
        };
      })
      .filter((user: UserAutocompleteResult) => {
        // Filter by name match (case insensitive)
        const fullName = user.name.toLowerCase();
        const firstName = (user.name.split(' ')[0] || '').toLowerCase();
        const lastName = (user.name.split(' ').slice(1).join(' ') || '').toLowerCase();
        const firstNameMatch = firstName.includes(queryLower);
        const lastNameMatch = lastName.includes(queryLower);
        const fullNameMatch = fullName.includes(queryLower);
        
        return firstNameMatch || lastNameMatch || fullNameMatch;
      })
      .sort((a: UserAutocompleteResult, b: UserAutocompleteResult) => {
        // Sort alphabetically by name
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit); // Limit results

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in user autocomplete API:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
