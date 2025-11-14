'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

  // Filter events based on time and sort by date (nearest first)
  const filteredClubEvents = clubEvents
    .filter(event => {
      if (eventFilter === 'all') return true;
      
      const currentDate = new Date();
      const eventDate = new Date(event.date);
      
      if (eventFilter === 'upcoming') {
        return eventDate >= currentDate;
      } else if (eventFilter === 'past') {
        return eventDate < currentDate;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Convert dates to Date objects for comparison, handling various date formats
      const getValidDate = (date: any): Date => {
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        if (date && typeof date === 'object' && date.toDate) return date.toDate(); // Firestore timestamp
        if (date && typeof date === 'object' && date.seconds) return new Date(date.seconds * 1000); // Firestore timestamp
        return new Date(date); // Fallback
      };
      
      const dateA = getValidDate(a.date);
      const dateB = getValidDate(b.date);
      
      // Sort by date ascending (nearest first)
      return dateA.getTime() - dateB.getTime();
    });

  // Dashboard statistics for selected club
  const submittedEvents = clubEvents.filter(event => event.status === 'proposed').length;
  const approvedEvents = clubEvents.filter(event => event.status === 'approved').length;
  const rejectedEvents = clubEvents.filter(event => event.status === 'rejected').length;
  const totalEvents = clubEvents.length;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Club Event Manager...</p>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50/50 via-background to-blue-50/30">
      {/* Unified Header Zone */}
      <div className="flex-shrink-0 mx-4 mt-4 mb-6">
        
        {/* Merged Header Tile with Status Tiles */}
        <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-lg bg-gradient-to-r from-white/98 via-white/95 to-primary/8">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            {/* Top Row: Logo, Title, Club Selection */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 group">
              {/* Logo and Title */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg opacity-30 blur-lg animate-pulse group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm group-hover:border-primary/60 transition-all duration-300 group-hover:scale-105 overflow-hidden h-8 w-16 sm:h-9 sm:w-18">
                    <Image
                      src="/myponyclub-logo-club-manager.png"
                      alt="MyPonyClub Club Manager Logo"
                      fill
                      className="object-cover drop-shadow-lg transition-transform duration-300"
                      priority
                    />
                  </div>
                </div>
                
                <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent truncate">
                  MyPonyClub - Club Manager
                </h1>
              </div>

              {/* Club Selection */}
              <div className="w-full sm:w-auto sm:max-w-md">
                {selectedClub ? (
                  <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                    <SelectTrigger className="h-12 sm:h-14 border-primary/30 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50 w-full">
                      <SelectValue>
                        <div className="text-left sm:text-right w-full">
                          <div className="text-sm sm:text-lg font-bold text-foreground truncate">
                            {selectedClub.name}
                          </div>
                          <div className="flex items-center justify-start sm:justify-end gap-1.5 text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs font-medium truncate">{selectedZone?.name || 'Unknown Zone'}</span>
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
                                <div className="min-w-0 flex-1">
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
                ) : (
                  <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                    <SelectTrigger className="h-10 border-primary/30 bg-background/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Choose your club..." />
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
                                <div className="min-w-0 flex-1">
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
                )}
              </div>
            </div>

            {/* Status Tiles Row */}
            {selectedClub && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                
                {/* Pending Approval */}
                <div className="relative overflow-hidden rounded-lg border border-amber-200/60 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
                    <div className="rounded-md bg-amber-100 dark:bg-amber-900/50 p-1.5 border border-amber-300/60 dark:border-amber-700/60 flex-shrink-0">
                      <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-500 leading-none">{clubEvents.filter(e => e.status === 'proposed').length}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 text-center sm:text-right">Pending</span>
                  </div>
                </div>

                {/* Approved Events */}
                <div className="relative overflow-hidden rounded-lg border border-emerald-200/60 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50/90 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
                    <div className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 p-1.5 border border-emerald-300/60 dark:border-emerald-700/60 flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-500 leading-none">{clubEvents.filter(e => e.status === 'approved').length}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 text-center sm:text-right">Approved</span>
                  </div>
                </div>

                {/* Total Events */}
                <div className="relative overflow-hidden rounded-lg border border-blue-200/60 dark:border-blue-700/60 bg-gradient-to-br from-blue-50/90 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
                    <div className="rounded-md bg-blue-100 dark:bg-blue-900/50 p-1.5 border border-blue-300/60 dark:border-blue-700/60 flex-shrink-0">
                      <Activity className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-500 leading-none">{clubEvents.length}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 text-center sm:text-right">Total</span>
                  </div>
                </div>

                {/* Schedules Under Review */}
                <div className="relative overflow-hidden rounded-lg border border-orange-200/60 dark:border-orange-700/60 bg-gradient-to-br from-orange-50/90 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
                    <div className="rounded-md bg-orange-100 dark:bg-orange-900/50 p-1.5 border border-orange-300/60 dark:border-orange-700/60 flex-shrink-0">
                      <Clock className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-500 leading-none">{clubEvents.filter(e => e.schedule && e.schedule.status === 'pending').length}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 text-center sm:text-right">Review</span>
                  </div>
                </div>

                {/* Schedules Needing Rework */}
                <div className="relative overflow-hidden rounded-lg border border-red-200/60 dark:border-red-700/60 bg-gradient-to-br from-red-50/90 to-rose-50/80 dark:from-red-950/30 dark:to-rose-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
                    <div className="rounded-md bg-red-100 dark:bg-red-900/50 p-1.5 border border-red-300/60 dark:border-red-700/60 flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-500 leading-none">{clubEvents.filter(e => e.schedule && e.schedule.status === 'rejected').length}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 text-center sm:text-right">Rework</span>
                  </div>
                </div>

                {/* Approved Schedules */}
                <div className="relative overflow-hidden rounded-lg border border-green-200/60 dark:border-green-700/60 bg-gradient-to-br from-green-50/90 to-emerald-50/80 dark:from-green-950/30 dark:to-emerald-950/20 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="p-2 flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-0">
                    <div className="rounded-md bg-green-100 dark:bg-green-900/50 p-1.5 border border-green-300/60 dark:border-green-700/60 flex-shrink-0">
                      <FileText className="h-4 w-4 text-green-700 dark:text-green-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-500 leading-none">{clubEvents.filter(e => e.schedule && e.schedule.status === 'approved').length}</div>
                    <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400 text-center sm:text-right">Ready</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Management Section */}
      {selectedClub && (
        <div className="flex-1 mx-4 mb-4">
          <div className="bg-gradient-to-r from-slate-200/30 via-white/90 to-blue-100/30 rounded-xl border border-border/30 shadow-inner">
            {/* Header with Event Filter and Add Event Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border-b border-border/20">
              {/* Event Filter - Only show when viewing events */}
              {!showAddEventForm && (
                <div className="w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
                    <div className="flex items-center gap-1.5 px-2 py-1 flex-shrink-0">
                      <Filter className="h-4 w-4 text-primary" />
                      <span className="text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap">Filter:</span>
                    </div>
                    
                    {/* Filter Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
                      {[
                        { key: 'all', label: 'All Events', icon: Calendar },
                        { key: 'upcoming', label: 'Upcoming', icon: Clock },
                        { key: 'past', label: 'Past Events', icon: CheckCircle }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setEventFilter(key as 'all' | 'upcoming' | 'past')}
                          className={`flex items-center justify-between gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            eventFilter === key
                              ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40'
                              : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span>{label}</span>
                          </div>
                          {key === 'all' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              eventFilter === key 
                                ? 'bg-white/90 text-primary' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {clubEvents.length}
                            </span>
                          )}
                          {key === 'upcoming' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              eventFilter === key 
                                ? 'bg-white/90 text-blue-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {clubEvents.filter(e => new Date(e.date) >= new Date()).length}
                            </span>
                          )}
                          {key === 'past' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              eventFilter === key 
                                ? 'bg-white/90 text-gray-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {clubEvents.filter(e => new Date(e.date) < new Date()).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Spacer when filter is hidden */}
              {showAddEventForm && <div></div>}

              {/* Add Event Button */}
              <Button 
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                size="lg"
                className="distinctive-button-primary bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-4 sm:px-8 py-3 sm:py-4 font-bold text-base sm:text-lg rounded-2xl border-2 border-emerald-400/50 hover:border-emerald-300 backdrop-blur-sm w-full sm:w-auto"
              >
                {showAddEventForm ? (
                  <>
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 drop-shadow-lg" />
                    View Events
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 drop-shadow-lg" />
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
                    club={selectedClub}
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
