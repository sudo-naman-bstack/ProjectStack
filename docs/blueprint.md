# **App Name**: ProjectWise

## Core Features:

- Text Ingestion: Textarea to paste meeting notes or chat threads to send to /api/ingest.
- AI Content Analysis: Use Gemini 2.5 Flash to detect or suggest a project name and generate a summary with action items, based on pasted text.
- Project Creation and Knowledge Storage: Check if a project exists; create if necessary. Store raw text and summary in knowledge_entries, action items in action_items (status: pending) within Supabase.
- Dashboard: Display all projects with a one-line summary and the count of pending action items, fetched from Supabase.
- Project Page: Display project name, summary, and list of action items (toggle to mark as done).
- AI Project Chat: Tool to interact with a project by sending user queries along with relevant project context from knowledge_entries to Gemini 2.5 Pro.
- Task Updater: API endpoint to update action item statuses in Supabase.

## Style Guidelines:

- Primary color: A calm blue (#64B5F6), evocative of focus and clarity, for a professional feel.
- Background color: A very light, desaturated blue (#E3F2FD) to maintain a clean, distraction-free interface.
- Accent color: A contrasting orange (#FFB74D) to draw attention to key interactive elements such as the submit button and action item toggles.
- Headline font: 'Space Grotesk' (sans-serif) for headlines, lending a techy and modern touch. Body font: 'Inter' (sans-serif) for the body, which provides excellent readability and a neutral tone for long-form text.
- Code font: 'Source Code Pro' (monospace) for displaying any code snippets that may appear in project knowledge entries or chat.
- Use minimalist, clear icons to represent different project categories or action item statuses.
- Subtle animations when toggling action item statuses or when new chat messages are received, to give positive feedback to user interactions.