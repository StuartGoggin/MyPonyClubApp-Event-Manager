
'use server';

import { z } from 'zod';
import { addEvent, updateEventStatus } from './data';
import { revalidatePath } from 'next/cache';

const eventRequestSchema = z.object({
  clubId: z.string({ required_error: 'Please select a club.' }).min(1, 'Please select a club.'),
  coordinatorName: z.string().optional(),
  coordinatorContact: z.string().optional(),
  name: z.string().min(3, { message: 'Event name must be at least 3 characters.' }),
  eventTypeId: z.string({ required_error: 'Please select an event type.' }).min(1, 'Please select an event type.'),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  isQualifier: z.boolean().default(false),
  dates: z.array(z.date({ required_error: 'A date is required.' })).min(1, 'You must add at least one date preference.'),
  notes: z.string().optional(),
  submittedBy: z.string().optional(),
  submittedByContact: z.string().optional(),
});


export type FormState = {
  message: string;
  success: boolean;
  errors?: {
    [key: string]: string[] | undefined;
     _errors?: string[];
  };
};

export async function createEventRequestAction(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
    const dates = data.getAll('dates').map(d => new Date(d as string));

    const payload = {
        clubId: data.get('clubId'),
        coordinatorName: data.get('coordinatorName'),
        coordinatorContact: data.get('coordinatorContact'),
        name: data.get('name'),
        eventTypeId: data.get('eventTypeId'),
        location: data.get('location'),
        isQualifier: data.get('isQualifier') === 'on',
        dates: dates.filter(d => !isNaN(d.getTime())),
        notes: data.get('notes'),
        submittedBy: data.get('submittedBy'),
        submittedByContact: data.get('submittedByContact'),
    }
    
    const validatedFields = eventRequestSchema.safeParse(payload);
    
    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Please correct the errors below.',
        };
    }

    const { dates: validDates, clubId, name, eventTypeId, location, isQualifier, ...otherData } = validatedFields.data;

    try {
        for (const date of validDates) {
            await addEvent({
                name,
                date,
                clubId,
                eventTypeId,
                location,
                isQualifier,
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
        revalidatePath('/request-event');
        return { success: true, message: 'Event approved successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to approve event.' };
    }
}
