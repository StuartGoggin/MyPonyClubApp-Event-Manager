'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Clock, Users, Building, Plus, Activity, Calendar, FileText, XCircle, Filter, AlertTriangle, Settings, Package } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { ClubEventSubmission } from '@/components/club-manager/club-event-submission';
import { ClubEventStatus } from '@/components/club-manager/club-event-status';
import { CommitteeNominationStatus } from '@/components/club-manager/committee-nomination-status';
import { CommitteeNominationForm } from '@/components/forms/committee-nomination-form';
import { ClubEquipmentDashboard } from '@/components/equipment/club-equipment-dashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getUserRoles, hasRole } from '@/lib/access-control';

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
  const [showCommitteeNominationModal, setShowCommitteeNominationModal] = useState(false);
  const [editingNominationId, setEditingNominationId] = useState<string | null>(null);
  const [nominationData, setNominationData] = useState<any>(null);
  const [committeeRefreshKey, setCommitteeRefreshKey] = useState(0);
  const [mainTab, setMainTab] = useState<string>('events');
  const [isNominationDue, setIsNominationDue] = useState(false);

  // Helper function to check if user has access to a club
  const hasClubAccess = (clubId: string, userZoneId?: string): boolean => {
    if (!user) return false;
    
    const userRoles = getUserRoles(user);
    
    // Super users and zone reps have access to all clubs
    if (userRoles.includes('super_user') || userRoles.includes('zone_rep')) {
      return true;
    }
    
    // Standard users can only access their own club
    if (userRoles.includes('standard') && !userRoles.includes('club_manager')) {
      return user.clubId === clubId;
    }
    
    // Club managers can access their own club
    if (userRoles.includes('club_manager')) {
      return user.clubId === clubId;
    }
    
    return false;
  };

  // Helper function to get authorized clubs based on user role
  const getAuthorizedClubIds = useCallback((allClubs: Club[], userRole: string, userClubId?: string, userZoneId?: string): string[] => {
    if (!user) return [];
    
    const userRoles = getUserRoles(user);
    
    // Super users can access all clubs
    if (userRoles.includes('super_user')) {
      return allClubs.map(club => club.id);
    }
    
    // Zone reps can access all clubs in their zone
    if (userRoles.includes('zone_rep') && userZoneId) {
      return allClubs.filter(club => club.zoneId === userZoneId).map(club => club.id);
    }
    
    // Club managers and standard users can only access their own club
    if ((userRoles.includes('club_manager') || userRoles.includes('standard')) && userClubId) {
      return allClubs.some(club => club.id === userClubId) ? [userClubId] : [];
    }
    
    return [];
  }, [user]);

  const fetchData = useCallback(async () => {
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

      // Auto-select user's primary club if they have one, otherwise first authorized club
      let defaultClubId = '';
      
      // Priority 1: User's assigned club (for all roles)
      if (user?.clubId && authorizedClubIds.includes(user.clubId)) {
        defaultClubId = user.clubId;
        console.log('Club Manager: Auto-selected user\'s assigned club:', defaultClubId);
      } 
      // Priority 2: First authorized club (fallback)
      else if (authorizedClubIds.length > 0) {
        defaultClubId = authorizedClubIds[0];
        console.log('Club Manager: Auto-selected first authorized club:', defaultClubId);
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
  }, [user, getAuthorizedClubIds]);

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
  }, [isAuthenticated, authLoading, user, router, fetchData]);

  // Check if committee nomination is due for current year
  const checkNominationStatus = useCallback(async (clubId: string) => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/committee-nominations?clubId=${clubId}&year=${currentYear}`);
      
      if (response.ok) {
        const data = await response.json();
        // Nomination is due if there's no nomination for current year
        setIsNominationDue(!data || Object.keys(data).length === 0);
      } else {
        // If no nomination found, it's due
        setIsNominationDue(true);
      }
    } catch (error) {
      console.error('Error checking nomination status:', error);
      // Assume it's due on error to be safe
      setIsNominationDue(true);
    }
  }, []);

  // Check nomination status when club changes or nomination is refreshed
  useEffect(() => {
    if (selectedClubId) {
      checkNominationStatus(selectedClubId);
    }
  }, [selectedClubId, committeeRefreshKey, checkNominationStatus]);

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

  // Create statistics object for the UI
  const statistics = {
    submitted: submittedEvents,
    approved: approvedEvents,
    rejected: rejectedEvents,
    total: totalEvents
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-auto aspect-[16/10] flex items-center justify-center p-2">
                {selectedClub?.image && selectedClub.image.startsWith('data:image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedClub.image}
                    alt={`${selectedClub.name} Logo`}
                    className="object-contain w-full h-full drop-shadow-lg"
                  />
                ) : selectedClub?.logoUrl && selectedClub.logoUrl.startsWith('data:image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedClub.logoUrl}
                    alt={`${selectedClub.name} Logo`}
                    className="object-contain w-full h-full drop-shadow-lg"
                  />
                ) : (
                  <Image
                    src="/myponyclub-logo-club-manager.png"
                    alt="Club Manager Logo"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {selectedClub ? selectedClub.name : 'Club Manager'}
                  <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                    Club Level
                  </Badge>
                </h1>
                <p className="text-blue-100 mt-1">
                  {selectedClub ? `Manage ${selectedClub.name}'s events and schedules` : 'Manage your club\'s events and schedules'}
                </p>
              </div>
            </div>
            
            {/* Club Selection */}
            <div className="w-full sm:w-auto sm:min-w-[300px]">
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="h-14 bg-white/90 hover:bg-white text-blue-600 shadow-lg border-white/40">
                  <SelectValue>
                    {selectedClub ? (
                      <div className="text-left w-full">
                        <div className="text-lg font-bold text-foreground truncate">
                          {selectedClub.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{selectedZone?.name || 'Unknown Zone'}</span>
                        </div>
                      </div>
                    ) : (
                      <span>Choose your club...</span>
                    )}
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
            </div>
          </div>
        </div>

        {/* Main Layout - Sidebar Navigation */}
        {selectedClub && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Vertical Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-6 shadow-lg">
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {/* Overview Section */}
                    <button
                      onClick={() => setMainTab('overview')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'overview'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      title="View club statistics and overview"
                    >
                      <Activity className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Overview</div>
                        <div className="text-xs opacity-80">Club statistics</div>
                      </div>
                    </button>

                    {/* Events Section */}
                    <button
                      onClick={() => setMainTab('events')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'events'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      title="Manage club events and schedules"
                    >
                      <Calendar className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Events</div>
                        <div className="text-xs opacity-80">Manage events</div>
                      </div>
                    </button>

                    {/* Committees Section */}
                    <button
                      onClick={() => setMainTab('committees')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'committees'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      title="Manage committee nominations"
                    >
                      <Users className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold flex items-center gap-2">
                          Committees
                          {isNominationDue && (
                            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">
                              Due
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs opacity-80">Nominations</div>
                      </div>
                    </button>

                    {/* Equipment Section */}
                    <button
                      onClick={() => setMainTab('equipment')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'equipment'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      title="Browse and request zone equipment"
                    >
                      <Package className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Book Zone Equipment</div>
                        <div className="text-xs opacity-80">Request & manage</div>
                      </div>
                    </button>

                    {/* Settings Section */}
                    <button
                      onClick={() => router.push(`/club-manager/settings?clubId=${selectedClubId}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Club configuration and settings"
                    >
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Settings</div>
                        <div className="text-xs opacity-80">Configuration</div>
                      </div>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Overview Tab */}
              {mainTab === 'overview' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Events</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {clubEvents.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Approved</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {statistics.approved}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {statistics.submitted}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Rejected</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {statistics.rejected}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <XCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {mainTab === 'events' && (
                <div className="space-y-6">
                  <div className="flex-1">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
            {/* Header with Event Filter and Add Event Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-border/20">
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
                </div>
              )}

              {/* Committees Tab */}
              {mainTab === 'committees' && (
                <div className="space-y-6">
                  <div>
                    <CommitteeNominationStatus
                      key={`committee-${selectedClubId}-${committeeRefreshKey}`}
                      clubId={selectedClubId}
                      onNominateCommittee={() => {
                        setEditingNominationId(null);
                        setNominationData(null);
                        setShowCommitteeNominationModal(true);
                      }}
                      onEditNomination={async (nominationId) => {
                        // Fetch the nomination data
                        try {
                          const response = await fetch(`/api/committee-nominations/${nominationId}`);
                          if (response.ok) {
                            const data = await response.json();
                            setEditingNominationId(nominationId);
                            setNominationData(data);
                            setShowCommitteeNominationModal(true);
                          }
                        } catch (error) {
                          console.error('Error fetching nomination for edit:', error);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Equipment Tab */}
              {mainTab === 'equipment' && selectedClub && selectedZone && (
                <div className="space-y-6">
                  <ClubEquipmentDashboard
                    zoneId={selectedZone.id}
                    zoneName={selectedZone.name}
                    clubId={selectedClub.id}
                    clubName={selectedClub.name}
                    clubLocation={(() => {
                      if (selectedClub.address && typeof selectedClub.address === 'object') {
                        const addr = selectedClub.address as any;
                        const parts = [
                          addr.address1,
                          addr.address2,
                          addr.town,
                          addr.postcode,
                          addr.county
                        ].filter(Boolean);
                        return parts.join(', ');
                      }
                      return (selectedClub as any).physicalAddress || '';
                    })()}
                    userEmail={user?.email || ''}
                    userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                    userPhone={(user as any)?.mobileNumber || ''}
                  />
                </div>
              )}
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
        <div className="flex-1 flex items-center justify-center mb-8">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg">
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

      {/* Committee Nomination Modal */}
      <Dialog open={showCommitteeNominationModal} onOpenChange={setShowCommitteeNominationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNominationId ? 'Edit' : 'Nominate'} Club Committee</DialogTitle>
          </DialogHeader>
          {selectedClub && (
            <CommitteeNominationForm
              clubId={selectedClubId}
              clubName={selectedClub.name}
              zoneId={selectedClub.zoneId}
              zoneName={selectedZone?.name || ''}
              existingNominationId={editingNominationId || undefined}
              initialData={nominationData}
              onSubmitSuccess={() => {
                setShowCommitteeNominationModal(false);
                setEditingNominationId(null);
                setNominationData(null);
                // Trigger a re-render of the CommitteeNominationStatus component
                setCommitteeRefreshKey(prev => prev + 1);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
