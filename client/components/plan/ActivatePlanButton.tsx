'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';

export function ActivatePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const activate = () => {
    startTransition(async () => {
      try {
        await api.post(`/plans/${planId}/activate`);
        router.push('/dashboard');
        router.refresh();
        toast.success('This plan is active again');
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not activate that plan.');
      }
    });
  };

  return (
    <Button onClick={activate} pending={pending} className="no-print">
      <CheckCircle2 className="size-4" aria-hidden="true" />
      Make this active
    </Button>
  );
}
