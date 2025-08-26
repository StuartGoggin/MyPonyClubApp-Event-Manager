'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { Event, Club, EventType } from '@/lib/types';
import { EditEventDialog } from './edit-event-dialog';
import { EventScheduleUpload } from '../event-schedule-upload';

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

  // Group events by status for summary badges
  const eventsByStatus = {
    submitted: events.filter(event => event.status === 'proposed'),
    approved: events.filter(event => event.status === 'approved'),
    rejected: events.filter(event => event.status === 'rejected'),
    all: events
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return (
          <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300 shadow-sm">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 shadow-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 shadow-sm">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'public_holiday':
        return (
          <Badge className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 shadow-sm">
            Public Holiday
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="shadow-sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Events Table */}
      <Card className="enhanced-card border-l-4 border-l-primary shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Event Status Overview
              </CardTitle>
              <CardDescription className="text-base mt-2">
                All events submitted by {clubName} - {events.length} total event{events.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1">
                <Clock className="h-3 w-3 mr-1" />
                {eventsByStatus.submitted.length} Pending
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {eventsByStatus.approved.length} Approved
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
                <XCircle className="h-3 w-3 mr-1" />
                {eventsByStatus.rejected.length} Rejected
              </Badge>
            </div>
          </div>
          <div className="h-1 w-32 bg-gradient-to-r from-primary to-accent rounded-full mt-4"></div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                <Calendar className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No Events Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                You haven't submitted any events yet. Use the "Submit Event" tab to create your first event request.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-150">
                    <TableHead className="font-semibold text-slate-700">Event Details</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Coordinator</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => {
                    const canEdit = event.status === 'proposed' || event.status === 'approved' || event.status === 'rejected';
                    const isEven = index % 2 === 0;
                    return (
                      <TableRow
                        key={event.id}
                        className={`transition-all duration-200 hover:bg-slate-50 hover:shadow-sm ${isEven ? 'bg-white' : 'bg-slate-25'}`}
                        style={{ verticalAlign: 'middle' }}
                      >
                        <TableCell className="py-4 align-middle">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-900 text-lg">{event.name}</h4>
                              {event.isQualifier && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Qualifier</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <span className="bg-slate-100 px-2 py-1 rounded-md font-medium">{getEventTypeName(event.eventTypeId)}</span>
                              {event.location && (
                                <span className="flex items-center gap-1"><span>📍</span>{event.location}</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <div className="flex items-center gap-2 text-slate-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium">{formatDate(event.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          <div className="flex items-center gap-3">
                            {getStatusBadge(event.status)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-middle">
                          {event.coordinatorName ? (
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">{event.coordinatorName}</div>
                              {event.coordinatorContact && (
                                <div className="text-sm text-slate-500">{event.coordinatorContact}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-4 align-middle">
                          <div className="flex items-center gap-2 justify-end">
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditEvent(event)}
                                className="premium-button-outline hover:scale-105 transition-transform"
                                aria-label="Edit event"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {/* TODO: View event details */}}
                              className="hover:bg-slate-100 hover:scale-105 transition-all"
                              aria-label="View event details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Event Schedule Upload for events without a schedule */}
                          {!event.schedule && (
                            <div className="mt-3 w-full max-w-xs mx-auto p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow flex flex-col items-center gap-2">
                              <span className="text-xs text-blue-700 font-semibold mb-1 block">No schedule uploaded</span>
                              <EventScheduleUpload eventId={event.id} onUploadSuccess={onEventUpdate} />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
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
