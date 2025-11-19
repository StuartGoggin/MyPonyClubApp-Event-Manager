'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, FileText, AlertTriangle, Trophy, Building, Calendar as CalendarLucide, Star, ChevronDown, ChevronUp, Navigation } from 'lucide-react';
import { Event, Club, EventType } from '@/lib/types';
import { EventRailwayProgress } from '../club-manager/event-railway-progress';
import { cn } from '@/lib/utils';

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

// Utility function to format dates for event titles (e.g., "9th Nov 2025")
const formatDateForTitle = (date: Date | string | any) => {
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
    
    const day = validDate.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                   day === 2 || day === 22 ? 'nd' :
                   day === 3 || day === 23 ? 'rd' : 'th';
    
    return new Intl.DateTimeFormat('en-AU', {
      month: 'short',
      year: 'numeric'
    }).format(validDate).replace(/^(\w+)/, `${day}${suffix} $1`);
  } catch (error) {
    console.error('Error formatting date for title:', error, 'Original date:', date);
    return '';
  }
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
  
  // State for collapsed events and their processed status
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());
  const [processedEvents, setProcessedEvents] = useState<Map<string, { action: 'approved' | 'rejected', notes: string }>>(new Map());
  const [focusEventId, setFocusEventId] = useState<string | null>(null);
  
  // Refs for scrolling to tiles
  const eventRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter events that need approval
  const pendingEvents = events.filter(event => event.status === 'proposed');
  const recentlyProcessed = events.filter(event => 
    ['approved', 'rejected'].includes(event.status)
  ).slice(0, 5); // Show last 5 processed events

  // Scroll to focused event
  useEffect(() => {
    if (focusEventId) {
      const element = eventRefs.current.get(focusEventId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Clear focus after scrolling
        setTimeout(() => setFocusEventId(null), 1000);
      }
    }
  }, [focusEventId]);

  const getClubName = (clubId: string | undefined) => {
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const getEventTypeName = (eventTypeId: string | undefined) => {
    if (!eventTypeId) return 'Unknown Type';
    return eventTypes.find(type => type.id === eventTypeId)?.name || 'Unknown Type';
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get distance to nearby event
  const getEventDistance = (currentEvent: Event, nearbyEvent: Event): string | null => {
    const currentClub = clubs.find(c => c.id === currentEvent.clubId);
    if (!currentClub?.latitude || !currentClub?.longitude) {
      return null;
    }
    
    const nearbyClub = clubs.find(c => c.id === nearbyEvent.clubId);
    if (!nearbyClub?.latitude || !nearbyClub?.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      currentClub.latitude,
      currentClub.longitude,
      nearbyClub.latitude,
      nearbyClub.longitude
    );
    
    return `${Math.round(distance)}km away`;
  };

  // Get events within ±1 day of the given event
  const getNearbyEvents = (event: Event): Event[] => {
    if (!event) return [];
    
    const eventDate = new Date(event.date);
    const oneDayBefore = new Date(eventDate);
    oneDayBefore.setDate(eventDate.getDate() - 1);
    const oneDayAfter = new Date(eventDate);
    oneDayAfter.setDate(eventDate.getDate() + 1);
    
    return events.filter(e => {
      if (e.id === event.id) return false; // Exclude the current event
      if (e.status === 'rejected') return false; // Exclude rejected events
      
      const otherEventDate = new Date(e.date);
      return otherEventDate >= oneDayBefore && otherEventDate <= oneDayAfter;
    });
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
      const response = await fetch(`/api/events/${selectedEvent.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType === 'approve' ? 'approved' : 'rejected',
          zoneManagerNotes: notes,
          processedBy: `Zone Manager - ${zoneName}`,
          processedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        // Mark event as processed locally
        const newProcessedEvents = new Map(processedEvents);
        newProcessedEvents.set(selectedEvent.id, { 
          action: actionType === 'approve' ? 'approved' : 'rejected', 
          notes: notes 
        });
        setProcessedEvents(newProcessedEvents);
        
        // Collapse the tile
        const newCollapsed = new Set(collapsedEvents);
        newCollapsed.add(selectedEvent.id);
        setCollapsedEvents(newCollapsed);
        
        // Find next pending event to focus on
        const currentIndex = pendingEvents.findIndex(e => e.id === selectedEvent.id);
        const nextPendingEvent = pendingEvents[currentIndex + 1];
        
        if (nextPendingEvent) {
          setFocusEventId(nextPendingEvent.id);
        }
        
        // Close dialog
        setIsDialogOpen(false);
        setSelectedEvent(null);
        setActionType(null);
        setNotes('');
        
        // No page reload needed - local state handles UI updates
        // Event data will refresh when user navigates or manually refreshes
      } else {
        throw new Error('Failed to update event status');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to process event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEventCollapse = (eventId: string) => {
    const newCollapsed = new Set(collapsedEvents);
    if (newCollapsed.has(eventId)) {
      newCollapsed.delete(eventId);
    } else {
      newCollapsed.add(eventId);
    }
    setCollapsedEvents(newCollapsed);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'proposed':
        return (
          <Badge className="bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border-amber-300 shadow-sm">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Events Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Events Awaiting Approval</h3>
          {pendingEvents.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingEvents.length} Pending
            </Badge>
          )}
        </div>

        {pendingEvents.length === 0 ? (
          <Card className="enhanced-card glass-effect bg-gradient-to-br from-white/95 to-green-50/80 border-2 border-green-200/50 shadow-lg">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-green-800">All Caught Up!</h3>
              <p className="text-muted-foreground">
                No events pending approval in {zoneName}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingEvents.map((event) => {
              const isCollapsed = collapsedEvents.has(event.id);
              const processedInfo = processedEvents.get(event.id);
              const isFocused = focusEventId === event.id;
              
              return (
              <div
                key={event.id}
                ref={(el) => {
                  if (el) eventRefs.current.set(event.id, el);
                }}
              >
              <Card className={`enhanced-card glass-effect overflow-hidden border-2 shadow-xl shadow-black/15 transition-all duration-300 ${
                isFocused ? 'ring-4 ring-primary/50 scale-[1.02]' : ''
              } ${
                processedInfo 
                  ? processedInfo.action === 'approved' 
                    ? 'bg-gradient-to-r from-white/98 via-white/95 to-green-50/60 border-green-300/60'
                    : 'bg-gradient-to-r from-white/98 via-white/95 to-red-50/60 border-red-300/60'
                  : event.isHistoricallyTraditional 
                    ? 'border-amber-300/60 hover:border-amber-400/70 ring-2 ring-amber-200/50 bg-gradient-to-r from-white/98 via-white/95 to-amber-50/60' 
                    : 'border-amber-200/60 hover:border-amber-400/70 bg-gradient-to-r from-white/98 via-white/95 to-amber-50/60'
              }`}>
                {/* Event Tile Header */}
                <div className={`border-b border-border/50 p-4 backdrop-blur-sm ${
                  processedInfo
                    ? processedInfo.action === 'approved'
                      ? 'bg-gradient-to-r from-green-50/60 via-background/95 to-green-100/40'
                      : 'bg-gradient-to-r from-red-50/60 via-background/95 to-red-100/40'
                    : event.isHistoricallyTraditional 
                      ? 'bg-gradient-to-r from-amber-50/80 via-background/95 to-amber-100/60'
                      : 'bg-gradient-to-r from-amber-50/60 via-background/95 to-amber-100/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Priority indicator */}
                      {event.priority && !isCollapsed && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
                          event.priority === 1 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          event.priority === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                          event.priority === 3 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-br from-green-500 to-green-600'
                        }`}>
                          {event.priority}
                        </div>
                      )}
                      
                      <div className="flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-foreground">
                          {formatDateForTitle(event.date) && `${formatDateForTitle(event.date)} - `}{event.name}
                        </h3>
                        
                        {/* Processed status message */}
                        {processedInfo && isCollapsed && (
                          <div className={`flex items-center gap-2 mt-1 ${
                            processedInfo.action === 'approved' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {processedInfo.action === 'approved' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="font-semibold text-sm">
                              Event has been {processedInfo.action === 'approved' ? 'APPROVED' : 'REJECTED'}
                            </span>
                          </div>
                        )}
                        
                        {/* Traditional event indicator */}
                        {event.isHistoricallyTraditional && !isCollapsed && (
                          <div className="flex items-center gap-1 text-sm text-amber-700 mt-1">
                            <CalendarLucide className="h-3 w-3" />
                            <span className="font-medium">Historical Traditional Event</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge and Collapse Button */}
                    <div className="flex items-center gap-2">
                      {processedInfo ? (
                        <Badge className={`${
                          processedInfo.action === 'approved'
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
                            : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300'
                        } shadow-sm`}>
                          {processedInfo.action === 'approved' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" />Approved</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Rejected</>
                          )}
                        </Badge>
                      ) : (
                        <>
                          {getStatusBadge(event.status)}
                          {event.priority === 1 && (
                            <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300">
                              Priority #{event.priority} - Highest
                            </Badge>
                          )}
                        </>
                      )}
                      
                      {/* Collapse/Expand Button */}
                      {processedInfo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEventCollapse(event.id)}
                          className="ml-2"
                        >
                          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Details Grid - Only show when not collapsed */}
                {!isCollapsed && (
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {/* Date */}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Date</span>
                          <span className="text-sm font-semibold">{formatDate(event.date)}</span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Location</span>
                          <span className="text-sm font-semibold">{event.location || 'Not specified'}</span>
                        </div>
                      </div>

                      {/* Club */}
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Club</span>
                          <span className="text-sm font-semibold">{getClubName(event.clubId)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      {/* Event Type */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-xs font-medium text-muted-foreground block">Event Type</span>
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold">{getEventTypeName(event.eventTypeId)}</span>
                            
                            {/* Event Indicators */}
                            <div className="flex flex-wrap gap-1.5">
                              {/* Priority Badge */}
                              {event.priority && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs font-medium",
                                    event.priority === 1 ? "bg-red-50 text-red-700 border-red-300" :
                                    event.priority === 2 ? "bg-orange-50 text-orange-700 border-orange-300" :
                                    event.priority === 3 ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                                    "bg-blue-50 text-blue-700 border-blue-300"
                                  )}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Priority {event.priority}
                                </Badge>
                              )}
                              
                              {/* Traditional Event Badge */}
                              {event.isHistoricallyTraditional ? (
                                <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-300">
                                  <CalendarLucide className="h-3 w-3 mr-1" />
                                  Traditional
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-500 border-gray-300">
                                  <CalendarLucide className="h-3 w-3 mr-1 opacity-50" />
                                  Non-Traditional
                                </Badge>
                              )}
                              
                              {/* Qualifier Badge */}
                              {event.isQualifier ? (
                                <Badge variant="outline" className="text-xs font-medium bg-amber-50 text-amber-700 border-amber-300">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Qualifier
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-500 border-gray-300">
                                  <Trophy className="h-3 w-3 mr-1 opacity-50" />
                                  Non-Qualifier
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Coordinator */}
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Coordinator</span>
                          <span className="text-sm font-semibold">{event.coordinatorName}</span>
                          <span className="text-xs text-muted-foreground block">{event.coordinatorContact}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Information Panel */}
                  {(() => {
                    const nearbyEvents = getNearbyEvents(event);
                    
                    return (
                      <div className="mb-4">
                        {nearbyEvents.length > 0 ? (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                              <h5 className="font-semibold text-amber-800">Approval Information - Potential Scheduling Conflicts</h5>
                            </div>
                            <p className="text-sm text-amber-700 mb-3">
                              The following events are scheduled within 1 day of this event:
                            </p>
                            <div className="space-y-2">
                              {nearbyEvents.map(nearbyEvent => {
                                const distance = getEventDistance(event, nearbyEvent);
                                const hasDistance = distance !== null;
                                const nearbyClub = clubs.find(c => c.id === nearbyEvent.clubId);
                                
                                return (
                                  <div key={nearbyEvent.id} className="text-sm bg-amber-100 p-3 rounded border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="font-semibold text-amber-900">{nearbyEvent.name}</div>
                                        <div className="text-xs text-amber-700 mt-0.5">
                                          {nearbyClub?.name || 'Unknown Club'} • {formatDate(nearbyEvent.date)}
                                        </div>
                                      </div>
                                      <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm border-2",
                                        "transform rotate-12 transition-all",
                                        hasDistance 
                                          ? "bg-green-100 border-green-300 text-green-800" 
                                          : "bg-red-100 border-red-300 text-red-800"
                                      )}>
                                        <Navigation className={cn(
                                          "h-3.5 w-3.5",
                                          hasDistance ? "text-green-600" : "text-red-600"
                                        )} />
                                        <span className="text-xs font-bold">
                                          {hasDistance ? distance : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                                        {getEventTypeName(nearbyEvent.eventTypeId)}
                                      </Badge>
                                      {nearbyEvent.status === 'approved' && (
                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Approved
                                        </Badge>
                                      )}
                                      {nearbyEvent.status === 'proposed' && (
                                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <h5 className="font-semibold text-green-800">Approval Information - No Scheduling Conflicts</h5>
                            </div>
                            <p className="text-sm text-green-700">
                              There are no other events scheduled within 1 day of this event date.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Approval Progress Railway */}
                  <div className="mb-4">
                    <EventRailwayProgress event={event} />
                  </div>

                  {/* Approval Action Buttons */}
                  {!processedInfo && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:border-red-700 px-6"
                        onClick={() => handleEventAction(event, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6"
                        onClick={() => handleEventAction(event, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Event
                      </Button>
                    </div>
                  )}
                </CardContent>
                )}
              </Card>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recently Processed Events */}
      {recentlyProcessed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">Recently Processed</h2>
            <Badge variant="outline" className="ml-2">{recentlyProcessed.length}</Badge>
          </div>

          <div className="space-y-4">
            {recentlyProcessed.map((event) => (
              <Card key={event.id} className={`enhanced-card glass-effect overflow-hidden border-2 shadow-lg transition-all duration-300 ${
                event.status === 'approved' 
                  ? 'bg-gradient-to-r from-white/98 via-white/95 to-green-50/60 border-green-200/60 hover:border-green-300/70' 
                  : 'bg-gradient-to-r from-white/98 via-white/95 to-red-50/60 border-red-200/60 hover:border-red-300/70'
              }`}>
                {/* Event Tile Header */}
                <div className={`border-b border-border/50 p-4 backdrop-blur-sm ${
                  event.status === 'approved'
                    ? 'bg-gradient-to-r from-green-50/60 via-background/95 to-green-100/40'
                    : 'bg-gradient-to-r from-red-50/60 via-background/95 to-red-100/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Priority indicator */}
                      {event.priority && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${
                          event.priority === 1 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                          event.priority === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                          event.priority === 3 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-br from-green-500 to-green-600'
                        }`}>
                          {event.priority}
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-foreground">
                          {formatDateForTitle(event.date) && `${formatDateForTitle(event.date)} - `}{event.name}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                </div>

                {/* Event Details Grid */}
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {/* Date */}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Date</span>
                          <span className="text-sm font-semibold">{formatDate(event.date)}</span>
                        </div>
                      </div>

                      {/* Club */}
                      <div className="flex items-start gap-2">
                        <Building className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Club</span>
                          <span className="text-sm font-semibold">{getClubName(event.clubId)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      {/* Event Type */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-xs font-medium text-muted-foreground block">Event Type</span>
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold">{getEventTypeName(event.eventTypeId)}</span>
                            
                            {/* Event Indicators */}
                            <div className="flex flex-wrap gap-1.5">
                              {/* Priority Badge */}
                              {event.priority && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-xs font-medium",
                                    event.priority === 1 ? "bg-red-50 text-red-700 border-red-300" :
                                    event.priority === 2 ? "bg-orange-50 text-orange-700 border-orange-300" :
                                    event.priority === 3 ? "bg-yellow-50 text-yellow-700 border-yellow-300" :
                                    "bg-blue-50 text-blue-700 border-blue-300"
                                  )}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Priority {event.priority}
                                </Badge>
                              )}
                              
                              {/* Traditional Event Badge */}
                              {event.isHistoricallyTraditional ? (
                                <Badge variant="outline" className="text-xs font-medium bg-purple-50 text-purple-700 border-purple-300">
                                  <CalendarLucide className="h-3 w-3 mr-1" />
                                  Traditional
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-500 border-gray-300">
                                  <CalendarLucide className="h-3 w-3 mr-1 opacity-50" />
                                  Non-Traditional
                                </Badge>
                              )}
                              
                              {/* Qualifier Badge */}
                              {event.isQualifier ? (
                                <Badge variant="outline" className="text-xs font-medium bg-amber-50 text-amber-700 border-amber-300">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Qualifier
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-500 border-gray-300">
                                  <Trophy className="h-3 w-3 mr-1 opacity-50" />
                                  Non-Qualifier
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block">Coordinator</span>
                          <span className="text-sm font-semibold">{event.coordinatorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Zone Manager Notes if present */}
                  {event.notes && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground block mb-1">Event Notes</span>
                          <p className="text-sm text-foreground">{event.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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
