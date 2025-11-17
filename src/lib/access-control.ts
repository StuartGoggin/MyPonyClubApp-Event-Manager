// Role-based access control utilities

export type UserRole = 'super_user' | 'state_admin' | 'zone_rep' | 'club_manager' | 'public_holiday_manager' | 'event_secretary' | 'standard';

export interface NavigationItem {
  href: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
}

/**
 * Helper to get user roles as array, supporting both legacy single role and new multi-role
 */
export function getUserRoles(user: { role?: string | UserRole; roles?: UserRole[] | string[] } | undefined | null): UserRole[] {
  if (!user) return [];
  
  // Prefer roles array if it exists and has values
  if (user.roles && user.roles.length > 0) {
    return user.roles as UserRole[];
  }
  
  // Fall back to single role
  if (user.role) {
    return [user.role as UserRole];
  }
  
  return [];
}

/**
 * Check if user has any of the required roles
 * Supports both single role (legacy) and multiple roles (new)
 */
export function hasAccess(userRole: UserRole | UserRole[] | undefined, requiredRoles?: UserRole[]): boolean {
  // If no roles are required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // If user has no role, deny access
  if (!userRole) {
    return false;
  }

  // Convert userRole to array if it's a single role (backward compatibility)
  const userRoles = Array.isArray(userRole) ? userRole : [userRole];
  
  // If user has no roles, deny access
  if (userRoles.length === 0) {
    return false;
  }

  // Super user has access to everything
  if (userRoles.includes('super_user')) {
    return true;
  }

  // Check if user has any of the required roles
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: { role?: string | UserRole; roles?: UserRole[] | string[] } | undefined | null, roleToCheck: UserRole): boolean {
  const userRoles = getUserRoles(user);
  return userRoles.includes(roleToCheck);
}

export function filterNavigationByRole(
  navigationItems: NavigationItem[], 
  userRole: UserRole | UserRole[] | undefined, 
  isAuthenticated: boolean
): NavigationItem[] {
  return navigationItems.filter(item => {
    // If authentication is required and user is not authenticated, hide item
    if (item.requireAuth && !isAuthenticated) {
      return false;
    }

    // Check role-based access
    return hasAccess(userRole, item.requiredRoles);
  });
}