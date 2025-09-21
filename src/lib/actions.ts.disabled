
'use server';

import { z } from 'zod';
import { addEvent, updateEventStatus, updateZone } from './data';
import { revalidatePath } from 'next/cache';
import type { Zone } from './types';

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

// Multi-event request schema
const multiEventRequestSchema = z.object({
  clubId: z.string({ required_error: 'Please select a club.' }).min(1, 'Please select a club.'),
  submittedBy: z.string().min(1, 'Please enter your name.'),
  submittedByEmail: z.string().email('Please enter a valid email address.').min(1, 'Please enter your email address.'),
  submittedByPhone: z.string().min(1, 'Please enter your phone number.'),
  events: z.array(z.object({
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
  }))
    .min(1, 'You must add at least one event request.')
    .max(4, 'You can request a maximum of 4 events.'),
  generalNotes: z.string().optional(),
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

export async function createMultiEventRequestAction(data: any): Promise<FormState> {
    try {
        // Convert date from form data if needed
        const processedData = {
            ...data,
            events: data.events.map((event: any) => ({
                ...event,
                date: typeof event.date === 'string' ? new Date(event.date) : event.date
            }))
        };

        const validatedFields = multiEventRequestSchema.safeParse(processedData);
        
        if (!validatedFields.success) {
            return {
                success: false,
                errors: validatedFields.error.flatten().fieldErrors,
                message: 'Please correct the errors below.',
            };
        }

        const { clubId, submittedBy, submittedByEmail, submittedByPhone, events, generalNotes } = validatedFields.data;

        // Combine contact information for backward compatibility
        const submittedByContact = [submittedByEmail, submittedByPhone].filter(Boolean).join(' | ');

        // Create events for each priority
        for (const eventData of events) {
            const { date, priority, name, eventTypeId, location, isQualifier, isHistoricallyTraditional, description, coordinatorName, coordinatorContact, notes } = eventData;
            
            // Create a single event for this priority
            const eventName = isHistoricallyTraditional 
                ? `${name} (Priority ${priority} - Traditional)` 
                : `${name} (Priority ${priority})`;
            
            const eventNotes = [
                `Priority ${priority} event`,
                isHistoricallyTraditional ? 'Historically traditional event' : null,
                notes || null
            ].filter(Boolean).join(' | ');

            await addEvent({
                name: eventName,
                date,
                clubId,
                eventTypeId,
                location,
                isQualifier,
                status: 'proposed',
                description,
                coordinatorName,
                coordinatorContact,
                notes: eventNotes,
                submittedBy,
                submittedByContact,
            });
        }

        revalidatePath('/');
        revalidatePath('/request-event');
        
        const eventCount = events.length;
        return { 
            success: true, 
            message: `Your ${eventCount} event request${eventCount > 1 ? 's have' : ' has'} been submitted for approval. They will appear on the calendar as pending events.` 
        };

    } catch (error) {
        console.error('Error creating multi-event request:', error);
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

export async function updateZoneAction(zone: Zone) {
    try {
        await updateZone(zone);
        revalidatePath('/admin');
        return { success: true, message: 'Zone updated successfully' };
    } catch (error) {
        return { success: false, message: 'Failed to update zone.' };
    }
}