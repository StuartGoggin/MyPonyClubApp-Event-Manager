// Role-based access control utilities

export type UserRole = 'super_user' | 'zone_rep' | 'club_manager' | 'event_secretary' | 'standard';

export interface NavigationItem {
  href: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
}

export function hasAccess(userRole: UserRole | undefined, requiredRoles?: UserRole[]): boolean {
  // If no roles are required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // If user has no role, deny access
  if (!userRole) {
    return false;
  }

  // Super user has access to everything
  if (userRole === 'super_user') {
    return true;
  }

  // Check if user's role is in the required roles
  return requiredRoles.includes(userRole);
}

export function filterNavigationByRole(
  navigationItems: NavigationItem[], 
  userRole: UserRole | undefined, 
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