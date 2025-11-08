'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Clock, Users, Building, Plus, Activity, Calendar, FileText, XCircle, Filter, AlertTriangle } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { ClubEventSubmission } from '@/components/club-manager/club-event-submission';
import { ClubEventStatus } from '@/components/club-manager/club-event-status';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function ClubEventManagerDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [authorizedClubs, setAuthorizedClubs] = useState<string[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  // Helper function to check if user has access to a club
  const hasClubAccess = (clubId: string, userZoneId?: string): boolean => {
    if (!user) return false;
    
    // Super users and zone reps have access to all clubs
    if (user.role === 'super_user' || user.role === 'zone_rep') {
      return true;
    }
    
    // Standard users can only access their own club
    if (user.role === 'standard') {
      return user.clubId === clubId;
    }
    
    return false;
  };

  // Helper function to get authorized clubs based on user role
  const getAuthorizedClubIds = (allClubs: Club[], userRole: string, userClubId?: string, userZoneId?: string): string[] => {
    if (!user) return [];
    
    // Super users can access all clubs
    if (userRole === 'super_user') {
      return allClubs.map(club => club.id);
    }
    
    // Zone reps can access all clubs in their zone
    if (userRole === 'zone_rep' && userZoneId) {
      return allClubs.filter(club => club.zoneId === userZoneId).map(club => club.id);
    }
    
    // Standard users can only access their own club
    if (userRole === 'standard' && userClubId) {
      return allClubs.some(club => club.id === userClubId) ? [userClubId] : [];
    }
    
    return [];
  };

  // Check authentication and authorization
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!user) {
      setAccessDenied(true);
      return;
    }
    
    fetchData();
  }, [isAuthenticated, authLoading, user, router]);

  const fetchData = async () => {
    console.log('Club Manager: fetchData called - refreshing all data');
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

      console.log('Club Manager: API Responses:', { zonesData, clubsData, eventsData, eventTypesData });

      // Extract arrays from API responses (they return objects with nested arrays)
      setZones(zonesData.zones || zonesData || []);
      setClubs(clubsData.clubs || clubsData || []);
      setEvents(eventsData.events || eventsData || []);
      setEventTypes(eventTypesData.eventTypes || eventTypesData || []);

      console.log('Club Manager: Data updated in state');

      // Get user-authorized clubs based on role and associations
      const clubsArray = clubsData.clubs || clubsData || [];
      const authorizedClubIds = getAuthorizedClubIds(
        clubsArray, 
        user?.role || '', 
        user?.clubId, 
        user?.zoneId
      );
      
      setAuthorizedClubs(authorizedClubIds);

      // Check if user has access to any clubs
      if (authorizedClubIds.length === 0) {
        setAccessDenied(true);
        setError('Access denied: You do not have permission to manage any clubs.');
        return;
      }

      // Auto-select user's primary club or first authorized club
      let defaultClubId = '';
      if (user?.role === 'standard' && user?.clubId && authorizedClubIds.includes(user.clubId)) {
        defaultClubId = user.clubId;
      } else if (authorizedClubIds.length > 0) {
        defaultClubId = authorizedClubIds[0];
      }
      
      if (defaultClubId) {
        setSelectedClubId(defaultClubId);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventUpdate = () => {
    console.log('Club Manager: handleEventUpdate called - triggering data refresh');
    fetchData(); // Refresh all data when events are updated
  };

  // Filter data for selected club with defensive programming
  const selectedClub = clubs.find(club => club.id === selectedClubId);
  const selectedZone = zones.find(zone => zone.id === selectedClub?.zoneId);
  const clubEvents = Array.isArray(events) ? events.filter(event => event.clubId === selectedClubId) : [];

  // Filter events based on time
  const filteredClubEvents = clubEvents.filter(event => {
    if (eventFilter === 'all') return true;
    
    const currentDate = new Date();
    const eventDate = new Date(event.date);
    
    if (eventFilter === 'upcoming') {
      return eventDate >= currentDate;
    } else if (eventFilter === 'past') {
      return eventDate < currentDate;
    }
    
    return true;
  });

  // Dashboard statistics for selected club
  const submittedEvents = clubEvents.filter(event => event.status === 'proposed').length;
  const approvedEvents = clubEvents.filter(event => event.status === 'approved').length;
  const rejectedEvents = clubEvents.filter(event => event.status === 'rejected').length;
  const totalEvents = clubEvents.length;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-primary/5 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full glass-effect border-2 border-destructive/20 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-destructive">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You do not have permission to access the club management dashboard.
            </p>
            <div className="text-sm text-muted-foreground mb-4">
              {user?.role === 'standard' && (
                <p>Standard users can only manage events for their assigned club.</p>
              )}
              {(!user?.clubId && user?.role === 'standard') && (
                <p>No club association found in your profile. Please contact an administrator.</p>
              )}
            </div>
            <Button onClick={() => router.push('/admin')} variant="outline">
              Go to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50/50 via-background to-blue-50/30">
      {/* Unified Header Zone with Two Rows */}
      <div className="flex-shrink-0 mx-4 mt-4 mb-6 space-y-4">
        
        {/* Top Row: Page Info + Club Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Page Info Tile */}
          <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-lg bg-gradient-to-r from-white/98 via-white/95 to-primary/8">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg shadow-inner backdrop-blur-sm">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                      Club Event Manager
                    </h1>
                    {user && (
                      <Badge variant={
                        user.role === 'super_user' ? 'default' : 
                        user.role === 'zone_rep' ? 'secondary' : 
                        'outline'
                      } className="text-xs">
                        {user.role === 'super_user' ? 'Super User' : 
                         user.role === 'zone_rep' ? 'Zone Rep' : 
                         'Standard'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs font-medium">
                    Submit and manage your event requests
                    {user?.role === 'standard' && ' for your club'}
                    {user?.role === 'zone_rep' && ' for clubs in your zone'}
                    {user?.role === 'super_user' && ' for all clubs'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Club Selection Tile */}
          <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-lg bg-gradient-to-r from-white/98 via-white/95 to-blue/8">
            <CardContent className="p-4">
              {selectedClub ? (
                <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                  <SelectTrigger className="border-none shadow-none bg-transparent p-0 h-auto hover:bg-transparent focus:ring-0 w-full">
                    <div className="text-left w-full">
                      <h2 className="text-lg font-bold text-foreground cursor-pointer hover:text-primary transition-colors leading-tight truncate">
                        {selectedClub.name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs font-medium truncate">{selectedZone?.name || 'Unknown Zone'}</span>
                      </div>
                    </div>
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
              ) : (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">Select Club</h3>
                  <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                    <SelectTrigger className="enhanced-select bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm h-9 text-sm">
                      <SelectValue placeholder="Choose your club..." />
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Statistics */}
        {selectedClub && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Event Date Requests Statistics */}
            <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-lg bg-gradient-to-r from-blue-50/90 to-cyan-50/70 border-blue-300/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-800">Event Date Requests</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-muted-foreground">Pending Approval</span>
                    </div>
                    <span className="text-sm font-bold text-amber-800">{clubEvents.filter(e => e.status === 'proposed').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-muted-foreground">Dates Approved</span>
                    </div>
                    <span className="text-sm font-bold text-green-800">{clubEvents.filter(e => e.status === 'approved').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-muted-foreground">Total Events</span>
                    </div>
                    <span className="text-sm font-bold text-blue-800">{clubEvents.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Schedule Management Statistics */}
            <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-lg bg-gradient-to-r from-emerald-50/90 to-green-50/70 border-emerald-300/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-bold text-green-800">Schedule Management</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-muted-foreground">Under Review</span>
                    </div>
                    <span className="text-sm font-bold text-amber-800">{clubEvents.filter(e => e.schedule && e.schedule.status === 'pending').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs font-medium text-muted-foreground">Require Rework</span>
                    </div>
                    <span className="text-sm font-bold text-red-800">{clubEvents.filter(e => e.schedule && e.schedule.status === 'rejected').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-muted-foreground">Approved</span>
                    </div>
                    <span className="text-sm font-bold text-green-800">{clubEvents.filter(e => e.schedule && e.schedule.status === 'approved').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-muted-foreground">Total Schedules</span>
                    </div>
                    <span className="text-sm font-bold text-green-800">{clubEvents.filter(e => e.schedule).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Event Management Section */}
      {selectedClub && (
        <div className="flex-1 mx-4 mb-4">
          <div className="bg-gradient-to-r from-slate-200/30 via-white/90 to-blue-100/30 rounded-xl border border-border/30 shadow-inner">
            {/* Header with Event Filter and Add Event Button */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              {/* Event Filter - Only show when viewing events */}
              {!showAddEventForm && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 p-1 bg-gradient-to-r from-slate-100 via-white to-blue-50 rounded-xl border border-border/40 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Filter:</span>
                    </div>
                    
                    {/* Filter Buttons */}
                    {[
                      { key: 'all', label: 'All Events', icon: Calendar },
                      { key: 'upcoming', label: 'Upcoming', icon: Clock },
                      { key: 'past', label: 'Past Events', icon: CheckCircle }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setEventFilter(key as 'all' | 'upcoming' | 'past')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          eventFilter === key
                            ? 'bg-gradient-to-r from-primary/20 via-primary/15 to-accent/20 text-primary border border-primary/30 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                        {key === 'all' && (
                          <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold">
                            {clubEvents.length}
                          </span>
                        )}
                        {key === 'upcoming' && (
                          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                            {clubEvents.filter(e => new Date(e.date) >= new Date()).length}
                          </span>
                        )}
                        {key === 'past' && (
                          <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-bold">
                            {clubEvents.filter(e => new Date(e.date) < new Date()).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer when filter is hidden */}
              {showAddEventForm && <div></div>}

              {/* Add Event Button */}
              <Button 
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                size="lg"
                className="distinctive-button-primary bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 py-4 font-bold text-lg rounded-2xl border-2 border-emerald-400/50 hover:border-emerald-300 backdrop-blur-sm"
              >
                {showAddEventForm ? (
                  <>
                    <Users className="h-6 w-6 mr-3 drop-shadow-lg" />
                    View Events
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 mr-3 drop-shadow-lg" />
                    Add Event
                  </>
                )}
              </Button>
            </div>

            {/* Content Area - Event List or Add Form */}
            <div className="p-4">
              {showAddEventForm ? (
                // Add Event Form
                <div className="space-y-4">
                  <div className="border-b border-border/20 pb-4 mb-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Submit New Event
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Create a new event request for {selectedClub.name} in {selectedZone?.name || 'Unknown Zone'}
                    </p>
                  </div>
                  <ClubEventSubmission
                    clubId={selectedClubId}
                    clubName={selectedClub.name}
                    zoneName={selectedZone?.name || 'Unknown Zone'}
                    eventTypes={eventTypes}
                    onEventSubmitted={() => {
                      handleEventUpdate();
                      setShowAddEventForm(false);
                    }}
                  />
                </div>
              ) : (
                // Event Status Display
                <ClubEventStatus
                  clubId={selectedClubId}
                  clubName={selectedClub.name}
                  events={filteredClubEvents}
                  clubs={clubs}
                  eventTypes={eventTypes}
                  onEventUpdate={handleEventUpdate}
                />
              )}
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
