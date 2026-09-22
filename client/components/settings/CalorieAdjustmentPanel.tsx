'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Panel, PanelHeader } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { ApiError, api } from '@/lib/api/client';

/** Shows an accepted weight-trend adjustment and lets the user go back to the calculated target. */
export function CalorieAdjustmentPanel({ adjustment }: { adjustment: number }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const reset = () =>
    startTransition(async () => {
      try {
        await api.delete('/profile/adjustment');
        toast.success('Back to your calculated target, with a new plan');
        router.refresh();
      } catch (caught) {
        toast.error(caught instanceof ApiError ? caught.message : 'We could not reset your target.');
      }
    });

  return (
    <Panel>
      <PanelHeader
        eyebrow="Targets"
        title="Adjusting to your progress"
        icon={<Target className="size-[1.125rem] text-brand-700" aria-hidden="true" />}
        description={
          adjustment === 0
            ? 'When your weight trend stalls (or moves too fast) for two to three weeks, the Progress page suggests a small calorie change. Nothing changes until you say yes.'
            : `Your daily target is ${adjustment > 0 ? 'raised' : 'lowered'} by ${Math.abs(adjustment)} kcal from suggestions you accepted.`
        }
      />
      {adjustment !== 0 ? (
        <Button variant="secondary" onClick={reset} pending={pending}>
          Reset to the calculated target
        </Button>
      ) : null}
    </Panel>
  );
}
