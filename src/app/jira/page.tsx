
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle, PlusCircle, BrainCircuit } from 'lucide-react';
import type { JiraTicket } from '@/lib/jira-types';
import { Badge } from '@/components/ui/badge';
import { getUserPreference, setUserPreference } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const JQL_PREFERENCE_KEY = 'last_jql_query';

export default function JiraPage() {
  const [jql, setJql] = useState('');
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [linkedKeys, setLinkedKeys] = useState(new Set<string>());
  const [isIngesting, startIngestTransition] = useTransition();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLinkedKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/jira/check-links');
      if (!response.ok) return;
      const keys = await response.json();
      setLinkedKeys(new Set(keys));
    } catch (err) {
      console.error("Failed to fetch linked keys", err);
    }
  }, []);

  const searchJira = useCallback(async (currentJql: string) => {
    if (!currentJql) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    setError(null);
    setTickets([]);

    try {
      await setUserPreference(JQL_PREFERENCE_KEY, currentJql);

      const response = await fetch('/api/jira/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jql: currentJql }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        let errorMessage = responseData.error || 'Failed to fetch tickets.';
        if (responseData.details && responseData.details.errorMessages) {
          errorMessage += ` Details: ${responseData.details.errorMessages.join(', ')}`;
        }
        throw new Error(errorMessage);
      }

      setTickets(responseData.issues);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleIngest = async (issueKey: string, createNewProject: boolean) => {
    setLoadingKey(issueKey);
    startIngestTransition(async () => {
      try {
        const response = await fetch('/api/jira/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issueKey, createNewProject }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Failed to link ticket.');
        }

        toast({
          title: 'Success!',
          description: `Ticket ${issueKey} linked successfully.`,
        });
        setLinkedKeys(prev => new Set(prev).add(issueKey));

      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Error Linking Ticket',
          description: err.message,
        });
      } finally {
        setLoadingKey(null);
      }
    });
  };

  useEffect(() => {
    async function loadInitialData() {
      const savedJql = await getUserPreference(JQL_PREFERENCE_KEY);
      const initialJql = savedJql || 'assignee = currentUser() AND status = "In Progress" ORDER BY updated DESC';
      setJql(initialJql);
      await Promise.all([
        searchJira(initialJql),
        fetchLinkedKeys()
      ]);
    }
    loadInitialData();
  }, [searchJira, fetchLinkedKeys]);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    searchJira(jql);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Jira Items</CardTitle>
          <CardDescription>
            Enter a JQL query to search for your Jira tickets. Your last query is saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="text"
              value={jql}
              onChange={(e) => setJql(e.target.value)}
              placeholder="e.g., assignee = currentUser()"
              className="font-code"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || isIngesting}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading && (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}
        {error && (
            <Card className="bg-destructive/10 border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error</CardTitle>
                    <CardDescription className="text-destructive/80">{error}</CardDescription>
                </CardHeader>
            </Card>
        )}
        {tickets.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {tickets.map((ticket) => {
              const isLinked = linkedKeys.has(ticket.key);
              const isCurrentlyLoading = loadingKey === ticket.key;
              const jiraInstanceUrl = process.env.NEXT_PUBLIC_JIRA_HOST_URL || '';
              const ticketUrl = jiraInstanceUrl ? `${jiraInstanceUrl}/browse/${ticket.key}` : '#';

              return (
              <Card key={ticket.id} className="flex flex-col">
                <CardHeader>
                   <div className="flex justify-between items-start">
                     <Link href={ticketUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-muted-foreground hover:text-primary pr-4">{ticket.key}</Link>
                     <Badge variant={isLinked ? "secondary" : "outline"} className={isLinked ? 'text-green-600 border-green-600/50' : ''}>
                        {isLinked && <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                        {isLinked ? 'Linked' : 'Not Linked'}
                     </Badge>
                   </div>
                   <CardTitle className="text-base pt-1">{ticket.fields.summary}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                   <Badge variant="secondary">{ticket.fields.status.name}</Badge>
                </CardContent>
                <CardFooter className="bg-muted/50 p-3 flex justify-end gap-2">
                    {isLinked ? (
                       <p className="text-sm text-muted-foreground mr-auto italic">This ticket has been processed.</p>
                    ) : (
                      <>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleIngest(ticket.key, false)}
                            disabled={isIngesting || isLoading}
                        >
                            {isCurrentlyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <BrainCircuit className="mr-2 h-4 w-4"/>}
                            Process & Organize
                        </Button>
                        <Button 
                            size="sm"
                            onClick={() => handleIngest(ticket.key, true)}
                            disabled={isIngesting || isLoading}
                            className="bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                           {isCurrentlyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                           Create New Project
                        </Button>
                      </>
                    )}
                </CardFooter>
              </Card>
            )})}
          </div>
        )}
         {!isLoading && !error && tickets.length === 0 && jql && (
            <div className="text-center text-muted-foreground py-10">
                <p>No tickets found for your query.</p>
            </div>
        )}
      </div>
    </div>
  );
}
