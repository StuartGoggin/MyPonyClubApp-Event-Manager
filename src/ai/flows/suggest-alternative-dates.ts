
'use server';

/**
 * @fileOverview A flow to suggest alternative dates for a pony club event based on potential conflicts with similar events in close proximity.
 *
 * - suggestAlternativeDates - A function that takes event details and proximity information to suggest alternative dates.
 * - SuggestAlternativeDatesInput - The input type for the suggestAlternativedates function.
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
      distance: z.number().describe('The distance in kilometers from the requested event location. A distance of 0 means it is another date preference for the same event.')
    })
  ).describe('A list of other events happening on or around the same date, including other date preferences for this same event request.'),
});
export type SuggestAlternativeDatesInput = z.infer<typeof SuggestAlternativeDatesInputSchema>;

const SuggestAlternativeDatesOutputSchema = z.object({
  conflictAnalysis: z
    .string()
    .describe(
      'A natural language analysis of potential conflicts with the other events provided. If there are no conflicts, state that clearly. Otherwise, describe the conflicts.'
    ),
  suggestedDates: z.array(
    z.string().describe('A list of suggested alternative dates (YYYY-MM-DD).')
  ).describe('A list of 3 suggested alternative dates to avoid conflicts.'),
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
  prompt: `You are an expert event planning assistant for pony clubs. Your goal is to analyze potential date conflicts and suggest alternatives to maximize participation.

The user is requesting a date for an event, and you have a list of other events happening on or around the same time. This list also includes other dates the user is considering for this same event (marked with a distance of 0). Treat any nearby event (within ~100km) as a potential conflict, regardless of its type. For example, a dressage event can conflict with a show jumping event because they draw from the same pool of riders and volunteers. The distance to the other event is a key factor.

Analyze the requested event against the list of other events. 
- Requested Date: {{{eventDate}}}
- Event Type: {{{eventType}}}
- Event Location: {{{eventLocation}}}

Other Nearby Events & Date Preferences:
{{#if otherEvents}}
{{#each otherEvents}}
- Date: {{{date}}}, Type: {{{type}}}, Location: {{{location}}}, {{#if distance}}Distance: ~{{{distance}}}km away{{else}}This is another date preference{{/if}}
{{/each}}
{{else}}
None
{{/if}}

First, provide a "conflictAnalysis". This should be a friendly, natural language summary. If there are no conflicts, say something like "This date looks clear! There are no other major events happening around this time within a 100km radius." If there are conflicts, describe them clearly, mentioning the distance (e.g., "The Barwon Zone Rally is on the same day and is only 25km away," or "The Spring Show Jumping is the next day and is 80km away, which might affect attendance."). Be sure to mention if the conflict is with another of the user's preferred dates.

Second, based on your analysis, suggest 3 alternative dates in YYYY-MM-DD format that avoid all identified conflicts (including the user's other preferences). Prioritize weekend dates if possible.

Finally, provide a brief "reasoning" for your suggestions, explaining why they are good alternatives.
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
