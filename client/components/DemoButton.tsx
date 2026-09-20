'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';
import type { UserResponse } from '@/lib/types';

export function DemoButton({ className }: { className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const tryDemo = () => {
    startTransition(async () => {
      try {
        await api.post<UserResponse>('/auth/demo');
        router.push('/dashboard');
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'The demo account is not available right now.',
        );
      }
    });
  };

  return (
    <Button variant="secondary" size="lg" onClick={tryDemo} pending={pending} className={className}>
      <Sparkles className="size-4 text-orange-500" aria-hidden="true" />
      Try the demo
    </Button>
  );
}
