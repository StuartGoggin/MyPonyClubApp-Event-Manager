
'use client';

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
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Pin, Route, FerrisWheel } from 'lucide-react';
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
  month,
  events,
  onEventClick,
  isYearView = false,
  today,
}: {
  month: Date;
  events: Event[];
  onEventClick: (eventId: string) => void;
  isYearView?: boolean;
  today: Date;
}) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn });
  
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

  return (
    <div className={cn("bg-card rounded-lg border shadow-sm w-full", { "p-0 border-0 shadow-none bg-transparent": isYearView })}>
        {!isYearView && (
             <div className="table table-fixed w-full text-xs text-center font-medium text-muted-foreground">
                <div className='table-header-group'>
                    <div className='table-row'>
                        {dayOrder.map((day) => (
                            <div key={day} className={cn("table-cell py-2", (day === 'Sat' || day === 'Sun') ? "w-[20%]" : "w-[12%]")}>
                                {day}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      <div className={cn("divide-y border-t", {"border-t-0 divide-y-0": isYearView})}>
        {weeks.map((week, weekIndex) => {
            const eventHeight = isYearView ? 22 : 30;
            const eventGap = isYearView ? 2 : 4;
            const baseCellHeight = isYearView ? 28 : 32;

            const maxEventsInWeek = Math.max(0, ...week.map(day => {
                return events.filter(event => isSameDay(new Date(event.date), day)).length;
            }));
            
            const requiredContentHeight = maxEventsInWeek * (eventHeight + eventGap);
            const cellHeight = baseCellHeight + requiredContentHeight;


          return (
          <div key={weekIndex} className="table table-fixed w-full border-t first:border-t-0 md:border-t">
             <div className='table-row' style={{ height: `${cellHeight}px` }}>
            {dayIndexMap.map(dayIdx => {
                const day = week.find(d => getDay(d) === dayIdx)!;
                const isSaturday = getDay(day) === 6;
                const isSunday = getDay(day) === 0;
                const isCurrentDayToday = isSameDay(day, today);

                const dayEvents = events.filter(event => isSameDay(new Date(event.date), day));
                
                return (
                    <div
                        key={day.toString()}
                        className={cn('table-cell border-l p-1.5 align-top relative', {
                          'bg-background/50 text-muted-foreground': !isSameMonth(day, month),
                          'bg-muted/20': !isSameMonth(day, month) && (isSaturday || isSunday),
                          'bg-primary/5': isSameMonth(day, month) && (isSaturday || isSunday),
                          'relative': isCurrentDayToday,
                          'border-t-0': isYearView && weekIndex === 0,
                          'w-[20%]': isSaturday || isSunday,
                          'w-[12%]': !isSaturday && !isSunday
                        })}
                        style={{minHeight: `${baseCellHeight}px`}}
                    >
                         <span
                            className={cn(
                                'flex items-center justify-center h-6 w-6 rounded-full text-sm',
                                { 'text-muted-foreground': !isSameMonth(day, month) },
                                { 'bg-primary text-primary-foreground font-bold': isCurrentDayToday },
                                { 'text-xs h-5 w-5': isYearView }
                            )}
                        >
                            {format(day, 'd')}
                        </span>
                        <div className="absolute top-0 left-0 w-full p-1.5 z-10 space-y-1">
                        {dayEvents.map((event, index) => (
                            <button
                                key={event.id}
                                onClick={() => onEventClick(event.id)}
                                className={cn(
                                    "w-full text-left rounded-md text-xs leading-tight transition-colors shadow-sm",
                                    "whitespace-normal",
                                    isYearView ? "p-1" : "p-1.5",
                                    event.status === 'approved' ? 'bg-primary/20 hover:bg-primary/30 text-primary-foreground' :
                                    event.status === 'public_holiday' ? 'bg-green-500/20 hover:bg-green-500/30' :
                                    'bg-accent/20 hover:bg-accent/30 text-accent-foreground'
                                )}
                                style={{
                                    height: `${eventHeight}px`,
                                    top: `${baseCellHeight + index * (eventHeight + eventGap)}px`,
                                    position: 'absolute',
                                    left: '0.375rem',
                                    right: '0.375rem',
                                    width: 'calc(100% - 0.75rem)'
                                }}
                            >
                                <div className={cn("flex items-start gap-1.5", { "gap-1": isYearView })}>
                                <div className="flex-shrink-0 pt-0.5">
                                {event.status === 'approved' ? <CheckCircle className={cn("h-3 w-3 text-primary flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                 event.status === 'public_holiday' ? <FerrisWheel className={cn("h-3 w-3 text-green-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                 <Clock className={cn("h-3 w-3 text-accent flex-shrink-0", { "h-2 w-2": isYearView })}/>}
                                </div>
                                <span className={cn("font-medium", 
                                    event.status === 'approved' ? 'text-primary' : 
                                    event.status === 'public_holiday' ? 'text-green-700' :
                                    'text-accent'
                                    )}>{event.name}</span>
                                </div>
                            </button>
                            ))}
                        </div>
                    </div>
                );
            })}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};


export function EventCalendar({
  events,
  clubs,
  eventTypes,
  zones
}: EventCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);
  
  const [view, setView] = useState<'month' | 'year'>('month');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [eventSources] = useAtom(eventSourceAtom);
  
  const [filterMode, setFilterMode] = useState<'location' | 'distance'>('location');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [homeClubId, setHomeClubId] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(50);

  const filteredClubs = useMemo(() => {
    if (selectedZoneId === 'all') {
      return clubs;
    }
    return clubs.filter(club => club.zoneId === selectedZoneId);
  }, [selectedZoneId, clubs]);

  const sourceFilteredEvents = useMemo(() => {
    if (eventSources.length === 0) return events;
    return events.filter(event => eventSources.includes(event.source));
  }, [events, eventSources]);

  const filteredEvents = useMemo(() => {
    const eventsFromSource = events.filter(event => eventSources.includes(event.source));

    if (filterMode === 'distance' && homeClubId) {
        const homeClub = clubs.find(c => c.id === homeClubId);
        if (!homeClub || homeClub.latitude === undefined || homeClub.longitude === undefined) return eventsFromSource.filter(e => e.source === 'public_holiday');

        const homeCoords = { lat: homeClub.latitude, lon: homeClub.longitude };
        
        return eventsFromSource.filter(event => {
            if (event.source === 'public_holiday') return true; // Always show holidays
            const eventClub = clubs.find(c => c.id === event.clubId);
            if (!eventClub || eventClub.latitude === undefined || eventClub.longitude === undefined) return false;

            const eventCoords = { lat: eventClub.latitude, lon: eventClub.longitude };
            const dist = haversineDistance(homeCoords, eventCoords);
            return dist <= distance;
        });
    }

    // Location-based filtering
    return eventsFromSource.filter(event => {
      if (event.source === 'public_holiday') return true; // Always show holidays
      if (selectedClubId !== 'all') {
        return event.clubId === selectedClubId;
      }
      if (selectedZoneId !== 'all') {
        const clubIsInZone = clubs.find(c => c.id === event.clubId)?.zoneId === selectedZoneId;
        return clubIsInZone;
      }
      return true;
    });
  }, [events, clubs, eventSources, filterMode, homeClubId, distance, selectedZoneId, selectedClubId]);

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
      setCurrentDate(subMonths(currentDate, 12));
    }
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDialogOpen(true);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedClub = clubs.find(c => c.id === selectedEvent?.clubId);
  const selectedEventType = eventTypes.find(et => et.id === selectedEvent?.eventTypeId);

  const getNearbyEvents = (event: Event) => {
    if (!event || event.status === 'public_holiday') return [];
    const eventDate = new Date(event.date);
    return events.filter(e => {
        if (e.id === event.id) return false;
        const otherEventDate = new Date(e.date);
        const dayDiff = Math.abs(differenceInDays(eventDate, otherEventDate));
        return dayDiff <= 2;
    });
  };
  
  const handleEventApproved = () => {
    router.refresh();
  }

  const yearMonths = Array.from({ length: 12 }, (_, i) => {
    return setYear(startOfYear(new Date()), getYear(currentDate));
  }).map((d, i) => addMonths(d, i));

  if (!today) {
    return null; // or a loading skeleton
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex flex-col gap-4 p-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold font-headline">
                {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={next}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                <Button variant={view === 'month' ? 'secondary' : 'outline'} size="sm" onClick={() => setView('month')}>Month</Button>
                <Button variant={view === 'year' ? 'secondary' : 'outline'} size="sm" onClick={() => setView('year')}>Year</Button>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant={filterMode === 'location' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilterMode('location')}>
                <Pin className="mr-2 h-4 w-4" /> Filter by Location
            </Button>
            <Button variant={filterMode === 'distance' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilterMode('distance')}>
                <Route className="mr-2 h-4 w-4" /> Filter by Distance
            </Button>
        </div>
        <Separator />
        {filterMode === 'location' ? (
            <div className="flex items-center gap-2">
                <Select value={selectedZoneId} onValueChange={handleZoneChange}>
                    <SelectTrigger className="w-[180px]">
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
                    <SelectTrigger className="w-[180px]">
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
                    <SelectTrigger className="w-[240px]">
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
                    <SelectTrigger className="w-[180px]">
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
            <CalendarGrid month={currentDate} events={filteredEvents} onEventClick={handleEventClick} today={today}/>
        </div>
      )}
      
      {view === 'year' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {yearMonths.map(month => (
                <div key={month.toString()}>
                    <h3 className="text-lg font-semibold font-headline mb-2 text-center">{format(month, 'MMMM')}</h3>
                    <CalendarGrid month={month} events={filteredEvents} onEventClick={handleEventClick} isYearView={true} today={today} />
                </div>
            ))}
        </div>
      )}

      <EventDialog
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent || null}
        club={selectedClub}
        eventType={selectedEventType}
        nearbyEvents={selectedEvent ? getNearbyEvents(selectedEvent) : []}
        onEventApproved={handleEventApproved}
      />
    </div>
  );
}
