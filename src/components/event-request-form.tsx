'use client';

import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createEventRequestAction, type FormState } from '@/lib/actions';
import { useEffect, useRef, useState } from 'react';
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
import { CalendarIcon, AlertTriangle, Wand2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type Club, type EventType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const eventFormSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  clubId: z.string({ required_error: 'Please select a club.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }),
  date: z.date({ required_error: 'A date is required.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventRequestFormProps {
  clubs: Club[];
  eventTypes: EventType[];
}

export function EventRequestForm({ clubs, eventTypes }: EventRequestFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialState: FormState = { message: '', success: false };
  const [state, dispatch] = useFormState(createEventRequestAction, initialState);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      location: '',
    },
  });

  useEffect(() => {
    setIsSubmitting(false);
    if (state.success) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      form.reset();
      formRef.current?.reset();
    } else if (state.message && !state.suggestions) {
      toast({
        title: 'Error',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, form]);

  const onFormSubmit = (data: EventFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('clubId', data.clubId);
    formData.append('eventTypeId', data.eventTypeId);
    formData.append('date', format(data.date, 'yyyy-MM-dd'));
    formData.append('location', data.location);
    dispatch(formData);
  };
  
  const handleSuggestionClick = (dateStr: string) => {
    // The date from AI is YYYY-MM-DD. Need to parse it carefully.
    const parts = dateStr.split('-').map(p => parseInt(p, 10));
    const suggestedDate = new Date(parts[0], parts[1] - 1, parts[2]);
    form.setValue('date', suggestedDate, { shouldValidate: true });
    form.handleSubmit(onFormSubmit)();
  };


  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spring Dressage Gala" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clubId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pony Club</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <FormField
                control={form.control}
                name="eventTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Location / Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Equestrian Rd, Horsemansville" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {state.suggestions && (
              <Card className="bg-accent/10 border-accent/20">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-accent" />
                        <CardTitle className="text-accent-foreground">Date Conflict</CardTitle>
                    </div>
                  <CardDescription className="text-accent-foreground/80">{state.message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Wand2 className="h-4 w-4" />
                                AI Suggested Dates
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">{state.suggestions.reasoning}</p>
                            <div className="flex flex-wrap gap-2">
                                {state.suggestions.suggestedDates.map(date => (
                                    <Button key={date} type="button" variant="outline" onClick={() => handleSuggestionClick(date)}>
                                        {format(new Date(date.replace(/-/g, '/')), 'MMM d, yyyy')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
