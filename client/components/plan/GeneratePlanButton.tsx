'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import type { PlanResponse } from '@/lib/types';

export function GeneratePlanButton({ label = 'Generate my plan' }: { label?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const generate = () => {
    startTransition(async () => {
      try {
        await api.post<PlanResponse>('/plans');
        router.refresh();
        toast.success('Your new 7-day plan is ready');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not build your plan.');
      }
    });
  };

  return (
    <Button onClick={generate} pending={pending} size="lg">
      <Sparkles className="size-4" aria-hidden="true" />
      {pending ? 'Building your plan…' : label}
    </Button>
  );
}
