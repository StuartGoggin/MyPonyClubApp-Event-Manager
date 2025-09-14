'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
import { HelpTooltip } from '@/components/ui/help-tooltip';

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
  submittedByEmail: z.string().email('Please enter a valid email address.').min(1, 'Please enter your email address.'),
  submittedByPhone: z.string().min(1, 'Please enter your phone number.'),
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
  const [clubSearchTerm, setClubSearchTerm] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  
  // Name autocomplete state
  const [nameSearchTerm, setNameSearchTerm] = useState<string>('');
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [availableNames, setAvailableNames] = useState<any[]>([]);
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const nameAutocompleteRef = useRef<HTMLDivElement>(null);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);

  const form = useForm<MultiEventRequestFormValues>({
    resolver: zodResolver(multiEventRequestSchema),
    defaultValues: {
      clubId: '',
      submittedBy: '',
      submittedByEmail: '',
      submittedByPhone: '',
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

  // Initialize nameSearchTerm with form value
  useEffect(() => {
    const currentName = form.watch('submittedBy');
    if (currentName && !nameSearchTerm) {
      setNameSearchTerm(currentName);
    }
  }, [form.watch('submittedBy'), nameSearchTerm]);

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

  // Click outside handler for autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (nameAutocompleteRef.current && !nameAutocompleteRef.current.contains(event.target as Node)) {
        setShowNameSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredClubs = useMemo(() => {
    if (!selectedZoneId) {
      return [];
    }
    return clubs.filter(club => club.zoneId === selectedZoneId);
  }, [selectedZoneId, clubs]);

  // Filter clubs based on search term for direct club search
  const searchFilteredClubs = useMemo(() => {
    if (!clubSearchTerm) return clubs;
    return clubs.filter(club => 
      club.name.toLowerCase().includes(clubSearchTerm.toLowerCase())
    );
  }, [clubSearchTerm, clubs]);

  // Auto-select zone when club is selected
  const handleClubSelection = (club: Club) => {
    setSelectedClub(club);
    setSelectedZoneId(club.zoneId);
    setClubSearchTerm(club.name);
    setShowSuggestions(false);
    form.setValue('clubId', club.id);
  };

  // Handle input changes for autocomplete
  const handleClubInputChange = (value: string) => {
    setClubSearchTerm(value);
    setShowSuggestions(value.length > 0);
    
    // Clear selection if input doesn't match selected club
    if (selectedClub && value !== selectedClub.name) {
      setSelectedClub(null);
      setSelectedZoneId(undefined);
      form.setValue('clubId', '');
    }
  };

  // Handle keyboard shortcuts for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
    }
  };

  // Fetch user names for autocomplete
  const fetchUserNames = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setAvailableNames([]);
      return;
    }

    setIsLoadingNames(true);
    try {
      const response = await fetch(`/api/users/names?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableNames(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching user names:', error);
      setAvailableNames([]);
    } finally {
      setIsLoadingNames(false);
    }
  };

  // Handle name input changes
  const handleNameInputChange = (value: string) => {
    setNameSearchTerm(value);
    form.setValue('submittedBy', value);
    setShowNameSuggestions(value.length >= 2);
    
    // Debounce the API call
    if (value.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchUserNames(value);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Handle name selection from suggestions
  const handleNameSelection = (selectedResult: any) => {
    setNameSearchTerm(selectedResult.name);
    form.setValue('submittedBy', selectedResult.name);
    setShowNameSuggestions(false);
    setSelectedUserData(selectedResult.user);
    
    // Auto-populate contact details if available
    if (selectedResult.user) {
      if (selectedResult.user.email) {
        form.setValue('submittedByEmail', selectedResult.user.email);
      }
      if (selectedResult.user.mobileNumber) {
        form.setValue('submittedByPhone', selectedResult.user.mobileNumber);
      }
    }
    
    // Auto-populate club and zone if available
    if (selectedResult.clubId) {
      const club = clubs.find(c => c.id === selectedResult.clubId);
      if (club) {
        setSelectedClub(club);
        setSelectedZoneId(club.zoneId);
        form.setValue('clubId', club.id);
        setClubSearchTerm(club.name);
      }
    }
  };

  // Handle name input keyboard events
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowNameSuggestions(false);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowNameSuggestions(true);
    }
  };

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
          {/* Your Details */}
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Start by entering your name - we'll auto-fill your club and contact details
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field - Now First */}
              <FormField
                control={form.control}
                name="submittedBy"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Your Name *</FormLabel>
                      <HelpTooltip 
                        content="Start typing your name to search our member directory. We'll auto-fill your club and contact details when you select your name."
                        side="right"
                      />
                    </div>
                    <div className="relative" ref={nameAutocompleteRef}>
                      <FormControl>
                        <Input 
                          placeholder="Start typing your name..." 
                          value={nameSearchTerm || (typeof field.value === 'string' ? field.value : '')}
                          onChange={(e) => handleNameInputChange(e.target.value)}
                          onKeyDown={handleNameKeyDown}
                          onFocus={() => {
                            if (nameSearchTerm.length >= 2) {
                              setShowNameSuggestions(true);
                            }
                          }}
                        />
                      </FormControl>
                      
                      {/* Name Autocomplete Suggestions */}
                      {showNameSuggestions && availableNames.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[150px] overflow-y-auto">
                          {availableNames.map((result, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none transition-colors"
                              onClick={() => handleNameSelection(result)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">{result.name}</span>
                                {result.user?.clubId && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    Auto-fill details
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Loading indicator */}
                      {isLoadingNames && showNameSuggestions && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="p-3 text-sm text-gray-500 text-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                            Searching directory...
                          </div>
                        </div>
                      )}
                      
                      {/* No results message */}
                      {showNameSuggestions && !isLoadingNames && nameSearchTerm.length >= 2 && availableNames.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No matching names in directory
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto-filled user info display */}
              {selectedUserData && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">
                      Profile Found: {selectedUserData.firstName} {selectedUserData.lastName}
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Club, zone, and contact details auto-filled from your profile (you can still change them below)
                  </p>
                </div>
              )}

              {/* Club Selection with Autocomplete */}
              <FormField
                control={form.control}
                name="clubId"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Club *</FormLabel>
                      <HelpTooltip 
                        content="Search for your club by typing its name. The zone will be automatically selected when you choose your club."
                        side="right"
                      />
                    </div>
                    <div className="relative">
                      {/* Club Input with Zone Display */}
                      <div className="flex items-center gap-2" ref={autocompleteRef}>
                        <div className="flex-1 relative">
                          <FormControl>
                            <Input
                              placeholder="Type your club name..."
                              value={clubSearchTerm}
                              onChange={(e) => handleClubInputChange(e.target.value)}
                              onKeyDown={handleSearchKeyDown}
                              onFocus={() => setShowSuggestions(clubSearchTerm.length > 0)}
                              className="pr-4"
                            />
                          </FormControl>
                          
                          {/* Autocomplete Suggestions */}
                          {showSuggestions && searchFilteredClubs.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                              {searchFilteredClubs.slice(0, 10).map((club) => {
                                const zone = zones?.find(z => z.id === club.zoneId);
                                return (
                                  <button
                                    key={club.id}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none transition-colors"
                                    onClick={() => handleClubSelection(club)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-900">{club.name}</span>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {zone?.name}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Zone Badge Display */}
                        {selectedClub && selectedZoneId && (
                          <div className="flex-shrink-0">
                            <div className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              <span className="font-semibold">
                                {zones?.find(z => z.id === selectedZoneId)?.name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* No results message */}
                      {showSuggestions && clubSearchTerm && searchFilteredClubs.length === 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="p-3 text-sm text-gray-500 text-center">
                            No clubs found matching "{clubSearchTerm}"
                          </div>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Helpful note when no club selected */}
              {!selectedClub && !clubSearchTerm && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Tip:</strong> Start typing your club name and select from the suggestions
                  </p>
                </div>
              )}

              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="submittedByEmail"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Your Email Address *</FormLabel>
                        <HelpTooltip 
                          content="We'll use this email to notify you about the status of your event requests and any follow-up questions."
                          side="right"
                        />
                      </div>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="submittedByPhone"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Your Phone Number *</FormLabel>
                        <HelpTooltip 
                          content="Provide your preferred contact number for urgent matters related to your event requests."
                          side="right"
                        />
                      </div>
                      <FormControl>
                        <Input type="tel" placeholder="0400 123 456" {...field} />
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Event Requests ({eventFields.length}/4)</CardTitle>
                    <HelpTooltip 
                      content="Submit between 1-4 event requests. Assign priority levels to help coordinators understand which events are most important to your club."
                      side="right"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add up to 4 events with priority rankings - Priority 1 is most important
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                        <div 
                          className={`bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300 ${
                            eventFields.length === 0 ? 'w-0' :
                            eventFields.length === 1 ? 'w-1/4' :
                            eventFields.length === 2 ? 'w-2/4' :
                            eventFields.length === 3 ? 'w-3/4' : 'w-full'
                          }`}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground min-w-fit">
                        {eventFields.length === 0 && "No events added"}
                        {eventFields.length === 1 && "1 event added"}
                        {eventFields.length > 1 && `${eventFields.length} events added`}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEvent}
                  disabled={eventFields.length >= 4}
                  className="relative"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Event
                  {eventFields.length >= 4 && (
                    <span className="absolute -top-2 -right-2 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-full border border-amber-200">
                      Max
                    </span>
                  )}
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
              <div className="flex items-center gap-2">
                <CardTitle>Additional Information</CardTitle>
                <HelpTooltip 
                  content="Include any special requirements, coordination details, or context that would help the zone coordinator evaluate your requests."
                  side="right"
                />
              </div>
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
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-lg">Ready to Submit?</h3>
                  <p className="text-sm text-muted-foreground">
                    Your zone coordinator will review your request within 2-4 weeks and notify you via email.
                  </p>
                </div>
                
                {/* Submission checklist */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${form.watch('submittedBy') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={form.watch('submittedBy') ? 'text-green-700' : 'text-muted-foreground'}>
                      Contact details provided
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${form.watch('clubId') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={form.watch('clubId') ? 'text-green-700' : 'text-muted-foreground'}>
                      Club selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${eventFields.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={eventFields.length > 0 ? 'text-green-700' : 'text-muted-foreground'}>
                      Events added ({eventFields.length}/4)
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || eventFields.length === 0}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? 'Submitting...' : `Submit ${eventFields.length} Event Request${eventFields.length > 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}