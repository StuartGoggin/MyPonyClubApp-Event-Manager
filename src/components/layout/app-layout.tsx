'use client';

import type { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import Link from 'next/link';
import { Calendar, PlusCircle, Database, FerrisWheel, Shield, Settings, MapPin, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAtom } from 'jotai';
import { eventSourceAtom, type EventSource } from '@/lib/state';

export function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [eventSources, setEventSources] = useAtom(eventSourceAtom);
  
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      {/* Beautiful full-width header */}
      <AppHeader />
      
      {/* Content area below header */}
      <div className="h-[calc(100vh-5rem)] flex">
        {/* Custom Sidebar - No overlay, stays in place */}
        <div className={`transition-all duration-300 border-r border-border/40 bg-background/95 backdrop-blur-sm ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Sidebar Header with toggle */}
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-semibold tracking-tight text-muted-foreground">
                Navigation
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 hover:bg-primary/10"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Sidebar Content */}
          <div className="flex flex-col p-4 space-y-2">
            {/* Navigation Menu */}
            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                title="View Calendar"
              >
                <Calendar className="h-4 w-4" />
                {!sidebarCollapsed && <span>View Calendar</span>}
              </Link>
              <Link
                href="/request-event"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                title="Request Event"
              >
                <PlusCircle className="h-4 w-4" />
                {!sidebarCollapsed && <span>Request Event</span>}
              </Link>
              <Link
                href="/manage-events"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                title="Manage my Events"
              >
                <Settings className="h-4 w-4" />
                {!sidebarCollapsed && <span>Manage my Events</span>}
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                title="Admin Dashboard"
              >
                <Shield className="h-4 w-4" />
                {!sidebarCollapsed && <span>Admin</span>}
              </Link>
              <Link
                href="/zone-manager"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                title="Zone Manager"
              >
                <MapPin className="h-4 w-4" />
                {!sidebarCollapsed && <span>Zone Manager</span>}
              </Link>
              <Link
                href="/club-manager"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                title="Club Manager"
              >
                <Building className="h-4 w-4" />
                {!sidebarCollapsed && <span>Club Manager</span>}
              </Link>
            </div>
            
            {/* Separator */}
            <div className="border-t border-border/40 my-4"></div>
            
            {/* Event Sources - only show when expanded */}
            {!sidebarCollapsed && (
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
                      id="event_secretary" 
                      onCheckedChange={(checked) => handleSourceChange('event_secretary', !!checked)} 
                      checked={eventSources.includes('event_secretary')} 
                    />
                    <Label htmlFor="event_secretary" className="text-sm font-medium leading-none">Event Secretary</Label>
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
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
