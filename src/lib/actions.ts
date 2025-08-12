
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
  dates: z.array(z.string()).min(1, 'You must add at least one date preference.').transform(arr => arr.map(str => new Date(str))),
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
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
    const rawData = Object.fromEntries(formData.entries());
    const dates = formData.getAll('dates');
    
    const validatedFields = eventRequestSchema.safeParse({
      clubId: rawData.clubId,
      coordinatorName: rawData.coordinatorName,
      coordinatorContact: rawData.coordinatorContact,
      name: rawData.name,
      eventTypeId: rawData.eventTypeId,
      location: rawData.location,
      isQualifier: rawData.isQualifier === 'on',
      dates: dates,
      notes: rawData.notes,
      submittedBy: rawData.submittedBy,
      submittedByContact: rawData.submittedByContact,
    });
    
    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Please correct the errors below.',
        };
    }

    const { dates: validatedDates, clubId, name, eventTypeId, location, isQualifier, ...otherData } = validatedFields.data;

    try {
        for (const date of validatedDates) {
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
            message: 'An unexpected error occurred while saving to the database.',
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


    