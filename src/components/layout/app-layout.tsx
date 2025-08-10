'use client';

import type { PropsWithChildren } from 'react';
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
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calendar, PlusCircle, Wind, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAtom } from 'jotai';
import { eventSourceAtom, type EventSource } from '@/lib/state';


export function AppLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
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
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/">
                <Wind className="size-5 text-primary" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold tracking-tight font-headline">PonyClub Events</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Dashboard"
              >
                <Link href="/">
                  <Calendar />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/request-event'}
                tooltip="Request Event"
              >
                <Link href="/request-event">
                  <PlusCircle />
                  <span>Request Event</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
           <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Database />
                <span>Event Sources</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="flex flex-col gap-3 px-2 py-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="pca" onCheckedChange={(checked) => handleSourceChange('pca', !!checked)} checked={eventSources.includes('pca')}/>
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
                </div>
              </SidebarGroupContent>
           </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <SidebarTrigger />
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
