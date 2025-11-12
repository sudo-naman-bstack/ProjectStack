
'use server'

import { categorizeSummarizeAndExtractActionItems } from '@/ai/flows/categorize-summarize-and-extract-action-items'
import { chatWithProject as chatWithProjectFlow } from '@/ai/flows/chat-with-project'
import { summarizeProject } from '@/ai/flows/summarize-project'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function ingestData(prevState: any, formData: FormData) {
  const schema = z.object({
    text: z.string().min(1, 'Please paste some text.'),
    isNewProject: z.string().transform(value => value === 'true'),
  })

  const validatedFields = schema.safeParse({
    text: formData.get('text'),
    isNewProject: formData.get('isNewProject'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const supabase = createServerClient()
  const { text, isNewProject } = validatedFields.data

  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, summary');

    if (projectsError) throw new Error(projectsError.message)
    
    const aiResult = await categorizeSummarizeAndExtractActionItems({
      text,
      existingProjects: projects || [],
      newProject: isNewProject,
    })

    if (!aiResult.projectName) {
      throw new Error('AI could not determine a project name.')
    }
    
    if (aiResult.suggestion && !isNewProject) {
        return { message: aiResult.suggestion }
    }

    let finalProjectId: string | null = null;
    let finalProjectName: string = aiResult.projectName;
    let isExistingProject = false;

    if (isNewProject) {
      const { data: newProject, error: newProjectError } = await supabase
        .from('projects')
        .insert({
          name: aiResult.projectName,
          summary: aiResult.summary,
        })
        .select('id')
        .single()
      
      if (newProjectError || !newProject) throw new Error(newProjectError?.message || 'Could not create project.')
      finalProjectId = newProject.id;
    } else if (aiResult.projectId) {
       finalProjectId = aiResult.projectId;
       const existingProject = projects?.find(p => p.id === finalProjectId);
       if (existingProject) {
         finalProjectName = existingProject.name;
       }
       isExistingProject = true;
    } else {
        const { data: newProject, error: newProjectError } = await supabase
        .from('projects')
        .insert({
          name: aiResult.projectName,
          summary: aiResult.summary,
        })
        .select('id')
        .single()
      
      if (newProjectError || !newProject) throw new Error(newProjectError?.message || 'Could not create project.')
      finalProjectId = newProject.id
    }
    
    if (!finalProjectId) {
      return { success: false, message: 'Could not automatically classify the project. Please try creating a new project.' };
    }

    const { error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .insert({
        project_id: finalProjectId,
        content: text,
        summary: aiResult.summary,
      })

    if (knowledgeError) throw new Error(knowledgeError.message)

    if (aiResult.actionItems && aiResult.actionItems.length > 0) {
      const { error: actionItemsError } = await supabase
        .from('action_items')
        .insert(
          aiResult.actionItems.map((item) => ({
            project_id: finalProjectId,
            title: item,
            status: 'pending',
          }))
        )
      if (actionItemsError) throw new Error(actionItemsError.message)
    }

    if (isExistingProject) {
      const { data: allKnowledge, error: allKnowledgeError } = await supabase
        .from('knowledge_entries')
        .select('content')
        .eq('project_id', finalProjectId);
      
      if (allKnowledgeError) throw new Error(allKnowledgeError.message);

      const allKnowledgeText = allKnowledge.map(e => e.content).join('\n\n---\n\n');
      const { newSummary } = await summarizeProject({ knowledgeEntries: allKnowledgeText });

      if (newSummary) {
        await supabase
          .from('projects')
          .update({ summary: newSummary })
          .eq('id', finalProjectId);
      }
    }

    revalidatePath('/')
    revalidatePath(`/project/${finalProjectId}`)
    
    return { projectId: finalProjectId, success: true, message: `Content added to project: ${finalProjectName}` }
  } catch (error: any) {
    console.error('Error in ingestData action:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}

export async function updateTaskStatus(id: string, status: 'pending' | 'done') {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('action_items')
    .update({ status })
    .eq('id', id)
    .select('project_id')
    .single()

  if (error) {
    console.error('Error updating task:', error)
    return
  }

  if (data?.project_id) {
    revalidatePath(`/project/${data.project_id}`)
  }
}

export async function chatWithProject(projectId: string, query: string): Promise<string> {
    const supabase = createServerClient();

    const { data: knowledgeEntries, error } = await supabase
        .from('knowledge_entries')
        .select('content')
        .eq('project_id', projectId);

    if (error) {
        console.error('Error fetching knowledge:', error);
        return "I'm sorry, I couldn't access the project knowledge.";
    }

    const knowledgeString = knowledgeEntries.map(e => e.content).join('\n\n---\n\n');

    try {
        const { response } = await chatWithProjectFlow({
            projectId,
            query,
            knowledgeEntries: knowledgeString,
        });
        return response;
    } catch (e) {
        console.error('AI chat error:', e);
        return "I'm having trouble thinking right now. Please try again later.";
    }
}

export async function deleteProject(projectId: string) {
  if (!projectId) {
    return { success: false, error: 'Project ID is required.' }
  }
  
  try {
    const supabase = createServerClient()

    const { error: actionItemsError } = await supabase
      .from('action_items')
      .delete()
      .eq('project_id', projectId)

    if (actionItemsError) throw actionItemsError

    const { error: knowledgeError } = await supabase
      .from('knowledge_entries')
      .delete()
      .eq('project_id', projectId)

    if (knowledgeError) throw knowledgeError

    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (projectError) throw projectError

    revalidatePath('/')
    return { success: true, message: 'Project deleted successfully.' }
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return { success: false, error: error.message || 'An unexpected error occurred while deleting the project.' }
  }
}


export async function generatePrd(projectId: string): Promise<{ success: true; url: string } | { success: false; error: string }> {
  const apiKey = process.env.RELEVANCE_API_KEY;
  const agentId = process.env.RELEVANCE_AGENT_ID;

  if (!apiKey || !agentId) {
    return { success: false, error: 'Relevance AI API key or Agent ID is not configured.' };
  }

  const supabase = createServerClient();

  const { data: knowledgeEntries, error: knowledgeError } = await supabase
    .from('knowledge_entries')
    .select('content')
    .eq('project_id', projectId);
  
  if (knowledgeError) {
    console.error('Error fetching knowledge for PRD generation:', knowledgeError);
    return { success: false, error: 'Could not fetch project context.' };
  }

  if (!knowledgeEntries || knowledgeEntries.length === 0) {
    return { success: false, error: 'No knowledge entries found for this project to generate a PRD.' };
  }

  const projectContext = knowledgeEntries.map(e => e.content).join('\n\n');

  try {
    const response = await fetch('https://api-bcbe5a.stack.tryrelevance.com/latest/agents/trigger', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey
      },
      body: JSON.stringify({
        "message": {
          "role": "user",
          "content": projectContext
        },
        "agent_id": agentId
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Relevance AI API Error:', errorBody);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    
    if (!responseData.conversation_id || !responseData.agent_id) {
      console.error('Missing conversation_id or agent_id in Relevance AI response:', responseData);
      throw new Error('Invalid response from PRD agent.');
    }

    const prdUrl = `https://app.relevanceai.com/agents/bcbe5a/82d7a966-132a-499c-82e9-adc3e95198f2/${responseData.agent_id}/${responseData.conversation_id}`;
    
    const { error: updateError } = await supabase
        .from('projects')
        .update({ prd_url: prdUrl })
        .eq('id', projectId);

    if (updateError) {
        console.error('Error saving PRD URL:', updateError);
        throw new Error('Could not save the generated PRD link.');
    }
    
    revalidatePath(`/project/${projectId}`);

    return { success: true, url: prdUrl };
  } catch (error: any) {
    console.error('Error calling Relevance AI API:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while triggering the PRD agent.' };
  }
}

export async function getUserPreference(key: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('value')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
    console.error('Error fetching preference:', error);
    return null;
  }
  return data?.value ?? null;
}

export async function setUserPreference(key: string, value: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) {
    console.error('Error saving preference:', error);
  }
}
