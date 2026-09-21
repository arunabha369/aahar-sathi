'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { inputShell } from '@/components/ui/Field';
import { ApiError, api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export function DangerZone({ email }: { email: string }) {
  const router = useRouter();
  const toast = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState('');
  const [signingOut, startSignOut] = useTransition();
  const [deleting, startDelete] = useTransition();

  const signOut = () => {
    startSignOut(async () => {
      await api.post('/auth/logout');
      router.push('/login');
      router.refresh();
    });
  };

  const deleteAccount = () => {
    startDelete(async () => {
      try {
        await api.delete('/account');
        dialogRef.current?.close();
        router.push('/');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'We could not delete your account.');
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-4 ring-1 ring-line">
        <div>
          <p className="text-sm font-bold text-ink">Sign out</p>
          <p className="text-sm text-muted">You are signed in as {email}.</p>
        </div>
        <Button variant="secondary" onClick={signOut} pending={signingOut}>
          <LogOut className="size-4 text-muted" aria-hidden="true" />
          Sign out
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-chilli-50 px-4 py-4 ring-1 ring-inset ring-chilli-200">
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-chilli-100 text-chilli-600">
            <AlertTriangle className="size-[1.125rem]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-chilli-700">Delete account</p>
            <p className="text-sm text-chilli-700/85">
              Removes your profile, every plan and all of your water and weight logs. This cannot be undone.
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          onClick={() => {
            setConfirmation('');
            dialogRef.current?.showModal();
          }}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete account
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line p-0 shadow-[var(--shadow-lg)] backdrop:bg-black/70 open:animate-rise"
      >
        <div className="p-6">
          <span className="grid size-11 place-items-center rounded-xl bg-chilli-50 text-chilli-600">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <h2 id="delete-title" className="mt-4 text-lg font-extrabold text-ink">
            Delete your account?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This permanently removes your profile, all of your plans and every water and weight log. There is
            no way back.
          </p>

          <label htmlFor="delete-confirm" className="mt-5 block text-[0.8125rem] font-semibold text-ink-soft">
            Type <span className="font-mono font-bold text-ink">DELETE</span> to confirm
          </label>
          <input
            id="delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            className={cn(inputShell, 'mt-1.5 border-line focus:border-chilli-500 focus:ring-2 focus:ring-chilli-500/15')}
          />

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteAccount} pending={deleting} disabled={confirmation !== 'DELETE'}>
              Delete for good
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
