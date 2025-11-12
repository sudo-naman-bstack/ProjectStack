import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jql } = body;

    if (!jql) {
      return NextResponse.json({ error: 'JQL query is required' }, { status: 400 });
    }

    const { JIRA_HOST_URL, JIRA_USER_EMAIL, JIRA_API_KEY } = process.env;

    if (!JIRA_HOST_URL || !JIRA_USER_EMAIL || !JIRA_API_KEY) {
      return NextResponse.json({ error: 'Jira environment variables are not configured on the server.' }, { status: 500 });
    }

    const authToken = Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_KEY}`).toString('base64');
    const encodedJQL = encodeURIComponent(jql);

    // ✅ Use GET request with query parameters
    const url = `${JIRA_HOST_URL}/rest/api/3/search/jql?jql=${encodedJQL}&fields=summary,description,status,assignee,key&maxResults=50`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Jira API Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from Jira API.', details: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ issues: data.issues });

  } catch (error) {
    console.error('Error in Jira proxy API:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
