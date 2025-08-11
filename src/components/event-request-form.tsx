'use client';

import { useFormState } from 'react-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEventRequestAction, type FormState } from '@/lib/actions';
import { useEffect, useRef, useState, useMemo } from 'react';
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
  FormDescription,
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
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { suggestAlternativeDates, type SuggestAlternativeDatesOutput } from '@/ai/flows/suggest-alternative-dates';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const preferenceSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }).min(1, 'Please select an event type.'),
  date: z.date({ required_error: 'A date is required.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  isQualifier: z.boolean().default(false),
});

const eventRequestSchema = z.object({
    clubId: z.string({ required_error: 'Please select a club.' }).min(1, 'Please select a club.'),
    coordinatorName: z.string().optional(),
    coordinatorContact: z.string().optional(),
    preferences: z.array(preferenceSchema).min(1, 'You must add at least one event preference.').max(4, 'You can add a maximum of 4 preferences.'),
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

export function EventRequestForm({ clubs, eventTypes, allEvents, zones }: EventRequestFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [conflictSuggestions, setConflictSuggestions] = useState<Record<string, SuggestAlternativeDatesOutput | null>>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<Record<string, boolean>>({});

  const initialState: FormState = { message: '', success: false };
  const [state, dispatch] = useFormState(createEventRequestAction, initialState);

  const form = useForm<EventRequestFormValues>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      clubId: '',
      preferences: [{ name: '', location: '', isQualifier: false, eventTypeId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'preferences',
  });

  const selectedClubId = form.watch('clubId');

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

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      form.reset({
        clubId: '',
        preferences: [{ name: '', location: '', isQualifier: false, eventTypeId: '' }],
        coordinatorName: '',
        coordinatorContact: '',
        notes: '',
        submittedBy: '',
        submittedByContact: '',
      });
       setConflictSuggestions({});
    } else if (state.message) {
      if (state.errors?._errors) {
         toast({
          title: 'Error submitting form',
          description: state.errors._errors.join(', '),
          variant: 'destructive',
        });
      } else {
         toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast, form]);

  const onFormSubmit = (data: EventRequestFormValues) => {
    const formData = new FormData();
    formData.append('clubId', data.clubId);
    data.coordinatorName && formData.append('coordinatorName', data.coordinatorName);
    data.coordinatorContact && formData.append('coordinatorContact', data.coordinatorContact);
    data.notes && formData.append('notes', data.notes);
    data.submittedBy && formData.append('submittedBy', data.submittedBy);
    data.submittedByContact && formData.append('submittedByContact', data.submittedByContact);
    
    data.preferences.forEach((pref, index) => {
        formData.append(`preferences[${index}].name`, pref.name);
        formData.append(`preferences[${index}].eventTypeId`, pref.eventTypeId);
        formData.append(`preferences[${index}].date`, format(pref.date, 'yyyy-MM-dd'));
        formData.append(`preferences[${index}].location`, pref.location);
        formData.append(`preferences[${index}].isQualifier`, pref.isQualifier ? 'on' : 'off');
    });

    dispatch(formData);
  };
  
  const handleAnalyzeDate = async (index: number) => {
    const preference = form.getValues(`preferences.${index}`);
    if (!preference.date || !preference.eventTypeId) {
        toast({
            title: 'Missing Information',
            description: 'Please select a date and event type before analyzing.',
            variant: 'destructive',
        });
        return;
    }

    setIsLoadingSuggestions(prev => ({...prev, [index]: true}));
    setConflictSuggestions(prev => ({...prev, [index]: null}));

    const eventType = eventTypes.find(et => et.id === preference.eventTypeId);
    const nearbyEvents = allEvents.filter(e => {
        const dayDiff = Math.abs(differenceInDays(preference.date!, new Date(e.date)));
        return dayDiff <= 7; // Check for events within a week
    }).map(e => ({
        date: format(new Date(e.date), 'yyyy-MM-dd'),
        type: eventTypes.find(et => et.id === e.eventTypeId)?.name || 'Unknown',
        location: e.location,
    }));

    try {
        const result = await suggestAlternativeDates({
            eventDate: format(preference.date, 'yyyy-MM-dd'),
            eventType: eventType?.name || 'Unknown',
            eventLocation: preference.location,
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
                    <form ref={formRef} onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Club Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="clubId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pony Club</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                            <SelectValue placeholder="Select a club" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clubs.map(club => (
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
                                <CardTitle>Event Preferences</CardTitle>
                                <CardDescription>Add up to 4 event preferences in order of priority.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/20">
                                    <div className='flex justify-between items-center'>
                                      <h4 className="font-semibold text-lg">Preference {index + 1}</h4>
                                      {fields.length > 1 && (
                                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                      )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`preferences.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Event Name</FormLabel><FormControl><Input placeholder="e.g., Spring Dressage Gala" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`preferences.${index}.date`} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Event Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal bg-card', !field.value && 'text-muted-foreground' )}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={date => date < new Date() || date < new Date('1900-01-01')} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`preferences.${index}.eventTypeId`} render={({ field }) => (<FormItem><FormLabel>Event Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className='bg-card'><SelectValue placeholder="Select an event type" /></SelectTrigger></FormControl><SelectContent>{eventTypes.filter(t => t.id !== 'ph').map(type => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`preferences.${index}.location`} render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g., 123 Equestrian Rd" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name={`preferences.${index}.isQualifier`} render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="space-y-1 leading-none"><FormLabel>Will this be a SMZ Qualifier?</FormLabel></div></FormItem>)} />
                                        <div className="md:col-span-2 space-y-2">
                                            <Button type="button" onClick={() => handleAnalyzeDate(index)} disabled={isLoadingSuggestions[index]} className="w-full">
                                                <Wand2 className="mr-2 h-4 w-4" />
                                                {isLoadingSuggestions[index] ? 'Analyzing...' : 'Analyze Date for Conflicts'}
                                            </Button>
                                            {isLoadingSuggestions[index] && (
                                                <p className="text-sm text-muted-foreground text-center">Checking for conflicts with the AI assistant...</p>
                                            )}
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
                                        </div>
                                    </div>

                                </div>
                                ))}
                                {fields.length < 4 && (
                                    <Button type="button" variant="outline" onClick={() => append({ name: '', location: '', isQualifier: false, eventTypeId: '', date: undefined })}><PlusCircle className="mr-2 h-4 w-4" /> Add another preference</Button>
                                )}
                                 <Controller
                                    name="preferences"
                                    control={form.control}
                                    render={({ fieldState }) => fieldState.error?.message ? <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p> : null}
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

                        <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
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

            <Card>
                <CardHeader>
                    <CardTitle>Event Calendar</CardTitle>
                    <CardDescription>Check for conflicts as you select dates.</CardDescription>
                </CardHeader>
                <CardContent>
                     <EventCalendar events={allEvents} clubs={clubs} eventTypes={eventTypes} zones={zones} />
                </CardContent>
            </Card>

        </div>
    </div>
  );
}
