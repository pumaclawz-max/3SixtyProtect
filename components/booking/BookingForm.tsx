'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { Field, Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { FixedLines } from '@/components/ui/FixedLines';
import { Badge } from '@/components/ui/Badge';
import { RichText } from '@/components/ui/RichText';
import { createBookingAction, type BookingFormState } from '@/app/(site)/book/actions';
import { courseShortType, courseTypeLabel } from '@/lib/constants';
import {
  formatDateRange,
  formatPrice,
  formatTimeRange,
} from '@/lib/utils';
import type { Course } from '@/lib/types';

const initialState: BookingFormState = { status: 'idle' };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Submitting…' : label}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </Button>
  );
}

export function BookingForm({
  courses,
  initialCourseId,
  paymentEnabled = false,
}: {
  courses: Course[];
  initialCourseId?: string;
  paymentEnabled?: boolean;
}) {
  const [state, formAction] = useActionState(createBookingAction, initialState);
  const today = new Date().toISOString().slice(0, 10);

  // When the action returns a Stripe Checkout URL, send the browser there.
  useEffect(() => {
    if (state.status === 'redirect' && state.url) {
      window.location.href = state.url;
    }
  }, [state]);

  const [selectedId, setSelectedId] = useState(
    initialCourseId && courses.some((c) => c.id === initialCourseId)
      ? initialCourseId
      : '',
  );

  const selected = useMemo(
    () => courses.find((c) => c.id === selectedId) ?? null,
    [courses, selectedId],
  );

  // One <optgroup> per course type, in the type's display order.
  const grouped = useMemo(() => {
    const groups = new Map<string, { label: string; sort: number; courses: Course[] }>();
    for (const c of courses) {
      const g = groups.get(c.course_type) ?? {
        label: c.type_label ?? courseTypeLabel(c.course_type),
        sort: c.type_sort ?? 100,
        courses: [],
      };
      g.courses.push(c);
      groups.set(c.course_type, g);
    }
    return Array.from(groups.entries())
      .map(([key, g]) => ({ key, ...g }))
      .sort((a, b) => a.sort - b.sort || a.label.localeCompare(b.label));
  }, [courses]);

  if (state.status === 'success') {
    return <BookingConfirmation state={state} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Form */}
      <form action={formAction} className="lg:col-span-7">
        <div className="border border-ink-950 bg-background p-6 sm:p-8">
          {/* 1 — choose course */}
          <fieldset>
            <legend className="flex items-baseline gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-400">
              <span>01 /</span>
              <span className="text-ink-900">Choose your course</span>
            </legend>
            <div className="mt-4">
              <Field
                label="Course"
                htmlFor="course_id"
                required
                error={state.errors?.course_id}
              >
                <Select
                  id="course_id"
                  name="course_id"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a course date…
                  </option>
                  {grouped.map((g) => (
                    <optgroup key={g.key} label={g.label}>
                      {g.courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {formatDateRange(c.start_date, c.end_date)}, {c.location}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </Field>
            </div>
          </fieldset>

          <div className="my-7 hairline" />

          {/* 2 — your details */}
          <fieldset>
            <legend className="flex items-baseline gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-400">
              <span>02 /</span>
              <span className="text-ink-900">Your details</span>
            </legend>
            <p className="mt-2 text-sm text-ink-500">
              Use your details exactly as they appear on your ID. They’re needed for your qualification and SIA licence application.
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Full legal name"
                htmlFor="customer_name"
                required
                hint="As shown on your passport or driving licence."
                error={state.errors?.customer_name}
                className="sm:col-span-2"
              >
                <Input id="customer_name" name="customer_name" autoComplete="name" placeholder="Jordan Alex Taylor" required />
              </Field>
              <Field label="Date of birth" htmlFor="date_of_birth" required hint="You must be 18 or over by the course start date." error={state.errors?.date_of_birth}>
                <Input id="date_of_birth" name="date_of_birth" type="date" autoComplete="bday" max={today} required />
              </Field>
              <Field label="Phone number" htmlFor="customer_phone" required error={state.errors?.customer_phone}>
                <Input id="customer_phone" name="customer_phone" type="tel" autoComplete="tel" placeholder="07700 900000" required />
              </Field>
              <Field
                label="Email address"
                htmlFor="customer_email"
                required
                hint="Your receipt and joining instructions are sent here."
                error={state.errors?.customer_email}
                className="sm:col-span-2"
              >
                <Input id="customer_email" name="customer_email" type="email" autoComplete="email" placeholder="you@email.com" required />
              </Field>
            </div>
          </fieldset>

          <div className="my-7 hairline" />

          {/* 3 — address */}
          <fieldset>
            <legend className="flex items-baseline gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-400">
              <span>03 /</span>
              <span className="text-ink-900">Home address</span>
            </legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field label="Address line 1" htmlFor="address_line_1" required error={state.errors?.address_line_1} className="sm:col-span-2">
                <Input id="address_line_1" name="address_line_1" autoComplete="address-line1" required />
              </Field>
              <Field label="Address line 2" htmlFor="address_line_2" error={state.errors?.address_line_2} className="sm:col-span-2">
                <Input id="address_line_2" name="address_line_2" autoComplete="address-line2" />
              </Field>
              <Field label="Town or city" htmlFor="town" required error={state.errors?.town}>
                <Input id="town" name="town" autoComplete="address-level2" required />
              </Field>
              <Field label="Postcode" htmlFor="postcode" required error={state.errors?.postcode}>
                <Input id="postcode" name="postcode" autoComplete="postal-code" className="uppercase" required />
              </Field>
            </div>
          </fieldset>

          <div className="my-7 hairline" />

          {/* 4 — extras */}
          <fieldset>
            <legend className="flex items-baseline gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink-400">
              <span>04 /</span>
              <span className="text-ink-900">Anything else</span>
            </legend>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field label="Emergency contact name" htmlFor="emergency_contact_name" hint="Optional." error={state.errors?.emergency_contact_name}>
                <Input id="emergency_contact_name" name="emergency_contact_name" autoComplete="off" />
              </Field>
              <Field label="Emergency contact phone" htmlFor="emergency_contact_phone" hint="Optional." error={state.errors?.emergency_contact_phone}>
                <Input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" autoComplete="off" />
              </Field>
              <Field
                label="Message or special requirements"
                htmlFor="message"
                hint="Optional: access needs, dietary requirements or questions."
                error={state.errors?.message}
                className="sm:col-span-2"
              >
                <Textarea id="message" name="message" placeholder="Anything we should know before the course…" />
              </Field>
            </div>

            <label htmlFor="confirm" className="mt-6 flex items-start gap-3 text-sm text-ink-800">
              <input id="confirm" name="confirm" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-ink-950" />
              <span>
                I confirm these details are correct and agree to them being used to arrange my training and qualification, as
                described in the{' '}
                <Link href="/privacy-policy" className="font-semibold underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {state.errors?.confirm ? <p className="mt-1.5 text-sm text-error">{state.errors.confirm}</p> : null}
          </fieldset>

          {state.status === 'error' && state.message ? (
            <p className="mt-6 border border-error px-4 py-3 text-sm font-medium text-error">
              {state.message}
            </p>
          ) : null}

          <div className="mt-7">
            <SubmitButton
              label={
                paymentEnabled
                  ? selected
                    ? `Pay ${formatPrice(selected.price)} securely`
                    : 'Continue to secure payment'
                  : 'Confirm booking'
              }
            />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-mono text-[12px] uppercase tracking-[0.05em] text-ink-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              {paymentEnabled
                ? 'You’ll pay the full course fee on Stripe’s secure checkout page.'
                : 'No payment is taken now. We’ll confirm your place by email.'}
            </p>
          </div>
        </div>
      </form>

      {/* Summary */}
      <div className="lg:col-span-5">
        <div className="sticky top-24 space-y-6">
          <div className="border border-ink-950 bg-background">
            <div className="bg-ink-950 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-white">
              Booking summary
            </div>
            <div className="p-6">
              {selected ? (
                <>
                  <Badge tone="gold">
                    {courseShortType(selected)}
                  </Badge>
                  <h3 className="mt-3 font-heading text-xl uppercase tracking-tight text-ink-900">
                    {selected.title}
                  </h3>
                  <dl className="mt-4 space-y-2.5 text-sm text-ink-800">
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="h-4 w-4 text-ink-500" />
                      {formatDateRange(selected.start_date, selected.end_date)}
                    </div>
                    {(selected.start_time || selected.end_time) && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-ink-500" />
                        {formatTimeRange(selected.start_time, selected.end_time)}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-ink-500" />
                      {selected.location}
                    </div>
                  </dl>
                  {selected.description ? (
                    <div className="mt-4 border-t border-ink-200 pt-4 text-sm text-ink-600">
                      <RichText value={selected.description} />
                    </div>
                  ) : null}
                  <div className="mt-5 space-y-3 border-t border-ink-950 pt-4">
                    <div className="flex items-end justify-between">
                      <span className="font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">
                        Course fee
                      </span>
                      <span className="font-heading text-headline-md text-ink-900">
                        {formatPrice(selected.price)}
                      </span>
                    </div>
                    {paymentEnabled && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-600">Total due today</span>
                        <span className="font-semibold text-ink-900">{formatPrice(selected.price)}</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-sm text-ink-500">
                  <ShieldCheck className="mx-auto h-8 w-8 text-ink-400" />
                  <p className="mt-3">
                    Select a course to see the details and fee here.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border border-ink-950 bg-background p-6">
            <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink-900">
              What happens next?
            </h3>
            <ol className="mt-4 space-y-3 text-sm text-ink-800">
              {(paymentEnabled
                ? [
                    'Pay securely by card on Stripe’s checkout page.',
                    'Your place is confirmed and a receipt is emailed to you.',
                    'We send joining instructions and what to bring.',
                  ]
                : [
                    'We receive your booking instantly.',
                    'Our team confirms your place by email.',
                    'You’ll get joining details and what to bring.',
                  ]
              ).map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="font-mono text-ink-400">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingConfirmation({ state }: { state: BookingFormState }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="border border-ink-950 bg-background">
        <div className="bg-ink-950 px-8 py-12 text-center text-white">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-white">
            <CheckCircle2 className="h-9 w-9 text-white" />
          </div>
          <h1 className="mt-5 font-heading text-headline-md uppercase tracking-tight text-white md:text-display-lg">
            <FixedLines lines={['Booking', 'received']} />
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-200">
            Thank you{state.summary ? `, ${state.summary.name.split(' ')[0]}` : ''}.
            Your place is reserved.
          </p>
          {state.reference ? (
            <div className="mt-5 inline-flex items-center gap-2 border border-white/40 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.05em]">
              <span className="text-ink-300">Reference</span>
              <span className="font-semibold text-white">{state.reference}</span>
            </div>
          ) : null}
        </div>

        <div className="p-8">
          {state.summary ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">Course</dt>
                <dd className="text-right font-semibold text-ink-900">
                  {state.summary.courseTitle}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">Name</dt>
                <dd className="font-semibold text-ink-900">{state.summary.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-mono text-[12px] uppercase tracking-[0.05em] text-ink-500">Confirmation to</dt>
                <dd className="font-semibold text-ink-900">{state.summary.email}</dd>
              </div>
            </dl>
          ) : null}

          <div className="mt-6 flex items-start gap-3 border border-ink-950 p-4 text-sm text-ink-800">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" />
            <p>
              We’ve logged your booking and our team will be in touch shortly to
              confirm your place and share joining instructions.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button href="/calendar" variant="outline" className="w-full">
              Browse more courses
            </Button>
            <Button href="/" className="w-full">
              Back to home
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-ink-500">
        Need to change something?{' '}
        <Link href="/contact" className="font-semibold text-ink-900 underline underline-offset-4">
          Contact us
        </Link>
      </p>
    </div>
  );
}
