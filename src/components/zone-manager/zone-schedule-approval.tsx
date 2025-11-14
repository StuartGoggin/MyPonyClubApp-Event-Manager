'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, FileText, AlertTriangle, Download, ExternalLink } from 'lucide-react';
import { Event, Club, EventType } from '@/lib/types';
import { EventRailwayProgress } from '../club-manager/event-railway-progress';
import { cn } from '@/lib/utils';

// Utility function to format dates with validation
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

interface ZoneScheduleApprovalProps {
  zoneId: string;
  zoneName: string;
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
  onEventUpdate: () => void;
}

export function ZoneScheduleApproval({ 
  zoneId, 
  zoneName, 
  events, 
  clubs, 
  eventTypes, 
  onEventUpdate 
}: ZoneScheduleApprovalProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter events that have schedules pending approval
  const pendingSchedules = events.filter(event => 
    event.schedule && event.schedule.status === 'pending'
  );

  const recentlyProcessed = events.filter(event => 
    event.schedule && ['approved', 'rejected'].includes(event.schedule.status)
  ).slice(0, 5); // Show last 5 processed schedules

  const getClubName = (clubId: string | undefined) => {
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const getEventTypeName = (eventTypeId: string | undefined) => {
    if (!eventTypeId) return 'Unknown Type';
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  const handleApprove = (event: Event) => {
    setSelectedEvent(event);
    setDialogType('approve');
    setComment('');
  };

  const handleReject = (event: Event) => {
    setSelectedEvent(event);
    setDialogType('reject');
    setComment('');
  };

  const handleConfirmAction = async () => {
    if (!selectedEvent || !dialogType) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: dialogType === 'approve' ? 'approved' : 'rejected',
          comment: comment.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule status');
      }

      // Close dialog and refresh data
      setDialogType(null);
      setSelectedEvent(null);
      setComment('');
      onEventUpdate();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule status. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAction = () => {
    setDialogType(null);
    setSelectedEvent(null);
    setComment('');
  };

  return (
    <div className="space-y-6">
      {/* Pending Schedules Section */}
      {pendingSchedules.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Schedules Awaiting Review</h3>
            <Badge variant="destructive" className="text-sm">
              {pendingSchedules.length} Pending
            </Badge>
          </div>

          {pendingSchedules.map((event) => (
            <Card key={event.id} className="enhanced-card glass-effect border-2 border-orange-200/60 dark:border-orange-700/60 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-orange-700 dark:text-orange-400">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="mt-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{getClubName(event.clubId)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700">
                    {getEventTypeName(event.eventTypeId)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Schedule Information */}
                <div className="rounded-lg border-2 border-yellow-200/60 dark:border-yellow-700/60 bg-gradient-to-br from-yellow-50/90 to-amber-50/80 dark:from-yellow-950/30 dark:to-amber-950/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 uppercase tracking-wide">
                      Schedule Information
                    </h4>
                    <Badge className="bg-orange-500 hover:bg-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {event.schedule?.fileUrl && (
                      <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-yellow-300/40 dark:border-yellow-700/40">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          <div>
                            <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                              {event.schedule.fileName || 'Schedule Document'}
                            </div>
                            {event.schedule.uploadedAt && (
                              <div className="text-xs text-muted-foreground">
                                Uploaded: {(() => {
                                  try {
                                    return formatDate(event.schedule.uploadedAt);
                                  } catch {
                                    return 'Recently';
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(event.schedule?.fileUrl, '_blank')}
                            className="border-yellow-300 dark:border-yellow-700"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-yellow-300 dark:border-yellow-700"
                          >
                            <a href={event.schedule.fileUrl} download>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {event.schedule?.notes && (
                      <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-yellow-300/40 dark:border-yellow-700/40">
                        <div className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1 uppercase tracking-wide">
                          Notes from Club
                        </div>
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          {event.schedule.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                {event.description && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Description</div>
                        <div className="text-muted-foreground">{event.description}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Railway Progress */}
                <EventRailwayProgress event={event} />

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(event)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Schedule
                  </Button>
                  <Button
                    onClick={() => handleReject(event)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="enhanced-card glass-effect">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground text-center">
              There are no schedules awaiting your review at this time.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recently Processed Schedules */}
      {recentlyProcessed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recently Processed Schedules</h3>
          <div className="space-y-3">
            {recentlyProcessed.map((event) => (
              <Card key={event.id} className={cn(
                "border-2",
                event.schedule?.status === 'approved' 
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                  : "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">{event.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getClubName(event.clubId)} • {formatDate(event.date)}
                      </div>
                    </div>
                    <Badge 
                      variant={event.schedule?.status === 'approved' ? 'default' : 'destructive'}
                      className={cn(
                        event.schedule?.status === 'approved' 
                          ? "bg-emerald-600" 
                          : "bg-red-600"
                      )}
                    >
                      {event.schedule?.status === 'approved' ? 'Approved' : 'Changes Requested'}
                    </Badge>
                  </div>
                  {event.schedule?.reviewComment && (
                    <div className="mt-2 text-sm text-muted-foreground italic">
                      "{event.schedule.reviewComment}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogType !== null} onOpenChange={(open) => !open && handleCancelAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'approve' ? 'Approve Schedule' : 'Request Changes to Schedule'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve' 
                ? `You are about to approve the schedule for "${selectedEvent?.name}". This will notify the club that their schedule is approved.`
                : `You are about to request changes to the schedule for "${selectedEvent?.name}". The club will be notified and can resubmit.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {dialogType === 'approve' ? 'Comments (Optional)' : 'Reason for Changes (Required)'}
              </Label>
              <Textarea
                id="comment"
                placeholder={
                  dialogType === 'approve'
                    ? "Add any comments or notes..."
                    : "Please explain what changes are needed..."
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required={dialogType === 'reject'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelAction}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isProcessing || (dialogType === 'reject' && !comment.trim())}
              className={cn(
                dialogType === 'approve' 
                  ? "bg-emerald-600 hover:bg-emerald-700" 
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                  {dialogType === 'approve' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Schedule
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
