'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Eye, EyeOff, Send, UserPlus } from 'lucide-react';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { inviteUserAction, type UserFormState } from '@/app/admin/_actions/users';
import { ALL_CAPABILITIES, ROLE_LABELS, type Capability } from '@/lib/permissions';

const initialState: UserFormState = {};

export const CAPABILITY_LABELS: Record<Capability, string> = {
  'screening.view': 'View screening cases',
  'screening.manage': 'Add and edit screening records',
  'screening.review': 'Record screening decisions',
  'screening.evidence': 'Open and upload evidence files',
  'screening.reopen': 'Reopen completed screenings',
};

const ROLE_HELP: Record<string, string> = {
  super_admin: 'Everything, including user management.',
  admin: 'Everything, including user management.',
  vetting_admin: 'Runs screenings: records, evidence, references.',
  vetting_reviewer: 'Records final screening decisions and can reopen cases.',
  manager: 'Sees screening status and progress only.',
  standard: 'Courses and bookings only, unless extra permissions are ticked.',
};

function SubmitButton({ method }: { method: 'password' | 'invite' }) {
  const { pending } = useFormStatus();
  const Icon = method === 'password' ? UserPlus : Send;
  const label = method === 'password' ? 'Add user' : 'Send invitation';
  const pendingLabel = method === 'password' ? 'Adding…' : 'Sending…';
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Icon className="h-4 w-4" />
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function InviteUserForm() {
  const [state, formAction] = useActionState(inviteUserAction, initialState);
  const [method, setMethod] = useState<'password' | 'invite'>('password');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <fieldset>
        <legend className="mb-2 block font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">How they get access</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['password', 'Set a password now', 'You choose the password and share it with them. No email is sent.'],
              ['invite', 'Email an invitation', 'They receive a link to choose their own password (link lasts 24 hours).'],
            ] as const
          ).map(([value, label, help]) => (
            <label
              key={value}
              className="flex cursor-pointer items-start gap-3 border border-ink-300 p-3 transition-colors hover:border-ink-950 has-[:checked]:border-ink-950 has-[:checked]:bg-ink-50"
            >
              <input
                type="radio"
                name="method"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
                className="mt-1 accent-ink-950"
              />
              <span>
                <span className="block text-sm font-medium text-ink-900">{label}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Email address"
          htmlFor="invite-email"
          required
          hint={method === 'password' ? 'They sign in with this email and the password below.' : 'The invitation is sent to this address.'}
        >
          <Input id="invite-email" name="email" type="email" autoComplete="off" required />
        </Field>
        {method === 'password' ? (
          <Field label="Password" htmlFor="invite-password" required hint="At least 10 characters. They can change it later via “Forgot your password?”.">
            <div className="relative">
              <Input
                id="invite-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={10}
                required
                className="pr-32"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 px-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-950"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
        ) : null}
        <Field label="Role" htmlFor="invite-role" required>
          <Select id="invite-role" name="role" defaultValue="standard">
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <details className="group">
        <summary className="cursor-pointer select-none list-none font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 hover:text-ink-900 [&::-webkit-details-marker]:hidden">
          Extra screening permissions (optional)
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ALL_CAPABILITIES.map((cap) => (
            <label key={cap} className="flex items-start gap-3 text-sm text-ink-900">
              <input type="checkbox" name="permissions" value={cap} className="mt-0.5 h-4 w-4 border-ink-400 accent-ink-950" />
              <span>
                {CAPABILITY_LABELS[cap]}
                <span className="block font-mono text-[10px] text-ink-500">{cap}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Roles already include the right permissions; tick these only to give a standard user or manager specific
          screening access on top of their role.
        </p>
      </details>

      <div className="border-t border-ink-200 pt-4">
        <dl className="grid gap-x-6 gap-y-1 text-xs text-ink-600 sm:grid-cols-2">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <div key={key} className="flex gap-2">
              <dt className="shrink-0 font-mono uppercase tracking-[0.05em] text-ink-500">{label}:</dt>
              <dd>{ROLE_HELP[key]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <SubmitButton method={method} />
    </form>
  );
}
