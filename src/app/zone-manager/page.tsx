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
          {/* Awesome Compact Zone Management Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-2xl backdrop-blur-sm">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative p-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-6 items-center">
                
                {/* Zone Identity - 3 columns */}
                <div className="xl:col-span-3 flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl opacity-20 blur-lg animate-pulse"></div>
                    <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border-2 border-primary/40 backdrop-blur-sm">
                      <MapPin className="h-8 w-8 text-primary drop-shadow-lg" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                      Zone Manager
                    </h1>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-foreground">{selectedZone.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">Management and event oversight</p>
                    </div>
                  </div>
                </div>

                {/* Stats Dashboard - 3 columns */}
                <div className="xl:col-span-3 grid grid-cols-4 gap-2 xl:gap-3">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl opacity-15 blur-sm group-hover:opacity-25 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/60 dark:to-red-950/60 rounded-xl p-2 xl:p-3 text-center border border-orange-200/60 dark:border-orange-800/60 backdrop-blur-sm group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                      <div className="text-xl xl:text-2xl font-black text-orange-600 dark:text-orange-400">{pendingEvents}</div>
                      <div className="text-[9px] xl:text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Pending</div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl opacity-15 blur-sm group-hover:opacity-25 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/60 dark:to-green-950/60 rounded-xl p-2 xl:p-3 text-center border border-emerald-200/60 dark:border-emerald-800/60 backdrop-blur-sm group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                      <div className="text-xl xl:text-2xl font-black text-emerald-600 dark:text-emerald-400">{approvedEvents}</div>
                      <div className="text-[9px] xl:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Approved</div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl opacity-15 blur-sm group-hover:opacity-25 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/60 dark:to-cyan-950/60 rounded-xl p-2 xl:p-3 text-center border border-blue-200/60 dark:border-blue-800/60 backdrop-blur-sm group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                      <div className="text-xl xl:text-2xl font-black text-blue-600 dark:text-blue-400">{totalClubs}</div>
                      <div className="text-[9px] xl:text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Clubs</div>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl opacity-15 blur-sm group-hover:opacity-25 transition-all duration-300"></div>
                    <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/60 dark:to-violet-950/60 rounded-xl p-2 xl:p-3 text-center border border-purple-200/60 dark:border-purple-800/60 backdrop-blur-sm group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
                      <div className="text-xl xl:text-2xl font-black text-purple-600 dark:text-purple-400">{activeClubs}</div>
                      <div className="text-[9px] xl:text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Active</div>
                    </div>
                  </div>
                </div>

                {/* Management Info - 4 columns */}
                <div className="xl:col-span-4 flex items-center gap-3">
                  {/* Secretary Card */}
                  <div className="group relative flex-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl opacity-10 blur-sm group-hover:opacity-20 transition-all duration-300"></div>
                    <div className="relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm group-hover:shadow-md transition-all duration-300">
                      <div className="rounded-xl bg-blue-100 dark:bg-blue-900 p-2 border border-blue-200 dark:border-blue-700">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Secretary</p>
                        <p className="text-sm font-bold text-foreground truncate">{selectedZone.secretary?.name || 'Not assigned'}</p>
                        {selectedZone.secretary?.email && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{selectedZone.secretary.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Approvers Card */}
                  <div className="group relative flex-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl opacity-10 blur-sm group-hover:opacity-20 transition-all duration-300"></div>
                    <div className="relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-green-50/60 dark:from-emerald-950/40 dark:to-green-950/30 border border-emerald-200/40 dark:border-emerald-800/40 backdrop-blur-sm group-hover:shadow-md transition-all duration-300">
                      <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900 p-2 border border-emerald-200 dark:border-emerald-700">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Approvers</p>
                        <p className="text-sm font-bold text-foreground">{selectedZone.eventApprovers?.length || 0} assigned</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedZone.eventApprovers?.length === 0 ? 'None set' : 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone Selector - 2 columns */}
                <div className="xl:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl opacity-5"></div>
                    <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                      <SelectTrigger className="relative h-12 w-full border-primary/30 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                        {zones
                          .filter(zone => authorizedZones.includes(zone.id))
                          .map(zone => (
                            <SelectItem key={zone.id} value={zone.id} className="rounded-lg hover:bg-primary/10">
                              <div className="flex items-center gap-3">
                                <div className="rounded-md bg-primary/20 p-1.5">
                                  <MapPin className="h-3 w-3 text-primary" />
                                </div>
                                <span className="font-medium">{zone.name}</span>
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
