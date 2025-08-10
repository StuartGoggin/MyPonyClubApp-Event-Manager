'use client';

import { useState } from 'react';
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
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type Event, type Club, type EventType } from '@/lib/types';
import { EventDialog } from './event-dialog';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';

interface EventCalendarProps {
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
}

export function EventCalendar({
  events,
  clubs,
  eventTypes,
}: EventCalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start, end });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDialogOpen(true);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedClub = clubs.find(c => c.id === selectedEvent?.clubId);
  const selectedEventType = eventTypes.find(et => et.id === selectedEvent?.eventTypeId);

  const getNearbyEvents = (event: Event) => {
    if (!event) return [];
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

  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold font-headline">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-xs text-center font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(day => (
          <div
            key={day.toString()}
            className={cn('h-32 border-t border-l p-1.5 overflow-y-auto', {
              'bg-background/50': !isSameMonth(day, currentMonth),
              'relative': isToday(day),
            })}
          >
            <span className={cn('font-medium text-sm', 
              { 'text-muted-foreground': !isSameMonth(day, currentMonth) },
              { 'text-primary font-bold': isToday(day)}
            )}>{format(day, 'd')}</span>
            <div className="mt-1 space-y-1">
              {events
                .filter(event => isSameDay(new Date(event.date), day))
                .map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event.id)}
                    className={cn(
                        "w-full text-left p-1.5 rounded-md text-xs leading-tight transition-colors",
                        event.status === 'approved' ? 'bg-primary/10 hover:bg-primary/20' : 'bg-accent/10 hover:bg-accent/20'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                       {event.status === 'approved' ? <CheckCircle className="h-3 w-3 text-primary flex-shrink-0"/> : <Clock className="h-3 w-3 text-accent flex-shrink-0"/>}
                      <span className={cn("truncate font-medium", event.status === 'approved' ? 'text-primary-dark' : 'text-accent-dark' )}>{event.name}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
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
