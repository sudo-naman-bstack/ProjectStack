
import { createServerClient } from "@/lib/supabase"
import { notFound } from "next/navigation"
import { ActionItemsList } from "./ActionItemsList"
import { Chat } from "./Chat"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ListChecks, Ticket } from "lucide-react"
import { GeneratePrdButton } from "./GeneratePrdButton"
import { JiraItemsList } from "./JiraItemsList"

export const revalidate = 0; // Revalidate on every request

async function getProjectData(id: string) {
    const supabase = createServerClient()
    const projectPromise = supabase.from("projects").select("*").eq("id", id).single();
    const actionItemsPromise = supabase.from("action_items").select("*").eq("project_id", id).order("created_at", { ascending: true });
    const knowledgeEntriesPromise = supabase.from("knowledge_entries").select("id, summary, created_at").eq("project_id", id).order("created_at", { ascending: false });
    const jiraItemsPromise = supabase.from("linked_jira_items").select("*").eq("project_id", id).order("created_at", { ascending: false });

    const [
        { data: project, error: projectError },
        { data: actionItems, error: actionItemsError },
        { data: knowledgeEntries, error: knowledgeError },
        { data: jiraItems, error: jiraItemsError }
    ] = await Promise.all([projectPromise, actionItemsPromise, knowledgeEntriesPromise, jiraItemsPromise]);
    
    if (projectError) notFound();
    if (actionItemsError || knowledgeError || jiraItemsError) throw new Error("Failed to fetch project details.");

    return { project, actionItems, knowledgeEntries, jiraItems };
}


export default async function ProjectPage({ params }: { params: { id: string } }) {
    const { project, actionItems, knowledgeEntries, jiraItems } = await getProjectData(params.id);

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                 <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="font-headline text-3xl">{project.name}</CardTitle>
                            <CardDescription>{project.summary}</CardDescription>
                        </div>
                        <div>
                           <GeneratePrdButton projectId={project.id} prdUrl={project.prd_url} />
                        </div>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                           <Ticket /> Linked Jira Items
                        </CardTitle>
                        <CardDescription>Jira tickets associated with this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <JiraItemsList items={jiraItems || []} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                           <ListChecks /> Action Items
                        </CardTitle>
                        <CardDescription>Tasks extracted from your project knowledge.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActionItemsList items={actionItems || []} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                            <FileText /> Knowledge Base
                        </CardTitle>
                        <CardDescription>Summaries of documents and notes added to this project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {knowledgeEntries && knowledgeEntries.length > 0 ? (
                            <ul className="space-y-4">
                                {knowledgeEntries.map(entry => (
                                    <li key={entry.id} className="p-4 border rounded-lg bg-background/50">
                                        <p className="text-sm text-muted-foreground mb-1">Added on {new Date(entry.created_at).toLocaleDateString()}</p>
                                        <p className="font-medium">{entry.summary || "Summary not available."}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No knowledge entries yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                <div className="sticky top-20">
                     <Chat projectId={project.id} />
                </div>
            </div>
        </div>
    )
}
