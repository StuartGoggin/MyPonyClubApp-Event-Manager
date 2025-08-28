'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Clock, Users, Building, Plus, Activity } from 'lucide-react';
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
  const [showAddEventModal, setShowAddEventModal] = useState(false);

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
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchData} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50/50 via-background to-blue-50/30">
      {/* Compact Enhanced Header */}
      <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-xl shadow-primary/10 bg-gradient-to-r from-white/95 via-white/90 to-primary/5 flex-shrink-0 mx-4 mt-4">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Club Event Manager
              </h1>
              <p className="text-muted-foreground text-sm font-medium">Submit and manage your event requests</p>
            </div>
            <div className="w-72">
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="enhanced-select bg-white/90 backdrop-blur-sm border border-border/50 shadow-md h-10">
                  <SelectValue placeholder="Select your club">
                    {selectedClub?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="glass-effect">
                  {clubs
                    .filter(club => authorizedClubs.includes(club.id))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(club => {
                      const zone = zones.find(z => z.id === club.zoneId);
                      return (
                        <SelectItem key={club.id} value={club.id}>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{club.name}</div>
                              <div className="text-xs text-muted-foreground">
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
          <div className="h-0.5 w-24 bg-gradient-to-r from-primary to-accent rounded-full mt-3 shadow-sm"></div>
        </CardHeader>
      </Card>

      {/* Compact Enhanced Stats */}
      {selectedClub && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0 mx-4">
          <Card className="enhanced-card glass-effect bg-gradient-to-br from-amber-50/90 to-orange-50/70 border-amber-300/60 shadow-lg shadow-amber-200/40 hover:shadow-xl hover:shadow-amber-300/50 transition-all duration-300 border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-amber-200/80 to-amber-300/60 rounded-lg shadow-inner backdrop-blur-sm">
                  <Clock className="h-5 w-5 text-amber-800" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-amber-900">{submittedEvents}</div>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Submitted</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card glass-effect bg-gradient-to-br from-emerald-50/90 to-green-50/70 border-emerald-300/60 shadow-lg shadow-emerald-200/40 hover:shadow-xl hover:shadow-emerald-300/50 transition-all duration-300 border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-200/80 to-emerald-300/60 rounded-lg shadow-inner backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-emerald-800" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-emerald-900">{approvedEvents}</div>
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="enhanced-card glass-effect bg-gradient-to-br from-blue-50/90 to-cyan-50/70 border-blue-300/60 shadow-lg shadow-blue-200/40 hover:shadow-xl hover:shadow-blue-300/50 transition-all duration-300 border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-200/80 to-blue-300/60 rounded-lg shadow-inner backdrop-blur-sm">
                  <Activity className="h-5 w-5 text-blue-800" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-blue-900">{totalEvents}</div>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Management Section - Scrollable */}
      {selectedClub && (
        <div className="flex-1 overflow-hidden mx-4 mb-4">
          <div className="h-full bg-gradient-to-r from-slate-100/40 via-background/80 to-blue-100/40 rounded-xl border border-border/30 shadow-inner flex flex-col">
            {/* Header with Add Event Button */}
            <div className="flex items-center justify-between p-4 flex-shrink-0 border-b border-border/20">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Event Status ({totalEvents})</h3>
              </div>
              <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6 py-3 font-semibold"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-effect">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Submit New Event
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Create a new event request for {selectedClub.name} in {selectedZone?.name || 'Unknown Zone'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <ClubEventSubmission
                      clubId={selectedClubId}
                      clubName={selectedClub.name}
                      zoneName={selectedZone?.name || 'Unknown Zone'}
                      eventTypes={eventTypes}
                      onEventSubmitted={(event) => {
                        handleEventUpdate(event);
                        setShowAddEventModal(false);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Event Status Display - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <ClubEventStatus
                clubId={selectedClubId}
                clubName={selectedClub.name}
                events={clubEvents}
                clubs={clubs}
                eventTypes={eventTypes}
                onEventUpdate={handleEventUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Compact Empty States */}
      {!selectedClub && clubs.length > 0 && (
        <div className="flex-1 flex items-center justify-center mx-4 mb-4">
          <Card className="enhanced-card glass-effect bg-gradient-to-br from-slate-50/80 to-blue-50/60">
            <CardContent className="p-6 text-center">
              <Building className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Select a Club</h3>
              <p className="text-muted-foreground text-sm">
                Choose your club from the dropdown above to get started.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {clubs.length === 0 && (
        <div className="flex-1 flex items-center justify-center mx-4 mb-4">
          <Card className="enhanced-card glass-effect bg-gradient-to-br from-slate-50/80 to-red-50/60">
            <CardContent className="p-6 text-center">
              <Building className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">No Clubs Available</h3>
              <p className="text-muted-foreground text-sm">
                Contact your administrator for club access.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
