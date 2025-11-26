'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, CheckCircle, Clock, Users, Building, Plus, FileText, CalendarPlus, Settings, Package, Calendar, Save, Upload, Loader2, Image as ImageIcon, X, User, Mail, Phone } from 'lucide-react';
import { Zone, Club, Event, EventType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ZoneEventApproval } from '@/components/zone-manager/zone-event-approval';
import { ZoneScheduleApproval } from '@/components/zone-manager/zone-schedule-approval';
import { ZoneEventManagement } from '@/components/zone-manager/zone-event-management';
import { ZoneEventSubmission } from '@/components/zone-manager/zone-event-submission';
import { ZoneCommitteeApprovals } from '@/components/zone-manager/zone-committee-approvals';
import { ZoneEquipmentDashboard } from '@/components/zone-manager/zone-equipment-dashboard';
import { RouteGuard } from '@/components/auth/route-guard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { hasRole, getUserRoles } from '@/lib/access-control';
import { Suspense } from 'react';

function ZoneManagerContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddZoneEventForm, setShowAddZoneEventForm] = useState(false);
  const [pendingCommittees, setPendingCommittees] = useState(0);
  const [equipmentActionCount, setEquipmentActionCount] = useState(0);
  const [equipmentBookings, setEquipmentBookings] = useState<any[]>([]);
  const [mainTab, setMainTab] = useState<string>('events');

  // Settings form state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    streetAddress: '',
    secretaryName: '',
    secretaryEmail: '',
    secretaryMobile: '',
    imageUrl: ''
  });
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Future: This will be replaced with user's authorized zones from authentication
  const [authorizedZones, setAuthorizedZones] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
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
      const userRoles = getUserRoles(user);
      
      if (userRoles.includes('super_user')) {
        // Super users can access all zones
        setAuthorizedZones(zonesArray.map((zone: Zone) => zone.id));
      } else if (userRoles.includes('zone_rep') && user?.zoneId) {
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
  }, [user]);

  const fetchPendingCommitteesCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/committee-nominations/pending?zoneRepId=${user.id}`);
      if (response.ok) {
        const nominations = await response.json();
        setPendingCommittees(nominations.length);
      }
    } catch (error) {
      console.error('Error fetching pending committees count:', error);
    }
  }, [user?.id]);

  const fetchEquipmentBookings = useCallback(async () => {
    if (!selectedZoneId) return;
    
    try {
      const response = await fetch(`/api/equipment-bookings?zoneId=${selectedZoneId}`);
      if (response.ok) {
        const data = await response.json();
        const bookings = data.data || [];
        setEquipmentBookings(bookings);
        
        // Calculate action counts
        const pendingCount = bookings.filter((b: any) => b.status === 'pending').length;
        const handoverCount = bookings.filter((b: any) => 
          b.status === 'approved' || 
          b.status === 'confirmed' || 
          b.status === 'picked_up' || 
          b.status === 'in_use'
        ).length;
        
        setEquipmentActionCount(pendingCount + handoverCount);
      }
    } catch (error) {
      console.error('Error fetching equipment bookings:', error);
    }
  }, [selectedZoneId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user?.id) {
      fetchPendingCommitteesCount();
    }
  }, [user?.id, fetchPendingCommitteesCount]);

  useEffect(() => {
    if (selectedZoneId) {
      fetchEquipmentBookings();
    }
  }, [selectedZoneId, fetchEquipmentBookings]);

  // Populate settings form when zone changes
  useEffect(() => {
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    if (selectedZone) {
      const logoData = selectedZone.imageUrl && selectedZone.imageUrl.startsWith('data:image') ? selectedZone.imageUrl : '';
      
      setFormData({
        name: selectedZone.name || '',
        streetAddress: selectedZone.streetAddress || '',
        secretaryName: selectedZone.secretary?.name || '',
        secretaryEmail: selectedZone.secretary?.email || '',
        secretaryMobile: selectedZone.secretary?.mobile || '',
        imageUrl: logoData
      });

      if (logoData) {
        setLogoPreview(logoData);
      } else {
        setLogoPreview('');
      }
    }
  }, [selectedZoneId, zones]);

  // Settings form handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 500 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 500KB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData(prev => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload logo',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedZoneId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/zones/${selectedZoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          streetAddress: formData.streetAddress,
          imageUrl: formData.imageUrl,
          secretary: {
            name: formData.secretaryName,
            email: formData.secretaryEmail,
            mobile: formData.secretaryMobile
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update zone');
      }

      toast({
        title: 'Success',
        description: 'Zone information updated successfully',
      });

      // Refresh zone data
      await fetchData();
    } catch (error) {
      console.error('Error saving zone data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save zone information',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Check for tab parameter in URL
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['events', 'equipment', 'settings'].includes(tab)) {
      setMainTab(tab);
    }
  }, [searchParams]);

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
  const pendingSchedules = zoneEvents.filter(event => event.schedule && event.schedule.status === 'pending').length;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-auto aspect-[16/10] flex items-center justify-center p-2">
                {selectedZone?.imageUrl && selectedZone.imageUrl.startsWith('data:image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedZone.imageUrl}
                    alt={`${selectedZone.name} Logo`}
                    className="object-contain w-full h-full drop-shadow-lg"
                  />
                ) : (
                  <Image
                    src="/myponyclub-logo-zone-manager.png"
                    alt="Zone Manager Logo"
                    fill
                    className="object-contain drop-shadow-lg"
                    priority
                  />
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  {selectedZone ? selectedZone.name : 'Zone Manager'}
                  <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                    Zone Level
                  </Badge>
                </h1>
                <p className="text-blue-100 mt-1">
                  {selectedZone ? `Manage ${selectedZone.name}'s events and club activities` : 'Manage zone events and club activities'}
                </p>
              </div>
            </div>
            
            {/* Zone Selection */}
            <div className="w-full sm:w-auto sm:min-w-[300px]">
              <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                <SelectTrigger className="h-14 bg-white/90 hover:bg-white text-blue-600 shadow-lg border-white/40">
                  <SelectValue>
                    {selectedZone ? (
                      <div className="text-left w-full">
                        <div className="text-lg font-bold text-foreground truncate">
                          {selectedZone.name}
                        </div>
                      </div>
                    ) : (
                      <span>Select Zone...</span>
                    )}
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
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-base">{zone.name}</div>
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

        {/* Main Layout - Sidebar Navigation */}
        {selectedZone && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Vertical Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <Card className="sticky top-6 shadow-lg">
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {/* Events Section */}
                    <button
                      onClick={() => setMainTab('events')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'events'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Calendar className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Events</div>
                        <div className="text-xs opacity-80">Manage zone events</div>
                      </div>
                      {(pendingEvents + pendingSchedules + pendingCommittees > 0) && (
                        <Badge variant="destructive" className="text-xs">
                          {pendingEvents + pendingSchedules + pendingCommittees}
                        </Badge>
                      )}
                    </button>

                    {/* Equipment Section */}
                    <button
                      onClick={() => setMainTab('equipment')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'equipment'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Package className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Equipment</div>
                        <div className="text-xs opacity-80">Inventory & bookings</div>
                      </div>
                      {equipmentActionCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {equipmentActionCount}
                        </Badge>
                      )}
                    </button>

                    {/* Settings Section */}
                    <button
                      onClick={() => setMainTab('settings')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        mainTab === 'settings'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Settings</div>
                        <div className="text-xs opacity-80">Zone configuration</div>
                      </div>
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Events Section */}
              {mainTab === 'events' && (
                <div className="space-y-6">
                  {/* Event Sub-tabs */}
                  <Tabs defaultValue="approvals" className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <TabsList className="flex-1 grid grid-cols-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                      <TabsTrigger value="approvals" className="text-xs sm:text-sm" title="Review and approve club event date requests">
                        <Clock className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Event Dates</span>
                        <span className="sm:hidden">Dates</span>
                        {pendingEvents > 0 && (
                          <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                            {pendingEvents}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="schedules" className="text-xs sm:text-sm" title="Review and approve event schedules submitted by clubs">
                        <FileText className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Schedules</span>
                        <span className="sm:hidden">Sched</span>
                        {pendingSchedules > 0 && (
                          <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                            {pendingSchedules}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="committees" className="text-xs sm:text-sm" title="Review and approve committee nominations from clubs">
                        <Users className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Committees</span>
                        <span className="sm:hidden">Comm</span>
                        {pendingCommittees > 0 && (
                          <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">
                            {pendingCommittees}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="manage" className="text-xs sm:text-sm" title="Manage all approved zone events">
                        <CheckCircle className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">Manage</span>
                        <span className="sm:hidden">Mgmt</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Add Zone Event Button */}
                    <Button 
                      onClick={() => setShowAddZoneEventForm(!showAddZoneEventForm)}
                      size="lg"
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-xl whitespace-nowrap w-full sm:w-auto"
                    >
                      {showAddZoneEventForm ? (
                        <>
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          View Events
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Add Zone Event
                        </>
                      )}
                    </Button>
                  </div>

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

                  <TabsContent value="schedules" className="space-y-4">
                    <ZoneScheduleApproval
                      zoneId={selectedZoneId}
                      zoneName={selectedZone.name}
                      events={zoneEvents}
                      clubs={zoneClubs}
                      eventTypes={eventTypes}
                      onEventUpdate={fetchData}
                    />
                  </TabsContent>

                  <TabsContent value="committees" className="space-y-4">
                    <ZoneCommitteeApprovals
                      zoneId={selectedZoneId}
                      onUpdate={fetchPendingCommitteesCount}
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

                {/* Add Zone Event Form */}
                {showAddZoneEventForm && (
                  <Card className="border-2 border-primary/20 shadow-xl">
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
                          setShowAddZoneEventForm(false);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

              {/* Equipment Section */}
              {mainTab === 'equipment' && (
                <div className="space-y-6">
                  <ZoneEquipmentDashboard 
                    zoneId={selectedZoneId} 
                    zoneName={selectedZone.name}
                    onActionCountsChange={(counts) => {
                      const totalCount = counts.pending + counts.handover;
                      // Always update the count, even if it's 0, to reflect real data
                      setEquipmentActionCount(totalCount);
                    }}
                  />
                </div>
              )}

              {/* Settings Section */}
              {mainTab === 'settings' && (
                <div className="space-y-6">
                  {/* Zone Logo */}
                  <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Zone Logo
                      </CardTitle>
                      <CardDescription>
                        Upload your zone logo. Recommended size: 500x500px. Max size: 500KB.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Logo Preview */}
                        <div className="relative">
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/20 flex items-center justify-center">
                            {logoPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={logoPreview}
                                alt="Zone Logo"
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                            )}
                          </div>
                          {logoPreview && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={handleRemoveLogo}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            aria-label="Upload zone logo"
                          />
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {logoPreview ? 'Change Logo' : 'Upload Logo'}
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Supported formats: JPG, PNG, GIF, SVG
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Basic Information */}
                  <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Basic Information
                      </CardTitle>
                      <CardDescription>
                        Update your zone's basic details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Zone Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter zone name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="streetAddress">
                          <MapPin className="h-4 w-4 inline mr-2" />
                          Street Address
                        </Label>
                        <Textarea
                          id="streetAddress"
                          value={formData.streetAddress}
                          onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                          placeholder="Enter street address"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Secretary Information */}
                  <Card className="bg-white dark:bg-slate-900 shadow-lg border-slate-200 dark:border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Secretary Information
                      </CardTitle>
                      <CardDescription>
                        Zone secretary contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="secretaryName">Secretary Name</Label>
                        <Input
                          id="secretaryName"
                          value={formData.secretaryName}
                          onChange={(e) => handleInputChange('secretaryName', e.target.value)}
                          placeholder="Enter secretary name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="secretaryEmail">
                            <Mail className="h-4 w-4 inline mr-2" />
                            Email Address
                          </Label>
                          <Input
                            id="secretaryEmail"
                            type="email"
                            value={formData.secretaryEmail}
                            onChange={(e) => handleInputChange('secretaryEmail', e.target.value)}
                            placeholder="secretary@example.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="secretaryMobile">
                            <Phone className="h-4 w-4 inline mr-2" />
                            Mobile Number
                          </Label>
                          <Input
                            id="secretaryMobile"
                            type="tel"
                            value={formData.secretaryMobile}
                            onChange={(e) => handleInputChange('secretaryMobile', e.target.value)}
                            placeholder="0400 000 000"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex justify-end gap-4">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneManagerPage() {
  return (
    <RouteGuard requireAuth={true} requiredRoles={['super_user', 'zone_rep']}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Zone Manager Dashboard...</p>
          </div>
        </div>
      }>
        <ZoneManagerContent />
      </Suspense>
    </RouteGuard>
  );
}

export default ZoneManagerPage;
