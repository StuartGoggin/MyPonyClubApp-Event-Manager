'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Clock, Users, Building, PlusCircle, Activity } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { ClubEventSubmission } from '@/components/club-manager/club-event-submission';
import { ClubEventStatus } from '@/components/club-manager/club-event-status';

export default function ClubEventManagerDashboard() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Future: This will be replaced with user's authorized clubs from authentication
  const [authorizedClubs, setAuthorizedClubs] = useState<string[]>([]);

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
      // For now, allow access to all clubs
      const clubsArray = clubsData.clubs || clubsData || [];
      setAuthorizedClubs(clubsArray.map((club: Club) => club.id));

      // Auto-select first authorized club
      if (clubsArray.length > 0) {
        setSelectedClubId(clubsArray[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventUpdate = () => {
    fetchData(); // Refresh all data when events are updated
  };

  // Filter data for selected club with defensive programming
  const selectedClub = clubs.find(club => club.id === selectedClubId);
  const selectedZone = zones.find(zone => zone.id === selectedClub?.zoneId);
  const clubEvents = Array.isArray(events) ? events.filter(event => event.clubId === selectedClubId) : [];

  // Dashboard statistics for selected club
  const submittedEvents = clubEvents.filter(event => event.status === 'proposed').length;
  const approvedEvents = clubEvents.filter(event => event.status === 'approved').length;
  const rejectedEvents = clubEvents.filter(event => event.status === 'rejected').length;
  const totalEvents = clubEvents.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center enhanced-card p-8 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">Loading club dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center enhanced-card p-8 rounded-lg">
          <p className="text-destructive mb-6 text-lg">{error}</p>
          <button 
            onClick={fetchData}
            className="premium-button px-6 py-3 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Glass Club Selection Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl opacity-20 blur-lg animate-pulse"></div>
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border-2 border-primary/40 backdrop-blur-sm">
                <Building className="h-8 w-8 text-primary drop-shadow-lg" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                Club Event Manager
              </h1>
              <div className="flex items-center gap-4 mt-2">
                {/* Integrated Club Selector with Large Display */}
                <div className="flex-1">
                  <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                    <SelectTrigger className="relative h-14 border-primary/30 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                      <SelectValue>
                        <div className="text-left">
                          <div className="text-2xl xl:text-3xl font-black text-foreground">
                            {selectedClub?.name || 'Select Club'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedZone?.name ? `${selectedZone.name} • Submit and manage event requests` : 'Submit and manage event requests for your club across Victoria'}
                          </div>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                      {clubs
                        .filter(club => authorizedClubs.includes(club.id))
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(club => {
                          const zone = zones.find(z => z.id === club.zoneId);
                          return (
                            <SelectItem key={club.id} value={club.id} className="rounded-lg hover:bg-primary/10 py-3">
                              <div className="flex items-center gap-3">
                                <div className="rounded-md bg-primary/20 p-1.5">
                                  <Building className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                  <div className="font-bold text-base">{club.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {zone?.name || 'Unknown Zone'}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Club Statistics Grid */}
            {selectedClub && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Submitted Events */}
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-amber/5 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber/5 to-orange/5"></div>
                  <div className="relative p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-1.5 border border-amber-200 dark:border-amber-700">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wide">Submitted</span>
                    </div>
                    <div className="text-2xl font-black text-amber-600">{submittedEvents}</div>
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

                {/* Total Events */}
                <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-blue/5 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue/5 to-cyan/5"></div>
                  <div className="relative p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-1.5 border border-blue-200 dark:border-blue-700">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wide">Total Events</span>
                    </div>
                    <div className="text-2xl font-black text-blue-600">{totalEvents}</div>
                    <div className="text-sm text-muted-foreground">
                      {rejectedEvents > 0 && `(${rejectedEvents} rejected)`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      {selectedClub && (
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="status" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="status" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Event Status ({totalEvents})
                </TabsTrigger>
                <TabsTrigger value="submit" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Submit Event
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submit" className="mt-6">
                <ClubEventSubmission
                  clubId={selectedClubId}
                  clubName={selectedClub.name}
                  zoneName={selectedZone?.name || 'Unknown Zone'}
                  eventTypes={eventTypes}
                  onEventSubmitted={handleEventUpdate}
                />
              </TabsContent>

              <TabsContent value="status" className="mt-6">
                <ClubEventStatus
                  clubId={selectedClubId}
                  clubName={selectedClub.name}
                  events={clubEvents}
                  clubs={clubs}
                  eventTypes={eventTypes}
                  onEventUpdate={handleEventUpdate}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* No Club Selected */}
      {!selectedClub && clubs.length > 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Club Selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Please select a club from the dropdown above to view the event management dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Clubs Available */}
      {clubs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Clubs Available
            </h3>
            <p className="text-sm text-muted-foreground">
              No clubs found. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
