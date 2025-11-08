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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [eventSources, setEventSources] = useAtom(eventSourceAtom);
  const { user, isAuthenticated } = useAuth();

  // Hydration-safe client detection
  useEffect(() => {
    setIsClient(true);
  }, []);

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
      
      {/* Mobile Menu Button - only show after hydration */}
      {isClient && isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-20 left-4 z-50 h-10 w-10 bg-background/95 backdrop-blur-sm border border-border/40 shadow-lg hover:bg-primary/10 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Mobile Overlay - only show after hydration */}
      {isClient && isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Content area below header */}
      <div className="h-[calc(100vh-5rem)] flex">
        {/* Sidebar */}
        <div className={`
          transition-all duration-300 border-r border-border/40 bg-background/95 backdrop-blur-sm
          ${!isClient || !isMobile 
            ? sidebarCollapsed 
              ? 'w-16' 
              : 'w-64'
            : mobileMenuOpen 
              ? 'fixed inset-y-0 left-0 top-20 w-64 z-40' 
              : 'w-0 overflow-hidden'
          }
        `}>
          {/* Sidebar Header with toggle */}
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            {(!sidebarCollapsed || (isClient && mobileMenuOpen)) && (
              <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
                Navigation
              </h2>
            )}
            {(!isClient || !isMobile) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 hover:bg-primary/10"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            )}
            {isClient && isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 hover:bg-primary/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
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
                >
                  <item.icon className="h-4 w-4" />
                  {(!sidebarCollapsed || (isClient && mobileMenuOpen)) && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
            
            {/* Separator */}
            <div className="border-t border-border/40 my-4"></div>
            
            {/* Event Sources - only show when expanded */}
            {(!sidebarCollapsed || (isClient && mobileMenuOpen)) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Database className="text-primary h-4 w-4" />
                  <span className="text-sm">Event Sources</span>
                </div>
                <div className="space-y-3 pl-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="pca" 
                      onCheckedChange={(checked) => handleSourceChange('pca', !!checked)} 
                      checked={eventSources.includes('pca')} 
                    />
                    <Label htmlFor="pca" className="text-sm font-medium leading-none">PCA Event Calendar</Label>
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
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col ${isClient && isMobile ? 'w-full' : ''}`}>
          <div className={`flex-1 p-4 md:p-6 ${isClient && isMobile ? 'pt-16' : ''}`}>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
