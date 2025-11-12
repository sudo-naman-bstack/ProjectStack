'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BrainCircuit, Loader2, ArrowUpRight } from 'lucide-react';
import { generatePrd } from '@/app/actions';

export function GeneratePrdButton({ projectId, prdUrl }: { projectId: string; prdUrl: string | null }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAction = () => {
    if (prdUrl) {
      window.open(prdUrl, '_blank');
      return;
    }

    startTransition(async () => {
      const result = await generatePrd(projectId);

      if (result.success && result.url) {
        toast({
          title: 'PRD Generation Started',
          description: 'Your agent has been triggered. Opening Relevance AI...',
        });
        window.open(result.url, '_blank');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to start PRD generation.',
        });
      }
    });
  };

  const hasExistingPrd = !!prdUrl;

  return (
    <Button onClick={handleAction} disabled={isPending} variant="outline" className="group">
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : hasExistingPrd ? (
        <ArrowUpRight className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
      ) : (
        <BrainCircuit className="mr-2 h-4 w-4" />
      )}
      {hasExistingPrd ? 'View AI PRD' : 'Generate PRD'}
    </Button>
  );
}
