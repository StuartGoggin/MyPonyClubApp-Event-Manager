"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState, useMemo, useEffect } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  addMonths,
  subMonths,
  differenceInDays,
  getDay,
  getYear,
  setYear,
  startOfYear,
  addDays,
  getDaysInMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Pin, Route, FerrisWheel, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type Event, type Club, type EventType, type Zone } from '@/lib/types';
import { EventDialog } from './event-dialog';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAtom } from 'jotai';
import { eventSourceAtom } from '@/lib/state';

interface EventCalendarProps {
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
  zones: Zone[];
  today: Date;
  bypassSourceFiltering?: boolean; // New prop to bypass event source filtering
  currentUser?: { id: string; role: 'organiser' | 'zone_approver' | 'admin' | 'viewer' };
}

export function EventCalendar({
  events,
  clubs,
  eventTypes,
  zones,
  today,
  bypassSourceFiltering = false,
  currentUser,
}: EventCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [eventSources] = useAtom(eventSourceAtom);
  const [filterMode, setFilterMode] = useState<'location' | 'distance'>('location');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [homeClubId, setHomeClubId] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(50);

  // Helper function to get club name from clubId
  const getClubName = (clubId: string | undefined) => {
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const filteredClubs = useMemo(() => {
    if (selectedZoneId === 'all') {
      return clubs;
    }
    return clubs.filter(club => club.zoneId === selectedZoneId);
  }, [selectedZoneId, clubs]);

  const sourceFilteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (bypassSourceFiltering) return events;
    if (eventSources.length === 0) return events;
    return events.filter(event => eventSources.includes(event.source));
  }, [events, eventSources, bypassSourceFiltering]);

  const filteredEvents = useMemo(() => {
    const eventsFromSource = sourceFilteredEvents;
    if (!Array.isArray(eventsFromSource)) return [];
    if (filterMode === 'distance' && homeClubId) {
      const homeClub = clubs.find(c => c.id === homeClubId);
      if (!homeClub || homeClub.latitude === undefined || homeClub.longitude === undefined) return eventsFromSource.filter(e => e.source === 'public_holiday');
      const homeCoords = { lat: homeClub.latitude, lon: homeClub.longitude };
      return eventsFromSource.filter(event => {
        if (event.source === 'public_holiday') return true;
        const eventClub = clubs.find(c => c.id === event.clubId);
        if (!eventClub || eventClub.latitude === undefined || eventClub.longitude === undefined) return false;
        const eventCoords = { lat: eventClub.latitude, lon: eventClub.longitude };
        const dist = haversineDistance(homeCoords, eventCoords);
        return dist <= distance;
      });
    }
    // Location-based filtering
    return eventsFromSource.filter(event => {
      if (event.source === 'public_holiday') return true;
      if (selectedClubId !== 'all') {
        return event.clubId === selectedClubId;
      }
      if (selectedZoneId !== 'all') {
        const clubIsInZone = clubs.find(c => c.id === event.clubId)?.zoneId === selectedZoneId;
        return clubIsInZone;
      }
      return true;
    });
  }, [sourceFilteredEvents, clubs, filterMode, homeClubId, distance, selectedZoneId, selectedClubId]);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedClubId('all');
  };

  const next = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 12));
    }
  };

  const prev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, -12));
    }
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDialogOpen(true);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedClub = clubs.find(c => c.id === selectedEvent?.clubId);
  const selectedZone = zones.find(z => z.id === selectedClub?.zoneId);
  const selectedEventType = eventTypes.find(et => et.id === selectedEvent?.eventTypeId);

  const getNearbyEvents = (event: Event) => {
    if (!event || event.status === 'public_holiday' || !Array.isArray(events)) return [];
    const eventDate = new Date(event.date);
    return events.filter(e => {
      if (e.id === event.id) return false;
      const otherEventDate = new Date(e.date);
      const dayDiff = Math.abs(differenceInDays(eventDate, otherEventDate));
      return dayDiff <= 2;
    });
  };

  const yearMonths = Array.from({ length: 12 }, (_, i) => {
    return setYear(startOfYear(new Date()), getYear(currentDate));
  }).map((d, i) => addMonths(d, i));

  if (!today) {
    return null;
  }

  return (
  <div className="enhanced-card rounded-lg border shadow-lg glass-effect">
    <div className="flex flex-col gap-4 p-4 border-b border-border/50">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev} className="premium-button-outline h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={next} className="premium-button-outline h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button 
          variant={view === 'month' ? 'secondary' : 'outline'} 
          size="sm" 
          onClick={() => setView('month')}
          className={view === 'month' ? 'premium-button' : 'premium-button-outline'}
        >
          Month
        </Button>
        <Button 
          variant={view === 'year' ? 'secondary' : 'outline'} 
          size="sm" 
          onClick={() => setView('year')}
          className={view === 'year' ? 'premium-button' : 'premium-button-outline'}
        >
          Year
        </Button>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button 
        variant={filterMode === 'location' ? 'secondary' : 'outline'} 
        size="sm" 
        onClick={() => setFilterMode('location')}
        className={filterMode === 'location' ? 'premium-button' : 'premium-button-outline'}
      >
        <Pin className="mr-2 h-4 w-4" /> Filter by Location
      </Button>
      <Button 
        variant={filterMode === 'distance' ? 'secondary' : 'outline'} 
        size="sm" 
        onClick={() => setFilterMode('distance')}
        className={filterMode === 'distance' ? 'premium-button' : 'premium-button-outline'}
      >
        <Route className="mr-2 h-4 w-4" /> Filter by Distance
      </Button>
    </div>
    <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
    {filterMode === 'location' ? (
      <div className="flex items-center gap-2">
        <Select value={selectedZoneId} onValueChange={handleZoneChange}>
          <SelectTrigger className="w-[180px] enhanced-select">
            <SelectValue placeholder="Select Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All of Victoria</SelectItem>
            {zones.map(zone => (
              <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedClubId} onValueChange={setSelectedClubId} disabled={selectedZoneId === 'all' && filteredClubs.length === clubs.length}>
          <SelectTrigger className="w-[180px] enhanced-select">
            <SelectValue placeholder="Select Club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            {filteredClubs.map(club => (
              <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : (
      <div className="flex items-center gap-2">
         <Select value={homeClubId ?? ''} onValueChange={(val) => setHomeClubId(val === 'none' ? null : val)}>
          <SelectTrigger className="w-[240px] enhanced-select">
            <SelectValue placeholder="Select a home club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select a home club</SelectItem>
            {clubs.map(club => (
              <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         <Select value={String(distance)} onValueChange={(val) => setDistance(Number(val))} disabled={!homeClubId}>
          <SelectTrigger className="w-[180px] enhanced-select">
            <SelectValue placeholder="Select distance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">Within 25 km</SelectItem>
            <SelectItem value="50">Within 50 km</SelectItem>
            <SelectItem value="100">Within 100 km</SelectItem>
            <SelectItem value="200">Within 200 km</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
    </div>
      
    {view === 'month' && (
    <div className='p-4'>
      <CalendarGrid month={currentDate} events={filteredEvents} onEventClick={handleEventClick} today={today} clubs={clubs}/>
    </div>
    )}
      
      {view === 'year' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {yearMonths.map(month => (
            <div
              key={month.toString()}
              className="bg-white rounded-lg shadow p-4 flex flex-col w-full"
            >
              <CalendarGrid month={month} events={filteredEvents} onEventClick={handleEventClick} isYearView={true} today={today} clubs={clubs} />
            </div>
          ))}
        </div>
      )}

    <EventDialog
    isOpen={isDialogOpen}
    onOpenChange={setDialogOpen}
    event={selectedEvent || null}
    club={selectedClub}
    zone={selectedZone}
    eventType={selectedEventType}
    nearbyEvents={selectedEvent ? getNearbyEvents(selectedEvent) : []}
    currentUser={currentUser || { id: 'default', role: 'viewer' }}
    />
  </div>
  );
}

const haversineDistance = (
  coords1: { lat: number; lon: number },
  coords2: { lat: number; lon: number }
) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const weekStartsOn = 3; // Wednesday

const CalendarGrid = ({
  // ...props destructuring...
  month,
  events,
  onEventClick,
  isYearView = false,
  today,
  clubs,
}: {
  month: Date;
  events: Event[];
  onEventClick: (eventId: string) => void;
  isYearView?: boolean;
  today: Date;
  clubs: Club[];
}) => {
    // Track selected event for summary dialog
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const start = startOfWeek(startOfMonth(month), { weekStartsOn });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn });
  
  // Helper function to get club name from clubId
  const getClubName = (clubId: string | undefined) => {
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };
  
  const weeks: Date[][] = [];
  let day = start;
  while (day <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  
  const dayOrder = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  const dayIndexMap = [3, 4, 5, 6, 0, 1, 2]; // Wed=3, Thu=4, ..., Tue=2

  const activeDaysOfMonth = useMemo(() => {
    if (!isYearView) return new Set();
    if (!Array.isArray(events)) return new Set();

    const activeDays = new Set<number>();
    const monthEvents = events.filter(event => isSameMonth(new Date(event.date), month));
    
    monthEvents.forEach(event => {
      activeDays.add(getDay(new Date(event.date)));
    });
    
    return activeDays;
  }, [events, month, isYearView]);

  return (
    <div className={cn("enhanced-card rounded-lg border shadow-md", { "p-2": isYearView, "p-4": !isYearView })}>
      {isYearView && (
        <h3 className="text-base font-semibold font-headline mb-2 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{format(month, 'MMMM')}</h3>
      )}
  <table className={cn("w-full max-w-full text-xs text-center font-medium text-muted-foreground bg-muted/30 rounded-t-lg", { "max-h-[22rem]": isYearView, "overflow-y-auto": isYearView, "p-2": isYearView })}>
        <thead>
          <tr>
            {dayOrder.map((day) => (
              <th key={day} className="py-3 font-semibold">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => {
            if (!week.some(d => isSameMonth(d, month))) {
              return null;
            }
            return (
              <tr key={weekIndex}>
                {dayIndexMap.map(dayIdx => {
                  const day = week.find(d => getDay(d) === dayIdx)!;
                  const isSaturday = getDay(day) === 6;
                  const isSunday = getDay(day) === 0;
                  const isCurrentDayToday = isSameDay(day, today);
                  const dayEvents = Array.isArray(events) ? events.filter(event => isSameDay(new Date(event.date), day)) : [];
                  const isDayActiveInMonth = activeDaysOfMonth.has(dayIdx);
                  const isDayInCurrentMonth = isSameMonth(day, month);
                  return (
                    <td key={day.toString()} className={cn('relative p-1.5 min-h-[6rem] align-top', {
                      'text-muted-foreground': !isDayInCurrentMonth,
                      // Uniform darker blue for weekends
                      'bg-blue-100': isSaturday || isSunday,
                      'relative': isCurrentDayToday,
                    })}>
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'font-bold text-sm mb-1 mt-0 text-center w-full flex justify-center items-start',
                            { 'text-blue-700': isCurrentDayToday, 'text-gray-700': !isCurrentDayToday }
                          )}
                        >
                          {day.getDate()}
                        </span>
                        {/* Events for this day */}
                        <div className="flex flex-col gap-2 w-full">
                          {dayEvents.map((event, i) => (
                            <button
                              key={event.id || i}
                              className={cn(
                                "rounded-xl shadow-sm border bg-white p-2 text-left transition hover:ring-2 hover:ring-primary w-full",
                                event.status === 'approved' ? 'event-approved' :
                                event.status === 'proposed' ? 'event-proposed' :
                                event.status === 'public_holiday' ? 'event-holiday' :
                                event.status === 'rejected' ? 'event-rejected' :
                                'event-default',
                                isYearView ? "text-xs" : "text-sm"
                              )}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className={cn("flex items-start gap-1.5")}> 
                                <div className="flex-shrink-0 pt-0.5">
                                  {event.status === 'approved' ? <CheckCircle className={cn("h-3 w-3 text-primary flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                   event.status === 'proposed' ? <AlertCircle className={cn("h-3 w-3 text-amber-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                   event.status === 'public_holiday' ? <FerrisWheel className={cn("h-3 w-3 text-green-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                   event.status === 'rejected' ? <Clock className={cn("h-3 w-3 text-red-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                   <Clock className={cn("h-3 w-3 text-accent flex-shrink-0", { "h-2 w-2": isYearView })}/>}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className={cn("font-medium leading-tight", 
                                    isYearView ? "text-[10px]" : "text-xs",
                                    event.status === 'approved' ? 'text-primary' : 
                                    event.status === 'proposed' ? 'text-amber-800' :
                                    event.status === 'public_holiday' ? 'text-green-700' :
                                    event.status === 'rejected' ? 'text-red-700' :
                                    'text-accent'
                                  )}>{event.name}</div>
                                  {event.source !== 'public_holiday' && (
                                    <div className={cn("text-muted-foreground font-medium leading-tight",
                                      isYearView ? "text-[8px]" : "text-[9px]"
                                    )}>
                                      {getClubName(event.clubId)}
                                    </div>
                                  )}
                                  <div className="flex">
                                    {event.status === 'proposed' && (
                                      <span className={cn("inline-flex items-center rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200",
                                        isYearView ? "px-1 py-0.5 text-[7px]" : "px-1.5 py-0.5 text-[8px]"
                                      )}>
                                        Pending
                                      </span>
                                    )}
                                    {event.status === 'approved' && (
                                      <span className={cn("inline-flex items-center rounded-full font-medium bg-green-100 text-green-700 border border-green-200",
                                        isYearView ? "px-1 py-0.5 text-[7px]" : "px-1.5 py-0.5 text-[8px]"
                                      )}>
                                        Approved
                                      </span>
                                    )}
                                    {event.status === 'rejected' && (
                                      <span className={cn("inline-flex items-center rounded-full font-medium bg-red-100 text-red-700 border border-red-200",
                                        isYearView ? "px-1 py-0.5 text-[7px]" : "px-1.5 py-0.5 text-[8px]"
                                      )}>
                                        Rejected
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
  {/* Event Summary Dialog */}
  <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{selectedEvent?.name}</DialogTitle>
        <DialogDescription>
          <div className="space-y-2">
            <div><strong>Date:</strong> {selectedEvent?.date ? format(new Date(selectedEvent.date), 'PPP') : ''}</div>
            <div><strong>Club:</strong> {selectedEvent?.clubId ? getClubName(selectedEvent.clubId) : ''}</div>
            <div><strong>Status:</strong> {selectedEvent?.status}</div>
            {selectedEvent?.description && (
              <div><strong>Description:</strong> {selectedEvent.description}</div>
            )}
          </div>
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

}
