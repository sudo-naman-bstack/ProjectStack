'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { deleteProject } from './actions'
import { useToast } from '@/hooks/use-toast'

export function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(projectId)
      if (result.success) {
        toast({
          title: 'Project Deleted',
          description: `The project "${projectName}" has been successfully deleted.`,
        })
        setOpen(false)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Deleting Project',
          description: result.error,
        })
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete project</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            project <span className="font-bold">{projectName}</span> and all of its associated data, including knowledge entries and action items.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
