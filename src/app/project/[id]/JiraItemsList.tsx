
'use client'

import type { LinkedJiraItem } from '@/lib/types'
import { ArrowUpRight, Ticket } from 'lucide-react'
import Link from 'next/link'

export function JiraItemsList({ items }: { items: LinkedJiraItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No Jira tickets have been linked to this project yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          href={item.jira_url}
          key={item.id}
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Ticket className="h-5 w-5 text-muted-foreground" />
               <div>
                 <p className="font-medium">{item.jira_key}: {item.jira_title}</p>
                 <p className="text-sm text-muted-foreground group-hover:text-primary">View on Jira</p>
               </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform-gpu group-hover:-translate-y-1 group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  )
}
