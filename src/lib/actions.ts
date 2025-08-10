'use server';

import { z } from 'zod';
import { addEvent, getEvents, updateEventStatus, getEventTypes } from './data';
import { suggestAlternativeDates, type SuggestAlternativeDatesOutput } from '@/ai/flows/suggest-alternative-dates';
import { revalidatePath } from 'next/cache';
import { formatISO } from 'date-fns';

const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters.'),
  clubId: z.string().min(1, 'Please select a club.'),
  eventTypeId: z.string().min(1, 'Please select an event type.'),
  date: z.date({ required_error: 'Please select a date.' }),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
});

export type FormState = {
  message: string;
  success: boolean;
  suggestions?: SuggestAlternativeDatesOutput;
  errors?: {
    [key: string]: string[] | undefined;
  };
};

export async function createEventRequestAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    const rawFormData = Object.fromEntries(formData.entries());
    const dateString = rawFormData.date as string;
    
    // Adjust for timezone offset to prevent day-before issues
    const dateParts = dateString.split('-').map(part => parseInt(part, 10));
    const parsedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    const validatedFields = eventSchema.safeParse({
        ...rawFormData,
        date: !isNaN(parsedDate.getTime()) ? parsedDate : undefined,
    });
    
    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Please correct the errors below.',
        };
    }

    const { name, date, clubId, eventTypeId, location } = validatedFields.data;

    const allEvents = await getEvents();

    const conflictingEvents = allEvents.filter(
        event => new Date(event.date).toDateString() === new Date(date).toDateString()
    );

    if (conflictingEvents.length > 0) {
        const eventTypes = await getEventTypes();
        const eventTypeName = eventTypes.find(et => et.id === eventTypeId)?.name || 'Unknown Event Type';
        const otherEventsForAI = conflictingEvents.map(e => {
            const otherEventTypeName = eventTypes.find(et => et.id === e.eventTypeId)?.name || 'Unknown Event Type';
            return {
                date: formatISO(new Date(e.date), { representation: 'date' }),
                type: otherEventTypeName,
                location: e.location,
            }
        });

        const aiSuggestions = await suggestAlternativeDates({
            eventDate: formatISO(date, { representation: 'date' }),
            eventType: eventTypeName,
            eventLocation: location,
            otherEvents: otherEventsForAI,
        });

        if (aiSuggestions.suggestedDates.length > 0) {
            return {
                success: false,
                message: "There are conflicting events on this date. Here are some AI-powered suggestions for alternative dates.",
                suggestions: aiSuggestions,
            }
        }
    }

    try {
        await addEvent({
            name,
            date,
            clubId,
            eventTypeId,
            location,
            status: 'proposed',
        });

        revalidatePath('/');
        revalidatePath('/request-event');
        return { success: true, message: 'Event request submitted successfully!' };

    } catch(e) {
         return {
            success: false,
            message: 'An unexpected error occurred.',
        };
    }
}

export async function approveEventAction(eventId: string) {
    try {
        await updateEventStatus(eventId, 'approved');
        revalidatePath('/');
        return { success: true, message: 'Event approved successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to approve event.' };
    }
}
