'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { requestPasswordResetAction, type ResetState } from '@/app/admin/_actions/auth';

const initialState: ResetState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      <Send className="h-4 w-4" />
      {pending ? 'Sending…' : 'Send reset link'}
    </Button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <p className="flex items-start gap-3 border border-ink-950 px-4 py-4 text-sm text-ink-800" role="status">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-900" />
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <Field
        label="Email address"
        htmlFor="email"
        required
        hint="We will email a link that lets you choose a new password."
      >
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>

      <SubmitButton />
    </form>
  );
}
