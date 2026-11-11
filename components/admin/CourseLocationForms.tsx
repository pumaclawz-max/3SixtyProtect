'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Plus, Save, Trash2 } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  addCourseLocationAction,
  deleteCourseLocationAction,
  updateCourseLocationAction,
  type CourseLocationFormState,
} from '@/app/admin/_actions/course-locations';
import type { CourseLocation } from '@/lib/types';

const initialState: CourseLocationFormState = {};

function Submit({ label, icon: Icon }: { label: string; icon: typeof Save }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Icon className="h-4 w-4" />
      {pending ? 'Saving…' : label}
    </Button>
  );
}

function ErrorLine({ state }: { state: CourseLocationFormState }) {
  if (!state.error) return null;
  return (
    <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error" role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {state.error}
    </p>
  );
}

export function AddCourseLocationForm() {
  const [state, formAction] = useActionState(addCourseLocationAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <ErrorLine state={state} />
      <Field label="Location" htmlFor="new-location" required hint="Shown in the course form, calendar and booking form, e.g. “London, E14”.">
        <Input id="new-location" name="name" required autoComplete="off" />
      </Field>
      <Submit label="Add location" icon={Plus} />
    </form>
  );
}

export function EditCourseLocationForm({ location, courseCount }: { location: CourseLocation; courseCount: number }) {
  const [state, formAction] = useActionState(updateCourseLocationAction, initialState);
  return (
    <div className="space-y-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={location.id} />
        <ErrorLine state={state} />
        <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
          <Field label="Location" htmlFor={`name-${location.id}`} required>
            <Input id={`name-${location.id}`} name="name" defaultValue={location.name} required autoComplete="off" />
          </Field>
          <Field label="Order" htmlFor={`sort-${location.id}`}>
            <Input id={`sort-${location.id}`} name="sort_order" type="number" min={0} step={10} defaultValue={location.sort_order} />
          </Field>
        </div>
        <Submit label="Save" icon={Save} />
      </form>
      <form
        action={deleteCourseLocationAction}
        onSubmit={(e) => {
          const note = courseCount > 0 ? ` ${courseCount} course${courseCount === 1 ? '' : 's'} will keep it as their location.` : '';
          if (!confirm(`Remove “${location.name}” from the location menu?${note}`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={location.id} />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-error"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </form>
    </div>
  );
}
