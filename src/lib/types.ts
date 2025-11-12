
export type Project = {
  id: string;
  name: string;
  summary: string | null;
  created_at: string;
  prd_url: string | null;
};

export type KnowledgeEntry = {
  id: string;
  project_id: string;
  content: string;
  summary: string | null;
  created_at: string;
};

export type ActionItem = {
  id: string;
  project_id: string;
  title: string;
  status: 'pending' | 'done';
  created_at: string;
};

export type ProjectWithPendingActions = Project & {
  action_items: { status: string }[];
};

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export type LinkedJiraItem = {
  id: string;
  project_id: string;
  jira_key: string;
  jira_title: string;
  jira_url: string;
  created_at: string;
};
