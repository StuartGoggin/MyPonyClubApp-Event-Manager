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
  AlertCircle,
  MapPin,
  FileText,
  Upload,
  Download
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
    <div className="space-y-4">
      {/* Compact Header with Better Background */}
      <Card className="enhanced-card glass-effect border border-border/40 shadow-lg shadow-primary/10 bg-gradient-to-r from-white/95 via-slate-50/90 to-blue-50/80 flex-shrink-0">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Event Status Overview
              </h2>
              <p className="text-muted-foreground text-sm font-medium">
                {events.length} event{events.length !== 1 ? 's' : ''} submitted by {clubName}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="badge-enhanced bg-gradient-to-r from-amber-100/90 to-orange-100/70 text-amber-900 border-amber-400/60 px-2.5 py-1 text-xs shadow-md">
                <Clock className="h-3 w-3 mr-1.5" />
                {eventsByStatus.submitted.length} Pending
              </Badge>
              <Badge variant="outline" className="badge-enhanced bg-gradient-to-r from-green-100/90 to-emerald-100/70 text-green-900 border-green-400/60 px-2.5 py-1 text-xs shadow-md">
                <CheckCircle className="h-3 w-3 mr-1.5" />
                {eventsByStatus.approved.length} Approved
              </Badge>
              {eventsByStatus.rejected.length > 0 && (
                <Badge variant="outline" className="badge-enhanced bg-gradient-to-r from-red-100/90 to-rose-100/70 text-red-900 border-red-400/60 px-2.5 py-1 text-xs shadow-md">
                  <XCircle className="h-3 w-3 mr-1.5" />
                  {eventsByStatus.rejected.length} Rejected
                </Badge>
              )}
            </div>
          </div>
          <div className="h-0.5 w-20 bg-gradient-to-r from-primary to-accent rounded-full mt-2 shadow-sm"></div>
        </CardHeader>
      </Card>

      {/* Compact Event Tiles with Enhanced Background Shading */}
      {events.length === 0 ? (
        <Card className="enhanced-card glass-effect bg-gradient-to-br from-slate-50/90 to-blue-50/70 border border-border/40">
          <CardContent className="p-6 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
            <p className="text-muted-foreground text-sm">
              You haven't submitted any events yet. Use the "Add Event" button to create your first event request.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const canEdit = event.status === 'proposed' || event.status === 'approved' || event.status === 'rejected';
            
            return (
              <Card key={event.id} className="enhanced-card glass-effect overflow-hidden border border-border/50 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:border-primary/40 bg-gradient-to-r from-white/95 via-white/90 to-slate-50/80">
                {/* Compact Tile Header */}
                <div className="bg-gradient-to-r from-primary/8 via-background/95 to-accent/8 border-b border-border/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{event.name}</h3>
                        {event.isQualifier && (
                          <Badge variant="secondary" className="badge-enhanced bg-gradient-to-r from-purple-100/90 to-purple-200/70 text-purple-900 border-purple-400/60 text-xs font-semibold">
                            Qualifier
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/50 shadow-sm">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span className="font-semibold text-foreground text-xs">{formatDate(event.date)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/50 shadow-sm">
                            <MapPin className="h-3.5 w-3.5 text-accent" />
                            <span className="text-foreground text-xs">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`badge-enhanced px-2.5 py-1 text-xs font-semibold shadow-md ${getEventTypeName(event.eventTypeId)} backdrop-blur-sm border`}>
                        {getEventTypeName(event.eventTypeId)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Compact Tile Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Left Side - Event Details */}
                  <div className="p-4 space-y-3 bg-gradient-to-br from-slate-50/80 via-background/90 to-slate-100/60 backdrop-blur-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2.5 bg-white/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                        <div className="text-xs font-semibold text-muted-foreground">Status:</div>
                        {getStatusBadge(event.status)}
                      </div>
                      
                      <div className="space-y-2 p-3 bg-white/60 backdrop-blur-sm rounded-lg border border-border/40 shadow-sm">
                        <div className="text-xs font-semibold text-muted-foreground">Event Coordinator:</div>
                        {event.coordinatorName ? (
                          <div className="pl-3 border-l-2 border-primary/50 bg-white/70 backdrop-blur-sm rounded-r-md p-2">
                            <div className="font-semibold text-foreground text-sm">{event.coordinatorName}</div>
                            {event.coordinatorContact && (
                              <div className="text-xs text-muted-foreground mt-0.5">{event.coordinatorContact}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground italic text-xs bg-white/50 p-2 rounded-md border border-border/30">Not specified</div>
                        )}
                      </div>
                    </div>

                    {/* Compact Edit Button */}
                    <div className="pt-2">
                      {canEdit ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                          className="w-full h-8 premium-button-outline bg-gradient-to-r from-primary/8 to-primary/12 hover:from-primary/15 hover:to-primary/25 border-primary/40 hover:border-primary/60 text-primary hover:text-primary font-semibold text-xs shadow-md"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                          Edit Event Details
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="w-full h-8 bg-muted/60 text-muted-foreground text-xs">
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Only
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Event Schedule */}
                  <div className="p-4 bg-gradient-to-br from-blue-50/90 to-blue-100/70 border-l border-border/60 backdrop-blur-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-blue-300/50 shadow-sm">
                        <FileText className="h-4 w-4 text-blue-700" />
                        <h4 className="font-bold text-blue-900 text-sm">Event Schedule</h4>
                      </div>

                      {event.schedule ? (
                        <div className="space-y-3">
                          {/* Schedule Status */}
                          <div className="flex items-center gap-2 p-2.5 bg-green-50/90 backdrop-blur-sm rounded-lg border border-green-300/60 shadow-sm">
                            <CheckCircle className="h-4 w-4 text-green-700" />
                            <span className="text-xs font-semibold text-green-800">Schedule Uploaded</span>
                          </div>

                          {/* Schedule Links/Info */}
                          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-blue-200/70 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-900 text-sm">Schedule.pdf</span>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-100 text-blue-700">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Schedule Approval Status */}
                          <div className="space-y-2 p-2.5 bg-amber-50/90 backdrop-blur-sm rounded-lg border border-amber-200/70 shadow-sm">
                            <div className="text-xs font-semibold text-amber-800">Approval Status:</div>
                            <Badge variant="outline" className="badge-enhanced bg-gradient-to-r from-amber-100/90 to-orange-100/70 text-amber-900 border-amber-400/60 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Review
                            </Badge>
                          </div>

                          {/* Update Schedule Button */}
                          <Button size="sm" variant="outline" className="w-full h-8 premium-button-outline bg-gradient-to-r from-blue-50/80 to-blue-100/60 hover:from-blue-100/80 hover:to-blue-200/70 border-blue-400/60 hover:border-blue-500/70 text-blue-800 font-semibold text-xs">
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                            Update Schedule
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* No Schedule Status */}
                          <div className="flex items-center gap-2 p-2.5 bg-amber-50/90 backdrop-blur-sm rounded-lg border border-amber-200/70 shadow-sm">
                            <AlertCircle className="h-4 w-4 text-amber-700" />
                            <span className="text-xs font-semibold text-amber-800">No Schedule Uploaded</span>
                          </div>

                          {/* Upload Prompt */}
                          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-blue-200/70 text-center shadow-sm">
                            <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-xs text-blue-700 font-medium mb-2">
                              Upload your event schedule for approval
                            </p>
                          </div>

                          {/* Upload Schedule Button */}
                          <div className="p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                            <EventScheduleUpload eventId={event.id} onUploadSuccess={onEventUpdate} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
