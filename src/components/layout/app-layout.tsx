'use client';

import type { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Calendar, PlusCircle, Database, FerrisWheel, Shield, Settings, MapPin, Building, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAtom } from 'jotai';
import { eventSourceAtom, type EventSource } from '@/lib/state';
import { NavigationItem, filterNavigationByRole, UserRole } from '@/lib/access-control';

export function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  // Start expanded only on root URL, minimized everywhere else
  const [sidebarCollapsed, setSidebarCollapsed] = useState(pathname !== '/');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [eventSources, setEventSources] = useAtom(eventSourceAtom);
  const { user, isAuthenticated } = useAuth();

  // Hydration-safe client detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update sidebar state when pathname changes
  useEffect(() => {
    // Expand sidebar on root URL, collapse on other pages (but allow user toggle to persist)
    if (pathname === '/') {
      setSidebarCollapsed(false);
    }
  }, [pathname]);

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
  }, [pathname]);
  
  // Navigation items with role-based access control
  const navigationItems: NavigationItem[] = [
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
    {
      href: '/admin',
      title: 'Admin Dashboard',
      icon: Shield,
      label: 'Admin',
      requireAuth: true,
      requiredRoles: ['super_user'], // Only super users can access admin
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
      href: '/zone-manager',
      title: 'Zone Manager',
      icon: MapPin,
      label: 'Zone Manager',
      requireAuth: true,
      requiredRoles: ['super_user', 'zone_rep'], // Super users and zone reps
    },
    {
      href: '/club-manager',
      title: 'Club Manager',
      icon: Building,
      label: 'Club Manager',
      requireAuth: true,
      // All authenticated users can access club manager functionality
    },
  ];

  // Filter navigation items based on user role and authentication status
  const visibleNavigationItems = filterNavigationByRole(
    navigationItems,
    user?.role as UserRole,
    isAuthenticated
  );
  
  // If this is an embed route, just return children without any app layout
  if (pathname?.startsWith('/embed')) {
    return <>{children}</>;
  }

  const handleSourceChange = (source: EventSource, checked: boolean) => {
    setEventSources(prev => {
      const newSources = new Set(prev);
      if (checked) {
        newSources.add(source);
      } else {
        newSources.delete(source);
      }
      return Array.from(newSources);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Beautiful full-width header */}
      <AppHeader />
      
      {/* Menu Toggle Button - shows when sidebar is collapsed */}
      {isClient && sidebarCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(false)}
          className="fixed top-24 left-4 z-50 h-10 w-10 bg-background/95 backdrop-blur-sm border border-border/40 shadow-lg hover:bg-primary/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay when sidebar is open - click to close */}
      {isClient && !sidebarCollapsed && (
        <div
          className="fixed inset-0 top-20 bg-black/20 z-30"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Content area below header */}
      <div className="h-[calc(100vh-5rem)] flex relative">
        {/* Sidebar - now fixed/absolute to hover over content */}
        <div className={`
          fixed top-20 left-0 h-[calc(100vh-5rem)] z-40
          transition-all duration-300 border-r border-border/40 bg-background/95 backdrop-blur-sm shadow-lg
          ${sidebarCollapsed 
            ? '-translate-x-full opacity-0' 
            : 'translate-x-0 opacity-100'
          } w-64
        `}>
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
            {/* Navigation Menu */}
            <div className="space-y-1">
              {visibleNavigationItems.map((item) => (
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
            
            {/* Separator */}
            <div className="border-t border-border/40 my-4"></div>
            
            {/* Event Sources */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Database className="text-primary h-4 w-4" />
                <span className="text-sm">Event Sources</span>
              </div>
              <div className="space-y-3 pl-2">
                  <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed">
                    <Checkbox 
                      id="pca" 
                      disabled
                      checked={false} 
                    />
                    <Label htmlFor="pca" className="text-sm font-medium leading-none text-muted-foreground cursor-not-allowed">PCA Event Calendar (Coming Soon)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="zone" 
                      onCheckedChange={(checked) => handleSourceChange('zone', !!checked)} 
                      checked={eventSources.includes('zone')} 
                    />
                    <Label htmlFor="zone" className="text-sm font-medium leading-none">Zone Calendars</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="public_holiday" 
                      onCheckedChange={(checked) => handleSourceChange('public_holiday', !!checked)} 
                      checked={eventSources.includes('public_holiday')} 
                    />
                    <Label htmlFor="public_holiday" className="text-sm font-medium leading-none flex items-center gap-1.5">
                      <FerrisWheel className="h-3.5 w-3.5" /> Public Holidays
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
        {/* Main Content Area - now takes full width with sidebar hovering */}
        <div className="flex-1 flex flex-col w-full">
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
