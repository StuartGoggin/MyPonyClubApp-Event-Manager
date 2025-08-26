'use client';

import type { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Calendar, PlusCircle, Database, FerrisWheel, Shield, Settings, MapPin, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAtom } from 'jotai';
import { eventSourceAtom, type EventSource } from '@/lib/state';

// A simple SVG pony icon.
const PonyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9.5 14.5A2.5 2.5 0 0 1 12 12h0a2.5 2.5 0 0 1 2.5 2.5v5.5h-5v-5.5Z" />
        <path d="M12 12V6.5a2.5 2.5 0 0 1 5 0V9" />
        <path d="m7 14 2-2" />
        <path d="M14 14h1a2 2 0 0 1 2 2v2h-3v-3.5a2.5 2.5 0 0 0-5 0V20H6v-2a2 2 0 0 1 2-2h1" />
        <path d="M12 9.5a2.5 2.5 0 1 1 5 0V12" />
    </svg>
)

export function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  
  // If this is an embed route, just return children without any app layout
  if (pathname?.startsWith('/embed')) {
    return <>{children}</>;
  }

  const [eventSources, setEventSources] = useAtom(eventSourceAtom);

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
    <SidebarProvider>
      <Sidebar className="border-r border-border/40 bg-background">
        <SidebarHeader className="p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 bg-primary/10 hover:bg-primary/20 transition-colors" asChild>
              <Link href="/">
                <PonyIcon className="size-6 text-primary" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">
              PonyClub Events
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="View Calendar"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/">
                  <Calendar />
                  <span>View Calendar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Request Event"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/request-event">
                  <PlusCircle />
                  <span>Request Event</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Manage my Events"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/manage-events">
                  <Settings />
                  <span>Manage my Events</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Admin Dashboard"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/admin">
                  <Shield />
                  <span>Admin</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Zone Manager"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/zone-manager">
                  <MapPin />
                  <span>Zone Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Club Event Manager"
                className="hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Link href="/club-manager">
                  <Building />
                  <span>Club Manager</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
           <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2 text-muted-foreground font-medium">
                <Database className="text-primary" />
                <span>Event Sources</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-3 px-2 py-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="pca" onCheckedChange={(checked) => handleSourceChange('pca', !!checked)} checked={eventSources.includes('pca')} />
                        <Label htmlFor="pca" className="text-sm font-medium leading-none">PCA Event Calendar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="event_secretary" onCheckedChange={(checked) => handleSourceChange('event_secretary', !!checked)} checked={eventSources.includes('event_secretary')} />
                        <Label htmlFor="event_secretary" className="text-sm font-medium leading-none">Event Secretary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="zone" onCheckedChange={(checked) => handleSourceChange('zone', !!checked)} checked={eventSources.includes('zone')} />
                        <Label htmlFor="zone" className="text-sm font-medium leading-none">Zone Calendars</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="public_holiday" onCheckedChange={(checked) => handleSourceChange('public_holiday', !!checked)} checked={eventSources.includes('public_holiday')} />
                        <Label htmlFor="public_holiday" className="text-sm font-medium leading-none flex items-center gap-1.5">
                            <FerrisWheel className="h-3.5 w-3.5" /> Public Holidays
                        </Label>
                    </div>
                </div>
              </SidebarGroupContent>
           </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Pony Club Event Manager</h2>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
