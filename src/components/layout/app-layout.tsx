'use client';

import type { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Calendar, PlusCircle, FerrisWheel, Shield, Settings, MapPin, Building, ChevronLeft, ChevronRight, Menu, X, Trophy, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NavigationItem, filterNavigationByRole, UserRole, getUserRoles } from '@/lib/access-control';

export function AppLayout({ children }: PropsWithChildren) {
  const [pathname, setPathname] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  // Start collapsed by default
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Get pathname safely on client side only
  const currentPathname = usePathname();

  // Hydration-safe client detection and pathname setup
  useEffect(() => {
    setIsClient(true);
    setPathname(currentPathname);
    // Set initial sidebar state after client mounts
    if (currentPathname === '/') {
      setSidebarCollapsed(false);
    }
  }, [currentPathname]);

  // Detect mobile screen size only after hydration
  useEffect(() => {
    if (!isClient) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true); // Auto-collapse on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSidebarCollapsed(true);
  }, [currentPathname]);
  
  // Navigation items with role-based access control
  // Navigation items grouped by zones
  const navigationGroups: { label: string; items: NavigationItem[] }[] = [
    {
      label: 'Events',
      items: [
        {
          href: '/',
          title: 'View Calendar',
          icon: Calendar,
          label: 'View Calendar',
          // Public access - no role requirements
        },
        {
          href: '/request-event',
          title: 'Request Event',
          icon: PlusCircle,
          label: 'Request Event',
          // Public access - no authentication required
        },
      ]
    },
    {
      label: 'Club',
      items: [
        {
          href: '/nominate-committee',
          title: 'Club Committee Update',
          icon: Users2,
          label: 'Club Committee Update',
          // Public access - no authentication required
        },
      ]
    },
    {
      label: 'Management',
      items: [
        {
          href: '/club-manager',
          title: 'Club Manager',
          icon: Building,
          label: 'Club Manager',
          requireAuth: true,
          // All authenticated users can access club manager functionality
        },
        {
          href: '/zone-manager',
          title: 'Zone Manager',
          icon: MapPin,
          label: 'Zone Manager',
          requireAuth: true,
          requiredRoles: ['super_user', 'zone_rep'], // Super users and zone reps
        },
        {
          href: '/state-manager',
          title: 'State Manager',
          icon: FerrisWheel,
          label: 'State Manager',
          requireAuth: true,
          requiredRoles: ['super_user', 'state_admin'], // Super users and state admins
        },
        {
          href: '/ev-manager',
          title: 'EV Manager',
          icon: Trophy,
          label: 'EV Manager',
          requireAuth: true,
          requiredRoles: ['super_user', 'state_admin'], // Super users and state admins
        },
        {
          href: '/public-holiday-manager',
          title: 'Public Holiday Manager',
          icon: Calendar,
          label: 'Public Holidays',
          requireAuth: true,
          requiredRoles: ['super_user', 'public_holiday_manager'], // Super users and public holiday managers
        },
      ]
    },
    {
      label: 'Administration',
      items: [
        {
          href: '/admin',
          title: 'Admin Dashboard',
          icon: Shield,
          label: 'Admin',
          requireAuth: true,
          requiredRoles: ['super_user'], // Only super users can access admin
        },
      ]
    }
  ];

  // Flatten and filter navigation items based on user role and authentication status
  const userRoles = getUserRoles(user);
  const visibleNavigationGroups = navigationGroups.map(group => ({
    ...group,
    items: filterNavigationByRole(group.items, userRoles, isAuthenticated)
  })).filter(group => group.items.length > 0); // Only show groups with visible items
  
  // If this is an embed route, just return children without any app layout
  if (pathname?.startsWith('/embed')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Beautiful full-width header */}
      <AppHeader 
        onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        showMenuToggle={isClient && sidebarCollapsed}
      />

      {/* Content area below header */}
      <div className="flex relative">
        {/* Mobile backdrop overlay */}
        {!sidebarCollapsed && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}
        
        {/* Sidebar - overlay on mobile, pushes content on desktop */}
        <div className={`
          transition-all duration-300 border-r border-border/40 bg-background/95 backdrop-blur-sm shadow-lg
          ${sidebarCollapsed 
            ? 'w-0 overflow-hidden' 
            : 'w-64 overflow-y-auto'
          }
          ${!sidebarCollapsed && isMobile
            ? 'fixed inset-y-0 left-0 z-50 w-full max-w-xs'
            : 'sticky top-0 h-screen'
          }
        `}>
          {!sidebarCollapsed && (
            <>
              {/* Sidebar Header with close button */}
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
                  Navigation
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-8 w-8 hover:bg-primary/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Sidebar Content */}
              <div className="flex flex-col p-4 space-y-2">
                {/* Navigation Menu - Grouped */}
                <div className="space-y-4">
                  {visibleNavigationGroups.map((group, groupIndex) => (
                    <div key={group.label}>
                      {/* Group Label */}
                      <div className="px-3 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                          {group.label}
                        </p>
                      </div>
                      
                      {/* Group Items */}
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                            title={item.title}
                            onClick={() => setSidebarCollapsed(true)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                      
                      {/* Separator between groups (except for last group) */}
                      {groupIndex < visibleNavigationGroups.length - 1 && (
                        <div className="my-3 border-t border-border/40" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Main Content Area - adjusts width based on sidebar */}
        <div className="flex-1">
          <div className="p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
