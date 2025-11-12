'use client'

import { useTransition } from 'react'
import type { ActionItem } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { updateTaskStatus } from '@/app/actions'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

function Task({ item }: { item: ActionItem }) {
  const [isPending, startTransition] = useTransition()

  const handleCheckedChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      startTransition(async () => {
        try {
          await updateTaskStatus(item.id, checked ? 'done' : 'pending')
          toast({
            title: `Task marked as ${checked ? 'done' : 'pending'}.`,
          })
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error updating task.',
          })
        }
      })
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-md transition-colors',
        item.status === 'done' && 'bg-muted/50'
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Checkbox
          id={item.id}
          checked={item.status === 'done'}
          onCheckedChange={handleCheckedChange}
        />
      )}
      <Label
        htmlFor={item.id}
        className={cn(
          'flex-1 text-sm font-medium transition-colors',
          item.status === 'done' && 'line-through text-muted-foreground'
        )}
      >
        {item.title}
      </Label>
    </div>
  )
}

export function ActionItemsList({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No action items found for this project.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Task key={item.id} item={item} />
      ))}
    </div>
  )
}
