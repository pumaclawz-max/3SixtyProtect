import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BookingStatusControl } from '@/components/admin/BookingStatusControl';
import { BookingStatusBadge } from '@/components/admin/StatusBadge';
import { getBookingByIdAdmin } from '@/lib/bookings';
import { courseShortType } from '@/lib/constants';
import { PAYMENT_STATUS_META } from '@/lib/payments';
import { withTypeLabels } from '@/lib/course-types';
import { createAdminClient } from '@/lib/supabase/admin';
import { isServiceRoleConfigured } from '@/lib/supabase/config';
import { formatDate, formatDateRange, formatPrice, formatTimeRange } from '@/lib/utils';

export const metadata = { title: 'Booking' };
export const dynamic = 'force-dynamic';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  }).format(d);
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof User; children: ReactNode }) {
  return (
    <section className="border border-ink-950 bg-white">
      <div className="flex items-center gap-2 border-b border-ink-950 px-5 py-4">
        <Icon className="h-4 w-4 text-ink-900" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-ink-900">{children}</dd>
    </div>
  );
}

interface LinkedScreening {
  id: string;
  reference: string;
  status: string;
  progress_percent: number;
}

/** Screening cases started from this booking (if the screening module is set up). */
async function linkedScreenings(bookingId: string): Promise<LinkedScreening[]> {
  if (!isServiceRoleConfigured()) return [];
  try {
    const db = createAdminClient();
    const { data: candidates } = await db.from('screening_candidates').select('id').eq('linked_booking_id', bookingId);
    const ids = (candidates ?? []).map((c) => c.id);
    if (!ids.length) return [];
    const { data } = await db
      .from('screening_cases')
      .select('id, reference, status, progress_percent')
      .in('candidate_id', ids)
      .order('created_at', { ascending: false });
    return (data ?? []) as LinkedScreening[];
  } catch {
    return [];
  }
}

export default async function BookingDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const booking = await getBookingByIdAdmin(params.id);
  if (!booking) notFound();

  const course = booking.course ? (await withTypeLabels([booking.course]))[0] : null;
  const screenings = await linkedScreenings(booking.id);
  const payment = PAYMENT_STATUS_META[booking.payment_status ?? 'unpaid'];
  const paid = booking.amount_paid ?? (booking.payment_status === 'deposit_paid' ? booking.deposit_amount ?? null : null);
  const balance = course ? Math.max(0, course.price - (paid ?? 0)) : null;
  const address = [booking.address_line_1, booking.address_line_2, booking.town, booking.postcode].filter(Boolean);
  const age = (() => {
    if (!booking.date_of_birth) return null;
    const d = new Date(`${booking.date_of_birth}T00:00:00Z`);
    const now = new Date();
    let a = now.getUTCFullYear() - d.getUTCFullYear();
    if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) a -= 1;
    return a;
  })();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 border border-ink-950 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.booking_status} />
            {course ? <Badge tone="gold">{courseShortType(course)}</Badge> : null}
            <Badge tone={payment.tone}>{payment.label}</Badge>
          </div>
          <h1 className="mt-3 font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">
            {booking.customer_name}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">
            {booking.reference ? `Ref ${booking.reference} · ` : ''}Booked {formatDateTime(booking.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">Booking status</span>
          <BookingStatusControl id={booking.id} status={booking.booking_status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Contact details" icon={User}>
          <dl className="divide-y divide-ink-200">
            <Row label="Full legal name">{booking.customer_name}</Row>
            <Row label="Date of birth">
              {booking.date_of_birth ? `${formatDate(booking.date_of_birth, { weekday: undefined })}${age !== null ? ` (age ${age})` : ''}` : '–'}
            </Row>
            <Row label="Home address">
              {address.length ? (
                <span className="whitespace-pre-line">{address.join('\n')}</span>
              ) : (
                '–'
              )}
            </Row>
            <Row label="Email">
              <a href={`mailto:${booking.customer_email}`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                <Mail className="h-4 w-4 text-ink-500" />
                {booking.customer_email}
              </a>
            </Row>
            <Row label="Telephone">
              <a href={`tel:${booking.customer_phone}`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                <Phone className="h-4 w-4 text-ink-500" />
                {booking.customer_phone}
              </a>
            </Row>
            <Row label="Emergency contact">
              {booking.emergency_contact_name || booking.emergency_contact_phone
                ? [booking.emergency_contact_name, booking.emergency_contact_phone].filter(Boolean).join(', ')
                : '–'}
            </Row>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href={`mailto:${booking.customer_email}`} size="sm" variant="outline">
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button href={`tel:${booking.customer_phone}`} size="sm" variant="outline">
              <Phone className="h-4 w-4" /> Call
            </Button>
          </div>
        </Panel>

        <Panel title="Course" icon={CalendarDays}>
          {course ? (
            <dl className="divide-y divide-ink-200">
              <Row label="Course">{course.title}</Row>
              <Row label="Dates">{formatDateRange(course.start_date, course.end_date)}</Row>
              {course.start_time || course.end_time ? (
                <Row label="Times">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-ink-500" />
                    {formatTimeRange(course.start_time, course.end_time)}
                  </span>
                </Row>
              ) : null}
              <Row label="Location">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-ink-500" />
                  {course.location}
                </span>
              </Row>
              <Row label="Spaces left">
                {course.available_spaces} of {course.max_spaces}
              </Row>
              <Row label="Course page">
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link href={`/admin/courses/${course.id}/participants`} className="underline underline-offset-4 hover:text-ink-600">
                    All participants
                  </Link>
                  <Link href={`/admin/courses/${course.id}/edit`} className="underline underline-offset-4 hover:text-ink-600">
                    Edit course
                  </Link>
                </span>
              </Row>
            </dl>
          ) : (
            <p className="text-sm text-ink-500">The course for this booking has been deleted.</p>
          )}
        </Panel>

        <Panel title="Payment" icon={CreditCard}>
          <dl className="divide-y divide-ink-200">
            <Row label="Course fee">{course ? formatPrice(course.price) : '–'}</Row>
            <Row label="Status">{payment.label}</Row>
            <Row label="Amount paid">{paid !== null ? formatPrice(paid) : '–'}</Row>
            {booking.paid_at ? <Row label="Paid on">{formatDateTime(booking.paid_at)}</Row> : null}
            {balance !== null && balance > 0 && paid !== null ? <Row label="Balance due">{formatPrice(balance)}</Row> : null}
            {booking.stripe_session_id ? (
              <Row label="Stripe session">
                <span className="block break-all font-mono text-xs text-ink-600">{booking.stripe_session_id}</span>
              </Row>
            ) : null}
          </dl>
        </Panel>

        <Panel title="Message from the customer" icon={MessageSquare}>
          {booking.message ? (
            <p className="whitespace-pre-line text-sm text-ink-800">{booking.message}</p>
          ) : (
            <p className="text-sm text-ink-500">No message was left with this booking.</p>
          )}
        </Panel>
      </div>

      <Panel title="Vetting & screening" icon={ShieldCheck}>
        {screenings.length ? (
          <ul className="divide-y divide-ink-200">
            {screenings.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <Link href={`/admin/vetting/${s.id}`} className="font-medium text-ink-900 underline-offset-4 hover:underline">
                  {s.reference}
                </Link>
                <span className="text-ink-500">
                  {s.status.replace(/_/g, ' ')} · {s.progress_percent}%
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-600">No screening has been started for this person yet.</p>
            <Button href={`/admin/vetting/new?from_booking=${booking.id}`} size="sm">
              <ShieldCheck className="h-4 w-4" /> Start screening
            </Button>
          </div>
        )}
      </Panel>

      <p className="text-xs text-ink-500">
        Last updated {formatDateTime(booking.updated_at)}. Booking created {formatDate(booking.created_at.slice(0, 10))}.
      </p>
    </div>
  );
}
