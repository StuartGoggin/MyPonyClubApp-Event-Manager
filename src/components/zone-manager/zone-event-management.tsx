'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  User, 
  Edit3, 
  Trash2, 
  Download, 
  Search,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Mail,
  Send,
  FileText
} from 'lucide-react';
import { Event, Club, EventType } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Utility function to format dates with validation
const formatDate = (date: Date | string | any) => {
  try {
    // Handle various date formats that might come from the database
    let validDate: Date;
    
    if (date instanceof Date) {
      validDate = date;
    } else if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date && typeof date === 'object' && date.toDate) {
      // Firestore timestamp
      validDate = date.toDate();
    } else if (date && typeof date === 'object' && date.seconds) {
      // Firestore timestamp with seconds
      validDate = new Date(date.seconds * 1000);
    } else {
      throw new Error('Invalid date format');
    }
    
    // Check if the date is valid
    if (isNaN(validDate.getTime())) {
      throw new Error('Invalid date value');
    }
    
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(validDate);
  } catch (error) {
    console.error('Error formatting date:', error, 'Original date:', date);
    return 'Invalid Date';
  }
};

interface ZoneEventManagementProps {
  zoneId: string;
  zoneName: string;
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
  onEventUpdate: () => void;
}

export function ZoneEventManagement({ 
  zoneId, 
  zoneName, 
  events, 
  clubs, 
  eventTypes, 
  onEventUpdate 
}: ZoneEventManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clubFilter, setClubFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUnapproveDialogOpen, setIsUnapproveDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getClubName = (clubId: string | undefined, event?: Event) => {
    // Check if this is a zone-level event
    if (event?.zoneId && !event?.clubId) {
      return `${zoneName} (Zone Event)`;
    }
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const getEventTypeName = (eventTypeId: string | undefined) => {
    if (!eventTypeId) return 'Unknown Type';
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getClubName(event.clubId, event).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    // For zone events (no clubId), only show if 'all' is selected or if filtering for zone events
    const matchesClub = clubFilter === 'all' || event.clubId === clubFilter || (clubFilter === 'zone-event' && event.zoneId && !event.clubId);
    const matchesType = typeFilter === 'all' || event.eventTypeId === typeFilter;

    return matchesSearch && matchesStatus && matchesClub && matchesType;
  });

  // Group events by status for tabs
  const eventsByStatus = {
    upcoming: filteredEvents.filter(event => 
      event.status === 'approved' && new Date(event.date) >= new Date()
    ),
    past: filteredEvents.filter(event => 
      event.status === 'approved' && new Date(event.date) < new Date()
    ),
    pending: filteredEvents.filter(event => event.status === 'proposed'),
    rejected: filteredEvents.filter(event => event.status === 'rejected')
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'public_holiday':
        return <Badge variant="secondary">Public Holiday</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleUnapproveEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsUnapproveDialogOpen(true);
  };

  const handleResendEventRequestEmail = async (event: Event) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement email regeneration API call
      const response = await fetch('/api/resend-event-request-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: event.id,
          emailType: 'event_request'
        })
      });

      if (response.ok) {
        alert('Event Request email has been resent successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to resend email: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendApprovalEmail = async (event: Event) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement approval email regeneration
      const response = await fetch('/api/resend-event-request-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: event.id,
          emailType: 'event_approval'
        })
      });

      if (response.ok) {
        alert('Approval email has been resent successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to resend email: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('Failed to resend email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmUnapproveEvent = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'proposed',
          zoneManagerNotes: 'Event unapproved - returned to pending status',
          processedBy: 'zone_rep',
          processedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        onEventUpdate();
        setIsUnapproveDialogOpen(false);
        setSelectedEvent(null);
      } else {
        throw new Error('Failed to unapprove event');
      }
    } catch (error) {
      console.error('Error unapproving event:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onEventUpdate();
        setIsDeleteDialogOpen(false);
        setSelectedEvent(null);
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportEvents = async (status?: string) => {
    try {
      const params = new URLSearchParams({ zoneId });
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/admin/export-events?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${zoneName}_events_${status || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting events:', error);
    }
  };

  const EventTable = ({ events, showActions = true }: { events: Event[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event Details</TableHead>
          <TableHead>Club</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Coordinator</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 6 : 5} className="text-center text-muted-foreground py-8">
              No events found
            </TableCell>
          </TableRow>
        ) : (
          events.map(event => (
            <TableRow key={event.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{event.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {getEventTypeName(event.eventTypeId)}
                  </div>
                  {event.isQualifier && (
                    <Badge variant="secondary" className="mt-1">Qualifier</Badge>
                  )}
                  {event.location && (
                    <div className="text-sm text-muted-foreground mt-1">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {getClubName(event.clubId, event)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {formatDate(event.date)}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(event.status)}</TableCell>
              <TableCell>
                {event.coordinatorName && (
                  <div>
                    <div className="font-medium">{event.coordinatorName}</div>
                    {event.coordinatorContact && (
                      <div className="text-sm text-muted-foreground">{event.coordinatorContact}</div>
                    )}
                  </div>
                )}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        {event.status === 'approved' && (
                          <DropdownMenuItem 
                            onClick={() => handleUnapproveEvent(event)}
                            className="text-amber-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Unapprove Event
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Email Notifications</DropdownMenuLabel>
                      
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => handleResendEventRequestEmail(event)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Event Request Email
                        </DropdownMenuItem>
                        {event.status === 'approved' && (
                          <DropdownMenuItem onClick={() => handleResendApprovalEmail(event)}>
                            <Send className="h-4 w-4 mr-2" />
                            Resend Approval Email
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEvent(event)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Events
          </CardTitle>
          <CardDescription>
            Search and filter events in {zoneName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
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
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="proposed">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="public_holiday">Public Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Club</Label>
              <Select value={clubFilter} onValueChange={setClubFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs & Zone Events</SelectItem>
                  <SelectItem value="zone-event">Zone Events Only</SelectItem>
                  {clubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportEvents()}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events by Status Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Event Management</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Upcoming ({eventsByStatus.upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({eventsByStatus.pending.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Past ({eventsByStatus.past.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({eventsByStatus.rejected.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Upcoming Events</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportEvents('approved')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Upcoming
                  </Button>
                </div>
                <EventTable events={eventsByStatus.upcoming} />
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Pending Approval</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportEvents('proposed')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Pending
                  </Button>
                </div>
                <EventTable events={eventsByStatus.pending} showActions={false} />
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Past Events</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportEvents('approved')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Past
                  </Button>
                </div>
                <EventTable events={eventsByStatus.past} showActions={false} />
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Rejected Events</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportEvents('rejected')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Rejected
                  </Button>
                </div>
                <EventTable events={eventsByStatus.rejected} showActions={false} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-medium">{selectedEvent.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {getClubName(selectedEvent.clubId, selectedEvent)} • {formatDate(selectedEvent.date)}
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

      {/* Unapprove Confirmation Dialog */}
      <Dialog open={isUnapproveDialogOpen} onOpenChange={setIsUnapproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-600" />
              Unapprove Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unapprove this event? It will be moved back to pending status and will need to be re-approved before appearing on the calendar.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-medium">{selectedEvent.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {getClubName(selectedEvent.clubId, selectedEvent)} • {formatDate(selectedEvent.date)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnapproveDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={confirmUnapproveEvent}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Unapproving...' : 'Unapprove Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Event
            </DialogTitle>
            <DialogDescription>
              Update event details and submitter information.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Event Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedEvent.name}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={selectedEvent.location}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Submitter Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-submittedBy">Submitted By</Label>
                    <Input
                      id="edit-submittedBy"
                      value={selectedEvent.submittedBy || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, submittedBy: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-submittedByEmail">Email</Label>
                    <Input
                      id="edit-submittedByEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={selectedEvent.submittedByEmail || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, submittedByEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-submittedByPhone">Phone</Label>
                    <Input
                      id="edit-submittedByPhone"
                      type="tel"
                      placeholder="0400 000 000"
                      value={selectedEvent.submittedByPhone || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, submittedByPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Coordinator Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-coordinatorName">Coordinator Name</Label>
                    <Input
                      id="edit-coordinatorName"
                      value={selectedEvent.coordinatorName || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, coordinatorName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-coordinatorContact">Coordinator Contact</Label>
                    <Input
                      id="edit-coordinatorContact"
                      value={selectedEvent.coordinatorContact || ''}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, coordinatorContact: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={selectedEvent.notes || ''}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedEvent) return;
                setIsSubmitting(true);
                try {
                  const response = await fetch(`/api/events/${selectedEvent.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(selectedEvent),
                  });

                  if (response.ok) {
                    alert('Event updated successfully');
                    setIsEditDialogOpen(false);
                    onEventUpdate();
                  } else {
                    alert('Failed to update event');
                  }
                } catch (error) {
                  console.error('Error updating event:', error);
                  alert('Error updating event');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
