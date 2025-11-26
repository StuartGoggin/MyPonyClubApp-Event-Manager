/**
 * Token Refresh API
 * POST /api/auth/refresh - Refresh an existing JWT token
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getUserFromToken } from '@/lib/api-auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    // Verify the current token and get user
    const user = await getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid or expired token',
          message: 'Please log in again'
        },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (!user.isActive) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact an administrator.'
        },
        { status: 403 }
      );
    }

    // Generate new JWT token with fresh expiration
    const token = await new SignJWT({ 
      userId: user.id,
      ponyClubId: user.ponyClubId,
      role: user.role,
      clubId: user.clubId,
      zoneId: user.zoneId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      token,
      user: {
        id: user.id,
        ponyClubId: user.ponyClubId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
        zoneId: user.zoneId,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    // If error is JWT expired, return specific error
    if (error instanceof Error && error.message.includes('expired')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Token refresh failed',
        message: 'Unable to refresh token. Please log in again.'
      },
      { status: 500 }
    );
  }
}
