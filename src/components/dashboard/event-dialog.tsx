'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approveEventAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { type Event, type Club, type EventType } from '@/lib/types';
import { format } from 'date-fns';
import { CheckCircle, Clock, MapPin, Users, Tag, AlertTriangle, FerrisWheel } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface EventDialogProps {
  event: Event | null;
  club: Club | undefined;
  eventType: EventType | undefined;
  nearbyEvents: Event[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEventApproved: () => void;
}

export function EventDialog({
  event,
  club,
  eventType,
  nearbyEvents,
  isOpen,
  onOpenChange,
  onEventApproved,
}: EventDialogProps) {
  const { toast } = useToast();
  const [isApproving, setIsApproving] = React.useState(false);

  if (!event || !eventType) return null;
   // For public holidays, club might be undefined.
  if (event.source !== 'public_holiday' && !club) return null;


  const handleApprove = async () => {
    if (!event) return;
    setIsApproving(true);
    const result = await approveEventAction(event.id);
    if (result.success) {
      toast({
        title: 'Event Approved',
        description: `"${event.name}" has been approved.`,
      });
      onEventApproved();
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsApproving(false);
  };

  const statusBadgeVariant = event.status === 'approved' ? 'default' : 'secondary';
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{event.name}</DialogTitle>
          <DialogDescription>
            {format(new Date(event.date), 'PPPP')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2">
            <Badge variant={statusBadgeVariant} className={cn("capitalize", {
                'bg-green-100 text-green-800 border-green-200': event.status === 'public_holiday'
            })}>
                {event.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                {event.status === 'proposed' && <Clock className="mr-1 h-3 w-3" />}
                {event.status === 'public_holiday' && <FerrisWheel className="mr-1 h-3 w-3" />}
                {event.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="space-y-3 text-sm">
            {club && (
                <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{club.name}</span>
                </div>
            )}
            <div className="flex items-start gap-3">
              <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{eventType.name}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
          </div>
          
          {nearbyEvents.length > 0 && (
             <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-accent" />
                    <h4 className="font-semibold text-accent-foreground">Nearby Events</h4>
                </div>
                <p className="text-xs text-accent-foreground/80 mb-2">
                    Consider potential clashes with these events:
                </p>
                <ul className="space-y-1 text-xs text-accent-foreground">
                    {nearbyEvents.map(nearbyEvent => (
                        <li key={nearbyEvent.id}>- <strong>{nearbyEvent.name}</strong> on {format(new Date(nearbyEvent.date), 'MMM d')}</li>
                    ))}
                </ul>
             </div>
          )}
        </div>
        <DialogFooter>
        {event.status === 'proposed' && (
            <Button onClick={handleApprove} className="w-full" disabled={isApproving}>
                {isApproving ? 'Approving...' : <><CheckCircle className="mr-2 h-4 w-4" /> Approve Event</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
