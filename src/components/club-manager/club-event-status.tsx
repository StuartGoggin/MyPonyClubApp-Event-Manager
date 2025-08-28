'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Download,
  User
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
      {/* Compact Event Tiles with Enhanced Background Shading */}
      {events.length === 0 ? (
        <Card className="enhanced-card glass-effect bg-gradient-to-br from-white/95 to-blue-50/80 border-2 border-border/50 shadow-lg">
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
              <Card key={event.id} className="enhanced-card glass-effect overflow-hidden border-2 border-border/60 shadow-xl shadow-black/15 hover:shadow-2xl hover:shadow-primary/15 transition-all duration-300 hover:border-primary/50 bg-gradient-to-r from-white/98 via-white/95 to-slate-50/90">
                {/* Compact Tile Header */}
                <div className="bg-gradient-to-r from-primary/8 via-background/95 to-accent/8 border-b border-border/50 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{event.name}</h3>
                    {event.isQualifier && (
                      <Badge variant="secondary" className="badge-enhanced bg-gradient-to-r from-purple-100/90 to-purple-200/70 text-purple-900 border-purple-400/60 text-xs font-semibold">
                        Qualifier
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Compact Tile Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Left Side - Event Status Panel */}
                  <div className="p-4 bg-slate-200/80 backdrop-blur-sm flex flex-col justify-between min-h-[280px]">
                    <div className="space-y-4 flex-1">
                      {/* Event Details Section */}
                      <div className="space-y-3 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-border/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1 w-8 bg-gradient-to-r from-primary to-accent rounded-full"></div>
                          <div className="text-xs font-bold text-foreground/80 uppercase tracking-wide">Event Details</div>
                        </div>
                        
                        {/* Event Date */}
                        <div className="flex items-center gap-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-muted-foreground">Date</div>
                            <div className="text-sm font-bold text-foreground">{formatDate(event.date)}</div>
                          </div>
                        </div>

                        {/* Event Location */}
                        <div className="flex items-center gap-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-green-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-muted-foreground">Location</div>
                            <div className="text-sm font-bold text-foreground">{event.location || 'Not specified'}</div>
                          </div>
                        </div>

                        {/* Event Type */}
                        <div className="flex items-center gap-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-purple-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-muted-foreground">Event Type</div>
                            <div className="text-sm font-bold text-foreground">{getEventTypeName(event.eventTypeId)}</div>
                          </div>
                        </div>

                        {/* Event Coordinator */}
                        <div className="flex items-center gap-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm">
                          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-orange-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-muted-foreground">Coordinator</div>
                            {event.coordinatorName ? (
                              <div>
                                <div className="text-sm font-bold text-foreground">{event.coordinatorName}</div>
                                {event.coordinatorContact && (
                                  <div className="text-xs text-muted-foreground mt-0.5">{event.coordinatorContact}</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground italic">Not specified</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Section */}
                      <div className="flex items-center gap-2 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                        <div className="text-xs font-semibold text-muted-foreground">Status:</div>
                        {getStatusBadge(event.status)}
                      </div>
                    </div>

                    {/* Edit Button - Moved to bottom */}
                    <div className="pt-4 mt-auto">
                      {canEdit ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                          className="distinctive-button-secondary w-full h-10 bg-gradient-to-r from-teal-50 via-teal-100 to-cyan-100 hover:from-teal-100 hover:via-teal-200 hover:to-cyan-200 border-2 border-teal-300/70 hover:border-teal-400 text-teal-800 hover:text-teal-900 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                        >
                          <Edit3 className="h-4 w-4 mr-2 drop-shadow-sm" />
                          Edit Event Details
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="distinctive-button-disabled w-full h-10 bg-gradient-to-r from-slate-100 to-slate-200 border-2 border-slate-300/50 text-slate-500 font-bold text-sm rounded-xl shadow-inner">
                          <Eye className="h-4 w-4 mr-2" />
                          View Only
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Event Schedule */}
                  <div className="p-4 bg-slate-200/80 backdrop-blur-sm border-l border-border/60 flex flex-col justify-between min-h-[280px]">
                    <div className="space-y-4 flex-1">
                      {/* Event Schedule Section */}
                      <div className="space-y-3 p-3 bg-white/90 backdrop-blur-sm rounded-lg border border-border/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                          <div className="text-xs font-bold text-foreground/80 uppercase tracking-wide">Event Schedule</div>
                        </div>

                        {event.schedule ? (
                          <div className="space-y-3">
                            {/* Schedule File Info */}
                            <div className="flex items-center gap-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/30 shadow-sm">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-muted-foreground">Document</div>
                                <div className="text-sm font-bold text-foreground">Schedule.pdf</div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  if (event.schedule?.fileUrl) {
                                    // Create a temporary link to download the file
                                    const link = document.createElement('a');
                                    link.href = event.schedule.fileUrl;
                                    link.download = `${event.name}-Schedule.pdf`;
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }
                                }}
                                className="distinctive-button-icon h-8 w-8 p-0 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-900 rounded-lg border border-blue-300/60 hover:border-blue-400 shadow-sm hover:shadow-md transition-all duration-300"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Upload Prompt */}
                            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-border/40 text-center shadow-sm">
                              <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                              <p className="text-xs text-blue-700 font-medium">
                                Upload your event schedule for approval
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Schedule Status Section */}
                      <div className="flex items-center gap-2 p-2.5 bg-white/90 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                        <div className="text-xs font-semibold text-muted-foreground">Schedule Status:</div>
                        {event.schedule ? (
                          <Badge variant="outline" className="badge-enhanced bg-green-50 text-green-800 border-green-300/60 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded - Pending Review
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="badge-enhanced bg-amber-50 text-amber-800 border-amber-300/60 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Uploaded
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Schedule Action Button - Moved to bottom */}
                    <div className="pt-4 mt-auto">
                      {event.schedule ? (
                        <Button size="sm" variant="outline" className="distinctive-button-secondary w-full h-10 bg-gradient-to-r from-teal-50 via-teal-100 to-cyan-100 hover:from-teal-100 hover:via-teal-200 hover:to-cyan-200 border-2 border-teal-300/70 hover:border-teal-400 text-teal-800 hover:text-teal-900 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                          <Upload className="h-4 w-4 mr-2 drop-shadow-sm" />
                          Update Schedule
                        </Button>
                      ) : (
                        <div className="p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                          <EventScheduleUpload 
                            eventId={event.id} 
                            onUploadSuccess={(schedule) => onEventUpdate()} 
                          />
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
