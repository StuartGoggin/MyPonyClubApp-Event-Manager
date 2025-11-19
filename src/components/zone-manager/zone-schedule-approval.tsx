'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, FileText, AlertTriangle, Download, ExternalLink, Sparkles, ChevronRight, AlertCircle, CheckCircleIcon } from 'lucide-react';
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
    } else if (date && typeof date === 'object' && (date.seconds || date._seconds)) {
      // Handle both Firestore Timestamp formats (seconds and _seconds)
      const seconds = date.seconds || date._seconds;
      validDate = new Date(seconds * 1000);
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
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'ai-report' | null>(null);
  const [comment, setComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiReviewingEventId, setAiReviewingEventId] = useState<string | null>(null);
  const [expandedAiReview, setExpandedAiReview] = useState<string | null>(null);

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

  const handleRequestAiReview = async (event: Event) => {
    setAiReviewingEventId(event.id);
    try {
      const response = await fetch(`/api/events/${event.id}/ai-review`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to perform AI review');
      }

      // Refresh data to show the new AI review
      onEventUpdate();
    } catch (error) {
      console.error('Error requesting AI review:', error);
      alert('Failed to perform AI review. Please try again.');
    } finally {
      setAiReviewingEventId(null);
    }
  };

  const handleViewFullAiReport = (event: Event) => {
    setSelectedEvent(event);
    setDialogType('ai-report');
  };

  const handleDownloadAiReport = (event: Event) => {
    if (!event.schedule?.aiReview) return;

    const report = `AI Schedule Compliance Review
Event: ${event.name}
Date: ${formatDate(event.date)}
Review Date: ${formatDate(event.schedule.aiReview.reviewedAt)}
Model: ${event.schedule.aiReview.model}

SUMMARY
${event.schedule.aiReview.summary}

COMPLIANCE SCORE: ${event.schedule.aiReview.overallScore}/100
STATUS: ${event.schedule.aiReview.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}

ISSUES FOUND (${event.schedule.aiReview.issues.length})
${event.schedule.aiReview.issues.map((issue, index) => `
${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category.toUpperCase()}
   ${issue.description}
`).join('\n')}

SUGGESTIONS (${event.schedule.aiReview.suggestions.length})
${event.schedule.aiReview.suggestions.map((suggestion, index) => `
${index + 1}. ${suggestion}
`).join('\n')}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-Review-${event.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
              <CardHeader className="pb-3 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 w-full">
                    <CardTitle className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-400">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="mt-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium truncate">{getClubName(event.clubId)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700 whitespace-nowrap">
                    {getEventTypeName(event.eventTypeId)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-3 sm:p-6">
                {/* Schedule Information */}
                <div className="rounded-lg border-2 border-yellow-200/60 dark:border-yellow-700/60 bg-gradient-to-br from-yellow-50/90 to-amber-50/80 dark:from-yellow-950/30 dark:to-amber-950/20 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-yellow-900 dark:text-yellow-100 uppercase tracking-wide">
                      Schedule Information
                    </h4>
                    <Badge className="bg-orange-500 hover:bg-orange-600 whitespace-nowrap">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {event.schedule?.fileUrl && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-yellow-300/40 dark:border-yellow-700/40 overflow-hidden">
                        <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
                          <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 truncate">
                              {event.schedule.fileName || 'Schedule Document'}
                            </div>
                            {event.schedule.uploadedAt && (
                              <div className="text-xs text-muted-foreground truncate">
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
                        <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(event.schedule?.fileUrl, '_blank')}
                            className="border-yellow-300 dark:border-yellow-700 flex-1 sm:flex-none"
                          >
                            <ExternalLink className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-yellow-300 dark:border-yellow-700 flex-1 sm:flex-none"
                          >
                            <a href={event.schedule.fileUrl} download>
                              <Download className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Download</span>
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

                {/* AI Compliance Review */}
                <div className="rounded-lg border-2 border-purple-200/60 dark:border-purple-700/60 bg-gradient-to-br from-purple-50/90 to-violet-50/80 dark:from-purple-950/30 dark:to-violet-950/20 p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">AI Compliance Review</span>
                    </h4>
                    {!event.schedule?.aiReview && (
                      <Button
                        size="sm"
                        onClick={() => handleRequestAiReview(event)}
                        disabled={aiReviewingEventId === event.id}
                        className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap w-full sm:w-auto"
                      >
                        {aiReviewingEventId === event.id ? (
                          <>
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            Run AI Review
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {event.schedule?.aiReview ? (
                    <div className="space-y-3">
                      {/* Summary Card */}
                      <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-purple-300/40 dark:border-purple-700/40">
                        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0",
                              event.schedule.aiReview.overallScore >= 80 ? "bg-green-100 text-green-700" :
                              event.schedule.aiReview.overallScore >= 60 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            )}>
                              {event.schedule.aiReview.overallScore}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                                Compliance Score
                              </div>
                              <Badge className={cn(
                                "mt-1",
                                event.schedule.aiReview.compliant 
                                  ? "bg-green-600" 
                                  : "bg-orange-600"
                              )}>
                                {event.schedule.aiReview.compliant ? (
                                  <>
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Compliant
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Needs Attention
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(event.schedule.aiReview.reviewedAt)}
                          </div>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          {event.schedule.aiReview.summary}
                        </p>
                      </div>

                      {/* Issues Summary - Collapsible */}
                      {event.schedule.aiReview.issues.length > 0 && (
                        <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-purple-300/40 dark:border-purple-700/40">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-purple-900 dark:text-purple-100 uppercase tracking-wide">
                              Issues Found ({event.schedule.aiReview.issues.length})
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedAiReview(
                                expandedAiReview === event.id ? null : event.id
                              )}
                              className="h-6 px-2"
                            >
                              {expandedAiReview === event.id ? 'Show Less' : 'Show All'}
                              <ChevronRight className={cn(
                                "h-3 w-3 ml-1 transition-transform",
                                expandedAiReview === event.id && "rotate-90"
                              )} />
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {(expandedAiReview === event.id 
                              ? event.schedule.aiReview.issues 
                              : event.schedule.aiReview.issues.slice(0, 3)
                            ).map((issue, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <div className={cn(
                                  "mt-0.5 rounded px-1.5 py-0.5 text-xs font-bold uppercase",
                                  issue.severity === 'high' ? "bg-red-100 text-red-700" :
                                  issue.severity === 'medium' ? "bg-yellow-100 text-yellow-700" :
                                  "bg-blue-100 text-blue-700"
                                )}>
                                  {issue.severity}
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium text-purple-900 dark:text-purple-100">
                                    {issue.category}:
                                  </span>
                                  <span className="text-purple-800 dark:text-purple-200 ml-1">
                                    {issue.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {!expandedAiReview && event.schedule.aiReview.issues.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center pt-1">
                                +{event.schedule.aiReview.issues.length - 3} more issues
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFullAiReport(event)}
                          className="flex-1 border-purple-300 dark:border-purple-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Full Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAiReport(event)}
                          className="flex-1 border-purple-300 dark:border-purple-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download Report
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Click "Run AI Review" to analyze this schedule for compliance issues
                      </p>
                    </div>
                  )}
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
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
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
        <DialogContent className={dialogType === 'ai-report' ? 'max-w-4xl max-h-[80vh] overflow-y-auto' : ''}>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'approve' && 'Approve Schedule'}
              {dialogType === 'reject' && 'Request Changes to Schedule'}
              {dialogType === 'ai-report' && 'AI Compliance Review - Full Report'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'approve' && 
                `You are about to approve the schedule for "${selectedEvent?.name}". This will notify the club that their schedule is approved.`
              }
              {dialogType === 'reject' &&
                `You are about to request changes to the schedule for "${selectedEvent?.name}". The club will be notified and can resubmit.`
              }
              {dialogType === 'ai-report' &&
                `Detailed AI analysis of the schedule for "${selectedEvent?.name}"`
              }
            </DialogDescription>
          </DialogHeader>

          {dialogType === 'ai-report' && selectedEvent?.schedule?.aiReview ? (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold",
                  selectedEvent.schedule.aiReview.overallScore >= 80 ? "bg-green-100 text-green-700" :
                  selectedEvent.schedule.aiReview.overallScore >= 60 ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {selectedEvent.schedule.aiReview.overallScore}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold">Compliance Score</div>
                  <Badge className={cn(
                    "mt-1",
                    selectedEvent.schedule.aiReview.compliant 
                      ? "bg-green-600" 
                      : "bg-orange-600"
                  )}>
                    {selectedEvent.schedule.aiReview.compliant ? 'Compliant' : 'Needs Attention'}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Reviewed: {formatDate(selectedEvent.schedule.aiReview.reviewedAt)}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.schedule.aiReview.summary}</p>
              </div>

              {/* Issues */}
              {selectedEvent.schedule.aiReview.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Issues Found ({selectedEvent.schedule.aiReview.issues.length})</h4>
                  <div className="space-y-3">
                    {selectedEvent.schedule.aiReview.issues.map((issue, index) => (
                      <div key={index} className="p-3 bg-white dark:bg-slate-900 rounded-lg border">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 rounded px-2 py-1 text-xs font-bold uppercase",
                            issue.severity === 'high' ? "bg-red-100 text-red-700" :
                            issue.severity === 'medium' ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {issue.severity}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1 uppercase tracking-wide">
                              {issue.category}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {issue.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {selectedEvent.schedule.aiReview.suggestions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Suggestions ({selectedEvent.schedule.aiReview.suggestions.length})</h4>
                  <ul className="space-y-2">
                    {selectedEvent.schedule.aiReview.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : dialogType !== 'ai-report' && (
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
          )}

          <DialogFooter>
            {dialogType === 'ai-report' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => selectedEvent && handleDownloadAiReport(selectedEvent)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button onClick={handleCancelAction}>
                  Close
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
