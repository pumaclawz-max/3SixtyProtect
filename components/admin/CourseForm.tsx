'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Save, AlertCircle } from 'lucide-react';
import { Field, Input, Textarea, Select } from '@/components/ui/Field';
import { RichTextEditor } from './RichTextEditor';
import { CourseImageUpload } from './CourseImageUpload';
import { Button } from '@/components/ui/Button';
import { COURSE_STATUS_OPTIONS } from '@/lib/constants';
import {
  createCourseAction,
  updateCourseAction,
  type CourseFormState,
} from '@/app/admin/_actions/courses';
import type { Course, CourseLocation, CourseTypeInfo } from '@/lib/types';

const initialState: CourseFormState = { status: 'idle' };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save className="h-4 w-4" />
      {pending ? 'Saving…' : label}
    </Button>
  );
}

export function CourseForm({
  course,
  types,
  locations,
}: {
  course?: Course;
  types: CourseTypeInfo[];
  locations: CourseLocation[];
}) {
  const isEdit = Boolean(course);
  const action = isEdit ? updateCourseAction : createCourseAction;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-8">
      {isEdit ? <input type="hidden" name="id" value={course!.id} /> : null}

      {state.status === 'error' && state.message ? (
        <p className="flex items-start gap-2 border border-error px-4 py-3 text-sm font-medium text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      {/* Details */}
      <section className="border border-ink-950 bg-background p-6">
        <h2 className="font-mono uppercase text-[11px] tracking-[0.05em] text-ink-500">
          Course details
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field
            label="Course title"
            htmlFor="title"
            required
            error={state.errors?.title}
            className="sm:col-span-2"
          >
            <Input
              id="title"
              name="title"
              defaultValue={course?.title}
              placeholder="SIA Door Supervision: Level 2 Award"
              required
            />
          </Field>
          <Field
            label="Course type"
            htmlFor="course_type"
            required
            error={state.errors?.course_type}
          >
            <Select
              id="course_type"
              name="course_type"
              defaultValue={course?.course_type ?? types[0]?.key ?? 'door_supervision'}
              required
            >
              {types.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Link
              href="/admin/courses/types"
              className="mt-1.5 inline-block font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"
            >
              Add or edit course types
            </Link>
          </Field>
          <Field
            label="Status"
            htmlFor="status"
            required
            error={state.errors?.status}
          >
            <Select
              id="status"
              name="status"
              defaultValue={course?.status ?? 'draft'}
              required
            >
              {COURSE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={state.errors?.description}
            className="sm:col-span-2"
          >
            <RichTextEditor
              name="description"
              defaultValue={course?.description ?? ''}
              placeholder="A short summary shown on the website…"
            />
          </Field>
        </div>
      </section>

      {/* Schedule */}
      <section className="border border-ink-950 bg-background p-6">
        <h2 className="font-mono uppercase text-[11px] tracking-[0.05em] text-ink-500">
          Schedule &amp; location
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Start date" htmlFor="start_date" required error={state.errors?.start_date}>
            <Input id="start_date" name="start_date" type="date" defaultValue={course?.start_date} required />
          </Field>
          <Field label="End date" htmlFor="end_date" required error={state.errors?.end_date}>
            <Input id="end_date" name="end_date" type="date" defaultValue={course?.end_date} required />
          </Field>
          <Field label="Start time" htmlFor="start_time" error={state.errors?.start_time}>
            <Input id="start_time" name="start_time" type="time" defaultValue={course?.start_time ?? '09:00'} />
          </Field>
          <Field label="End time" htmlFor="end_time" error={state.errors?.end_time}>
            <Input id="end_time" name="end_time" type="time" defaultValue={course?.end_time ?? '17:00'} />
          </Field>
          <Field
            label="Location"
            htmlFor="location"
            required
            error={state.errors?.location}
            className="sm:col-span-2"
          >
            <Select id="location" name="location" defaultValue={course?.location ?? ''} required>
              <option value="" disabled>
                Choose a location
              </option>
              {/* Keep a course's current location selectable even if it has left the menu */}
              {course?.location && !locations.some((l) => l.name === course.location) ? (
                <option value={course.location}>{course.location}</option>
              ) : null}
              {locations.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </Select>
            <Link
              href="/admin/courses/locations"
              className="mt-1.5 inline-block font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline"
            >
              Add or edit locations
            </Link>
          </Field>
        </div>
      </section>

      {/* Pricing & capacity */}
      <section className="border border-ink-950 bg-background p-6">
        <h2 className="font-mono uppercase text-[11px] tracking-[0.05em] text-ink-500">
          Pricing &amp; capacity
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field label="Price (£)" htmlFor="price" required error={state.errors?.price}>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={course?.price ?? 0}
              required
            />
          </Field>
          <Field label="Maximum spaces" htmlFor="max_spaces" required error={state.errors?.max_spaces}>
            <Input
              id="max_spaces"
              name="max_spaces"
              type="number"
              min="0"
              step="1"
              defaultValue={course?.max_spaces ?? 16}
              required
            />
          </Field>
          <Field
            label="Available spaces"
            htmlFor="available_spaces"
            required
            error={state.errors?.available_spaces}
          >
            <Input
              id="available_spaces"
              name="available_spaces"
              type="number"
              min="0"
              step="1"
              defaultValue={course?.available_spaces ?? 16}
              required
            />
          </Field>
        </div>
        <div className="mt-5">
          <Field
            label="Course image"
            hint="Optional: shown on course cards across the site."
            error={state.errors?.image_url}
          >
            <CourseImageUpload
              currentUrl={course?.image_url}
              error={state.errors?.image_file}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton label={isEdit ? 'Save changes' : 'Create course'} />
        <Link
          href="/admin/courses"
          className="px-5 py-2.5 font-mono uppercase text-[11px] tracking-[0.05em] text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
