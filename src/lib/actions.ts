'use server';

import { z } from 'zod';
import { addEvent, getEvents, updateEventStatus, getEventTypes } from './data';
import { suggestAlternativeDates, type SuggestAlternativeDatesOutput } from '@/ai/flows/suggest-alternative-dates';
import { revalidatePath } from 'next/cache';
import { format, formatISO } from 'date-fns';

const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters.'),
  clubId: z.string().min(1, 'Please select a club.'),
  eventTypeId: z.string().min(1, 'Please select an event type.'),
  date: z.date({ required_error: 'Please select a date.' }),
  location: z.string().min(3, 'Location must be at least 3 characters.'),
  isQualifier: z.boolean().optional(),
});

const formSchema = z.object({
    clubId: z.string({ required_error: 'Please select a club.' }).min(1, 'Please select a club.'),
    coordinatorName: z.string().optional(),
    coordinatorContact: z.string().optional(),
    preferences: z.array(eventSchema).min(1, "Please add at least one event preference."),
    notes: z.string().optional(),
    submittedBy: z.string().optional(),
    submittedByContact: z.string().optional(),
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
    
    // This action needs to be updated to handle multiple event creations.
    // For now, let's focus on validating the first preference as a proof of concept.
    // The full implementation will loop through all preferences.

    const rawData = {
        clubId: formData.get('clubId'),
        coordinatorName: formData.get('coordinatorName'),
        coordinatorContact: formData.get('coordinatorContact'),
        notes: formData.get('notes'),
        submittedBy: formData.get('submittedBy'),
        submittedByContact: formData.get('submittedByContact'),
        preferences: [],
    };

    // This is a simplified example of how to extract array data.
    // In a real scenario with unknown numbers of preferences, we'd loop differently.
    for (let i = 0; i < 4; i++) {
        if (formData.get(`preferences[${i}].name`)) {
            const dateString = formData.get(`preferences[${i}].date`) as string;
            const dateParts = dateString ? dateString.split('-').map(p => parseInt(p, 10)) : null;
            const date = dateParts ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : undefined;

            (rawData.preferences as any[]).push({
                name: formData.get(`preferences[${i}].name`),
                eventTypeId: formData.get(`preferences[${i}].eventTypeId`),
                date: date,
                location: formData.get(`preferences[${i}].location`),
                isQualifier: formData.get(`preferences[${i}].isQualifier`) === 'on',
            });
        }
    }
    
    const validatedFields = formSchema.safeParse(rawData);
    
    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Please correct the errors below.',
        };
    }

    const { preferences, clubId, ...otherData } = validatedFields.data;

    try {
        for (const pref of preferences) {
            await addEvent({
                ...pref,
                clubId: clubId,
                status: 'proposed',
                ...otherData,
            });
        }

        revalidatePath('/');
        revalidatePath('/request-event');
        return { success: true, message: 'Event requests submitted successfully!' };

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
