'use client'

import { useActionState, useEffect, useState } from 'react'
import { ingestData } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send } from 'lucide-react'
import { redirect } from 'next/navigation'

const initialState = {
  message: undefined,
  errors: undefined,
  projectId: undefined,
  success: false,
}

function SubmitButton() {
  const { pending } = useActionState(ingestData, initialState)
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Process & Organize
        </>
      )}
    </Button>
  )
}

export default function AddPage() {
  const [state, formAction] = useActionState(ingestData, initialState)
  const [isNewProject, setIsNewProject] = useState(false);
  const { toast } = useToast()
  
  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.success ? 'default' : 'destructive',
        title: state.success ? 'Success' : 'Suggestion',
        description: state.message,
      })
    }
    if (state.errors?.text) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: state.errors.text[0],
      })
    }
    if (state.success && state.projectId) {
      toast({
        title: 'Success!',
        description: 'Your knowledge has been added.',
      })
      redirect(`/project/${state.projectId}`)
    }
  }, [state, toast])

  const handleCheckedChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      setIsNewProject(checked);
    }
  };

  return (
    <div className="flex justify-center items-start w-full">
      <Card className="w-full max-w-3xl">
        <form action={formAction}>
           <input type="hidden" name="isNewProject" value={String(isNewProject)} />
          <CardHeader>
            <CardTitle className="font-headline">Add Knowledge</CardTitle>
            <CardDescription>
              Paste meeting notes, chat logs, or any text. ProjectStack will
              automatically categorize it, generate a summary, and extract
              action items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              name="text"
              placeholder="Paste your text here..."
              className="min-h-[300px] text-base font-code"
              required
            />
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="new-project-checkbox" checked={isNewProject} onCheckedChange={handleCheckedChange} />
              <Label htmlFor="new-project-checkbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Create a new project for this content
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
