'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, FileText, AlertTriangle } from 'lucide-react';
import { Event, Club, EventType } from '@/lib/types';

// Utility function to format dates
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

interface ZoneEventApprovalProps {
  zoneId: string;
  zoneName: string;
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
  onEventUpdate: () => void;
}

export function ZoneEventApproval({ 
  zoneId, 
  zoneName, 
  events, 
  clubs, 
  eventTypes, 
  onEventUpdate 
}: ZoneEventApprovalProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter events that need approval
  const pendingEvents = events.filter(event => event.status === 'proposed');
  const recentlyProcessed = events.filter(event => 
    ['approved', 'rejected'].includes(event.status)
  ).slice(0, 5); // Show last 5 processed events

  const getClubName = (clubId: string) => {
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const getEventTypeName = (eventTypeId: string) => {
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  const handleEventAction = (event: Event, action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setActionType(action);
    setNotes('');
    setIsDialogOpen(true);
  };

  const submitEventAction = async () => {
    if (!selectedEvent || !actionType) return;

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/events/${selectedEvent.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          zoneManagerNotes: notes,
          processedBy: `Zone Manager - ${zoneName}`, // Future: actual user info
          processedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        onEventUpdate();
        setIsDialogOpen(false);
        setSelectedEvent(null);
        setActionType(null);
        setNotes('');
      } else {
        throw new Error('Failed to update event status');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Events Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Events Pending Approval
            {pendingEvents.length > 0 && (
              <Badge variant="destructive">{pendingEvents.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Events submitted by clubs in {zoneName} requiring your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">All caught up!</h3>
              <p className="text-sm text-muted-foreground">No events pending approval in {zoneName}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Details</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEvents.map(event => (
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {getClubName(event.clubId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(event.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.coordinatorName}</div>
                        <div className="text-sm text-muted-foreground">{event.coordinatorContact}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {event.submittedBy || 'Club submission'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleEventAction(event, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleEventAction(event, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recently Processed Events */}
      {recentlyProcessed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recently Processed Events
            </CardTitle>
            <CardDescription>
              Last 5 events you've approved or rejected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyProcessed.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getEventTypeName(event.eventTypeId)}
                      </div>
                    </TableCell>
                    <TableCell>{getClubName(event.clubId)}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.status === 'approved' ? 'Approved' : 'Rejected'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {actionType === 'approve' ? 'Approve Event' : 'Reject Event'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Approve this event for publication in the zone calendar'
                : 'Reject this event with feedback for the club'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="font-medium">{selectedEvent.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getClubName(selectedEvent.clubId)} • {formatDate(selectedEvent.date)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getEventTypeName(selectedEvent.eventTypeId)}
                </div>
                {selectedEvent.location && (
                  <div className="text-sm text-muted-foreground">
                    📍 {selectedEvent.location}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Add any notes for the club...'
                      : 'Please provide a reason for rejection...'
                  }
                  rows={3}
                />
                {actionType === 'reject' && notes.trim().length === 0 && (
                  <p className="text-sm text-red-600">
                    Please provide a reason for rejection
                  </p>
                )}
              </div>

              {actionType === 'reject' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-800">
                      The club will be notified of this rejection and your feedback.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={submitEventAction}
              disabled={isSubmitting || (actionType === 'reject' && notes.trim().length === 0)}
            >
              {isSubmitting ? 'Processing...' : (
                actionType === 'approve' ? 'Approve Event' : 'Reject Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
