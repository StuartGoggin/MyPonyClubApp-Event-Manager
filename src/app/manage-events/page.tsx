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
    <div className="space-y-4">
      {/* Compact Glass Header Panel */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="relative rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-2.5 border border-primary/40 backdrop-blur-sm">
                <CheckCircle className="h-6 w-6 text-primary drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                Manage Events
              </h1>
              <p className="text-muted-foreground text-sm">
                Review and manage event requests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Enhanced Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-border/40 bg-gradient-to-r from-background/95 to-background/90 backdrop-blur-sm p-0.5">
          <TabsList className="grid w-full grid-cols-3 bg-transparent h-10">
            <TabsTrigger 
              value="pending" 
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-700 data-[state=active]:border-amber-200 transition-all duration-300"
            >
              <Clock className="h-3.5 w-3.5" />
              Pending ({getEventsByStatus('proposed').length})
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-green-500/20 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 transition-all duration-300"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Approved ({getEventsByStatus('approved').length})
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:text-red-700 data-[state=active]:border-red-200 transition-all duration-300"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejected ({getEventsByStatus('rejected').length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="space-y-3">
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
            <div className="relative overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-background via-background/95 to-muted/20 shadow-lg backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
              <div className="relative py-6 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-semibold mb-1 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">No Pending Events</h3>
                <p className="text-muted-foreground text-sm">All events have been reviewed.</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3">
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

      {/* Enhanced Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background/95 to-primary/5 border border-border/40 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-accent/3 rounded-lg"></div>
          <div className="relative">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  actionType === 'approve' 
                    ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-emerald-200' 
                    : 'bg-gradient-to-br from-red-100 to-rose-100 border-2 border-red-200'
                }`}>
                  {actionType === 'approve' ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {actionType === 'approve' ? 'Approve Event' : 'Reject Event'}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {actionType === 'approve' 
                      ? `Confirm approval of "${selectedEvent?.name}"`
                      : `Confirm rejection of "${selectedEvent?.name}"`
                    }
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-3 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="font-medium text-sm">
                  {actionType === 'approve' ? 'Approval Notes (optional)' : 'Rejection Reason (optional)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={actionType === 'approve' 
                    ? "Add any approval notes or conditions..."
                    : "Add a reason for rejection..."
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background/50 border-border/40 focus:border-primary/50 transition-colors h-20"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 hover:bg-muted/50 transition-colors h-9"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmAction}
                className={`flex-1 transition-all duration-300 h-9 ${
                  actionType === 'approve'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-red-500/20'
                } text-white`}
              >
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Approve
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
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
        return (
          <Badge className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900 shadow-amber-100/50">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-900 shadow-emerald-100/50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-900 shadow-red-100/50">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-background via-background/95 to-muted/10 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 backdrop-blur-sm">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-accent/3"></div>
      
      {/* Compact Header */}
      <div className="relative p-4 border-b border-border/40">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {event.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5">
                <div className="p-0.5 rounded bg-primary/10">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-medium">{event.date.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="p-0.5 rounded bg-accent/10">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                </div>
                <span>{event.location}</span>
              </div>
            </div>
          </div>
          <div className="ml-3">
            {getStatusBadge(event.status)}
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="relative p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-background/50 to-muted/30 border border-border/30">
              <div className="p-1 rounded bg-primary/10">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Club</p>
                <p className="font-semibold text-sm">{clubName}</p>
                <p className="text-xs text-muted-foreground">({zoneName})</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-background/50 to-muted/30 border border-border/30">
              <div className="p-1 rounded bg-accent/10">
                <FileText className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Event Type</p>
                <p className="font-semibold text-sm">{eventTypeName}</p>
              </div>
            </div>
            {event.isQualifier && (
              <div className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/50">
                <div className="p-1 rounded bg-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-700 text-xs">Qualifier Event</p>
                  <p className="text-xs text-amber-600">Special qualifying competition</p>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {event.coordinatorName && (
              <div className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-background/50 to-muted/30 border border-border/30">
                <div className="p-1 rounded bg-purple-100">
                  <User className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Coordinator</p>
                  <p className="font-semibold text-sm">{event.coordinatorName}</p>
                </div>
              </div>
            )}
            {event.coordinatorContact && (
              <div className="flex items-center gap-2 p-2 rounded bg-gradient-to-r from-background/50 to-muted/30 border border-border/30">
                <div className="p-1 rounded bg-blue-100">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Contact</p>
                  <p className="font-semibold text-sm">{event.coordinatorContact}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {event.notes && (
          <div className="mb-3 p-3 rounded bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <div className="p-0.5 rounded bg-primary/10 mt-0.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-xs text-primary mb-1">Notes</p>
                <p className="text-xs text-muted-foreground">{event.notes}</p>
              </div>
            </div>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            <Button 
              onClick={onApprove} 
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 h-9"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Approve
            </Button>
            <Button 
              onClick={onReject} 
              variant="destructive" 
              className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-red-500/20 transition-all duration-300 h-9"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
