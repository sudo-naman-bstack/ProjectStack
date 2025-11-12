import { createServerClient } from "@/lib/supabase";
import type { ProjectWithPendingActions } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ListTodo, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteProjectButton } from "./DeleteProjectButton";

export const revalidate = 0; // Revalidate on every request

export default async function Dashboard() {
  const supabase = createServerClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*, action_items(status)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return (
      <div className="text-center text-destructive">
        Error loading projects.
      </div>
    );
  }

  const processedProjects = projects.map((p: ProjectWithPendingActions) => ({
    ...p,
    pending_actions_count: p.action_items.filter(
      (item) => item.status === "pending"
    ).length,
    knowledge_count: p.action_items.length, // This is incorrect, but we don't have knowledge count
  }));

  if (processedProjects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-2xl font-bold tracking-tight font-headline">
            You have no projects
          </h3>
          <p className="text-sm text-muted-foreground">
            Get started by pasting notes to create your first project.
          </p>
          <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Knowledge
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {processedProjects.map((project) => (
        <Card
          key={project.id}
          className="flex flex-col hover:shadow-lg transition-shadow duration-300 relative"
        >
          <div className="absolute top-2 right-2">
            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </div>
          <CardHeader>
            <CardTitle className="font-headline text-xl leading-tight pr-8">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {project.summary || "No summary available."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <ListTodo className="mr-2 h-4 w-4" />
                <span>Pending Actions</span>
              </div>
              <Badge
                variant={
                  project.pending_actions_count > 0 ? "destructive" : "secondary"
                }
                className="font-bold"
              >
                {project.pending_actions_count}
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/project/${project.id}`}>
                Open Project <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
