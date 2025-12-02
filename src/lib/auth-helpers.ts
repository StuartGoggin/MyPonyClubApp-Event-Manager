import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { UserService } from '@/lib/user-service';
import { UserRole } from '@/lib/access-control';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

export interface AuthenticatedUser {
  id: string;
  ponyClubId?: string;
  name?: string;
  email?: string;
  role: UserRole;
  roles?: UserRole[];
  clubId?: string;
  zoneId?: string;
  isActive: boolean;
}

/**
 * Extract and verify JWT token from request headers
 * Supports both production JWT tokens and development admin tokens
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // Development mode: Support simple admin tokens for testing
    if (process.env.NODE_ENV === 'development') {
      if (token === 'admin-token' || token === 'dev-admin-token') {
        return {
          id: 'dev-admin',
          name: 'Development Admin',
          role: 'super_user',
          roles: ['super_user'],
          isActive: true,
        };
      }
    }
    
    // Production mode: Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get current user data from database
    const user = await UserService.getUserById(payload.userId as string);
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      id: user.id,
      ponyClubId: user.ponyClubId,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
      email: user.email,
      role: user.role as UserRole,
      roles: user.roles as UserRole[] | undefined,
      clubId: user.clubId,
      zoneId: user.zoneId,
      isActive: user.isActive,
    };
  } catch (error) {
    console.error('Error verifying user from request:', error);
    return null;
  }
}

/**
 * Check if user has any of the required roles
 */
export function userHasRole(user: AuthenticatedUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  
  // Super user has access to everything
  if (user.role === 'super_user') return true;
  
  // Check primary role
  if (roles.includes(user.role)) return true;
  
  // Check additional roles if present
  if (user.roles && user.roles.some(r => roles.includes(r))) return true;
  
  return false;
}

/**
 * Check if user is in the same zone (for zone-level authorization)
 */
export function userInZone(user: AuthenticatedUser | null, zoneId: string | undefined): boolean {
  if (!user || !zoneId) return false;
  
  // Super user and state admin have access to all zones
  if (userHasRole(user, 'super_user', 'state_admin')) return true;
  
  return user.zoneId === zoneId;
}

/**
 * Check if user is in the same club (for club-level authorization)
 */
export function userInClub(user: AuthenticatedUser | null, clubId: string | undefined): boolean {
  if (!user || !clubId) return false;
  
  // Super user and state admin have access to all clubs
  if (userHasRole(user, 'super_user', 'state_admin')) return true;
  
  return user.clubId === clubId;
}
