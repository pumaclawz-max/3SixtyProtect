'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { updatePasswordAction, type ResetState } from '@/app/admin/_actions/auth';

const initialState: ResetState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      <KeyRound className="h-4 w-4" />
      {pending ? 'Saving…' : 'Set new password'}
    </Button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);
  const [show, setShow] = useState(false);
  const type = show ? 'text' : 'password';

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <Field label="New password" htmlFor="password" required hint="At least 10 characters.">
        <div className="relative">
          <Input id="password" name="password" type={type} autoComplete="new-password" minLength={10} required className="pr-32" />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-pressed={show}
            className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {show ? 'Hide' : 'Show'} password
          </button>
        </div>
      </Field>

      <Field label="Confirm new password" htmlFor="confirm" required>
        <Input id="confirm" name="confirm" type={type} autoComplete="new-password" minLength={10} required />
      </Field>

      <SubmitButton />
    </form>
  );
}
