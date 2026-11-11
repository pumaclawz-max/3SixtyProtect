'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { signInAction, type LoginState } from '@/app/admin/_actions/auth';

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
      {!pending && <LogIn className="h-4 w-4" />}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <Field label="Email address" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="owner@3sixtyprotect.com"
          required
        />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-32"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls="password"
            className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPassword ? 'Hide' : 'Show'} password
          </button>
        </div>
      </Field>

      <div className="-mt-1 flex justify-end">
        <Link
          href="/admin/forgot-password"
          className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-950 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <SubmitButton />
    </form>
  );
}
