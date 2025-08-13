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
      {/* Header with Zone Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zone Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Manage events and clubs within your authorized zones
          </p>
        </div>
        <div className="w-64">
          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a zone" />
            </SelectTrigger>
            <SelectContent>
              {zones
                .filter(zone => authorizedZones.includes(zone.id))
                .map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {zone.name}
                    </div>
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedZone && (
        <>
          {/* Zone Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Events</p>
                    <p className="text-2xl font-bold text-amber-600">{pendingEvents}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved Events</p>
                    <p className="text-2xl font-bold text-green-600">{approvedEvents}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Clubs</p>
                    <p className="text-2xl font-bold text-blue-600">{totalClubs}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Clubs</p>
                    <p className="text-2xl font-bold text-purple-600">{activeClubs}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {selectedZone.name}
              </CardTitle>
              <CardDescription>
                Zone management and event oversight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Zone Secretary</p>
                  <p>{selectedZone.secretary?.name || 'Not assigned'}</p>
                  {selectedZone.secretary?.email && (
                    <p className="text-blue-600">{selectedZone.secretary.email}</p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Event Approvers</p>
                  <p>{selectedZone.eventApprovers?.length || 0} assigned</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Clubs in Zone</p>
                  <p>{totalClubs} clubs</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
