'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Plus, Save, Trash2 } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  addCourseTypeAction,
  deleteCourseTypeAction,
  updateCourseTypeAction,
  type CourseTypeFormState,
} from '@/app/admin/_actions/course-types';
import type { CourseTypeInfo } from '@/lib/types';

const initialState: CourseTypeFormState = {};

function Submit({ label, icon: Icon }: { label: string; icon: typeof Save }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Icon className="h-4 w-4" />
      {pending ? 'Saving…' : label}
    </Button>
  );
}

function ErrorLine({ state }: { state: CourseTypeFormState }) {
  if (!state.error) return null;
  return (
    <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error" role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {state.error}
    </p>
  );
}

export function AddCourseTypeForm() {
  const [state, formAction] = useActionState(addCourseTypeAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <ErrorLine state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="new-label" required hint="Shown in the course form and booking form, e.g. “SIA Security Guarding”.">
          <Input id="new-label" name="label" required autoComplete="off" />
        </Field>
        <Field label="Short name" htmlFor="new-short" required hint="Shown on badges and calendar filters, e.g. “Security Guarding”.">
          <Input id="new-short" name="short_label" required autoComplete="off" />
        </Field>
      </div>
      <Submit label="Add course type" icon={Plus} />
    </form>
  );
}

export function EditCourseTypeForm({
  type,
  courseCount,
  builtIn,
}: {
  type: CourseTypeInfo;
  courseCount: number;
  builtIn: boolean;
}) {
  const [state, formAction] = useActionState(updateCourseTypeAction, initialState);
  const canDelete = !builtIn && courseCount === 0;
  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="key" value={type.key} />
        <ErrorLine state={state} />
        <div className="grid gap-4 sm:grid-cols-[2fr_1.4fr_6rem]">
          <Field label="Full name" htmlFor={`label-${type.key}`} required>
            <Input id={`label-${type.key}`} name="label" defaultValue={type.label} required autoComplete="off" />
          </Field>
          <Field label="Short name" htmlFor={`short-${type.key}`} required>
            <Input id={`short-${type.key}`} name="short_label" defaultValue={type.short_label} required autoComplete="off" />
          </Field>
          <Field label="Order" htmlFor={`sort-${type.key}`}>
            <Input id={`sort-${type.key}`} name="sort_order" type="number" min={0} step={10} defaultValue={type.sort_order} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Submit label="Save" icon={Save} />
        </div>
      </form>
      <form
        action={deleteCourseTypeAction}
        onSubmit={(e) => {
          if (!confirm(`Delete the course type “${type.label}”?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="key" value={type.key} />
        <button
          type="submit"
          disabled={!canDelete}
          title={
            builtIn
              ? 'Built-in type: it has its own page on the website, so it can be renamed but not deleted'
              : courseCount > 0
                ? 'Move or delete the courses using this type first'
                : 'Delete this course type'
          }
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </form>
    </div>
  );
}
