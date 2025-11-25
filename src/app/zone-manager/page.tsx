'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Clock, Users, Building, Plus, FileText, CalendarPlus, Settings, Package, Calendar } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { ZoneEventApproval } from '@/components/zone-manager/zone-event-approval';
import { ZoneScheduleApproval } from '@/components/zone-manager/zone-schedule-approval';
import { ZoneEventManagement } from '@/components/zone-manager/zone-event-management';
import { ZoneEventSubmission } from '@/components/zone-manager/zone-event-submission';
import { ZoneCommitteeApprovals } from '@/components/zone-manager/zone-committee-approvals';
import { ZoneEquipmentDashboard } from '@/components/zone-manager/zone-equipment-dashboard';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasRole, getUserRoles } from '@/lib/access-control';
import { Suspense } from 'react';

function ZoneManagerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddZoneEventForm, setShowAddZoneEventForm] = useState(false);
  const [pendingCommittees, setPendingCommittees] = useState(0);
  const [mainTab, setMainTab] = useState<string>('events');

  // Future: This will be replaced with user's authorized zones from authentication
  const [authorizedZones, setAuthorizedZones] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
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

      console.log('API Responses:', { zonesData, clubsData, eventsData, eventTypesData });

      // Extract arrays from API responses (they return objects with nested arrays)
      setZones(zonesData.zones || zonesData || []);
      setClubs(clubsData.clubs || clubsData || []);
      setEvents(eventsData.events || eventsData || []);
      setEventTypes(eventTypesData.eventTypes || eventTypesData || []);

      // Set authorized zones based on user role
      const zonesArray = zonesData.zones || zonesData || [];
      const userRoles = getUserRoles(user);
      
      if (userRoles.includes('super_user')) {
        // Super users can access all zones
        setAuthorizedZones(zonesArray.map((zone: Zone) => zone.id));
      } else if (userRoles.includes('zone_rep') && user?.zoneId) {
        // Zone reps can only access their assigned zone
        setAuthorizedZones([user.zoneId]);
      } else {
        // Default: allow access to all zones (fallback)
        setAuthorizedZones(zonesArray.map((zone: Zone) => zone.id));
      }

      // Auto-select zone based on user membership
      let defaultZoneId = '';
      
      // If user has a zoneId and it exists in the zones list, select it
      if (user?.zoneId && zonesArray.some((zone: Zone) => zone.id === user.zoneId)) {
        defaultZoneId = user.zoneId;
      } else if (zonesArray.length > 0) {
        // Otherwise, select first available zone
        defaultZoneId = zonesArray[0].id;
      }
      
      if (defaultZoneId) {
        setSelectedZoneId(defaultZoneId);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPendingCommitteesCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/committee-nominations/pending?zoneRepId=${user.id}`);
      if (response.ok) {
        const nominations = await response.json();
        setPendingCommittees(nominations.length);
      }
    } catch (error) {
      console.error('Error fetching pending committees count:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.id) {
      fetchPendingCommitteesCount();
    }
  }, [user?.id, fetchPendingCommitteesCount]);

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['events', 'equipment', 'settings'].includes(tab)) {
      setMainTab(tab);
    }
  }, [searchParams]);

  // Filter data for selected zone with defensive programming
  const selectedZone = zones.find(zone => zone.id === selectedZoneId);
  const zoneClubs = Array.isArray(clubs) ? clubs.filter(club => club.zoneId === selectedZoneId) : [];
  const zoneEvents = Array.isArray(events) ? events.filter(event => {
    // Include events that are directly associated with the zone
    if (event.zoneId === selectedZoneId) {
      return true;
    }
    // Include events from clubs in this zone
    const eventClub = clubs.find(club => club.id === event.clubId);
    return eventClub?.zoneId === selectedZoneId;
  }) : [];

  // Dashboard statistics for selected zone
  const pendingEvents = zoneEvents.filter(event => event.status === 'proposed').length;
  const pendingSchedules = zoneEvents.filter(event => event.schedule && event.schedule.status === 'pending').length;
  const approvedEvents = zoneEvents.filter(event => event.status === 'approved').length;
  const totalClubs = zoneClubs.length;
  const activeClubs = zoneClubs.filter(club => 
    events.some(event => event.clubId === club.id)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Zone Manager Dashboard...</p>
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
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
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
                {selectedZone?.imageUrl && selectedZone.imageUrl.startsWith('data:image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedZone.imageUrl}
                    alt={`${selectedZone.name} Logo`}
                    className="object-contain w-full h-full drop-shadow-lg"
                  />
                ) : (
                  <Image
                    src="/myponyclub-logo-zone-manager.png"
                    alt="Zone Manager Logo"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {selectedZone ? selectedZone.name : 'Zone Manager'}
                  <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                    Zone Level
                  </Badge>
                </h1>
                <p className="text-blue-100 mt-1">
                  {selectedZone ? `Manage ${selectedZone.name}'s events and club activities` : 'Manage zone events and club activities'}
                </p>
              </div>
            </div>
            
            {/* Zone Selection */}
            <div className="w-full sm:w-auto sm:min-w-[300px]">
              <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                <SelectTrigger className="h-14 bg-white/90 hover:bg-white text-blue-600 shadow-lg border-white/40">
                  <SelectValue>
                    {selectedZone ? (
                      <div className="text-left w-full">
                        <div className="text-lg font-bold text-foreground truncate">
                          {selectedZone.name}
                        </div>
                      </div>
                    ) : (
                      <span>Select Zone...</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                  {zones
                    .filter(zone => authorizedZones.includes(zone.id))
                    .map(zone => (
                      <SelectItem key={zone.id} value={zone.id} className="rounded-lg hover:bg-primary/10 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-primary/20 p-1.5">
                            <MapPin className="h-3 w-3 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-base">{zone.name}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Tabs - Events, Equipment, Settings */}
        {selectedZone && (
          <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100 dark:bg-slate-800 shadow-lg rounded-xl p-1">
              <TabsTrigger 
                value="events" 
                className="text-sm sm:text-base font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Events</span>
                {(pendingEvents + pendingSchedules + pendingCommittees > 0) && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {pendingEvents + pendingSchedules + pendingCommittees}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="equipment" 
                className="text-sm sm:text-base font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Equipment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="text-sm sm:text-base font-semibold rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6 mt-6">
              {/* Statistics Cards - Only show on Events tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Events</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                          {pendingEvents}
                        </p>
                      </div>
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Approved</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                          {approvedEvents}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending Schedules</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                          {pendingSchedules}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Clubs</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                          {activeClubs}/{totalClubs}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Event Sub-tabs */}
                <Tabs defaultValue="approvals" className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <TabsList className="flex-1 grid grid-cols-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                      <TabsTrigger value="approvals" className="text-xs sm:text-sm">
                        <Clock className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Event Dates</span>
                        <span className="sm:hidden">Dates</span>
                        {pendingEvents > 0 && (
                          <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                            {pendingEvents}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="schedules" className="text-xs sm:text-sm">
                        <FileText className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Schedules</span>
                        <span className="sm:hidden">Sched</span>
                        {pendingSchedules > 0 && (
                          <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                            {pendingSchedules}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="committees" className="text-xs sm:text-sm">
                        <Users className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Committees</span>
                        <span className="sm:hidden">Comm</span>
                        {pendingCommittees > 0 && (
                          <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                            {pendingCommittees}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="manage" className="text-xs sm:text-sm">
                        <CheckCircle className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Manage</span>
                        <span className="sm:hidden">Mgmt</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Add Zone Event Button */}
                    <Button 
                      onClick={() => setShowAddZoneEventForm(!showAddZoneEventForm)}
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap w-full sm:w-auto"
                    >
                      {showAddZoneEventForm ? (
                        <>
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          View Events
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Add Zone Event
                        </>
                      )}
                    </Button>
                  </div>

                  <TabsContent value="approvals" className="space-y-4">
                    <ZoneEventApproval
                      zoneId={selectedZoneId}
                      zoneName={selectedZone.name}
                      events={zoneEvents}
                      clubs={zoneClubs}
                      eventTypes={eventTypes}
                      onEventUpdate={fetchData}
                    />
                  </TabsContent>

                  <TabsContent value="schedules" className="space-y-4">
                    <ZoneScheduleApproval
                      zoneId={selectedZoneId}
                      zoneName={selectedZone.name}
                      events={zoneEvents}
                      clubs={zoneClubs}
                      eventTypes={eventTypes}
                      onEventUpdate={fetchData}
                    />
                  </TabsContent>

                  <TabsContent value="committees" className="space-y-4">
                    <ZoneCommitteeApprovals
                      zoneId={selectedZoneId}
                      onUpdate={fetchPendingCommitteesCount}
                    />
                  </TabsContent>

                  <TabsContent value="manage" className="space-y-4">
                    <ZoneEventManagement
                      zoneId={selectedZoneId}
                      zoneName={selectedZone.name}
                      events={zoneEvents}
                      clubs={zoneClubs}
                      eventTypes={eventTypes}
                      onEventUpdate={fetchData}
                    />
                  </TabsContent>
                </Tabs>

                {/* Add Zone Event Form */}
                {showAddZoneEventForm && (
                  <Card className="border-2 border-primary/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Create Zone-Level Event
                      </CardTitle>
                      <CardDescription>
                        Add a new zone-level event. Zone-level events are automatically approved and visible to all clubs in the selected zone.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ZoneEventSubmission
                        zones={zones}
                        eventTypes={eventTypes}
                        defaultZoneId={selectedZoneId}
                        onEventSubmitted={() => {
                          fetchData();
                          setShowAddZoneEventForm(false);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="space-y-6 mt-6">
              <ZoneEquipmentDashboard 
                zoneId={selectedZoneId} 
                zoneName={selectedZone.name} 
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card className="border-2 border-primary/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Zone Settings
                  </CardTitle>
                  <CardDescription>
                    Manage zone configuration and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-card p-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        Advanced zone settings and configuration options
                      </p>
                      <Button
                        onClick={() => router.push(`/zone-manager/settings?zoneId=${selectedZoneId}`)}
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
                      >
                        <Settings className="mr-2 h-5 w-5" />
                        Go to Settings Page
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function ZoneManagerPage() {
  return (
    <RouteGuard requireAuth={true} requiredRoles={['super_user', 'zone_rep']}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Zone Manager Dashboard...</p>
          </div>
        </div>
      }>
        <ZoneManagerContent />
      </Suspense>
    </RouteGuard>
  );
}

export default ZoneManagerPage;
