'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import type { Message } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, User, Loader2, SendHorizonal } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { chatWithProject } from '@/app/actions'

export function Chat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isPending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    startTransition(async () => {
      const assistantResponse = await chatWithProject(projectId, input)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
      }
      setMessages((prev) => [...prev, assistantMessage])
    })
  }

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Bot /> Chat with Project
        </CardTitle>
        <CardDescription>
          Ask questions about this project's knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-6 pr-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    Start the conversation!
                </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md rounded-lg p-3 text-sm animate-in fade-in-0 zoom-in-95',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User size={20} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isPending && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
