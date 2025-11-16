'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Filter,
  X,
  List
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Event } from '@/lib/types';

interface EVEventsManagementProps {
  onEventsUpdate?: () => void;
}

export function EVEventsManagement({ onEventsUpdate }: EVEventsManagementProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    eventLink: '',
    discipline: '',
    tier: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, disciplineFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      console.log('🔍 EVEventsManagement - All events:', data.events?.length || 0);
      const evScrapedEvents = (data.events || []).filter((e: Event) => e.source === 'ev_scraper');
      console.log('🔍 EVEventsManagement - EV scraped events:', evScrapedEvents.length, evScrapedEvents);
      setEvents(evScrapedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load EV events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.discipline?.toLowerCase().includes(query)
      );
    }

    // Discipline filter
    if (disciplineFilter !== 'all') {
      filtered = filtered.filter(event => event.discipline === disciplineFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredEvents(filtered);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    setEditForm({
      name: event.name || '',
      date: eventDate.toISOString().split('T')[0],
      location: event.location || '',
      description: event.description || '',
      eventLink: event.eventLink || '',
      discipline: event.discipline || '',
      tier: event.tier || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEvent) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          date: new Date(editForm.date),
          location: editForm.location,
          description: editForm.description,
          eventLink: editForm.eventLink,
          discipline: editForm.discipline,
          tier: editForm.tier,
        }),
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast({
        title: 'Success',
        description: 'Event updated successfully',
      });

      setEditDialogOpen(false);
      await fetchEvents();
      if (onEventsUpdate) onEventsUpdate();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      });

      setDeleteDialogOpen(false);
      await fetchEvents();
      if (onEventsUpdate) onEventsUpdate();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDisciplineFilter('all');
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEventIds);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEventIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedEventIds.size === filteredEvents.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(filteredEvents.map(e => e.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedEventIds.size === 0) {
      toast({
        title: 'No events selected',
        description: 'Please select at least one event to delete',
        variant: 'destructive',
      });
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedEventIds).map(eventId =>
        fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(r => !r.ok);

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} event(s)`);
      }

      toast({
        title: 'Success',
        description: `Deleted ${selectedEventIds.size} event(s) successfully`,
      });

      setSelectedEventIds(new Set());
      setBulkDeleteDialogOpen(false);
      await fetchEvents();
      if (onEventsUpdate) onEventsUpdate();
    } catch (error) {
      console.error('Error deleting events:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete some events',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Get unique disciplines for filter
  const disciplines = Array.from(new Set(events.map(e => e.discipline).filter(Boolean)));

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-6 w-6 text-purple-600" />
          Manage Scraped EV Events
        </CardTitle>
        <CardDescription>
          View, edit, and delete events imported from Equestrian Victoria
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, or discipline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Discipline Filter */}
            <div className="w-full sm:w-64">
              <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Disciplines</SelectItem>
                  {disciplines.map(discipline => (
                    <SelectItem key={discipline} value={discipline!}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh */}
            <Button onClick={fetchEvents} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {/* Clear Filters */}
            {(searchQuery || disciplineFilter !== 'all') && (
              <Button onClick={clearFilters} variant="ghost">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredEvents.length} of {events.length} events
              {selectedEventIds.size > 0 && (
                <span className="ml-2 text-purple-600 font-medium">
                  ({selectedEventIds.size} selected)
                </span>
              )}
            </span>
            {selectedEventIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedEventIds.size})
              </Button>
            )}
          </div>
        </div>

        {/* Events Table */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No events found</p>
            <p className="text-sm text-muted-foreground">
              {events.length === 0
                ? 'No EV events have been scraped yet. Use the Web Scraper to import events.'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredEvents.length > 0 && selectedEventIds.size === filteredEvents.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all events"
                    />
                  </TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Discipline</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                  const isPast = eventDate < new Date();
                  
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEventIds.has(event.id)}
                          onCheckedChange={() => toggleEventSelection(event.id)}
                          aria-label={`Select ${event.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-md">
                        <div className="flex items-center gap-2">
                          <span className={isPast ? 'text-muted-foreground' : ''}>
                            {event.name}
                          </span>
                          {event.eventLink && (
                            <a
                              href={event.eventLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View event on EV website"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className={isPast ? 'text-muted-foreground' : ''}>
                            {eventDate.toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          {isPast && (
                            <Badge variant="outline" className="w-fit text-xs">
                              Past
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.discipline && (
                          <Badge variant="secondary" className="capitalize">
                            {event.discipline}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.location || '-'}
                      </TableCell>
                      <TableCell>
                        {event.tier && (
                          <Badge variant="outline" className="text-xs">
                            {event.tier}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(event)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit EV Event</DialogTitle>
              <DialogDescription>
                Make changes to the event details below
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Event Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Event name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-discipline">Discipline</Label>
                  <Input
                    id="edit-discipline"
                    value={editForm.discipline}
                    onChange={(e) => setEditForm({ ...editForm, discipline: e.target.value })}
                    placeholder="e.g., dressage, jumping"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tier">Tier</Label>
                  <Input
                    id="edit-tier"
                    value={editForm.tier}
                    onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                    placeholder="e.g., State, National"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-link">Event Link</Label>
                <Input
                  id="edit-link"
                  type="url"
                  value={editForm.eventLink}
                  onChange={(e) => setEditForm({ ...editForm, eventLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Event description"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedEvent?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Multiple Events</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedEventIds.size} selected event(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  `Delete ${selectedEventIds.size} Event(s)`
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
