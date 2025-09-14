
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
import { CalendarIcon, PlusCircle, Trash2, History, Wand2, AlertTriangle, CheckCircle } from 'lucide-react';
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

// Individual event details schema
const eventDetailsSchema = z.object({
  priority: z.number().min(1).max(4),
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }).min(1, 'Please select an event type.'),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  isQualifier: z.boolean().default(false),
  dates: z.array(z.object({ value: z.date() })).min(1, 'You must add at least one date preference.'),
  description: z.string().optional(),
  coordinatorName: z.string().optional(),
  coordinatorContact: z.string().optional(),
  notes: z.string().optional(),
});

// Main form schema for multiple events
const multiEventRequestSchema = z.object({
  clubId: z.string({ required_error: 'Please select a club.' }).min(1, 'Please select a club.'),
  submittedBy: z.string().min(1, 'Please enter your name.'),
  submittedByContact: z.string().min(1, 'Please enter your contact information.'),
  events: z.array(eventDetailsSchema)
    .min(1, 'You must add at least one event request.')
    .max(4, 'You can request a maximum of 4 events.')
    .refine((events) => {
      // Check for duplicate priorities
      const priorities = events.map(e => e.priority);
      const uniquePriorities = new Set(priorities);
      return priorities.length === uniquePriorities.size;
    }, { message: 'Each event must have a unique priority (1-4).' })
    .refine((events) => {
      // Check that priorities are consecutive starting from 1
      const priorities = events.map(e => e.priority).sort();
      for (let i = 0; i < priorities.length; i++) {
        if (priorities[i] !== i + 1) {
          return false;
        }
      }
      return true;
    }, { message: 'Event priorities must be consecutive starting from 1 (e.g., if you have 3 events, use priorities 1, 2, and 3).' }),
  generalNotes: z.string().optional(),
});

// Legacy single event schema for backward compatibility
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

type MultiEventRequestFormValues = z.infer<typeof multiEventRequestSchema>;
type EventRequestFormValues = z.infer<typeof eventRequestSchema>;

interface EventRequestFormProps {
  clubs?: Club[];
  eventTypes?: EventType[];
  allEvents?: Event[];
  zones?: Zone[];
  embedMode?: boolean;
  onSubmit?: (data: any) => void;
  mode?: 'single' | 'multi'; // Allow switching between single and multi-event modes
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

export function EventRequestForm({ 
  clubs: propClubs, 
  eventTypes: propEventTypes, 
  allEvents: propAllEvents, 
  zones: propZones,
  embedMode = false,
  onSubmit
}: EventRequestFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useFormState(createEventRequestAction, initialState);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Data loading state for embed mode
  const [clubs, setClubs] = useState<Club[]>(propClubs || []);
  const [eventTypes, setEventTypes] = useState<EventType[]>(propEventTypes || []);
  const [allEvents, setAllEvents] = useState<Event[]>(propAllEvents || []);
  const [zones, setZones] = useState<Zone[]>(propZones || []);
  const [isLoadingData, setIsLoadingData] = useState(embedMode && (!propClubs || !propEventTypes || !propAllEvents || !propZones));
  
  const [conflictSuggestions, setConflictSuggestions] = useState<Record<string, SuggestAlternativeDatesOutput | null>>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState<Record<number, boolean>>({});

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch data for embed mode
  useEffect(() => {
    if (embedMode && isLoadingData) {
      const fetchData = async () => {
        try {
          // Add timeout and retry logic
          const fetchWithTimeout = async (url: string, timeout = 10000) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            try {
              const response = await fetch(url, { signal: controller.signal });
              clearTimeout(timeoutId);
              return response;
            } catch (error) {
              clearTimeout(timeoutId);
              throw error;
            }
          };

          const [clubsRes, eventTypesRes, eventsRes, zonesRes] = await Promise.all([
            fetchWithTimeout('/api/clubs'),
            fetchWithTimeout('/api/event-types'),
            fetchWithTimeout('/api/events'),
            fetchWithTimeout('/api/zones')
          ]);

          // Handle non-200 responses
          if (!clubsRes.ok || !eventTypesRes.ok || !eventsRes.ok || !zonesRes.ok) {
            throw new Error('One or more API requests failed');
          }

          const [clubsData, eventTypesData, eventsData, zonesData] = await Promise.all([
            clubsRes.json(),
            eventTypesRes.json(),
            eventsRes.json(),
            zonesRes.json()
          ]);

          setClubs(clubsData.clubs || clubsData);
          setEventTypes(eventTypesData.eventTypes || eventTypesData);
          setAllEvents(eventsData.events || eventsData);
          setZones(zonesData.zones || zonesData);
          setIsLoadingData(false);
        } catch (error) {
          console.error('Error fetching data for embed mode:', error);
          
          // Provide fallback empty data instead of staying in loading state
          setClubs([]);
          setEventTypes([]);
          setAllEvents([]);
          setZones([]);
          setIsLoadingData(false);
          
          // Show error toast
          toast({
            title: 'Connection Issue',
            description: 'Some data may not be available. You can still submit your request.',
            variant: 'destructive',
          });
        }
      };

      fetchData();
    }
  }, [embedMode, isLoadingData, toast]);

  // Handle form submission success
  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
      // Reset form after successful submission
      form.reset();
      // Show success toast
      toast({
        title: 'Event Request Submitted!',
        description: 'Your event request has been submitted successfully and is awaiting approval.',
        variant: 'default',
      });
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, form, toast]);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Hydration protection - prevent SSR/client mismatch */}
        {!isClient && (
          <div className="lg:col-span-3 flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground text-sm">Loading form...</p>
            </div>
          </div>
        )}
        
        {/* Loading state for embed mode */}
        {isClient && isLoadingData && (
          <div className="lg:col-span-3 flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground text-sm">Loading form data...</p>
            </div>
          </div>
        )}
        
        {/* Compact Success Confirmation Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="mx-4 max-w-md w-full enhanced-card glass-effect">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-green-600 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-lg">
                  Event Request Submitted!
                </CardTitle>
                <CardDescription className="text-sm">
                  Your event request has been successfully submitted for approval
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-3 pt-0">
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">✓ Event data has been saved</p>
                  <p className="mb-1">✓ Zone managers have been notified</p>
                  <p>✓ You will receive updates on the approval status</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={() => setShowSuccess(false)}
                    className="premium-button flex-1 h-9"
                  >
                    Submit Another Event
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowSuccess(false);
                      router.push('/');
                    }}
                    className="premium-button-outline flex-1 h-9"
                  >
                    View Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compact Main form content - only show when client is ready and not loading */}
        {isClient && !isLoadingData && (
          <>
            <div className="lg:col-span-2">
            <Card className="enhanced-card">
                <CardContent className="pt-4">
                <Form {...form}>
                    <form
                      ref={formRef}
                      action={formAction}
                      onSubmit={(evt) => {
                          evt.preventDefault();
                          form.handleSubmit(
                            (data) => {
                              // Validation succeeded
                              if (embedMode && onSubmit) {
                                // In embed mode, call the callback with form data
                                const submissionData = {
                                  id: Date.now().toString(),
                                  eventName: data.name,
                                  eventDate: format(data.dates[0].value, 'PPP'),
                                  clubName: clubs.find(c => c.id === data.clubId)?.name || 'Unknown Club',
                                  eventType: eventTypes.find(t => t.id === data.eventTypeId)?.name || 'Unknown Type',
                                  ...data
                                };
                                onSubmit(submissionData);
                              } else {
                                // Normal mode, call the server action
                                if (formRef.current) {
                                  const formData = new FormData(formRef.current);
                                  formAction(formData);
                                }
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
                      className="space-y-4"
                    >
                        <Card className="enhanced-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-lg">
                                    Club Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-3">
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
                                            <SelectTrigger className="enhanced-select">
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
                             <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Event Details</CardTitle>
                                <CardDescription className="text-sm">Enter the details for the event you are requesting.</CardDescription>
                             </CardHeader>
                             <CardContent className="grid md:grid-cols-2 gap-3">
                                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="e.g., Spring Dressage Gala" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="eventTypeId" render={({ field }) => (<FormItem><FormLabel>Event Type</FormLabel><Select onValueChange={field.onChange} value={field.value} name={field.name}><FormControl><SelectTrigger className='bg-card'><SelectValue placeholder="Select an event type" /></SelectTrigger></FormControl><SelectContent>{eventTypes.filter(t => t.id !== 'ph').map(type => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g., 123 Equestrian Rd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="isQualifier" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card"><FormControl><Checkbox name={field.name} checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Will this be a SMZ Qualifier?</FormLabel></div></FormItem>)} />
                             </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Date Preferences</CardTitle>
                                <CardDescription className="text-sm">Add up to 4 preferred dates for this event.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {fields.map((field, index) => (
                                <div key={field.id} className="p-3 border rounded-lg space-y-3 relative bg-muted/20">
                                    <div className='flex justify-between items-center'>
                                      <h4 className="font-semibold text-base">Date Option {index + 1}</h4>
                                      {fields.length > 1 && (
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                      )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <FormField 
                                          control={form.control} 
                                          name={`dates.${index}.value`} 
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>Event Date</FormLabel>
                                              <Popover open={datePickerOpen[index] || false} onOpenChange={(open) => setDatePickerOpen(prev => ({ ...prev, [index]: open }))}>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={'outline'}
                                                      className={cn(
                                                        'w-full pl-3 text-left font-normal bg-card h-9',
                                                        !field.value && 'text-muted-foreground'
                                                      )}
                                                    >
                                                      {isClient && field.value ? (
                                                        format(field.value, 'PPP')
                                                      ) : (
                                                        <span>Pick a date</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(date) => {
                                                      field.onChange(date);
                                                      setDatePickerOpen(prev => ({ ...prev, [index]: false }));
                                                    }}
                                                    disabled={(date) => 
                                                      date < new Date() || date < new Date('1900-01-01')
                                                    }
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )} 
                                        />
                                        
                                        <div className="space-y-2 self-end">
                                            <Button type="button" onClick={() => handleAnalyzeDate(index)} disabled={isLoadingSuggestions[index]} className="w-full h-9 text-sm">
                                                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                                                {isLoadingSuggestions[index] ? 'Analyzing...' : 'Analyze Date'}
                                            </Button>
                                            {isLoadingSuggestions[index] && (
                                                <p className="text-xs text-muted-foreground text-center">Checking for conflicts...</p>
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
                                    <Button type="button" variant="outline" onClick={() => append({ value: new Date() })} className="h-9"><PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add another date</Button>
                                )}
                                 <Controller
                                    name="dates"
                                    control={form.control}
                                    render={({ fieldState }) => fieldState.error?.message ? <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p> : <></>}
                                />
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-lg">Additional Information</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Any other notes</FormLabel><FormControl><Textarea placeholder="Add any extra details here..." className="h-20" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid md:grid-cols-2 gap-3">
                                    <FormField control={form.control} name="submittedBy" render={({ field }) => (<FormItem><FormLabel>Who filled in this form</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="submittedByContact" render={({ field }) => (<FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Button type="submit" className="h-10">
                          Submit Request
                        </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg"><History className="h-4 w-4" /> Club Event History</CardTitle>
                    <CardDescription className="text-sm">Past and future events for the selected club.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!selectedClubId ? (
                        <p className="text-xs text-muted-foreground">Please select a club to see its event history.</p>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Future & Proposed Events</h4>
                                {clubEvents.future.length > 0 ? (
                                     <div className="text-xs border rounded-lg">
                                        {clubEvents.future.map((e, index) => (
                                          <div key={e.id} className={cn("p-2", index !== clubEvents.future.length - 1 && 'border-b')}>
                                            <strong>{format(new Date(e.date), 'do MMM yyyy')}:</strong> {e.name} <span className="text-xs capitalize p-1 rounded-md bg-muted">({e.status.replace('_', ' ')})</span>
                                          </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-muted-foreground">No upcoming events.</p>}
                            </div>
                            <Separator/>
                            <div>
                                <h4 className="font-semibold mb-2 text-sm">Past Events</h4>
                                 {clubEvents.past.length > 0 ? (
                                    <div className="text-xs border rounded-lg max-h-32 overflow-y-auto">
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
          </>
        )}
    </div>
  );
}
