
export interface JiraTicket {
  id: string;
  key: string;
  self: string; // The URL to the issue in the Jira API
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee: {
      displayName: string;
    } | null;
    description: {
      type: string;
      version: number;
      content: any[];
    } | null;
    comment: {
      comments: {
        body: {
          type: string;
          version: number;
          content: any[];
        } | null;
      }[];
    } | null;
  };
}

// Helper to extract text from Atlassian Document Format (ADF)
function adfToString(adf: any): string {
  if (!adf || !adf.content) return "";
  let text = "";
  
  function traverse(node: any) {
    if (node.type === 'text') {
      text += node.text;
    } else if (node.content) {
      node.content.forEach(traverse);
      if (['paragraph', 'heading'].includes(node.type)) {
        text += '\n';
      }
    }
  }
  
  adf.content.forEach(traverse);
  return text.trim();
}

export function formatTicketDetails(ticket: JiraTicket): string {
    const summary = ticket.fields.summary || "No summary.";
    const description = ticket.fields.description ? adfToString(ticket.fields.description) : "No description.";
    
    let commentsText = "No comments.";
    if (ticket.fields.comment && ticket.fields.comment.comments.length > 0) {
        commentsText = ticket.fields.comment.comments
            .map((comment, index) => `Comment ${index + 1}:\n${comment.body ? adfToString(comment.body) : 'Empty comment.'}`)
            .join('\n\n---\n\n');
    }

    return `Title: ${summary}\n\nDescription:\n${description}\n\nComments:\n${commentsText}`;
}
