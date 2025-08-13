'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Eye,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { Event, Club, EventType } from '@/lib/types';
import { EditEventDialog } from './edit-event-dialog';

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

interface ClubEventStatusProps {
  clubId: string;
  clubName: string;
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
  onEventUpdate: () => void;
}

export function ClubEventStatus({ 
  clubId, 
  clubName, 
  events, 
  clubs, 
  eventTypes, 
  onEventUpdate 
}: ClubEventStatusProps) {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEditDialog(true);
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    setEditingEvent(null);
  };

  const getEventTypeName = (eventTypeId: string) => {
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  // Group events by status for tabs (no filtering needed for club level)
  const eventsByStatus = {
    submitted: events.filter(event => event.status === 'proposed'),
    approved: events.filter(event => event.status === 'approved'),
    rejected: events.filter(event => event.status === 'rejected'),
    all: events
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Submitted</Badge>;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'proposed':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportEvents = async (status?: string) => {
    try {
      const params = new URLSearchParams({ clubId });
      if (status && status !== 'all') params.append('status', status);
      
      const response = await fetch(`/api/admin/export-events?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clubName}_events_${status || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting events:', error);
    }
  };

  const EventTable = ({ events, showActions = false }: { events: Event[], showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event Details</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted By</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No events found
            </TableCell>
          </TableRow>
        ) : (
          events.map(event => {
            const canEdit = event.status === 'proposed' || event.status === 'approved' || event.status === 'rejected';
            
            return (
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
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(event.date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(event.status)}
                    {getStatusBadge(event.status)}
                  </div>
                </TableCell>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditEvent(event)}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {/* TODO: View event details */}}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Events by Status Tabs */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Event Status Tracking
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportEvents()}
                className="premium-button-outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Badge variant="outline" className="badge-enhanced">
                {events.length} event{events.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-base">
            Track the status of all events submitted by {clubName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="submitted" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="submitted" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Submitted ({eventsByStatus.submitted.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({eventsByStatus.approved.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({eventsByStatus.rejected.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                All ({eventsByStatus.all.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submitted" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Submitted Events</h3>
                    <p className="text-sm text-muted-foreground">
                      Events waiting for zone approval
                    </p>
                  </div>
                </div>
                <EventTable events={eventsByStatus.submitted} />
              </div>
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Approved Events</h3>
                    <p className="text-sm text-muted-foreground">
                      Events approved for the calendar
                    </p>
                  </div>
                </div>
                <EventTable events={eventsByStatus.approved} />
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Rejected Events</h3>
                    <p className="text-sm text-muted-foreground">
                      Events that were not approved
                    </p>
                  </div>
                </div>
                <EventTable events={eventsByStatus.rejected} />
              </div>
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">All Events</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete history of event submissions
                    </p>
                  </div>
                </div>
                <EventTable events={eventsByStatus.all} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status and Edit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status & Edit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Event Status</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-600">Submitted</div>
                    <div className="text-muted-foreground text-sm">Your event has been submitted and is awaiting zone manager review</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-600">Approved</div>
                    <div className="text-muted-foreground text-sm">Your event has been approved and will appear on the public calendar</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-red-600">Rejected</div>
                    <div className="text-muted-foreground text-sm">Your event was not approved. Check with your zone manager for feedback</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Editing Events</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Edit3 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-600">Edit Anytime</div>
                    <div className="text-muted-foreground text-sm">You can edit event details even after submission</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-600">Date Changes</div>
                    <div className="text-muted-foreground text-sm">Changing the date of an approved event requires reapproval</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-purple-600">Instant Updates</div>
                    <div className="text-muted-foreground text-sm">Non-date changes update immediately without reapproval</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          eventTypes={eventTypes}
          open={showEditDialog}
          onOpenChange={handleEditDialogClose}
          onEventUpdated={onEventUpdate}
        />
      )}
    </div>
  );
}
