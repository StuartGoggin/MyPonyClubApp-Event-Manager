'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-auto aspect-[16/10] flex items-center justify-center p-2">
                <Image
                  src="/myponyclub-logo-zone-manager.png"
                  alt="State Manager Logo"
                  fill
                  className="object-contain drop-shadow-lg"
                  priority
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
                  State Manager
                  <span className="inline-flex gap-2">
                    <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                      State Level
                    </Badge>
                  </span>
                </h1>
                <p className="text-blue-100 mt-1">
                  Manage state-wide events and public holidays
                </p>
              </div>
            </div>
            
            {/* Settings Button */}
            <div className="w-full sm:w-auto">
              <Button
                onClick={() => router.push('/state-manager/settings')}
                variant="secondary"
                size="sm"
                className="w-full bg-white/90 hover:bg-white text-blue-600 shadow-lg"
              >
                <Settings className="mr-2 h-4 w-4" />
                State Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">State Events</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {totalStateEvents}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CalendarPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Public Holidays</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {totalPublicHolidays}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FerrisWheel className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upcoming</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {upcomingStateEvents}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Zones</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {totalZones}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Clubs</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {totalClubs}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Building className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Main Content */}
      <div className="max-w-7xl space-y-6 w-full pb-8">
        <StateEventManagement
          events={stateEvents}
          zones={zones}
          clubs={clubs}
          eventTypes={eventTypes}
          onEventUpdate={fetchData}
        />
      </div>
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
