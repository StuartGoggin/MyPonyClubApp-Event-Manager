'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Building, CalendarPlus, FerrisWheel, Settings } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { StateEventManagement } from '@/components/state-manager/state-event-management';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

function StateManagerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [zonesResponse, clubsResponse, eventsResponse, eventTypesResponse] = await Promise.all([
        fetch('/api/zones'),
        fetch('/api/clubs'),
        fetch('/api/events'),
        fetch('/api/event-types')
      ]);

      if (!zonesResponse.ok || !clubsResponse.ok || !eventsResponse.ok || !eventTypesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const zonesData = await zonesResponse.json();
      const clubsData = await clubsResponse.json();
      const eventsData = await eventsResponse.json();
      const eventTypesData = await eventTypesResponse.json();

      setZones(zonesData.zones || zonesData || []);
      setClubs(clubsData.clubs || clubsData || []);
      setEvents(eventsData.events || eventsData || []);
      setEventTypes(eventTypesData.eventTypes || eventTypesData || []);
      
      console.log('📊 State Manager - Total events fetched:', (eventsData.events || eventsData || []).length);
      console.log('🔍 State Manager - Events data:', eventsData.events || eventsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter for state-level events and public holidays (events without zoneId or clubId)
  const stateEvents = Array.isArray(events) ? events.filter(event => 
    !event.zoneId && !event.clubId
  ) : [];
  
  // Separate state events from public holidays
  const regularStateEvents = stateEvents.filter(event => event.source !== 'public_holiday');
  const publicHolidays = stateEvents.filter(event => event.source === 'public_holiday');
  
  console.log('🎯 State Manager - State events filtered:', regularStateEvents.length, regularStateEvents);
  console.log('🎉 State Manager - Public holidays:', publicHolidays.length, publicHolidays);

  // Dashboard statistics
  const totalStateEvents = regularStateEvents.length;
  const totalPublicHolidays = publicHolidays.length;
  const upcomingStateEvents = regularStateEvents.filter(event => 
    new Date(event.date) >= new Date()
  ).length;
  const totalZones = zones.length;
  const totalClubs = clubs.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading State Manager Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50/50 via-background to-blue-50/30">
      {/* Header */}
      <div className="flex-shrink-0 mx-4 mt-4 mb-6">
        <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-lg bg-gradient-to-r from-white/98 via-white/95 to-primary/8">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Top Row: Logo, Title, and Settings */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 group">
              {/* Logo and Title */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg opacity-30 blur-lg animate-pulse group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm group-hover:border-primary/60 transition-all duration-300 group-hover:scale-105 overflow-hidden h-8 w-16 sm:h-9 sm:w-18">
                    <Image
                      src="/myponyclub-logo-zone-manager.png"
                      alt="MyPonyClub State Manager Logo"
                      fill
                      className="object-cover drop-shadow-lg transition-transform duration-300"
                      priority
                    />
                  </div>
                </div>
                
                <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent truncate">
                  MyPonyClub - State Manager
                </h1>
              </div>

              {/* Settings Button */}
              <Button
                onClick={() => router.push('/state-manager/settings')}
                variant="outline"
                size="icon"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-primary/30 bg-background/90 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
                title="State Settings"
              >
                <Settings className="h-5 w-5 text-primary" />
              </Button>
            </div>
            
            {/* State Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Total State Events */}
              <div className="relative overflow-hidden rounded-lg border border-blue-200/60 dark:border-blue-700/60 bg-gradient-to-br from-blue-50/90 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="p-2 flex items-center justify-between">
                  <div className="rounded-md bg-blue-100 dark:bg-blue-900/50 p-1.5 border border-blue-300/60 dark:border-blue-700/60 flex-shrink-0">
                    <CalendarPlus className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-500 leading-none">{totalStateEvents}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Events</span>
                </div>
              </div>

              {/* Public Holidays */}
              <div className="relative overflow-hidden rounded-lg border border-green-200/60 dark:border-green-700/60 bg-gradient-to-br from-green-50/90 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="p-2 flex items-center justify-between">
                  <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-1.5 border border-green-300/60 dark:border-green-700/60 flex-shrink-0">
                    <FerrisWheel className="h-4 w-4 text-green-700 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-black text-green-600 dark:text-green-500 leading-none">{totalPublicHolidays}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">Holidays</span>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="relative overflow-hidden rounded-lg border border-emerald-200/60 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/90 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="p-2 flex items-center justify-between">
                  <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 p-1.5 border border-emerald-300/60 dark:border-emerald-700/60 flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 leading-none">{upcomingStateEvents}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Upcoming</span>
                </div>
              </div>

              {/* Total Zones */}
              <div className="relative overflow-hidden rounded-lg border border-purple-200/60 dark:border-purple-700/60 bg-gradient-to-br from-purple-50/90 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="p-2 flex items-center justify-between">
                  <div className="rounded-md bg-purple-100 dark:bg-purple-900/50 p-1.5 border border-purple-300/60 dark:border-purple-700/60 flex-shrink-0">
                    <MapPin className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-500 leading-none">{totalZones}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Zones</span>
                </div>
              </div>

              {/* Total Clubs */}
              <div className="relative overflow-hidden rounded-lg border border-amber-200/60 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="p-2 flex items-center justify-between">
                  <div className="rounded-md bg-amber-100 dark:bg-amber-900/50 p-1.5 border border-amber-300/60 dark:border-amber-700/60 flex-shrink-0">
                    <Building className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">{totalClubs}</div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Clubs</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 space-y-6 w-full pb-8">
        <StateEventManagement
          events={stateEvents}
          zones={zones}
          clubs={clubs}
          eventTypes={eventTypes}
          onEventUpdate={fetchData}
        />
      </div>
    </div>
  );
}

export default function StateManagerDashboard() {
  return (
    <RouteGuard requireAuth={true} requiredRoles={['super_user', 'state_admin']}>
      <StateManagerContent />
    </RouteGuard>
  );
}
