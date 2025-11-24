/**
 * API Authentication & Authorization Helpers
 * 
 * Provides middleware functions to protect API routes based on user roles.
 * Equipment-specific: Allows public booking requests, restricts admin actions to zone managers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from './firebase-admin';

export interface AuthUser {
  id: string;
  ponyClubId: string;
  email?: string;
  role: string;
  roles?: string[];
  clubId?: string;
  zoneId?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

/**
 * Extract and verify JWT token from request
 * Returns user object if valid, null otherwise
 */
async function getUserFromToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // In development, accept dev token
    if (process.env.NODE_ENV === 'development' && token === 'dev-admin-token') {
      return {
        id: 'dev-admin',
        ponyClubId: 'DEV001',
        email: 'admin@dev.local',
        role: 'super_user',
        roles: ['super_user'],
        firstName: 'Dev',
        lastName: 'Admin',
        isActive: true,
      };
    }

    // Verify token and get user from database
    // Note: In production, use JWT verification with Firebase Auth or similar
    const userDoc = await adminDb.collection('users').doc(token).get();
    
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    
    if (!userData?.isActive) {
      return null;
    }

    return {
      id: userDoc.id,
      ponyClubId: userData.ponyClubId,
      email: userData.email,
      role: userData.role,
      roles: userData.roles || [userData.role],
      clubId: userData.clubId,
      zoneId: userData.zoneId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isActive: userData.isActive,
    };
  } catch (error) {
    console.error('Error verifying user token:', error);
    return null;
  }
}

/**
 * Check if user has one of the required roles
 */
function hasRole(user: AuthUser, allowedRoles: string[]): boolean {
  if (allowedRoles.includes(user.role)) {
    return true;
  }
  
  if (user.roles) {
    return user.roles.some(role => allowedRoles.includes(role));
  }
  
  return false;
}

/**
 * Check if user is a zone manager for the specified zone
 */
function isZoneManager(user: AuthUser, zoneId?: string): boolean {
  if (hasRole(user, ['super_user'])) {
    return true; // Super users have access to all zones
  }
  
  if (!hasRole(user, ['zone_manager'])) {
    return false;
  }
  
  // If zoneId specified, check if user manages that zone
  if (zoneId && user.zoneId !== zoneId) {
    return false;
  }
  
  return true;
}

/**
 * Require authentication for an API route
 * Returns user if authenticated, otherwise returns 401 response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const user = await getUserFromToken(request);
  
  if (!user) {
    return {
      error: NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to perform this action'
        },
        { status: 401 }
      )
    };
  }
  
  return { user };
}

/**
 * Require zone manager access for an API route
 * Optionally validate against a specific zoneId
 */
export async function requireZoneManager(
  request: NextRequest,
  zoneId?: string
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const authResult = await requireAuth(request);
  
  if ('error' in authResult) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!isZoneManager(user, zoneId)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Zone manager access required for this action'
        },
        { status: 403 }
      )
    };
  }
  
  return { user };
}

/**
 * Require super user access for an API route
 */
export async function requireSuperUser(
  request: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const authResult = await requireAuth(request);
  
  if ('error' in authResult) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!hasRole(user, ['super_user'])) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Super user access required for this action'
        },
        { status: 403 }
      )
    };
  }
  
  return { user };
}

/**
 * Get optional user from request (doesn't fail if not authenticated)
 * Useful for routes that have different behavior for authenticated users
 */
export async function getOptionalUser(request: NextRequest): Promise<AuthUser | null> {
  return getUserFromToken(request);
}

/**
 * Extract zoneId from request body or query params
 */
export function getZoneIdFromRequest(request: NextRequest, body?: any): string | undefined {
  // Check query params
  const { searchParams } = new URL(request.url);
  const queryZoneId = searchParams.get('zoneId');
  if (queryZoneId) return queryZoneId;
  
  // Check body
  if (body?.zoneId) return body.zoneId;
  
  return undefined;
}
