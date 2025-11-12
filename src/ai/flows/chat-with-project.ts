'use server';

/**
 * @fileOverview Implements the chat with project flow, allowing users to interact with a project using its stored knowledge.
 *
 * - chatWithProject - A function that handles the chat with project process.
 * - ChatWithProjectInput - The input type for the chatWithProject function.
 * - ChatWithProjectOutput - The return type for the chatWithProject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithProjectInputSchema = z.object({
  projectId: z.string().describe('The ID of the project to chat with.'),
  query: z.string().describe('The user query.'),
  knowledgeEntries: z.string().describe('Concatenated string of relevant knowledge entries for the project.'),
});
export type ChatWithProjectInput = z.infer<typeof ChatWithProjectInputSchema>;

const ChatWithProjectOutputSchema = z.object({
  response: z.string().describe('The AI response to the user query.'),
});
export type ChatWithProjectOutput = z.infer<typeof ChatWithProjectOutputSchema>;

export async function chatWithProject(input: ChatWithProjectInput): Promise<ChatWithProjectOutput> {
  return chatWithProjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithProjectPrompt',
  input: {schema: ChatWithProjectInputSchema},
  output: {schema: ChatWithProjectOutputSchema},
  prompt: `You are the AI project assistant.

Use the provided context (meeting notes, documents, and summaries) to answer the user's question clearly and concisely.
Be factual and reference past project updates if relevant.

Context: {{{knowledgeEntries}}}

Question: {{{query}}}`,
});

const chatWithProjectFlow = ai.defineFlow(
  {
    name: 'chatWithProjectFlow',
    inputSchema: ChatWithProjectInputSchema,
    outputSchema: ChatWithProjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
