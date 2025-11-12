
import { ingestData } from '@/app/actions';
import { createServerClient } from '@/lib/supabase';
import { formatTicketDetails, type JiraTicket } from '@/lib/jira-types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { issueKey, createNewProject } = await request.json();

  if (!issueKey) {
    return NextResponse.json({ error: 'Jira issue key is required.' }, { status: 400 });
  }

  const { JIRA_HOST_URL, JIRA_USER_EMAIL, JIRA_API_KEY } = process.env;
  if (!JIRA_HOST_URL || !JIRA_USER_EMAIL || !JIRA_API_KEY) {
    return NextResponse.json({ error: 'Jira environment variables are not configured.' }, { status: 500 });
  }

  try {
    // 1. Get Full Ticket Details from Jira
    const authToken = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    const url = `${JIRA_HOST_URL}/rest/api/3/issue/${issueKey}?fields=summary,description,comment,self`;
    
    const jiraResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json'
      }
    });

    if (!jiraResponse.ok) {
      const errorData = await jiraResponse.text();
      console.error('Jira API Error:', errorData);
      throw new Error(`Failed to fetch Jira ticket details: ${jiraResponse.statusText}`);
    }

    const ticket: JiraTicket = await jiraResponse.json();

    // 2. Format Text
    const fullText = formatTicketDetails(ticket);
    
    // 3. Ingest to ProjectStack
    const formData = new FormData();
    formData.append('text', fullText);
    formData.append('isNewProject', String(createNewProject));

    // We pass null for prevState because this API isn't using useActionState
    const ingestResult = await ingestData(null, formData);
    
    if (!ingestResult.success || !ingestResult.projectId) {
      throw new Error(ingestResult.message || 'Failed to process and ingest Jira ticket content.');
    }

    // 4. Save the Link
    const supabase = createServerClient();
    const { error: linkError } = await supabase
      .from('linked_jira_items')
      .insert({
        project_id: ingestResult.projectId,
        jira_key: ticket.key,
        jira_title: ticket.fields.summary,
        jira_url: ticket.self.replace(/\/rest\/api\/3\/issue\/\d+$/, `/browse/${ticket.key}`),
      });

    if (linkError) {
      console.error('Error linking Jira item:', linkError);
      throw new Error('Failed to save the link between Jira and ProjectStack.');
    }

    // 5. Respond
    return NextResponse.json({ success: true, message: 'Ticket linked successfully.' });

  } catch (error: any) {
    console.error('Error in Jira ingest process:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
