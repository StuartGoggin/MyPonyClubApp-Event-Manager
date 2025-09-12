'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { hasAccess, UserRole } from '@/lib/access-control';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireAuth?: boolean;
  redirectTo?: string;
}

export function RouteGuard({ 
  children, 
  requiredRoles, 
  requireAuth = false, 
  redirectTo = '/login' 
}: RouteGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (loading) return;

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role-based access
    if (requiredRoles && !hasAccess(user?.role as UserRole, requiredRoles)) {
      // Redirect based on user role or to home if no access
      if (!isAuthenticated) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      } else {
        // User is authenticated but doesn't have required role
        router.push('/unauthorized');
      }
      return;
    }
  }, [user, isAuthenticated, loading, router, pathname, requiredRoles, requireAuth, redirectTo]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if user doesn't have access
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requiredRoles && !hasAccess(user?.role as UserRole, requiredRoles)) {
    return null;
  }

  return <>{children}</>;
}