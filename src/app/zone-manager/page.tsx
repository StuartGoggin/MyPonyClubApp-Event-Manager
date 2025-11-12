'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Clock, Users, Building, Plus } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { ZoneEventApproval } from '@/components/zone-manager/zone-event-approval';
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
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl opacity-20 blur-lg animate-pulse"></div>
                  <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border-2 border-primary/40 backdrop-blur-sm">
                    <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                    Zone Manager
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    {/* Integrated Zone Selector with Large Display */}
                    <div className="flex-1">
                      <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                        <SelectTrigger className="relative h-14 border-primary/30 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                          <SelectValue>
                            <div className="text-left">
                              <div className="text-2xl xl:text-3xl font-black text-foreground">
                                {selectedZone?.name || 'Select Zone'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Management and event oversight
                              </div>
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
                                  <div>
                                    <div className="font-bold text-base">{zone.name}</div>
                                    <div className="text-sm text-muted-foreground">Zone Management</div>
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
              </div>
              
              {/* Zone Statistics - Compact Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Pending Events */}
                <div className="relative overflow-hidden rounded-lg border-2 border-amber-200/60 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="rounded-md bg-amber-100 dark:bg-amber-900/50 p-1.5 border border-amber-300/60 dark:border-amber-700/60">
                        <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending</span>
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-500 leading-none mb-1">{pendingEvents}</div>
                    <div className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">Awaiting approval</div>
                  </div>
                </div>

                {/* Approved Events */}
                <div className="relative overflow-hidden rounded-lg border-2 border-emerald-200/60 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/90 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/20 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 p-1.5 border border-emerald-300/60 dark:border-emerald-700/60">
                        <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Approved</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500 leading-none mb-1">{approvedEvents}</div>
                    <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-medium">Events confirmed</div>
                  </div>
                </div>

                {/* Total Clubs */}
                <div className="relative overflow-hidden rounded-lg border-2 border-blue-200/60 dark:border-blue-700/60 bg-gradient-to-br from-blue-50/90 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="rounded-md bg-blue-100 dark:bg-blue-900/50 p-1.5 border border-blue-300/60 dark:border-blue-700/60">
                        <Building className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Clubs</span>
                    </div>
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-500 leading-none mb-1">{totalClubs}</div>
                    <div className="text-xs text-blue-700/80 dark:text-blue-400/80 font-medium">In this zone</div>
                  </div>
                </div>

                {/* Active Clubs */}
                <div className="relative overflow-hidden rounded-lg border-2 border-purple-200/60 dark:border-purple-700/60 bg-gradient-to-br from-purple-50/90 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/20 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="rounded-md bg-purple-100 dark:bg-purple-900/50 p-1.5 border border-purple-300/60 dark:border-purple-700/60">
                        <Users className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Active</span>
                    </div>
                    <div className="text-3xl font-black text-purple-600 dark:text-purple-500 leading-none mb-1">{activeClubs}</div>
                    <div className="text-xs text-purple-700/80 dark:text-purple-400/80 font-medium">With events</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="approvals" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="approvals">
                <Clock className="h-4 w-4 mr-2" />
                Event Approvals
                {pendingEvents > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingEvents}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="manage">
                <CheckCircle className="h-4 w-4 mr-2" />
                Manage Events
              </TabsTrigger>
              <TabsTrigger value="add-zone-event">
                <Plus className="h-4 w-4 mr-2" />
                Add Zone Event
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="add-zone-event" className="space-y-4">
              <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-xl">
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
                      // Optionally switch back to manage tab after submission
                      // document.querySelector('[value="manage"]')?.click();
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
