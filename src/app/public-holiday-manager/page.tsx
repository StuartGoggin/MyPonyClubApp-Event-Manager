'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Settings, Calendar } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { Badge } from '@/components/ui/badge';
import { PublicHolidaySyncTile } from '@/components/admin/public-holiday-sync-tile';
import { PublicHolidayManagement } from '@/components/public-holiday-manager/public-holiday-management';

function PublicHolidayManagerContent() {
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
      
      console.log('📊 Public Holiday Manager - Total events fetched:', (eventsData.events || eventsData || []).length);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter for public holidays only
  const publicHolidays = Array.isArray(events) ? events.filter(event => 
    event.source === 'public_holiday'
  ) : [];
  
  console.log('🎉 Public Holiday Manager - Public holidays filtered:', publicHolidays.length, publicHolidays);

  // Dashboard statistics
  const totalPublicHolidays = publicHolidays.length;
  const upcomingPublicHolidays = publicHolidays.filter(event => 
    new Date(event.date) >= new Date()
  ).length;
  const pastPublicHolidays = publicHolidays.filter(event => 
    new Date(event.date) < new Date()
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p>Loading Public Holiday Manager...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Public Holiday Manager
                  <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                    State Level
                  </Badge>
                </h1>
                <p className="text-green-100 mt-1">
                  Manage Victorian public holidays and school holidays
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Public Holidays</p>
                  <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {totalPublicHolidays}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                  <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                    {upcomingPublicHolidays}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <CalendarPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Past</p>
                  <p className="text-3xl font-bold mt-1 text-gray-600 dark:text-gray-400">
                    {pastPublicHolidays}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-900/30 rounded-xl">
                  <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Calendar */}
        <Card className="shadow-xl mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-green-600" />
              Public Holidays Calendar
            </h2>
            <EventCalendar
              events={publicHolidays}
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

        {/* Public Holiday Sync Configuration */}
        <PublicHolidaySyncTile />

        {/* Event Management Section */}
        <PublicHolidayManagement onEventsUpdate={fetchData} />
      </div>
    </div>
  );
}

export default function PublicHolidayManagerPage() {
  return (
    <RouteGuard requiredRoles={['public_holiday_manager', 'super_user']}>
      <PublicHolidayManagerContent />
    </RouteGuard>
  );
}
