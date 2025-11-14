'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle, Clock, Users, Building, Plus, FileText, CalendarPlus } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { ZoneEventApproval } from '@/components/zone-manager/zone-event-approval';
import { ZoneScheduleApproval } from '@/components/zone-manager/zone-schedule-approval';
import { ZoneEventManagement } from '@/components/zone-manager/zone-event-management';
import { ZoneEventSubmission } from '@/components/zone-manager/zone-event-submission';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/contexts/auth-context';

function ZoneManagerContent() {
  const { user } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddZoneEventForm, setShowAddZoneEventForm] = useState(false);

  // Future: This will be replaced with user's authorized zones from authentication
  const [authorizedZones, setAuthorizedZones] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [user]); // Re-fetch when user changes

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

      console.log('API Responses:', { zonesData, clubsData, eventsData, eventTypesData });

      // Extract arrays from API responses (they return objects with nested arrays)
      setZones(zonesData.zones || zonesData || []);
      setClubs(clubsData.clubs || clubsData || []);
      setEvents(eventsData.events || eventsData || []);
      setEventTypes(eventTypesData.eventTypes || eventTypesData || []);

      // Set authorized zones based on user role
      const zonesArray = zonesData.zones || zonesData || [];
      
      if (user?.role === 'super_user') {
        // Super users can access all zones
        setAuthorizedZones(zonesArray.map((zone: Zone) => zone.id));
      } else if (user?.role === 'zone_rep' && user?.zoneId) {
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
  };

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
    <div className="space-y-6">
      {selectedZone && (
        <>
          {/* Clean Zone Management Header - Matching Club Manager Style */}
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6 group">
                {/* Logo with beautiful effects */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg sm:rounded-xl opacity-30 blur-lg animate-pulse group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm group-hover:border-primary/60 transition-all duration-300 group-hover:scale-105 overflow-hidden h-7 sm:h-8 md:h-9 w-14 sm:w-16 md:w-18">
                    <Image
                      src="/myponyclub-logo-zone-manager.png"
                      alt="MyPonyClub Zone Manager Logo"
                      fill
                      className="object-cover drop-shadow-lg transition-transform duration-300"
                      priority
                    />
                  </div>
                </div>
                
                <div className="flex-1 flex items-center justify-between gap-4">
                  {/* Title matching Event Calendar style */}
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                    MyPonyClub - Zone Manager
                  </h1>
                  
                  {/* Integrated Zone Selector - Same Line */}
                  <div className="w-auto max-w-md">
                    <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                      <SelectTrigger className="relative h-10 border-primary/30 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 justify-end">
                        <SelectValue>
                          <div className="text-base font-bold text-foreground mr-2">
                            {selectedZone?.name || 'Select Zone'}
                          </div>
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
              
              {/* Zone Statistics - Compact Inline Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Pending Events */}
                <div className="relative overflow-hidden rounded-lg border border-amber-200/60 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex items-center justify-between">
                    <div className="rounded-md bg-amber-100 dark:bg-amber-900/50 p-1.5 border border-amber-300/60 dark:border-amber-700/60 flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">{pendingEvents}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending</span>
                  </div>
                </div>

                {/* Approved Events */}
                <div className="relative overflow-hidden rounded-lg border border-emerald-200/60 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/90 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex items-center justify-between">
                    <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 p-1.5 border border-emerald-300/60 dark:border-emerald-700/60 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 leading-none">{approvedEvents}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Approved</span>
                  </div>
                </div>

                {/* Total Clubs */}
                <div className="relative overflow-hidden rounded-lg border border-blue-200/60 dark:border-blue-700/60 bg-gradient-to-br from-blue-50/90 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex items-center justify-between">
                    <div className="rounded-md bg-blue-100 dark:bg-blue-900/50 p-1.5 border border-blue-300/60 dark:border-blue-700/60 flex-shrink-0">
                      <Building className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-500 leading-none">{totalClubs}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Clubs</span>
                  </div>
                </div>

                {/* Active Clubs */}
                <div className="relative overflow-hidden rounded-lg border border-purple-200/60 dark:border-purple-700/60 bg-gradient-to-br from-purple-50/90 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex items-center justify-between">
                    <div className="rounded-md bg-purple-100 dark:bg-purple-900/50 p-1.5 border border-purple-300/60 dark:border-purple-700/60 flex-shrink-0">
                      <Users className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-500 leading-none">{activeClubs}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="approvals" className="space-y-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <TabsList className="flex-1 grid grid-cols-3">
                <TabsTrigger value="approvals">
                  <Clock className="h-4 w-4 mr-2" />
                  Event Date Approvals
                  {pendingEvents > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingEvents}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="schedules">
                  <FileText className="h-4 w-4 mr-2" />
                  Event Schedule Approvals
                  {pendingSchedules > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingSchedules}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="manage">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Manage Events
                </TabsTrigger>
              </TabsList>

              {/* Add Zone Event Button */}
              <Button 
                onClick={() => setShowAddZoneEventForm(!showAddZoneEventForm)}
                size="lg"
                className="distinctive-button-primary bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-6 py-3 font-bold text-base rounded-2xl border-2 border-emerald-400/50 hover:border-emerald-300 backdrop-blur-sm whitespace-nowrap"
              >
                {showAddZoneEventForm ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2 drop-shadow-lg" />
                    View Events
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-5 w-5 mr-2 drop-shadow-lg" />
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

          {/* Add Zone Event Form - Shown when button is clicked */}
          {showAddZoneEventForm && (
            <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-xl mt-4">
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
        </>
      )}
    </div>
  );
}

export default function ZoneManagerDashboard() {
  return (
    <RouteGuard requireAuth={true} requiredRoles={['super_user', 'zone_rep']}>
      <ZoneManagerContent />
    </RouteGuard>
  );
}
