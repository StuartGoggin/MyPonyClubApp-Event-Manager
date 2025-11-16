'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Building, CalendarPlus, Settings, Trophy } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { Badge } from '@/components/ui/badge';
import { EvEventsSyncTile } from '@/components/admin/ev-events-sync-tile';
import { EVEventsManagement } from '@/components/ev-manager/ev-events-management';

function EVManagerContent() {
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
      
      console.log('📊 EV Manager - Total events fetched:', (eventsData.events || eventsData || []).length);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter for Equestrian Victoria events (both legacy and new scraped events)
  const evEvents = Array.isArray(events) ? events.filter(event => 
    event.source === 'equestrian_victoria' || event.source === 'ev_scraper'
  ) : [];
  
  console.log('🏇 EV Manager - EV events filtered:', evEvents.length, evEvents);

  // Dashboard statistics
  const totalEVEvents = evEvents.length;
  const upcomingEVEvents = evEvents.filter(event => 
    new Date(event.date) >= new Date()
  ).length;
  const totalZones = zones.length;
  const totalClubs = clubs.length;

  const handleNavigateToSettings = () => {
    router.push('/ev-manager/settings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading Equestrian Victoria Manager...</p>
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
            <Button onClick={() => fetchData()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Equestrian Victoria Manager
                  <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                    State Level
                  </Badge>
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage Equestrian Victoria events across Victoria
                </p>
              </div>
            </div>
            <Button
              onClick={handleNavigateToSettings}
              variant="secondary"
              className="bg-white/90 hover:bg-white text-blue-600 shadow-lg"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total EV Events</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {totalEVEvents}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl">
                  <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                  <p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">
                    {upcomingEVEvents}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CalendarPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Zones</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                    {totalZones}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clubs</p>
                  <p className="text-3xl font-bold mt-1 text-orange-600 dark:text-orange-400">
                    {totalClubs}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Calendar */}
        <Card className="shadow-xl mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-600" />
              Equestrian Victoria Events Calendar
            </h2>
            <EventCalendar
              events={evEvents}
              clubs={clubs}
              eventTypes={eventTypes}
              zones={zones}
              today={new Date()}
              bypassSourceFiltering={true}
              currentUser={{
                id: user?.id || '',
                role: user?.role || 'standard',
                zoneId: user?.zoneId,
                clubId: user?.clubId
              }}
            />
          </CardContent>
        </Card>

        {/* EV Events Sync Configuration */}
        <EvEventsSyncTile />

        {/* Event Management Section */}
        <EVEventsManagement onEventsUpdate={fetchData} />
      </div>
    </div>
  );
}

export default function EVManagerPage() {
  return (
    <RouteGuard requiredRoles={['state_admin', 'super_user']}>
      <EVManagerContent />
    </RouteGuard>
  );
}
