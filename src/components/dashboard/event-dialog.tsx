'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { type Event, type Club, type EventType, type Zone } from '@/lib/types';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Users, 
  Tag, 
  AlertTriangle, 
  FerrisWheel, 
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Award,
  Building2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { EventScheduleUpload } from '@/components/event-schedule-upload';
import { EventScheduleReview } from '@/components/event-schedule-review';

interface EventDialogProps {
  event: Event | null;
  club: Club | undefined;
  zone: Zone | undefined;
  eventType: EventType | undefined;
  nearbyEvents: Event[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser: { id: string; role: 'organiser' | 'zone_approver' | 'admin' | 'viewer' };
}

export function EventDialog({
  event,
  club,
  zone,
  eventType,
  nearbyEvents,
  isOpen,
  onOpenChange,
  currentUser,
}: EventDialogProps) {
  if (!event || !eventType) return null;
  // For public holidays, club might be undefined.
  if (event.source !== 'public_holiday' && !club) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            <Clock className="mr-1 h-3 w-3" />
            Awaiting Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'public_holiday':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <FerrisWheel className="mr-1 h-3 w-3" />
            Public Holiday
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

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
      
      return validDate;
    } catch (error) {
      console.error('Error formatting date:', error, 'Original date:', date);
      return new Date();
    }
  };

  const eventDate = formatDate(event.date);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl pr-8">{event.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            {format(eventDate, 'PPPP')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {getStatusBadge(event.status)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                <div className="flex items-center gap-2 mt-1">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{eventType.name}</span>
                  {event.isQualifier && (
                    <Badge variant="secondary" className="ml-2">
                      <Award className="h-3 w-3 mr-1" />
                      Qualifier
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Source</label>
                <div className="mt-1 capitalize">
                  {event.source?.replace('_', ' ') || 'Unknown'}
                </div>
              </div>
              
              {event.location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Club and Zone Information */}
          {(club || zone) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {club && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Club</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{club.name}</span>
                    </div>
                    {club.email && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${club.email}`} className="hover:underline">
                          {club.email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {zone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Zone</label>
                    <div className="mt-1">{zone.name}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coordinator Information */}
          {(event.coordinatorName || event.coordinatorContact) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Event Coordinator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.coordinatorName && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Coordinator</label>
                    <div className="mt-1">{event.coordinatorName}</div>
                  </div>
                )}
                
                {event.coordinatorContact && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Contact</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{event.coordinatorContact}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submission Information */}
          {(event.submittedBy || event.submittedByContact) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Submission Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.submittedBy && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted By</label>
                    <div className="mt-1">{event.submittedBy}</div>
                  </div>
                )}
                
                {event.submittedByContact && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitter Contact</label>
                    <div className="mt-1">{event.submittedByContact}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Additional Notes</h3>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
              </div>
            </div>
          )}
          
          {/* Nearby Events Warning */}
          {nearbyEvents.length > 0 && (
            <div className="border-t pt-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-800">Potential Scheduling Conflicts</h4>
                </div>
                <p className="text-sm text-amber-700 mb-3">
                  The following events are scheduled nearby and may create conflicts:
                </p>
                <div className="space-y-2">
                  {nearbyEvents.map(nearbyEvent => (
                    <div key={nearbyEvent.id} className="text-sm text-amber-700 bg-amber-100 p-2 rounded">
                      <div className="font-medium">{nearbyEvent.name}</div>
                      <div className="text-xs">{format(formatDate(nearbyEvent.date), 'PPP')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Event Schedule Status & Download */}
          {event.schedule && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Event Schedule
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {event.schedule.status === 'pending' && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">Schedule Pending</Badge>
                )}
                {event.schedule.status === 'approved' && (
                  <Badge variant="default" className="bg-green-600">Schedule Approved</Badge>
                )}
                {event.schedule.status === 'rejected' && (
                  <Badge variant="destructive">Schedule Rejected</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a href={event.schedule.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Download Schedule ({event.schedule.fileType})
                </a>
              </div>
              {/* Conditional rendering for review */}
              {currentUser?.role === 'zone_approver' && event.schedule.status === 'pending' && (
                <EventScheduleReview
                  eventId={event.id}
                  schedule={{
                    ...event.schedule,
                    reviewedAt: event.schedule.reviewedAt ? event.schedule.reviewedAt.toString() : undefined,
                  }}
                  reviewer={currentUser.id}
                />
              )}
            </div>
          )}
          {/* Conditional rendering for upload */}
          {!event.schedule && currentUser?.role === 'organiser' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload Event Schedule
              </h3>
              <EventScheduleUpload eventId={event.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
