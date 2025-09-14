'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { PlusCircle, Send, AlertCircle } from 'lucide-react';
import { type Club, type EventType, type Event, type Zone } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SingleEventForm } from '@/components/single-event-form';
import { EventRequestPolicyInfo } from '@/components/event-request-policy-info';
import { createMultiEventRequestAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

// Individual event details schema
const eventDetailsSchema = z.object({
  priority: z.number().min(1).max(4),
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }).min(1, 'Please select an event type.'),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  isQualifier: z.boolean().default(false),
  isHistoricallyTraditional: z.boolean().default(false),
  date: z.date({ required_error: 'Please select a date for this event.' }),
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

type MultiEventRequestFormValues = z.infer<typeof multiEventRequestSchema>;

interface MultiEventRequestFormProps {
  clubs?: Club[];
  eventTypes?: EventType[];
  allEvents?: Event[];
  zones?: Zone[];
  embedMode?: boolean;
  onSubmit?: (data: any) => void;
}

export function MultiEventRequestForm({ 
  clubs: propClubs, 
  eventTypes: propEventTypes, 
  allEvents: propAllEvents, 
  zones: propZones,
  embedMode = false,
  onSubmit
}: MultiEventRequestFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  // Data loading state for embed mode
  const [clubs, setClubs] = useState<Club[]>(propClubs || []);
  const [eventTypes, setEventTypes] = useState<EventType[]>(propEventTypes || []);
  const [allEvents, setAllEvents] = useState<Event[]>(propAllEvents || []);
  const [zones, setZones] = useState<Zone[]>(propZones || []);
  const [isLoadingData, setIsLoadingData] = useState(embedMode && (!propClubs || !propEventTypes || !propAllEvents || !propZones));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>();

  const form = useForm<MultiEventRequestFormValues>({
    resolver: zodResolver(multiEventRequestSchema),
    defaultValues: {
      clubId: '',
      submittedBy: '',
      submittedByContact: '',
      events: [{
        priority: 1,
        name: '',
        eventTypeId: '',
        location: '',
        isQualifier: false,
        isHistoricallyTraditional: false,
        date: new Date(),
        description: '',
        coordinatorName: '',
        coordinatorContact: '',
        notes: '',
      }],
      generalNotes: '',
    },
  });

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  // Fetch data for embed mode
  useEffect(() => {
    if (embedMode && isLoadingData) {
      const fetchData = async () => {
        try {
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
          
          setClubs([]);
          setEventTypes([]);
          setAllEvents([]);
          setZones([]);
          setIsLoadingData(false);
          
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

  const filteredClubs = useMemo(() => {
    if (!selectedZoneId) {
      return [];
    }
    return clubs.filter(club => club.zoneId === selectedZoneId);
  }, [selectedZoneId, clubs]);

  const handleAddEvent = () => {
    if (eventFields.length >= 4) {
      toast({
        title: 'Maximum Events Reached',
        description: 'You can request a maximum of 4 events.',
        variant: 'destructive',
      });
      return;
    }

    const nextPriority = eventFields.length + 1;
    appendEvent({
      priority: nextPriority,
      name: '',
      eventTypeId: '',
      location: '',
      isQualifier: false,
      isHistoricallyTraditional: false,
      date: new Date(),
      description: '',
      coordinatorName: '',
      coordinatorContact: '',
      notes: '',
    });
  };

  const handleRemoveEvent = (index: number) => {
    removeEvent(index);
    
    // Reorder priorities to maintain consecutive numbering
    const currentEvents = form.getValues('events');
    currentEvents.forEach((_, eventIndex) => {
      if (eventIndex >= index) {
        form.setValue(`events.${eventIndex}.priority`, eventIndex + 1);
      }
    });
  };

  const onSubmitForm = async (data: MultiEventRequestFormValues) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting multi-event request:', data);
      
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Use the server action
        const result = await createMultiEventRequestAction(data);
        
        if (result.success) {
          toast({
            title: 'Request Submitted!',
            description: result.message,
          });
          
          // Reset form
          form.reset();
          
          // Redirect to home page
          router.push('/');
        } else {
          toast({
            title: 'Submission Failed',
            description: result.message,
            variant: 'destructive',
          });
          
          // Handle field-specific errors
          if (result.errors) {
            Object.entries(result.errors).forEach(([field, errors]) => {
              if (errors && errors.length > 0) {
                form.setError(field as any, {
                  type: 'manual',
                  message: errors.join(', '),
                });
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Policy Information */}
      <EventRequestPolicyInfo />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Organization & Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Organization & Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zone Selection */}
              <div>
                <label className="text-sm font-medium">Zone *</label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones?.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Club Selection */}
              <FormField
                control={form.control}
                name="clubId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedZoneId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedZoneId ? "Select your club" : "Select a zone first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredClubs?.map((club) => (
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

              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="submittedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submittedByContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Contact Information *</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number or email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Requests */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Requests ({eventFields.length}/4)</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add up to 4 events with priority rankings
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEvent}
                  disabled={eventFields.length >= 4}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {eventFields.map((field, index) => (
                <SingleEventForm
                  key={field.id}
                  eventIndex={index}
                  priority={index + 1}
                  control={form.control}
                  watch={form.watch}
                  eventTypes={eventTypes}
                  canRemove={eventFields.length > 1}
                  onRemoveEvent={() => handleRemoveEvent(index)}
                />
              ))}

              {eventFields.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please add at least one event request to continue.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* General Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="generalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information for your event requests..."
                        className="resize-none"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || eventFields.length === 0}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : `Submit ${eventFields.length} Event Request${eventFields.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}