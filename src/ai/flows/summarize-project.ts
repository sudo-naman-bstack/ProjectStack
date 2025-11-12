'use server';

/**
 * @fileOverview A Genkit flow to summarize all knowledge entries for a project.
 *
 * - summarizeProject - The main function that triggers the flow.
 * - SummarizeProjectInput - The input type for the main function.
 * - SummarizeProjectOutput - The output type for the main function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProjectInputSchema = z.object({
  knowledgeEntries: z.string().describe('A concatenated string of all knowledge entries for a project.'),
});
export type SummarizeProjectInput = z.infer<typeof SummarizeProjectInputSchema>;

const SummarizeProjectOutputSchema = z.object({
  newSummary: z.string().describe('A new, consolidated one-line summary for the entire project.'),
});
export type SummarizeProjectOutput = z.infer<typeof SummarizeProjectOutputSchema>;

export async function summarizeProject(input: SummarizeProjectInput): Promise<SummarizeProjectOutput> {
  return summarizeProjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProjectPrompt',
  input: {schema: SummarizeProjectInputSchema},
  output: {schema: SummarizeProjectOutputSchema},
  prompt: `You are an expert at synthesizing information. Below is a collection of all notes and documents for a project.
Your task is to read all of it and generate a single, concise, one-line summary that accurately represents the current state and core purpose of the entire project.

Project Knowledge:
{{{knowledgeEntries}}}
`,
});

const summarizeProjectFlow = ai.defineFlow(
  {
    name: 'summarizeProjectFlow',
    inputSchema: SummarizeProjectInputSchema,
    outputSchema: SummarizeProjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
