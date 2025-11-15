'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  Edit3, 
  Trash2, 
  Download, 
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  Save,
  X
} from 'lucide-react';
import { Event, Zone, Club, EventType } from '@/lib/types';

// Utility function to format dates
const formatDate = (date: Date | string | any) => {
  try {
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date && typeof date === 'object' && date.toDate) {
      validDate = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
      validDate = new Date(date.seconds * 1000);
    } else {
      throw new Error('Invalid date format');
    }
    
    if (isNaN(validDate.getTime())) {
      throw new Error('Invalid date value');
    }
    
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(validDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

// Convert date to YYYY-MM-DD format for input
const formatDateForInput = (date: Date | string | any): string => {
  try {
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date && typeof date === 'object' && date.toDate) {
      validDate = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
      validDate = new Date(date.seconds * 1000);
    } else {
      return '';
    }
    
    if (isNaN(validDate.getTime())) {
      return '';
    }
    
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const day = String(validDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

interface StateEventManagementProps {
  events: Event[];
  zones: Zone[];
  clubs: Club[];
  eventTypes: EventType[];
  onEventUpdate: () => void;
}

interface EventFormData {
  name: string;
  date: string;
  eventTypeId: string;
  location: string;
  description: string;
  coordinatorName: string;
  coordinatorContact: string;
}

const emptyFormData: EventFormData = {
  name: '',
  date: '',
  eventTypeId: '',
  location: '',
  description: '',
  coordinatorName: '',
  coordinatorContact: ''
};

export function StateEventManagement({ 
  events, 
  zones,
  clubs,
  eventTypes, 
  onEventUpdate 
}: StateEventManagementProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'state' | 'public_holiday'>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(emptyFormData);

  const getEventTypeName = (eventTypeId: string | undefined) => {
    if (!eventTypeId) return 'Unknown Type';
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || event.eventTypeId === typeFilter;
    const matchesSource = sourceFilter === 'all' || 
                         (sourceFilter === 'public_holiday' && event.source === 'public_holiday') ||
                         (sourceFilter === 'state' && event.source !== 'public_holiday');
    return matchesSearch && matchesType && matchesSource;
  });

  // Group events by time period
  const eventsByStatus = {
    upcoming: filteredEvents.filter(event => new Date(event.date) >= new Date()),
    past: filteredEvents.filter(event => new Date(event.date) < new Date())
  };

  const handleAddEvent = () => {
    setFormData(emptyFormData);
    setIsAddDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name || '',
      date: formatDateForInput(event.date),
      eventTypeId: event.eventTypeId || '',
      location: event.location || '',
      description: event.description || '',
      coordinatorName: event.coordinatorName || '',
      coordinatorContact: event.coordinatorContact || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const submitEvent = async (isEdit: boolean) => {
    if (!formData.name || !formData.date || !formData.eventTypeId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Date, Event Type)',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        ...formData,
        status: 'approved', // State events are automatically approved
        source: 'state' as const, // Mark as state-level event
        date: new Date(formData.date).toISOString()
        // Note: No zoneId or clubId for state-level events
      };

      console.log('🔍 Creating state event with data:', eventData);

      const url = isEdit ? `/api/events/${selectedEvent?.id}` : '/api/events';
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();
      console.log('📡 API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save event');
      }

      toast({
        title: 'Success',
        description: `State event ${isEdit ? 'updated' : 'created'} successfully`,
      });

      console.log('✅ Event created successfully, refreshing data...');
      onEventUpdate();
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      setFormData(emptyFormData);
    } catch (error) {
      console.error('❌ Error saving event:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} event. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast({
        title: 'Success',
        description: 'State event deleted successfully',
      });

      onEventUpdate();
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportEvents = async () => {
    try {
      // Export state-level events (no zone filter)
      const response = await fetch('/api/admin/export-events?stateOnly=true');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `state_events_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting events:', error);
      toast({
        title: 'Error',
        description: 'Failed to export events',
        variant: 'destructive'
      });
    }
  };

  const EventTable = ({ events }: { events: Event[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event Details</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Coordinator</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No state events found
            </TableCell>
          </TableRow>
        ) : (
          events.map(event => (
            <TableRow key={event.id}>
              <TableCell>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{event.name}</div>
                    {event.source === 'public_holiday' && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Public Holiday
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getEventTypeName(event.eventTypeId)}
                  </div>
                  {event.location && (
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                  {event.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(event.date)}
                </div>
              </TableCell>
              <TableCell>
                {event.coordinatorName ? (
                  <div>
                    <div className="font-medium">{event.coordinatorName}</div>
                    {event.coordinatorContact && (
                      <div className="text-sm text-muted-foreground">{event.coordinatorContact}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditEvent(event)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteEvent(event)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                State Event Management
              </CardTitle>
              <CardDescription>
                Manage state-level events and public holidays. State events can be created manually, while public holidays are synced from an external source.
              </CardDescription>
            </div>
            <Button
              onClick={handleAddEvent}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add State Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Event Source</Label>
              <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="state">State Events</SelectItem>
                  <SelectItem value="public_holiday">Public Holidays</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>State Events</CardTitle>
            <Button variant="outline" size="sm" onClick={exportEvents}>
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Upcoming ({eventsByStatus.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Past ({eventsByStatus.past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              <EventTable events={eventsByStatus.upcoming} />
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <EventTable events={eventsByStatus.past} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Add State Event
            </DialogTitle>
            <DialogDescription>
              Create a new state-level event. State events are automatically approved and visible to all zones and clubs.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Event Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter event name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-date">Date *</Label>
                <Input
                  id="add-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="add-eventType">Event Type *</Label>
                <Select 
                  value={formData.eventTypeId} 
                  onValueChange={(value) => setFormData({ ...formData, eventTypeId: value })}
                >
                  <SelectTrigger id="add-eventType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-location">Location</Label>
              <Input
                id="add-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="add-coordinatorName">Coordinator Name</Label>
                <Input
                  id="add-coordinatorName"
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  placeholder="Coordinator name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="add-coordinatorContact">Coordinator Contact</Label>
                <Input
                  id="add-coordinatorContact"
                  value={formData.coordinatorContact}
                  onChange={(e) => setFormData({ ...formData, coordinatorContact: e.target.value })}
                  placeholder="Email or phone"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => submitEvent(false)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Edit State Event
            </DialogTitle>
            <DialogDescription>
              Update the state event details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Event Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter event name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-eventType">Event Type *</Label>
                <Select 
                  value={formData.eventTypeId} 
                  onValueChange={(value) => setFormData({ ...formData, eventTypeId: value })}
                >
                  <SelectTrigger id="edit-eventType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-coordinatorName">Coordinator Name</Label>
                <Input
                  id="edit-coordinatorName"
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  placeholder="Coordinator name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-coordinatorContact">Coordinator Contact</Label>
                <Input
                  id="edit-coordinatorContact"
                  value={formData.coordinatorContact}
                  onChange={(e) => setFormData({ ...formData, coordinatorContact: e.target.value })}
                  placeholder="Email or phone"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => submitEvent(true)}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete State Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this state event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-medium">{selectedEvent.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {getEventTypeName(selectedEvent.eventTypeId)} • {formatDate(selectedEvent.date)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteEvent}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
