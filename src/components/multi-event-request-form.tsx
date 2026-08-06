'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
import { PlusCircle, Send, AlertCircle, FileText, Copy, MailCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { type Club, type EventType, type Event, type Zone } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SingleEventForm } from '@/components/single-event-form';

import { createMultiEventRequestAction } from '@/lib/actions';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { formatClubAddress } from '@/lib/utils';

// Individual event details schema
const eventDetailsSchema = z.object({
  priority: z.number().min(1).max(4),
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }).min(1, 'Please select an event type.'),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  eventLink: z.string().url().optional().or(z.literal('')),
  isQualifier: z.boolean().default(false),
  isHistoricallyTraditional: z.boolean().default(false),
  date: z.date({ required_error: 'Please select a date for this event.' }),
  description: z.string().optional(),
  coordinatorName: z.string().trim().min(1, 'Please enter the event coordinator name.'),
  coordinatorContact: z.string().trim().min(1, 'Please enter the event coordinator contact details.'),
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

export type MultiEventRequestFormValues = z.infer<typeof multiEventRequestSchema>;

interface DirectoryMember {
  id: string;
  firstName?: string;
  lastName?: string;
}

interface EventRequestVerification {
  token: string;
  userId: string;
  clubId: string;
  displayName: string;
}

interface PreviousEventTemplate {
  id: string;
  name: string;
  date: string;
  eventTypeId: string;
  location: string;
  eventLink: string;
  isQualifier: boolean;
  isHistoricallyTraditional: boolean;
  description: string;
}

interface SubmissionConfirmation {
  clubName: string;
  eventCount: number;
  referenceNumber: string;
  emailStatus: 'preparing' | 'sent' | 'queued' | 'warning';
}

interface MultiEventRequestFormProps {
  clubs?: Club[];
  eventTypes?: EventType[];
  zones?: Zone[];
  embedMode?: boolean;
  onSubmit?: (data: any) => void;
}

export function MultiEventRequestForm({ 
  clubs: propClubs, 
  eventTypes: propEventTypes, 
  zones: propZones,
  embedMode = false,
  onSubmit
}: MultiEventRequestFormProps) {
  const { toast } = useToast();
  
  // Data loading state - silent refresh for event types
  const [clubs, setClubs] = useState<Club[]>(propClubs || []);
  const [eventTypes, setEventTypes] = useState<EventType[]>(propEventTypes || []);
  const [zones, setZones] = useState<Zone[]>(propZones || []);
  const [isLoadingData, setIsLoadingData] = useState(embedMode && (!propClubs || !propEventTypes || !propZones));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
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
  const [selectedUserData, setSelectedUserData] = useState<DirectoryMember | null>(null);
  const [verification, setVerification] = useState<EventRequestVerification | null>(null);
  const [previousEventTemplates, setPreviousEventTemplates] = useState<PreviousEventTemplate[]>([]);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isLoadingPreviousEvents, setIsLoadingPreviousEvents] = useState(false);
  const [submissionConfirmation, setSubmissionConfirmation] = useState<SubmissionConfirmation | null>(null);
  const hasInitializedEvent = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MultiEventRequestFormValues>({
    resolver: zodResolver(multiEventRequestSchema),
    defaultValues: {
      clubId: '',
      submittedBy: '',
      submittedByEmail: '',
      submittedByPhone: '',
      events: [],
      generalNotes: '',
    },
  });

  // Scroll to top on component mount (mobile fix - prevents focus from jumping to middle of page)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Focus on the name field after a short delay to ensure scroll completes
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const submittedBy = form.watch('submittedBy');
  const submittedByEmail = form.watch('submittedByEmail');
  const submittedByPhone = form.watch('submittedByPhone');

  // Initialize nameSearchTerm with form value
  useEffect(() => {
    if (submittedBy && !nameSearchTerm) {
      setNameSearchTerm(submittedBy);
    }
  }, [submittedBy, nameSearchTerm]);

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  const watchedEvents = form.watch('events');
  const hasValidEmail = /^\S+@\S+\.\S+$/.test(submittedByEmail || '');
  const contactDetailsComplete = Boolean(submittedBy?.trim() && hasValidEmail && submittedByPhone?.trim());
  const requesterCoordinatorContact = [submittedByEmail, submittedByPhone].filter(Boolean).join(' | ');
  const incompleteEventIndex = watchedEvents.findIndex(event =>
    !event?.name || !event?.eventTypeId || !event?.location || !event?.date || !event?.coordinatorName || !event?.coordinatorContact
  );
  const requiredFieldsRemaining =
    (submittedBy?.trim() ? 0 : 1) +
    (hasValidEmail ? 0 : 1) +
    (submittedByPhone?.trim() ? 0 : 1) +
    (form.watch('clubId') ? 0 : 1) +
    (watchedEvents.length === 0
      ? 1
      : watchedEvents.reduce((total, event) => total + [
        event?.name,
        event?.eventTypeId,
        event?.location,
        event?.date,
        event?.coordinatorName,
        event?.coordinatorContact,
      ].filter(value => !value).length, 0));

  // Use the requester as the starting coordinator for each event without replacing a chosen coordinator.
  useEffect(() => {
    form.getValues('events').forEach((event, index) => {
      if (submittedBy?.trim() && !event.coordinatorName?.trim()) {
        form.setValue(`events.${index}.coordinatorName`, submittedBy.trim(), { shouldDirty: true });
      }
      if (requesterCoordinatorContact && !event.coordinatorContact?.trim()) {
        form.setValue(`events.${index}.coordinatorContact`, requesterCoordinatorContact, { shouldDirty: true });
      }
    });
  }, [eventFields.length, form, requesterCoordinatorContact, submittedBy]);

  const loadPreviousEventTemplates = async (token: string) => {
    setIsLoadingPreviousEvents(true);
    try {
      const response = await fetch(`/api/event-request/previous-events?token=${encodeURIComponent(token)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to load previous events.');
      }

      setPreviousEventTemplates(result.templates || []);
    } catch (error) {
      console.error('Unable to load previous event templates:', error);
      setPreviousEventTemplates([]);
      toast({
        title: 'Previous events unavailable',
        description: error instanceof Error ? error.message : 'Please request another verification link.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPreviousEvents(false);
    }
  };

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('verification');
    if (!token) return;

    // Do not leave a bearer token in the address bar after it has been consumed by the page.
    window.history.replaceState({}, document.title, window.location.pathname);

    const verify = async () => {
      try {
        const response = await fetch(`/api/event-request/verification?token=${encodeURIComponent(token)}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'This verification link is no longer valid.');
        }

        const verifiedMember = result.verification as Omit<EventRequestVerification, 'token'>;
        setVerification({ token, ...verifiedMember });
        setSelectedUserData({ id: verifiedMember.userId });
        setNameSearchTerm(verifiedMember.displayName);
        form.setValue('submittedBy', verifiedMember.displayName);
        await loadPreviousEventTemplates(token);
      } catch (error) {
        toast({
          title: 'Verification link unavailable',
          description: error instanceof Error ? error.message : 'Please request a new verification link.',
          variant: 'destructive',
        });
      }
    };

    void verify();
  // This runs once for a link opened from an email. The form state is intentionally preserved afterwards.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          const [clubsRes, eventTypesRes, zonesRes] = await Promise.all([
            fetchWithTimeout('/api/clubs'),
            fetchWithTimeout('/api/event-types'),
            fetchWithTimeout('/api/zones')
          ]);

          if (!clubsRes.ok || !eventTypesRes.ok || !zonesRes.ok) {
            throw new Error('One or more API requests failed');
          }

          const [clubsData, eventTypesData, zonesData] = await Promise.all([
            clubsRes.json(),
            eventTypesRes.json(),
            zonesRes.json()
          ]);

          setClubs(clubsData.clubs || clubsData);
          setEventTypes(eventTypesData.eventTypes || eventTypesData);
          setZones(zonesData.zones || zonesData);
          setIsLoadingData(false);
        } catch (error) {
          console.error('Error fetching data for embed mode:', error);
          
          setClubs([]);
          setEventTypes([]);
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

  // Silent function to refresh event types (no user notifications)
  const refreshEventTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/event-types');
      if (response.ok) {
        const data = await response.json();
        const newEventTypes = data.eventTypes || data;
        setEventTypes(newEventTypes);
      }
    } catch (error) {
      console.error('Silent refresh of event types failed:', error);
      // No user notification - fail silently
    }
  }, []);

  // Auto-refresh event types when window gains focus (user returns from admin)
  useEffect(() => {
    let lastRefresh = 0;
    const refreshCooldown = 30000; // 30 seconds cooldown to avoid excessive requests

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRefresh > refreshCooldown) {
        lastRefresh = now;
        refreshEventTypes();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshEventTypes]);

  // Silent refresh on component mount (once)
  useEffect(() => {
    if (!embedMode && propEventTypes && propEventTypes.length > 0) {
      // Only refresh if we have initial data (not first load)
      const timer = setTimeout(() => {
        refreshEventTypes();
      }, 1000); // Small delay to avoid racing with page load
      
      return () => clearTimeout(timer);
    }
  }, [embedMode, propEventTypes, refreshEventTypes]);

  // Initialize first event after component mounts (hydration-safe)
  useEffect(() => {
    if (eventFields.length === 0 && !hasInitializedEvent.current) {
      hasInitializedEvent.current = true;
      appendEvent({
        priority: 1,
        name: '',
        eventTypeId: '',
        location: '',
        isQualifier: false,
        isHistoricallyTraditional: false,
        date: undefined as unknown as Date,
        description: '',
        coordinatorName: '',
        coordinatorContact: '',
        notes: '',
      });
    }
  }, [eventFields.length, appendEvent]);

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
    
    // Update location for existing events if they're empty
    const clubAddress = formatClubAddress(club);
    const currentEvents = form.getValues('events');
    currentEvents.forEach((event, index) => {
      if (!event.location || event.location.trim() === '') {
        form.setValue(`events.${index}.location`, clubAddress);
      }
    });
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
    if (selectedUserData) {
      setSelectedUserData(null);
      setVerification(null);
      setPreviousEventTemplates([]);
    }
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
    setVerification(null);
    setPreviousEventTemplates([]);
    
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

  const handleSendVerification = async () => {
    const email = form.getValues('submittedByEmail');
    if (!selectedUserData?.id || !email) {
      toast({
        title: 'Email required',
        description: 'Select your name from the directory and enter your email address first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingVerification(true);
    try {
      const response = await fetch('/api/event-request/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserData.id, email }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Unable to send the verification email.');
      }

      toast({
        title: 'Check your email',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Verification email unavailable',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleUsePreviousEvent = (template: PreviousEventTemplate) => {
    const currentEvents = form.getValues('events');
    const emptyEventIndex = currentEvents.findIndex(event => !event.name && !event.eventTypeId);
    const targetIndex = emptyEventIndex >= 0 ? emptyEventIndex : currentEvents.length;

    if (targetIndex >= 4) {
      toast({
        title: 'Maximum Events Reached',
        description: 'Remove an event before adding another template.',
        variant: 'destructive',
      });
      return;
    }

    const sourceDate = new Date(template.date);
    const today = new Date();
    const targetYear = today.getFullYear() + (today.getMonth() >= 6 ? 1 : 0);
    const suggestedDate = new Date(targetYear, sourceDate.getMonth(), sourceDate.getDate());
    const newEvent = {
      priority: targetIndex + 1,
      name: template.name,
      eventTypeId: template.eventTypeId,
      location: template.location,
      eventLink: template.eventLink,
      isQualifier: template.isQualifier,
      isHistoricallyTraditional: template.isHistoricallyTraditional,
      date: suggestedDate,
      description: template.description,
      coordinatorName: submittedBy?.trim() || '',
      coordinatorContact: requesterCoordinatorContact,
      notes: '',
    };

    const verifiedClub = clubs.find(club => club.id === verification?.clubId);
    if (verifiedClub) {
      handleClubSelection(verifiedClub);
    }

    if (emptyEventIndex >= 0) {
      form.setValue(`events.${emptyEventIndex}`, newEvent);
    } else {
      appendEvent(newEvent);
    }

    toast({
      title: 'Previous event copied',
      description: `The preferred date has been moved to ${targetYear}. Review it before submitting.`,
    });
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

    const currentEvents = form.getValues('events');
    const firstIncompleteIndex = currentEvents.findIndex(event =>
      !event.name || !event.eventTypeId || !event.location || !event.date || !event.coordinatorName || !event.coordinatorContact
    );
    if (firstIncompleteIndex >= 0) {
      toast({
        title: 'Complete the current event first',
        description: 'Add the event name, type, preferred date, location, and coordinator details before adding another priority.',
        variant: 'destructive',
      });
      scrollToNextIncompleteField();
      return;
    }

    const nextPriority = eventFields.length + 1;
    const defaultLocation = selectedClub ? formatClubAddress(selectedClub) : '';
    
    appendEvent({
      priority: nextPriority,
      name: '',
      eventTypeId: '',
      location: defaultLocation,
      isQualifier: false,
      isHistoricallyTraditional: false,
      date: undefined as unknown as Date,
      description: '',
      coordinatorName: submittedBy?.trim() || '',
      coordinatorContact: requesterCoordinatorContact,
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

  const scrollToNextIncompleteField = () => {
    let target: HTMLElement | null = null;

    if (!submittedBy?.trim()) {
      target = document.getElementById('request-submitted-by');
    } else if (!hasValidEmail) {
      target = document.getElementById('request-submitted-by-email');
    } else if (!submittedByPhone?.trim()) {
      target = document.getElementById('request-submitted-by-phone');
    } else if (!form.getValues('clubId')) {
      target = document.getElementById('request-club');
    } else if (incompleteEventIndex >= 0) {
      target = document.querySelector(`[data-event-request-index="${incompleteEventIndex}"]`);
    }

    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      const focusTarget = target?.matches('input, button, textarea')
        ? target
        : target?.querySelector<HTMLElement>('input, button, textarea, [role="combobox"]');
      focusTarget?.focus();
    }, 350);
  };

  const startAnotherRequest = () => {
    form.reset({
      clubId: '',
      submittedBy: '',
      submittedByEmail: '',
      submittedByPhone: '',
      events: [{
        priority: 1,
        name: '',
        eventTypeId: '',
        location: '',
        eventLink: '',
        isQualifier: false,
        isHistoricallyTraditional: false,
        date: undefined as unknown as Date,
        description: '',
        coordinatorName: '',
        coordinatorContact: '',
        notes: '',
      }],
      generalNotes: '',
    });
    setSubmissionConfirmation(null);
    setSelectedClub(null);
    setSelectedZoneId(undefined);
    setClubSearchTerm('');
    setNameSearchTerm('');
    setSelectedUserData(null);
    setVerification(null);
    setPreviousEventTemplates([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateAndDownloadPDF = async (data: MultiEventRequestFormValues) => {
    try {
      // Transform data to match EventRequestFormData interface
      const formDataForPDF = {
        ...data,
        clubName: selectedClub?.name || '', // Add club name from selected club
        events: data.events.map(event => ({
          ...event,
          coordinatorName: event.coordinatorName || '',
          coordinatorContact: event.coordinatorContact || '',
        }))
      };

      const response = await fetch('/api/generate-event-request-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: formDataForPDF,
          title: 'Event Request Submission',
          submissionDate: new Date().toISOString(),
          referenceNumber: `ER-${Date.now()}`
        }),
      });

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.statusText}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create filename
      const filename = `event-request-${data.submittedByEmail.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF downloaded successfully:', filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const generatePDFPreview = async () => {
    setIsGeneratingPDF(true);
    try {
      // Get current form data
      const formData = form.getValues();
      
      // Validate that we have at least basic required data
      if (!formData.submittedBy || !formData.clubId || !formData.events || formData.events.length === 0) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in your name, select a club, and add at least one event before generating the PDF preview.',
          variant: 'destructive',
        });
        return;
      }

      // Filter out empty events
      const validEvents = formData.events.filter(event => 
        event.name && event.date && event.eventTypeId && event.location
      );

      if (validEvents.length === 0) {
        toast({
          title: 'No Complete Events',
          description: 'Please complete at least one event with all required fields before generating the PDF preview.',
          variant: 'destructive',
        });
        return;
      }

      // Generate PDF with current form data
      await generateAndDownloadPDF({
        ...formData,
        events: validEvents
      });

      toast({
        title: 'PDF Preview Generated',
        description: 'Your PDF preview has been downloaded. You can review it before submitting your request.',
      });
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      toast({
        title: 'PDF Generation Failed',
        description: 'Unable to generate PDF preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const onSubmitForm = async (data: MultiEventRequestFormValues) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting multi-event request:', data);
      console.log('Form errors:', form.formState.errors);
      
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Use the server action
        const result = await createMultiEventRequestAction(data);
        
        if (result.success) {
          const referenceNumber = result.referenceNumber || `ER-${Date.now()}`;
          const clubName = selectedClub?.name || 'your selected club';
          setSubmissionConfirmation({
            clubName,
            eventCount: data.events.length,
            referenceNumber,
            emailStatus: 'preparing',
          });
          form.reset();

          void (async () => {
          // Generate PDF for email (but don't download it)
          let pdfBuffer: ArrayBuffer | null = null;
          try {
            // Transform data to match EventRequestFormData interface
            const formDataForPDF: any = {
              ...data,
              clubName: selectedClub?.name || '', // Add club name from selected club
              events: data.events.map(event => ({
                ...event,
                coordinatorName: event.coordinatorName || '',
                coordinatorContact: event.coordinatorContact || '',
              }))
            };
            
            // Call API endpoint to generate PDF for email
            const pdfResponse = await fetch('/api/generate-event-request-pdf', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                formData: formDataForPDF,
                title: 'Event Request Submission',
                submissionDate: new Date().toISOString(),
                referenceNumber
              }),
            });

            if (!pdfResponse.ok) {
              throw new Error('Failed to generate PDF');
            }

            pdfBuffer = await pdfResponse.arrayBuffer();
          } catch (pdfError) {
            console.error('PDF generation failed:', pdfError);
            // Don't fail the entire submission if PDF generation fails
            toast({
              title: 'PDF Generation Warning',
              description: 'Your request was submitted successfully, but the PDF could not be generated for email.',
              variant: 'default',
            });
            setSubmissionConfirmation(current => current ? { ...current, emailStatus: 'warning' } : current);
          }
          
          // Send email notification to zone approvers
          try {
            if (pdfBuffer) {
              const emailResponse = await fetch('/api/send-event-request-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  formData: data,
                  pdfData: Array.from(new Uint8Array(pdfBuffer)),
                  referenceNumber,
                }),
              });

              if (!emailResponse.ok) {
                const errorData = await emailResponse.json();
                console.error('Email sending failed:', errorData);
                toast({
                  title: 'Email Notification Warning',
                  description: 'Your request was submitted successfully, but the email notification could not be sent.',
                  variant: 'default',
                });
                setSubmissionConfirmation(current => current ? { ...current, emailStatus: 'warning' } : current);
              } else {
                const emailResult = await emailResponse.json();
                console.log('Email result:', emailResult);
                
                // Show different messages based on whether email was queued or sent
                if (emailResult.queuedForReview) {
                  setSubmissionConfirmation(current => current ? { ...current, emailStatus: 'queued' } : current);
                } else if (emailResult.success) {
                  setSubmissionConfirmation(current => current ? { ...current, emailStatus: 'sent' } : current);
                } else {
                  setSubmissionConfirmation(current => current ? { ...current, emailStatus: 'warning' } : current);
                }
              }
            }
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            toast({
              title: 'Email Notification Warning',
              description: 'Your request was submitted successfully, but the email notification could not be sent.',
              variant: 'default',
            });
            setSubmissionConfirmation(current => current ? { ...current, emailStatus: 'warning' } : current);
          }
          
          })();
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

  if (submissionConfirmation) {
    const emailStatus = submissionConfirmation.emailStatus === 'preparing'
      ? 'Preparing your confirmation email'
      : submissionConfirmation.emailStatus === 'sent'
        ? 'Confirmation email sent'
        : submissionConfirmation.emailStatus === 'queued'
          ? 'Confirmation email queued for review'
          : 'Your request is saved; the confirmation email needs attention';

    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-green-600" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Your event request is saved</h2>
              <p className="text-muted-foreground">{submissionConfirmation.eventCount} event request{submissionConfirmation.eventCount > 1 ? 's have' : ' has'} been sent to {submissionConfirmation.clubName} for review.</p>
            </div>
          </div>

          <div className="grid gap-3 border-y border-green-200 py-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Reference number</p>
              <p className="font-semibold">{submissionConfirmation.referenceNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email update</p>
              <p className="font-semibold">{emailStatus}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Keep the reference number for your records. Your zone coordinator will review the request and contact you using the details supplied.</p>
          <Button type="button" onClick={startAnotherRequest}>
            <PlusCircle />
            Start another request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:space-y-6 sm:pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm, (errors) => {
          console.error('Form validation errors:', errors);
          toast({
            title: 'Form Validation Failed',
            description: 'Please check all required fields and fix any errors before submitting.',
            variant: 'destructive',
          });
        })} className="space-y-4 sm:space-y-6">
          {/* Your Details */}
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Start by entering your name. Selecting a directory result can fill in your club, but you will enter your own contact details.
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
                        content="Start typing your name to search the member directory. Selecting a result can fill in your club; enter your own email address and phone number below."
                        side="right"
                      />
                    </div>
                    <div className="relative" ref={nameAutocompleteRef}>
                      <FormControl>
                        <Input 
                          id="request-submitted-by"
                          ref={nameInputRef}
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
                                {result.clubId && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    Select member
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
                      Member selected
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Your club can be selected from the member record. Enter and confirm your own contact details below.
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
                              id="request-club"
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
                        <Input id="request-submitted-by-email" type="email" placeholder="your.email@example.com" {...field} />
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
                        <Input id="request-submitted-by-phone" type="tel" placeholder="0400 123 456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedUserData && !verification && (
                <Alert className="border-blue-200 bg-blue-50">
                  <MailCheck className="h-4 w-4 text-blue-700" />
                  <AlertDescription className="space-y-3 text-blue-950">
                    <p>Verify the email address on your membership record to reuse a previous event as a template. This is optional and does not affect submitting a new request.</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleSendVerification} disabled={isSendingVerification}>
                      <MailCheck />
                      {isSendingVerification ? 'Sending verification link...' : 'Email me a verification link'}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {verification && (
                <Alert className="border-green-200 bg-green-50">
                  <MailCheck className="h-4 w-4 text-green-700" />
                  <AlertDescription className="space-y-3 text-green-950">
                    <p>Email verified for {verification.displayName}. Choose an earlier club event to use as a starting point. Personal contacts and internal notes are not copied.</p>
                    {isLoadingPreviousEvents ? (
                      <p className="text-sm">Loading previous events...</p>
                    ) : previousEventTemplates.length === 0 ? (
                      <p className="text-sm">No earlier events are available for this club.</p>
                    ) : (
                      <div className="space-y-2">
                        {previousEventTemplates.map(template => (
                          <div key={template.id} className="flex flex-col gap-2 border border-green-200 bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground">{new Date(template.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleUsePreviousEvent(template)}>
                              <Copy />
                              Use as template
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Event Requests */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  className="relative w-full sm:w-auto"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {eventFields.length > 0 ? 'Add another event' : 'Add first event'}
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
              
              {/* Display events array validation errors */}
              {form.formState.errors.events && typeof form.formState.errors.events.message === 'string' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {form.formState.errors.events.message}
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
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6 pb-6">
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-lg">Ready to Submit?</h3>
                  <p className="text-sm text-muted-foreground">
                    Your zone coordinator will review your request within 2-4 weeks and notify you via email.
                  </p>
                </div>
                
                {/* Submission checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs px-2 sm:px-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${contactDetailsComplete ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={contactDetailsComplete ? 'text-green-700' : 'text-muted-foreground'}>
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
                    <div className={`w-2 h-2 rounded-full ${eventFields.length > 0 && incompleteEventIndex === -1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className={eventFields.length > 0 && incompleteEventIndex === -1 ? 'text-green-700' : 'text-muted-foreground'}>
                      Events ready ({eventFields.length}/4)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 justify-center">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={generatePDFPreview}
                      disabled={isGeneratingPDF || isSubmitting || requiredFieldsRemaining > 0}
                      size="lg"
                      className="w-full sm:min-w-[160px] sm:w-auto"
                    >
                      {isGeneratingPDF ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      {isGeneratingPDF ? 'Generating...' : 'Preview PDF'}
                    </Button>
                    <HelpTooltip 
                      content="Generate and download a PDF preview of your request form using the current data. You can review this before submitting your final request."
                      side="top"
                      className="hidden sm:block"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || isGeneratingPDF || requiredFieldsRemaining > 0}
                    size="lg"
                    className="w-full sm:min-w-[200px] sm:w-auto"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? 'Submitting...' : `Submit ${eventFields.length} Event Request${eventFields.length > 1 ? 's' : ''}`}
                  </Button>
                </div>

                {requiredFieldsRemaining > 0 && (
                  <div className="hidden justify-center sm:flex">
                    <Button type="button" variant="link" onClick={scrollToNextIncompleteField}>
                      Complete the next missing detail
                      <ChevronRight />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      <div className="fixed bottom-3 left-3 right-3 z-40 flex items-center justify-between gap-3 border border-border bg-background p-3 shadow-lg sm:hidden">
        <div className="min-w-0">
          <p className="text-sm font-medium">{requiredFieldsRemaining === 0 ? 'Ready to submit' : `${requiredFieldsRemaining} detail${requiredFieldsRemaining === 1 ? '' : 's'} remaining`}</p>
          <p className="truncate text-xs text-muted-foreground">{eventFields.length > 0 ? `${eventFields.length} event${eventFields.length === 1 ? '' : 's'} in this request` : 'Add your first event request'}</p>
        </div>
        {requiredFieldsRemaining > 0 ? (
          <Button type="button" size="sm" onClick={scrollToNextIncompleteField}>
            Continue
            <ChevronRight />
          </Button>
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-label="Ready to submit" />
        )}
      </div>
    </div>
  );
}
