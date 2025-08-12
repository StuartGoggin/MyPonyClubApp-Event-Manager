
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEventRequestAction, type FormState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2, History, Wand2, AlertTriangle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { type Club, type EventType, type Event, type Zone } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { suggestAlternativeDates, type SuggestAlternativeDatesOutput } from '@/ai/flows/suggest-alternative-dates';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';

const eventRequestSchema = z.object({
  clubId: z.string({ required_error: 'Please select a club.' }).min(1, 'Please select a club.'),
  coordinatorName: z.string().optional(),
  coordinatorContact: z.string().optional(),
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }).min(1, 'Please select an event type.'),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  isQualifier: z.boolean().default(false),
  dates: z.array(z.object({ value: z.date() })).min(1, 'You must add at least one date preference.'),
  notes: z.string().optional(),
  submittedBy: z.string().optional(),
  submittedByContact: z.string().optional(),
});

type EventRequestFormValues = z.infer<typeof eventRequestSchema>;

interface EventRequestFormProps {
  clubs: Club[];
  eventTypes: EventType[];
  allEvents: Event[];
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

const initialState: FormState = {
    message: '',
    success: false,
    errors: {},
};

export function EventRequestForm({ clubs, eventTypes, allEvents, zones }: EventRequestFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useFormState(createEventRequestAction, initialState);
  
  const [conflictSuggestions, setConflictSuggestions] = useState<Record<string, SuggestAlternativeDatesOutput | null>>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const form = useForm<EventRequestFormValues>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      clubId: '',
      name: '',
      location: '',
      isQualifier: false,
      eventTypeId: '',
      dates: [{ value: new Date() }],
      coordinatorName: '',
      coordinatorContact: '',
      notes: '',
      submittedBy: '',
      submittedByContact: '',
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      router.push('/');
    } else if (state.errors) {
        for (const [field, errors] of Object.entries(state.errors)) {
          if (errors) {
            form.setError(field as keyof EventRequestFormValues, {
              type: 'manual',
              message: errors.join(', '),
            });
          }
        }
    } else if (state.message) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, form, toast, router]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'dates',
  });

  const selectedClubId = form.watch('clubId');
  const [selectedZoneId, setSelectedZoneId] = useState<string>();

  const filteredClubs = useMemo(() => {
    if (!selectedZoneId) {
      return [];
    }
    return clubs.filter(club => club.zoneId === selectedZoneId);
  }, [selectedZoneId, clubs]);

  const clubEvents = useMemo(() => {
    if (!selectedClubId) return { past: [], future: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clubEvents = allEvents.filter(event => event.clubId === selectedClubId);

    return {
      past: clubEvents.filter(event => new Date(event.date) < today).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      future: clubEvents.filter(event => new Date(event.date) >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    };
  }, [selectedClubId, allEvents]);
  
  const handleAnalyzeDate = async (index: number) => {
    const preferenceDate = form.getValues(`dates.${index}.value`);
    const eventTypeId = form.getValues('eventTypeId');
    const location = form.getValues('location');
    const clubId = form.getValues('clubId');
    const club = clubs.find(c => c.id === clubId);

    if (!preferenceDate || !eventTypeId || !club) {
        toast({
            title: 'Missing Information',
            description: 'Please select a club, date, and event type before analyzing.',
            variant: 'destructive',
        });
        return;
    }
     if (!club.latitude || !club.longitude) {
        toast({
            title: 'Missing Club Location',
            description: 'The selected club does not have location data needed for distance analysis.',
            variant: 'destructive',
        });
        return;
    }


    setIsLoadingSuggestions(prev => ({...prev, [index]: true}));
    setConflictSuggestions(prev => ({...prev, [index]: null}));

    const eventType = eventTypes.find(et => et.id === eventTypeId);
    const homeCoords = { lat: club.latitude, lon: club.longitude };
    
    const otherSelectedDates = form.getValues('dates')
      .map(d => d.value)
      .filter((d, i): d is Date => d !== undefined && i !== index);


    const nearbyEvents = allEvents.filter(e => {
        const dayDiff = Math.abs(differenceInDays(preferenceDate!, new Date(e.date)));
        if (dayDiff > 7) return false;

        const eventClub = clubs.find(c => c.id === e.clubId);
        if (!eventClub || eventClub.latitude === undefined || eventClub.longitude === undefined) return false;

        const eventCoords = { lat: eventClub.latitude, lon: eventClub.longitude };
        const distance = haversineDistance(homeCoords, eventCoords);

        return distance <= 100;
    }).map(e => {
        const eventClub = clubs.find(c => c.id === e.clubId)!;
        const distance = haversineDistance(homeCoords, {lat: eventClub.latitude!, lon: eventClub.longitude!});
        return {
            date: format(new Date(e.date), 'yyyy-MM-dd'),
            type: eventTypes.find(et => et.id === e.eventTypeId)?.name || 'Unknown',
            location: e.location,
            distance: Math.round(distance),
        }
    });
    
    // Add other selected dates to the context
    otherSelectedDates.forEach(d => {
       nearbyEvents.push({
           date: format(d, 'yyyy-MM-dd'),
           type: eventType?.name || 'Unknown',
           location: location,
           distance: 0,
       });
    });

    try {
        const result = await suggestAlternativeDates({
            eventDate: format(preferenceDate, 'yyyy-MM-dd'),
            eventType: eventType?.name || 'Unknown',
            eventLocation: location,
            otherEvents: nearbyEvents,
        });
        setConflictSuggestions(prev => ({...prev, [index]: result}));
    } catch (error) {
        console.error("AI suggestion failed:", error);
        toast({
            title: 'Analysis Failed',
            description: 'Could not get conflict analysis at this time.',
            variant: 'destructive',
        });
    } finally {
        setIsLoadingSuggestions(prev => ({...prev, [index]: false}));
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardContent className="pt-6">
                <Form {...form}>
                    <form
                      ref={formRef}
                      action={formAction}
                      onSubmit={(evt) => {
                          evt.preventDefault();
                          form.handleSubmit(
                            () => {
                              // Validation succeeded, call the server action
                              if (formRef.current) {
                                const formData = new FormData(formRef.current);
                                formAction(formData);
                              }
                            },
                            (errors) => {
                              // Validation failed, log errors and show a toast
                              console.error('Form validation errors:', errors);
                              toast({
                                title: 'Validation Error',
                                description: 'Please check the form for errors.',
                                variant: 'destructive',
                              });
                            }
                          )(evt);
                      }}
                      className="space-y-8"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Club Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <FormItem>
                                    <FormLabel>Zone</FormLabel>
                                    <Select 
                                        value={selectedZoneId} 
                                        onValueChange={(zoneId) => {
                                            setSelectedZoneId(zoneId);
                                            form.setValue('clubId', ''); // Reset club when zone changes
                                        }}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a zone" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {zones.map(zone => (
                                                <SelectItem key={zone.id} value={zone.id}>
                                                    {zone.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormField
                                    control={form.control}
                                    name="clubId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pony Club</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                            disabled={!selectedZoneId}
                                            name={field.name}
                                        >
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select a club" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredClubs.map(club => (
                                            <SelectItem key={club.id} value={club.id}>
                                                {club.name}
                                            </SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField control={form.control} name="coordinatorName" render={({ field }) => (<FormItem><FormLabel>Club Event Co-ordinator</FormLabel><FormControl><Input placeholder="Coordinator's Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="coordinatorContact" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="Coordinator's Contact" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </CardContent>
                        </Card>
                        
                        <Card>
                             <CardHeader>
                                <CardTitle>Event Details</CardTitle>
                                <CardDescription>Enter the details for the event you are requesting.</CardDescription>
                             </CardHeader>
                             <CardContent className="grid md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="e.g., Spring Dressage Gala" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="eventTypeId" render={({ field }) => (<FormItem><FormLabel>Event Type</FormLabel><Select onValueChange={field.onChange} value={field.value} name={field.name}><FormControl><SelectTrigger className='bg-card'><SelectValue placeholder="Select an event type" /></SelectTrigger></FormControl><SelectContent>{eventTypes.filter(t => t.id !== 'ph').map(type => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g., 123 Equestrian Rd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="isQualifier" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card"><FormControl><Checkbox name={field.name} checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Will this be a SMZ Qualifier?</FormLabel></div></FormItem>)} />
                             </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Date Preferences</CardTitle>
                                <CardDescription>Add up to 4 preferred dates for this event.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/20">
                                    <div className='flex justify-between items-center'>
                                      <h4 className="font-semibold text-lg">Date Option {index + 1}</h4>
                                      {fields.length > 1 && (
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                      )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`dates.${index}.value`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Event Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal bg-card', !field.value && 'text-muted-foreground' )}>{isClient && field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < new Date() || date < new Date('1900-01-01')} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                        
                                        <div className="space-y-2 self-end">
                                            <Button type="button" onClick={() => handleAnalyzeDate(index)} disabled={isLoadingSuggestions[index]} className="w-full">
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                {isLoadingSuggestions[index] ? 'Analyzing...' : 'Analyze Date for Conflicts'}
                                            </Button>
                                            {isLoadingSuggestions[index] && (
                                                <p className="text-sm text-muted-foreground text-center">Checking for conflicts...</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                     {conflictSuggestions[index] && (
                                        <Alert>
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Conflict Analysis</AlertTitle>
                                            <AlertDescription>
                                                <p className="mb-2">{conflictSuggestions[index]?.conflictAnalysis}</p>
                                                <p className="font-semibold">Reasoning:</p>
                                                <p className="mb-2">{conflictSuggestions[index]?.reasoning}</p>
                                                <p className="font-semibold">Suggested Dates:</p>
                                                <ul className="list-disc pl-5">
                                                    {conflictSuggestions[index]?.suggestedDates.map(date => (
                                                        <li key={date}>{format(new Date(date), 'PPP')}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/** Hidden input to submit the date value */}
                                    <input type="hidden" {...form.register(`dates.${index}.value`)} name="dates" value={form.watch(`dates.${index}.value`)?.toISOString() ?? ''} />

                                </div>
                                ))}
                                {fields.length < 4 && (
                                    <Button type="button" variant="outline" onClick={() => append({ value: new Date() })}><PlusCircle className="mr-2 h-4 w-4" /> Add another date</Button>
                                )}
                                 <Controller
                                    name="dates"
                                    control={form.control}
                                    render={({ fieldState }) => fieldState.error?.message ? <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p> : <></>}
                                />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Any other notes</FormLabel><FormControl><Textarea placeholder="Add any extra details here..." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="submittedBy" render={({ field }) => (<FormItem><FormLabel>Who filled in this form</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="submittedByContact" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit">
                          Submit Request
                        </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Club Event History</CardTitle>
                    <CardDescription>Past and future events for the selected club.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!selectedClubId ? (
                        <p className="text-sm text-muted-foreground">Please select a club to see its event history.</p>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Future & Proposed Events</h4>
                                {clubEvents.future.length > 0 ? (
                                     <div className="text-sm border rounded-lg">
                                        {clubEvents.future.map((e, index) => (
                                          <div key={e.id} className={cn("p-2", index !== clubEvents.future.length - 1 && 'border-b')}>
                                            <strong>{format(new Date(e.date), 'do MMM yyyy')}:</strong> {e.name} <span className="text-xs capitalize p-1 rounded-md bg-muted">({e.status.replace('_', ' ')})</span>
                                          </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No upcoming events.</p>}
                            </div>
                            <Separator/>
                            <div>
                                <h4 className="font-semibold mb-2">Past Events</h4>
                                 {clubEvents.past.length > 0 ? (
                                    <div className="text-sm border rounded-lg max-h-48 overflow-y-auto">
                                        {clubEvents.past.map((e, index) => (
                                          <div key={e.id} className={cn("p-2", index !== clubEvents.past.length - 1 && 'border-b')}>
                                            <strong>{format(new Date(e.date), 'do MMM yyyy')}:</strong> {e.name} <span className="text-xs capitalize p-1 rounded-md bg-muted">({e.status})</span>
                                          </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">No past events.</p>}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
