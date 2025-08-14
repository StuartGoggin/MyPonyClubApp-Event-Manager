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
      {/* Club Selection Header */}
      <Card className="enhanced-card border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Club Event Manager
            </span>
          </CardTitle>
          <CardDescription className="text-base">
            Submit and manage event requests for your club across Victoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Club Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Club</label>
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="w-full enhanced-select">
                  <SelectValue placeholder="Choose a club to manage..." />
                </SelectTrigger>
                <SelectContent>
                  {clubs
                    .filter(club => authorizedClubs.includes(club.id))
                    .map(club => {
                      const zone = zones.find(z => z.id === club.zoneId);
                      return (
                        <SelectItem key={club.id} value={club.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{club.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {zone?.name || 'Unknown Zone'}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Club Information Display */}
            {selectedClub && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {/* Club Details */}
                <Card className="enhanced-card border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Club</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-primary">{selectedClub.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedZone?.name || 'Unknown Zone'}
                      </div>
                      {selectedClub.email && (
                        <div className="text-sm text-muted-foreground">
                          📧 {selectedClub.email}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Submitted Events */}
                <Card className="enhanced-card border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{submittedEvents}</div>
                    <div className="text-sm text-muted-foreground">Awaiting approval</div>
                  </CardContent>
                </Card>

                {/* Approved Events */}
                <Card className="enhanced-card border-l-4 border-l-green-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{approvedEvents}</div>
                    <div className="text-sm text-muted-foreground">Events confirmed</div>
                  </CardContent>
                </Card>

                {/* Total Events */}
                <Card className="enhanced-card border-l-4 border-l-blue-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Events</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{totalEvents}</div>
                    <div className="text-sm text-muted-foreground">
                      {rejectedEvents > 0 && `(${rejectedEvents} rejected)`}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
