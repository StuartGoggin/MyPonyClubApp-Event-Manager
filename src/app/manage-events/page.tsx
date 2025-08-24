'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Phone, FileText, AlertTriangle } from 'lucide-react';
import { Event, Club, EventType, Zone, EventStatus } from '@/lib/types';
import { clubsMock, eventTypesMock, zonesMock } from '@/lib/client-data';

export default function ManageEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Initialize with mock data for now
    const mockEvents: Event[] = [
      {
        id: 'event-1',
        name: 'Spring Rally',
        date: new Date('2025-09-15'),
        clubId: 'club-melbourne',
        eventTypeId: 'event-type-rally',
        status: 'proposed',
        location: 'Melbourne Pony Club Grounds',
        source: 'zone',
        coordinatorName: 'Jane Smith',
        coordinatorContact: 'jane@email.com',
        isQualifier: true,
        notes: 'This is our annual spring rally with jumping and dressage competitions.'
      },
      {
        id: 'event-2',
        name: 'Monthly ODE',
        date: new Date('2025-08-22'),
        clubId: 'club-geelong',
        eventTypeId: 'event-type-ode',
        status: 'approved',
        location: 'Geelong Pony Club',
        source: 'zone',
        coordinatorName: 'Bob Johnson',
        coordinatorContact: 'bob@email.com'
      }
    ];
    
    setEvents(mockEvents);
    setClubs(clubsMock);
    setEventTypes(eventTypesMock);
    setZones(zonesMock);
  }, []);

  const handleAction = (event: Event, action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setActionType(action);
    setIsDialogOpen(true);
    setNotes('');
  };

  const confirmAction = async () => {
    if (!selectedEvent || !actionType) return;

    // In a real app, you would call an API to update the event status
    const newStatus: EventStatus = actionType === 'approve' ? 'approved' : 'rejected';
    
    setEvents(prev => prev.map(event => 
      event.id === selectedEvent.id 
        ? { ...event, status: newStatus }
        : event
    ));

    setIsDialogOpen(false);
    setSelectedEvent(null);
    setActionType(null);
    setNotes('');
  };

  const getEventsByStatus = (status: EventStatus) => {
    return events.filter(event => event.status === status);
  };

  const getClubName = (clubId: string | undefined) => {
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const getEventTypeName = (eventTypeId: string | undefined) => {
    if (!eventTypeId) return 'Unknown Type';
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  const getZoneName = (clubId: string | undefined) => {
    if (!clubId) return 'Unknown Zone';
    const club = clubs.find(c => c.id === clubId);
    if (!club) return 'Unknown Zone';
    return zones.find(zone => zone.id === club.zoneId)?.name || 'Unknown Zone';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage my Events</h1>
        <p className="text-muted-foreground">
          Review, approve, and manage event requests from your zone&apos;s clubs
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({getEventsByStatus('proposed').length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({getEventsByStatus('approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({getEventsByStatus('rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {getEventsByStatus('proposed').map(event => (
            <EventCard
              key={event.id}
              event={event}
              clubName={getClubName(event.clubId)}
              eventTypeName={getEventTypeName(event.eventTypeId)}
              zoneName={getZoneName(event.clubId)}
              onApprove={() => handleAction(event, 'approve')}
              onReject={() => handleAction(event, 'reject')}
              showActions={true}
            />
          ))}
          {getEventsByStatus('proposed').length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Events</h3>
                <p className="text-muted-foreground">All events have been reviewed.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {getEventsByStatus('approved').map(event => (
            <EventCard
              key={event.id}
              event={event}
              clubName={getClubName(event.clubId)}
              eventTypeName={getEventTypeName(event.eventTypeId)}
              zoneName={getZoneName(event.clubId)}
              showActions={false}
            />
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {getEventsByStatus('rejected').map(event => (
            <EventCard
              key={event.id}
              event={event}
              clubName={getClubName(event.clubId)}
              eventTypeName={getEventTypeName(event.eventTypeId)}
              zoneName={getZoneName(event.clubId)}
              showActions={false}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Event' : 'Reject Event'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Are you sure you want to approve "${selectedEvent?.name}"?`
                : `Are you sure you want to reject "${selectedEvent?.name}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder={actionType === 'approve' 
                  ? "Add any approval notes or conditions..."
                  : "Add a reason for rejection..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
            >
              {actionType === 'approve' ? 'Approve Event' : 'Reject Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  clubName: string;
  eventTypeName: string;
  zoneName: string;
  onApprove?: () => void;
  onReject?: () => void;
  showActions: boolean;
}

function EventCard({ event, clubName, eventTypeName, zoneName, onApprove, onReject, showActions }: EventCardProps) {
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'proposed':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{event.name}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {event.date.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            </CardDescription>
          </div>
          {getStatusBadge(event.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Club:</span>
              <span>{clubName} ({zoneName})</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Type:</span>
              <span>{eventTypeName}</span>
            </div>
            {event.isQualifier && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-amber-600">Qualifier Event</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {event.coordinatorName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Coordinator:</span>
                <span>{event.coordinatorName}</span>
              </div>
            )}
            {event.coordinatorContact && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{event.coordinatorContact}</span>
              </div>
            )}
          </div>
        </div>
        
        {event.notes && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm"><strong>Notes:</strong> {event.notes}</p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Button onClick={onApprove} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button onClick={onReject} variant="destructive" className="flex-1">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
