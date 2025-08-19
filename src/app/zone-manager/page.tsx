'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, CheckCircle, Clock, Users, Building } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { ZoneEventApproval } from '@/components/zone-manager/zone-event-approval';
import { ZoneEventManagement } from '@/components/zone-manager/zone-event-management';

export default function ZoneManagerDashboard() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Future: This will be replaced with user's authorized zones from authentication
  const [authorizedZones, setAuthorizedZones] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Future: Replace with actual user authorization check
      // For now, allow access to all zones
      const zonesArray = zonesData.zones || zonesData || [];
      setAuthorizedZones(zonesArray.map((zone: Zone) => zone.id));

      // Auto-select first authorized zone
      if (zonesArray.length > 0) {
        setSelectedZoneId(zonesArray[0].id);
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
              
              <div className="space-y-4">
                {/* Zone Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Pending Events */}
                  <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-amber/5 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber/5 to-orange/5"></div>
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-1.5 border border-amber-200 dark:border-amber-700">
                          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide">Pending</span>
                      </div>
                      <div className="text-2xl font-black text-amber-600">{pendingEvents}</div>
                      <div className="text-sm text-muted-foreground">Awaiting approval</div>
                    </div>
                  </div>

                  {/* Approved Events */}
                  <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-emerald/5 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald/5 to-green/5"></div>
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-1.5 border border-emerald-200 dark:border-emerald-700">
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide">Approved</span>
                      </div>
                      <div className="text-2xl font-black text-emerald-600">{approvedEvents}</div>
                      <div className="text-sm text-muted-foreground">Events confirmed</div>
                    </div>
                  </div>

                  {/* Total Clubs */}
                  <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-blue/5 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue/5 to-cyan/5"></div>
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-1.5 border border-blue-200 dark:border-blue-700">
                          <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide">Clubs</span>
                      </div>
                      <div className="text-2xl font-black text-blue-600">{totalClubs}</div>
                      <div className="text-sm text-muted-foreground">In this zone</div>
                    </div>
                  </div>

                  {/* Active Clubs */}
                  <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-purple/5 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple/5 to-violet/5"></div>
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="rounded-lg bg-purple-100 dark:bg-purple-900/50 p-1.5 border border-purple-200 dark:border-purple-700">
                          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wide">Active</span>
                      </div>
                      <div className="text-2xl font-black text-purple-600">{activeClubs}</div>
                      <div className="text-sm text-muted-foreground">With events</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="calendar" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Zone Calendar
              </TabsTrigger>
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
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Zone Event Calendar</CardTitle>
                  <CardDescription>
                    View all events within {selectedZone.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventCalendar 
                    events={zoneEvents}
                    clubs={zoneClubs}
                    eventTypes={eventTypes}
                    zones={[selectedZone]}
                    today={new Date()}
                  />
                </CardContent>
              </Card>
            </TabsContent>

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
          </Tabs>
        </>
      )}
    </div>
  );
}
