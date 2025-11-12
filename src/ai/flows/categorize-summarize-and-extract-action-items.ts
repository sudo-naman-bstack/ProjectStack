'use server';

/**
 * @fileOverview This file defines a Genkit flow for categorizing, summarizing, and extracting action items from pasted text.
 *
 * The flow uses the Gemini model to analyze the input text and extract relevant information.
 *
 * - categorizeSummarizeAndExtractActionItems - The main function that triggers the flow.
 * - CategorizeSummarizeAndExtractActionItemsInput - The input type for the main function.
 * - CategorizeSummarizeAndExtractActionItemsOutput - The output type for the main function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeSummarizeAndExtractActionItemsInputSchema = z.object({
  text: z.string().describe('The text content from which to extract project name, summary, and action items.'),
  existingProjects: z.array(z.object({id: z.string(), name: z.string(), summary: z.string().nullable()})).optional().describe('A list of existing projects to classify against.'),
  newProject: z.boolean().describe('A flag to indicate if a new project should be created.'),
});
export type CategorizeSummarizeAndExtractActionItemsInput = z.infer<typeof CategorizeSummarizeAndExtractActionItemsInputSchema>;

const CategorizeSummarizeAndExtractActionItemsOutputSchema = z.object({
  projectName: z.string().describe('The most likely project name based on the context. If creating a new project, this will be the generated name for it. If classifying, this is the name of the matched existing project.'),
  projectId: z.string().nullable().describe('The ID of the matched existing project. If a new project is being created or no match is found, this will be null.'),
  summary: z.string().describe('A one-line summary of the input text.'),
  actionItems: z.array(z.string()).describe('A list of action items assigned to the user.'),
  suggestion: z.string().optional().describe('A gentle suggestion to the user if no close project match is found.'),
});
export type CategorizeSummarizeAndExtractActionItemsOutput = z.infer<typeof CategorizeSummarizeAndExtractActionItemsOutputSchema>;

export async function categorizeSummarizeAndExtractActionItems(
  input: CategorizeSummarizeAndExtractActionItemsInput
): Promise<CategorizeSummarizeAndExtractActionItemsOutput> {
  return categorizeSummarizeAndExtractActionItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeSummarizeAndExtractActionItemsPrompt',
  input: {schema: CategorizeSummarizeAndExtractActionItemsInputSchema},
  output: {schema: CategorizeSummarizeAndExtractActionItemsOutputSchema},
  prompt: `You are an intelligent assistant helping a Product Manager organize project-related content. Your task is to process a piece of text and determine which project it belongs to, generate a summary, and extract action items.

Follow these rules:

1.  **Review the user's intent:**
    - If \`newProject\` is \`true\`, you MUST treat the input as the start of a new project.
    - If \`newProject\` is \`false\`, you MUST attempt to classify the text into one of the \`existingProjects\`.

2.  **If creating a new project (\`newProject: true\`):**
    - Generate a clear and concise project name based on the input text.
    - Set \`projectName\` to this new name.
    - Set \`projectId\` to \`null\`. Do not try to match it with any existing project. You must not return a projectId.

3.  **If classifying into an existing project (\`newProject: false\`):**
    - Analyze the \`text\` and compare its meaning and context with the \`name\` and \`summary\` of each project in \`existingProjects\`.
    - Find the best thematic and semantic match. Be conservative; prefer attaching content to an existing project if it aligns thematically.
    - If a strong match is found:
        - Set \`projectName\` to the name of the matched project.
        - Set \`projectId\` to the ID of that matched project.
    - If NO strong match is found:
        - Set \`projectName\` to a generated name for a *potential* new project.
        - Set \`projectId\` to \`null\`.
        - Set the \`suggestion\` field with a gentle message, like: "This seems like it could be a new project. Would you like to create '[Generated Project Name]'?"

4.  **For ALL cases:**
    - Generate a short, factual, one-line summary of the input \`text\`.
    - Extract any concise, direct action items or reminders for the user from the \`text\`.

**Existing Projects:**
{{#if existingProjects}}
  {{#each existingProjects}}
- ID: {{this.id}}, Name: {{this.name}}, Summary: {{this.summary}}
  {{/each}}
{{else}}
- None
{{/if}}

**Input Text:**
{{{text}}}
`,
});

const categorizeSummarizeAndExtractActionItemsFlow = ai.defineFlow(
  {
    name: 'categorizeSummarizeAndExtractActionItemsFlow',
    inputSchema: CategorizeSummarizeAndExtractActionItemsInputSchema,
    outputSchema: CategorizeSummarizeAndExtractActionItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    // If user wants a new project, ensure the projectId is null.
    if (input.newProject) {
        output!.projectId = null;
    } else if (output?.projectId) {
      // Otherwise, if a project ID is returned, ensure the project name matches.
      const matchedProject = input.existingProjects?.find(p => p.id === output.projectId);
      if (matchedProject) {
        output.projectName = matchedProject.name;
      }
    }

    return output!;
  }
);
