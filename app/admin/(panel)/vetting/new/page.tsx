import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, UserCheck, X } from 'lucide-react';
import { NewScreeningForm } from '@/components/admin/vetting/forms/NewScreeningForm';
import { AccessNotice, SetupNotice } from '@/components/admin/vetting/SetupNotice';
import { BackLink, Panel, PanelBody } from '@/components/admin/vetting/primitives';
import { screeningDb } from '@/lib/screening/db';
import { loadAdminUsers } from '@/lib/screening/load';
import { firstParam, isUuid, screeningAccess, type SearchParams } from '@/lib/screening/page';
import { getBooking, searchBookings, type BookingMatch } from '@/lib/screening/queries';

export const metadata = { title: 'Start new screening' };
export const dynamic = 'force-dynamic';

export default async function NewScreeningPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const access = await screeningAccess('screening.manage');
  if (access.kind === 'unauthenticated') redirect('/admin/login');

  const header = (
    <div>
      <BackLink href="/admin/vetting">Back to screening queue</BackLink>
      <h1 className="mt-3 font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">Start new screening</h1>
      <p className="mt-1 text-sm text-ink-500">
        Opens a BS 7858 screening case and generates a unique screening reference.
      </p>
    </div>
  );

  if (access.kind === 'config') return <div className="space-y-6">{header}<SetupNotice reason="config" /></div>;
  if (access.kind === 'denied') return <div className="space-y-6">{header}<AccessNotice capability="manage" /></div>;

  const q = firstParam(searchParams.q).slice(0, 80);
  const fromBooking = firstParam(searchParams.from_booking);
  const db = screeningDb();
  const [admins, matches, booking] = await Promise.all([
    loadAdminUsers(),
    q ? searchBookings(db, q) : Promise.resolve([] as BookingMatch[]),
    isUuid(fromBooking) ? getBooking(db, fromBooking) : Promise.resolve(null),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {header}

      <Panel
        title="Link to an existing record"
        description="Search course bookings to start from details already held, rather than re-typing them. The candidate record stays separate; only the link is stored."
      >
        <PanelBody className="space-y-4">
          <form method="get" action="/admin/vetting/new" className="flex max-w-lg items-center gap-2">
            <label className="sr-only" htmlFor="booking-search">
              Search bookings
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                id="booking-search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Name or email"
                className="h-10 w-full border border-ink-400 bg-background pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-2 focus:border-ink-950 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-10 border border-ink-950 bg-ink-950 px-4 font-mono text-[11px] uppercase tracking-[0.05em] text-white transition-colors hover:bg-background hover:text-ink-950"
            >
              Search
            </button>
          </form>

          {q ? (
            matches.length ? (
              <ul className="divide-y divide-ink-200 border border-ink-950">
                {matches.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{m.customer_name}</p>
                      <p className="truncate text-xs text-ink-500">
                        {m.customer_email}
                        {m.course?.title ? ` · ${m.course.title}` : ''}
                      </p>
                    </div>
                    <Link
                      href={`/admin/vetting/new?from_booking=${m.id}`}
                      className="shrink-0 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-900 hover:underline"
                    >
                      Use this record
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No bookings match “{q}”.</p>
            )
          ) : null}

          {booking ? (
            <p className="flex flex-wrap items-center justify-between gap-2 border border-ink-950 bg-ink-50 px-4 py-3 text-sm text-ink-900">
              <span className="inline-flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Prefilled from the booking for <strong>{booking.customer_name}</strong>
                {booking.course?.title ? ` (${booking.course.title})` : ''}
              </span>
              <Link href="/admin/vetting/new" className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.05em] hover:underline">
                <X className="h-3.5 w-3.5" /> Clear
              </Link>
            </p>
          ) : null}
        </PanelBody>
      </Panel>

      <NewScreeningForm
        key={booking?.id ?? 'blank'}
        admins={admins}
        defaultAssignee={access.actor.id}
        today={today}
        prefill={
          booking
            ? {
                legal_name: booking.customer_name,
                email: booking.customer_email,
                telephone: booking.customer_phone,
                linked_booking_id: booking.id,
              }
            : undefined
        }
      />
    </div>
  );
}
