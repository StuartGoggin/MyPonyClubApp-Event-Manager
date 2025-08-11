'use server';

import { z } from 'zod';
import { addEvent, getEvents, updateEventStatus, getEventTypes } from './data';
import { suggestAlternativeDates, type SuggestAlternativeDatesOutput } from '@/ai/flows/suggest-alternative-dates';
import { revalidatePath } from 'next/cache';
import { format, formatISO, parse } from 'date-fns';

const preferenceSchema = z.object({
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }),
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


export type FormState = {
  message: string;
  success: boolean;
  suggestions?: SuggestAlternativeDatesOutput;
  errors?: {
    [key: string]: string[] | undefined;
     _errors?: string[];
  };
};

export async function createEventRequestAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
    
    // This action needs to be updated to handle multiple event creations.
    // For now, let's focus on validating the first preference as a proof of concept.
    // The full implementation will loop through all preferences.
    const rawPreferences: any[] = [];
    formData.forEach((value, key) => {
        const match = key.match(/preferences\[(\d+)\]\.(.+)/);
        if (match) {
            const index = parseInt(match[1], 10);
            const field = match[2];
            if (!rawPreferences[index]) {
                rawPreferences[index] = {};
            }
            if (field === 'date' && typeof value === 'string') {
                rawPreferences[index][field] = parse(value, 'yyyy-MM-dd', new Date());
            } else if (field === 'isQualifier') {
                 rawPreferences[index][field] = value === 'on';
            } else {
                 rawPreferences[index][field] = value;
            }
        }
    });

    const rawData = {
        clubId: formData.get('clubId'),
        coordinatorName: formData.get('coordinatorName'),
        coordinatorContact: formData.get('coordinatorContact'),
        notes: formData.get('notes'),
        submittedBy: formData.get('submittedBy'),
        submittedByContact: formData.get('submittedByContact'),
        preferences: rawPreferences.filter(p => p.name), // Filter out empty preferences
    };
    
    const validatedFields = eventRequestSchema.safeParse(rawData);
    
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
        return { success: true, message: 'Your event request has been submitted for approval. It will appear on the calendar as a pending event.' };

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
