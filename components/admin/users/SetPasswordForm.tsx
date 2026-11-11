'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { setUserPasswordAction, type SetPasswordState } from '@/app/admin/_actions/users';

const initialState: SetPasswordState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-9 shrink-0 border border-ink-950 bg-ink-950 px-3 font-mono text-[11px] uppercase tracking-[0.05em] text-white transition-colors hover:bg-background hover:text-ink-950 disabled:opacity-60"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

/** Collapsible "Set password" control for one portal user. */
export function SetPasswordForm({ id, email }: { id: string; email: string }) {
  const [state, formAction] = useActionState(setUserPasswordAction, initialState);
  const [show, setShow] = useState(false);

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 hover:text-ink-950 [&::-webkit-details-marker]:hidden">
        <KeyRound className="h-3.5 w-3.5" />
        Set password
      </summary>
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`pw-${id}`}>
          New password for {email}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <input
              id={`pw-${id}`}
              name="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={10}
              required
              placeholder="New password (10+ characters)"
              className="h-9 w-full border border-ink-400 bg-background pl-3 pr-10 text-sm text-ink-900 placeholder:text-ink-400 focus:border-2 focus:border-ink-950 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-pressed={show}
              aria-label={show ? 'Hide password' : 'Show password'}
              title={show ? 'Hide password' : 'Show password'}
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-ink-500 hover:text-ink-950"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <SaveButton />
        </div>
        {state.error ? (
          <p className="flex items-center gap-1.5 text-xs text-error" role="alert">
            <AlertCircle className="h-3.5 w-3.5" /> {state.error}
          </p>
        ) : state.success ? (
          <p className="flex items-center gap-1.5 text-xs text-ink-700" role="status">
            <CheckCircle2 className="h-3.5 w-3.5" /> {state.success}
          </p>
        ) : null}
      </form>
    </details>
  );
}
