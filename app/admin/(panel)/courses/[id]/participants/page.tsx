import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Mail, MapPin, Phone, Printer, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BookingStatusBadge } from '@/components/admin/StatusBadge';
import { PrintButton } from '@/components/admin/PrintButton';
import { getAllBookingsAdmin } from '@/lib/bookings';
import { getCourseById } from '@/lib/courses';
import { courseShortType } from '@/lib/constants';
import { PAYMENT_STATUS_META } from '@/lib/payments';
import { formatDate, formatDateRange, formatTimeRange } from '@/lib/utils';
import type { Booking } from '@/lib/types';

export const metadata = { title: 'Participants' };
export const dynamic = 'force-dynamic';

function ParticipantTable({ rows, muted = false }: { rows: Booking[]; muted?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink-950 font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">
            <th className="w-10 px-5 py-3 font-medium">#</th>
            <th className="px-3 py-3 font-medium">Name</th>
            <th className="px-3 py-3 font-medium">Email</th>
            <th className="px-3 py-3 font-medium">Telephone</th>
            <th className="px-3 py-3 font-medium">Booked</th>
            <th className="px-3 py-3 font-medium">Payment</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium print:hidden" />
          </tr>
        </thead>
        <tbody className={muted ? 'divide-y divide-ink-200 text-ink-500' : 'divide-y divide-ink-200 text-ink-900'}>
          {rows.map((b, i) => (
            <tr key={b.id} className="align-top">
              <td className="px-5 py-3 tabular-nums text-ink-500">{i + 1}</td>
              <td className="px-3 py-3 font-medium">
                <Link href={`/admin/bookings/${b.id}`} className="underline-offset-4 hover:underline">
                  {b.customer_name}
                </Link>
              </td>
              <td className="px-3 py-3">
                <a href={`mailto:${b.customer_email}`} className="inline-flex items-center gap-1.5 hover:underline">
                  <Mail className="h-3.5 w-3.5 text-ink-400 print:hidden" />
                  {b.customer_email}
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <a href={`tel:${b.customer_phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                  <Phone className="h-3.5 w-3.5 text-ink-400 print:hidden" />
                  {b.customer_phone}
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-3">{formatDate(b.created_at.slice(0, 10), { weekday: undefined })}</td>
              <td className="whitespace-nowrap px-3 py-3">
                {b.payment_status ? PAYMENT_STATUS_META[b.payment_status].label : '–'}
              </td>
              <td className="px-3 py-3">
                <BookingStatusBadge status={b.booking_status} />
              </td>
              <td className="px-5 py-3 text-right print:hidden">
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900 hover:underline"
                >
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CourseParticipantsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const course = await getCourseById(params.id);
  if (!course) notFound();

  const bookings = (await getAllBookingsAdmin())
    .filter((b) => b.course_id === course.id)
    .sort((a, b) => a.customer_name.localeCompare(b.customer_name));
  const booked = bookings.filter((b) => b.booking_status !== 'cancelled');
  const cancelled = bookings.filter((b) => b.booking_status === 'cancelled');
  const confirmed = booked.filter((b) => b.booking_status === 'confirmed').length;
  const awaiting = booked.filter((b) => b.booking_status === 'new').length;
  const emails = booked.map((b) => b.customer_email).join(',');

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 transition-colors hover:text-ink-900 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to courses
      </Link>

      <div className="flex flex-col gap-4 border border-ink-950 bg-white p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{courseShortType(course)}</Badge>
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Participants</span>
          </div>
          <h1 className="mt-3 font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">{course.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-600">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-ink-500" />
              {formatDateRange(course.start_date, course.end_date)}
            </span>
            {course.start_time || course.end_time ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-ink-500" />
                {formatTimeRange(course.start_time, course.end_time)}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-ink-500" />
              {course.location}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
          {emails ? (
            <a
              href={`mailto:?bcc=${encodeURIComponent(emails)}`}
              className="inline-flex items-center gap-1.5 border border-ink-950 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
            >
              <Mail className="h-4 w-4" /> Email all
            </a>
          ) : null}
          <PrintButton>
            <Printer className="h-4 w-4" /> Print list
          </PrintButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Booked', booked.length],
          ['Confirmed', confirmed],
          ['Awaiting confirmation', awaiting],
          ['Spaces left', `${course.available_spaces} / ${course.max_spaces}`],
        ].map(([label, value]) => (
          <div key={label as string} className="border border-ink-950 bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500">{label}</p>
            <p className="mt-2 font-heading text-2xl tracking-tight text-ink-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="border border-ink-950 bg-white">
        <div className="flex items-center gap-2 border-b border-ink-950 px-5 py-4">
          <Users className="h-4 w-4 text-ink-900" />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900">Booked participants ({booked.length})</h2>
        </div>
        {booked.length ? (
          <ParticipantTable rows={booked} />
        ) : (
          <p className="px-5 py-10 text-center text-sm text-ink-500">Nobody is booked on this course yet.</p>
        )}
      </section>

      {cancelled.length ? (
        <section className="border border-ink-300 bg-white print:hidden">
          <div className="border-b border-ink-300 px-5 py-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">Cancelled ({cancelled.length})</h2>
          </div>
          <ParticipantTable rows={cancelled} muted />
        </section>
      ) : null}
    </div>
  );
}
