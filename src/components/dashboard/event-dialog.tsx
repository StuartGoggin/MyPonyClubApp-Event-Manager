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
  XCircle,
  Navigation,
  ExternalLink,
  Package,
  Truck,
  ArrowRight,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { EventScheduleUpload } from '@/components/event-schedule-upload';
import { EventScheduleReview } from '@/components/event-schedule-review';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EventDialogProps {
  event: Event | null;
  club: Club | undefined;
  zone: Zone | undefined;
  eventType: EventType | undefined;
  nearbyEvents: Event[];
  clubs: Club[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentUser?: {
    id: string;
    role: string;
    zoneId?: string;
    clubId?: string;
  } | null;
}

export function EventDialog({
  event,
  club,
  zone,
  eventType,
  nearbyEvents,
  clubs,
  isOpen,
  onOpenChange,
  currentUser,
}: EventDialogProps) {
  const { toast } = useToast();
  const [loadingHandover, setLoadingHandover] = useState(false);
  const [handoverChain, setHandoverChain] = useState<any>(null);
  const [equipmentHomeLocation, setEquipmentHomeLocation] = useState<any>(null);

  // Fetch handover chain when dialog opens for equipment bookings
  useEffect(() => {
    if (isOpen && event?.source === 'equipment_booking' && event.metadata) {
      const bookingId = (event.metadata as any).bookingId;
      const equipmentId = (event.metadata as any).equipmentId;
      
      if (bookingId && equipmentId) {
        fetchHandoverChain(bookingId, equipmentId);
      }
    } else {
      // Clear handover data when dialog closes or event changes
      setHandoverChain(null);
      setEquipmentHomeLocation(null);
    }
  }, [isOpen, event]);

  const fetchHandoverChain = async (bookingId: string, equipmentId: string) => {
    setLoadingHandover(true);
    try {
      // Get auth headers
      const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
      };

      const [chainResponse, equipmentResponse] = await Promise.all([
        fetch(`/api/equipment-bookings/${bookingId}/handover-chain`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/equipment/${equipmentId}`, {
          headers: getAuthHeaders()
        })
      ]);

      if (chainResponse.ok) {
        const chainData = await chainResponse.json();
        setHandoverChain(chainData);
      } else {
        console.error('Failed to fetch handover chain:', chainResponse.status);
      }

      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipmentHomeLocation(equipmentData.data?.homeLocation);
      }
    } catch (error) {
      console.error('Error fetching handover details:', error);
    } finally {
      setLoadingHandover(false);
    }
  };

  if (!event) return null;
  
  // Only require club for club-level events
  // State, Zone, Equestrian Victoria, EV Scraper, and Equipment Booking events don't need a club
  const requiresClub = event.source !== 'public_holiday' && 
                       event.source !== 'state' && 
                       event.source !== 'zone' && 
                       event.source !== 'equestrian_victoria' &&
                       event.source !== 'ev_scraper' &&
                       event.source !== 'equipment_booking';
  
  if (requiresClub && !club) return null;
  
  // For EV events, public holidays, and equipment bookings, eventType may not exist - that's okay
  const requiresEventType = event.status !== 'ev_event' && 
                            event.status !== 'public_holiday' &&
                            event.source !== 'public_holiday' &&
                            event.source !== 'equipment_booking';
  
  if (requiresEventType && !eventType) return null;

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
  const getEventDistance = (nearbyEvent: Event): string | null => {
    // Try to use event coordinates first, fall back to club coordinates
    let sourceLat: number | undefined;
    let sourceLng: number | undefined;
    
    if (event.latitude && event.longitude) {
      sourceLat = event.latitude;
      sourceLng = event.longitude;
    } else if (club?.latitude && club?.longitude) {
      sourceLat = club.latitude;
      sourceLng = club.longitude;
    } else {
      console.log('No coordinates for source event or club');
      return null;
    }
    
    // Try to use nearby event coordinates first, fall back to its club coordinates
    let targetLat: number | undefined;
    let targetLng: number | undefined;
    
    if (nearbyEvent.latitude && nearbyEvent.longitude) {
      targetLat = nearbyEvent.latitude;
      targetLng = nearbyEvent.longitude;
    } else {
      const nearbyClub = clubs.find(c => c.id === nearbyEvent.clubId);
      if (nearbyClub?.latitude && nearbyClub?.longitude) {
        targetLat = nearbyClub.latitude;
        targetLng = nearbyClub.longitude;
      } else {
        console.log('No coordinates for nearby event or its club');
        return null;
      }
    }
    
    const distance = calculateDistance(
      sourceLat,
      sourceLng,
      targetLat,
      targetLng
    );
    
    console.log(`Distance to nearby event: ${Math.round(distance)}km`);
    return `${Math.round(distance)}km away`;
  };

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
      case 'ev_event':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            EV Event
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
          <div className="flex items-center gap-3 text-base text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(eventDate, 'PPPP')}
            </div>
            {getStatusBadge(event.status)}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Equipment Booking Info - Show for equipment bookings */}
          {event.source === 'equipment_booking' && event.metadata && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 font-semibold text-orange-900">
                <Package className="h-5 w-5" />
                Equipment Hire Details
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-orange-700 font-medium mb-1">Equipment</div>
                  <div className="flex items-center gap-2">
                    {(event.metadata as any).equipmentIcon && (
                      <span className="text-xl">{(event.metadata as any).equipmentIcon}</span>
                    )}
                    <span className="font-semibold text-orange-900">
                      {(event.metadata as any).equipmentName || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-orange-700 font-medium mb-1">Booking Reference</div>
                  <div className="font-mono text-sm text-orange-900">
                    {(event.metadata as any).bookingReference || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-orange-700 font-medium mb-1">Hire Period</div>
                  <div className="text-sm text-orange-900">
                    {(event.metadata as any).pickupDate && (event.metadata as any).returnDate ? (
                      <>
                        {format(new Date((event.metadata as any).pickupDate), 'PP')} - {format(new Date((event.metadata as any).returnDate), 'PP')}
                      </>
                    ) : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-orange-700 font-medium mb-1">Status</div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                    <Truck className="h-3 w-3 mr-1" />
                    {(event.metadata as any).bookingStatus || 'Active'}
                  </Badge>
                </div>
              </div>
              
              {(event.metadata as any).custodianName && (
                <div className="pt-2 border-t border-orange-200">
                  <div className="text-sm text-orange-700 font-medium mb-1">Custodian</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-orange-900">
                      <User className="h-3 w-3" />
                      {(event.metadata as any).custodianName}
                    </div>
                    {(event.metadata as any).custodianEmail && (
                      <div className="flex items-center gap-2 text-sm text-orange-700">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${(event.metadata as any).custodianEmail}`} className="hover:underline">
                          {(event.metadata as any).custodianEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {event.location && (
                <div className="pt-2 border-t border-orange-200">
                  <div className="text-sm text-orange-700 font-medium mb-1">Location</div>
                  <div className="flex items-center gap-2 text-sm text-orange-900">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Handover Chain - Show for equipment bookings */}
          {event.source === 'equipment_booking' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Equipment Handover Chain
              </h3>
              
              {loadingHandover ? (
                <div className="text-sm text-muted-foreground">Loading handover details...</div>
              ) : !handoverChain ? (
                <div className="text-sm text-muted-foreground">No handover information available</div>
              ) : (
                <div className="space-y-3">
                  {/* Pickup Section */}
                  {handoverChain.pickup && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-blue-900 mb-2">
                        <ArrowRight className="h-4 w-4" />
                        Pick up from
                      </div>
                      <div className="space-y-1 text-sm">
                        {handoverChain.pickup.isZoneStorage ? (
                          <>
                            <div className="flex items-center gap-2 text-blue-800">
                              <Home className="h-3 w-3" />
                              <span className="font-medium">Zone Storage Location</span>
                            </div>
                            {equipmentHomeLocation && (
                              <>
                                <div className="text-blue-700">{equipmentHomeLocation.address}</div>
                                <div className="text-blue-700">
                                  Contact: {equipmentHomeLocation.contactPerson.name} - {equipmentHomeLocation.contactPerson.phone}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-blue-800">{handoverChain.pickup.clubName}</div>
                            <div className="text-blue-700">
                              {handoverChain.pickup.contact.name} - {handoverChain.pickup.contact.phone}
                            </div>
                            {handoverChain.pickup.contact.email && (
                              <div className="text-blue-600 text-xs">{handoverChain.pickup.contact.email}</div>
                            )}
                          </>
                        )}
                        <div className="text-blue-600 text-xs mt-1">
                          {format(new Date(handoverChain.pickup.date), 'PPP')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Current Booking */}
                  {handoverChain.current && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-green-900 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        Your Booking
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium text-green-800">{handoverChain.current.clubName}</div>
                        <div className="text-green-700">
                          {handoverChain.current.contact.name} - {handoverChain.current.contact.phone}
                        </div>
                        <div className="text-green-600 text-xs">
                          {format(new Date(handoverChain.current.pickupDate), 'PP')} - {format(new Date(handoverChain.current.returnDate), 'PP')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drop-off Section */}
                  {handoverChain.dropoff && (
                    <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded-lg">
                      <div className="flex items-center gap-2 font-medium text-purple-900 mb-2">
                        <ArrowRight className="h-4 w-4" />
                        Return to
                      </div>
                      <div className="space-y-1 text-sm">
                        {handoverChain.dropoff.isZoneStorage ? (
                          <>
                            <div className="flex items-center gap-2 text-purple-800">
                              <Home className="h-3 w-3" />
                              <span className="font-medium">Zone Storage Location</span>
                            </div>
                            {equipmentHomeLocation && (
                              <>
                                <div className="text-purple-700">{equipmentHomeLocation.address}</div>
                                <div className="text-purple-700">
                                  Contact: {equipmentHomeLocation.contactPerson.name} - {equipmentHomeLocation.contactPerson.phone}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-purple-800">{handoverChain.dropoff.clubName}</div>
                            <div className="text-purple-700">
                              {handoverChain.dropoff.contact.name} - {handoverChain.dropoff.contact.phone}
                            </div>
                            {handoverChain.dropoff.contact.email && (
                              <div className="text-purple-600 text-xs">{handoverChain.dropoff.contact.email}</div>
                            )}
                          </>
                        )}
                        <div className="text-purple-600 text-xs mt-1">
                          {format(new Date(handoverChain.dropoff.date), 'PPP')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Event Info Card - Only show for non-equipment events */}
          {event.source !== 'equipment_booking' && (
            <div className="bg-muted/20 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>{eventType?.name || (event.status === 'ev_event' ? 'EV Event' : 'Event')}</span>
                  {event.isQualifier && (
                    <Badge variant="secondary" className="ml-2">
                      <Award className="h-3 w-3 mr-1" />
                      Qualifier
                    </Badge>
                  )}
                </div>
              </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}

            {event.eventLink && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={event.eventLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  View Event Details
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
          )}

          {/* Organization & Contact Cards - Only show for non-equipment events */}
          {event.source !== 'equipment_booking' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organization Card */}
              {(club || zone) && (
                <div className="bg-muted/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 font-medium text-foreground mb-3">
                    <Building2 className="h-4 w-4" />
                    Organization
                  </div>
                <div className="space-y-2">
                  {club && (
                    <div>
                      <div className="font-medium text-foreground">{club.name}</div>
                      {club.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <a href={`mailto:${club.email}`} className="hover:underline">
                            {club.email}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {zone && (
                    <div className="text-sm text-muted-foreground">
                      {zone.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Card */}
            {(event.coordinatorName || event.coordinatorContact || event.submittedBy || event.submittedByContact) && (
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-foreground mb-3">
                  <User className="h-4 w-4" />
                  Contact Details
                </div>
                
                <div className="space-y-3">
                  {(event.coordinatorName || event.coordinatorContact) && (
                    <div className="grid grid-cols-3 gap-4 items-start">
                      <div className="text-sm text-muted-foreground font-medium">
                        Coordinator:
                      </div>
                      <div className="col-span-2 space-y-1">
                        {event.coordinatorName && (
                          <div className="font-medium text-foreground">{event.coordinatorName}</div>
                        )}
                        {event.coordinatorContact && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground">{event.coordinatorContact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(event.submittedBy || event.submittedByContact) && (
                    <div className="grid grid-cols-3 gap-4 items-start pt-2 border-t border-border/50">
                      <div className="text-sm text-muted-foreground font-medium">
                        Submitted by:
                      </div>
                      <div className="col-span-2 space-y-1">
                        {event.submittedBy && (
                          <div className="font-medium text-foreground">{event.submittedBy}</div>
                        )}
                        {event.submittedByContact && (
                          <div className="text-sm text-muted-foreground">
                            {event.submittedByContact}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          {nearbyEvents.length > 0 && event.source !== 'equipment_booking' && (
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
                  {nearbyEvents.map(nearbyEvent => {
                    const distance = getEventDistance(nearbyEvent);
                    const hasDistance = distance !== null;
                    
                    return (
                      <div key={nearbyEvent.id} className="text-sm text-amber-700 bg-amber-100 p-2 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{nearbyEvent.name}</div>
                            <div className="text-xs">{format(formatDate(nearbyEvent.date), 'PPP')}</div>
                          </div>
                          
                          {/* Distance Tile */}
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ml-3",
                            "shadow-sm border transform rotate-12",
                            hasDistance 
                              ? "bg-green-100 border-green-300 text-green-700" 
                              : "bg-red-100 border-red-300 text-red-700"
                          )}>
                            <Navigation className={cn(
                              "h-3 w-3",
                              hasDistance ? "text-green-600" : "text-red-600"
                            )} />
                            {hasDistance ? distance : "N/A"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
