'use server';

/**
 * @fileOverview A flow to suggest alternative dates for a pony club event based on potential conflicts with similar events in close proximity.
 *
 * - suggestAlternativeDates - A function that takes event details and proximity information to suggest alternative dates.
 * - SuggestAlternativeDatesInput - The input type for the suggestAlternativeDates function.
 * - SuggestAlternativeDatesOutput - The return type for the suggestAlternativeDates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeDatesInputSchema = z.object({
  eventDate: z.string().describe('The requested date for the event (YYYY-MM-DD).'),
  eventType: z.string().describe('The type of event (e.g., rally, competition).'),
  eventLocation: z.string().describe('The geographical location of the event (e.g., address, coordinates).'),
  otherEvents: z.array(
    z.object({
      date: z.string().describe('Date of the existing event (YYYY-MM-DD).'),
      type: z.string().describe('Type of the existing event.'),
      location: z.string().describe('Location of the existing event.'),
    })
  ).describe('A list of other events within a 100km radius.'),
});
export type SuggestAlternativeDatesInput = z.infer<typeof SuggestAlternativeDatesInputSchema>;

const SuggestAlternativeDatesOutputSchema = z.object({
  suggestedDates: z.array(
    z.string().describe('A list of suggested alternative dates (YYYY-MM-DD).')
  ).describe('A list of suggested alternative dates to avoid conflicts.'),
  reasoning: z.string().describe('The reasoning behind the suggested dates.'),
});
export type SuggestAlternativeDatesOutput = z.infer<typeof SuggestAlternativeDatesOutputSchema>;

export async function suggestAlternativeDates(input: SuggestAlternativeDatesInput): Promise<SuggestAlternativeDatesOutput> {
  return suggestAlternativeDatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAlternativeDatesPrompt',
  input: {schema: SuggestAlternativeDatesInputSchema},
  output: {schema: SuggestAlternativeDatesOutputSchema},
  prompt: `You are an event planning assistant for pony clubs. Your goal is to suggest alternative dates for events, minimizing conflicts with similar events in the same geographical area.

The user is requesting a date for an event, and you have a list of other events within a 100km radius.

Event Date: {{{eventDate}}}
Event Type: {{{eventType}}}
Event Location: {{{eventLocation}}}

Other Events:
{{#each otherEvents}}
- Date: {{{date}}}, Type: {{{type}}}, Location: {{{location}}}
{{/each}}

Based on this information, suggest 3 alternative dates that avoid conflicts with the other events. Explain your reasoning for each suggested date. Return the dates in YYYY-MM-DD format.
`,  
});

const suggestAlternativeDatesFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeDatesFlow',
    inputSchema: SuggestAlternativeDatesInputSchema,
    outputSchema: SuggestAlternativeDatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
