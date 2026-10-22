import Link from 'next/link';
import { Activity, Clock, Eye, MousePointerClick, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/admin/StatCard';
import { getActivitySince, RETENTION_DAYS, type SiteEvent } from '@/lib/activity';
import { getAllBookingsAdmin } from '@/lib/bookings';
import { getAllCoursesAdmin } from '@/lib/courses';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Site activity' };
export const dynamic = 'force-dynamic';

const RANGES = [
  { value: '24h', label: '24 hours', ms: 86_400_000 },
  { value: '7d', label: '7 days', ms: 7 * 86_400_000 },
  { value: '30d', label: '30 days', ms: 30 * 86_400_000 },
  { value: '90d', label: '90 days', ms: 90 * 86_400_000 },
] as const;

const VIEWS = [
  { value: 'visits', label: 'Visits' },
  { value: 'bookings', label: 'Booking attempts' },
  { value: 'insights', label: 'Pages & sources' },
  { value: 'log', label: 'Event log' },
] as const;

type Range = (typeof RANGES)[number]['value'];
type View = (typeof VIEWS)[number]['value'];

const OUTCOMES: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'ink' }> = {
  checkout: { label: 'Sent to payment', tone: 'neutral' },
  requested: { label: 'Booking requested', tone: 'success' },
  payment_cancelled: { label: 'Left payment page', tone: 'warning' },
  invalid: { label: 'Form errors', tone: 'warning' },
  underage: { label: 'Under 18', tone: 'warning' },
  fully_booked: { label: 'Fully booked', tone: 'warning' },
  unavailable: { label: 'Course not found', tone: 'warning' },
  error: { label: 'System error', tone: 'danger' },
};

const MAX_LISTED = 200;

// ── formatting ───────────────────────────────────────────────

const regionNames = new Intl.DisplayNames(['en-GB'], { type: 'region' });

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function location(e: Pick<SiteEvent, 'city' | 'country'>): string {
  return [e.city, countryName(e.country)].filter(Boolean).join(', ') || 'Unknown';
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function duration(ms: number | null | undefined): string {
  if (!ms || ms < 1000) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

function source(e: SiteEvent | undefined): string {
  if (!e) return 'Direct';
  const utm = e.metadata?.utm_source;
  if (typeof utm === 'string' && utm) return utm;
  if (e.referrer) {
    try {
      return new URL(e.referrer).hostname.replace(/^www\./, '');
    } catch {
      return e.referrer;
    }
  }
  return 'Direct';
}

function meta(e: SiteEvent, key: string): string | null {
  const v = e.metadata?.[key];
  return typeof v === 'string' && v ? v : null;
}

// ── aggregation ──────────────────────────────────────────────

interface Visit {
  id: string;
  start: number;
  end: number;
  first: SiteEvent;
  pageviews: SiteEvent[];
  bookingAttempts: SiteEvent[];
  enquiries: number;
  isBot: boolean;
}

function buildVisits(events: SiteEvent[]): Visit[] {
  const byId = new Map<string, Visit>();
  // Oldest first, so each visit's first event is its entry point.
  for (const e of [...events].reverse()) {
    const t = new Date(e.created_at).getTime();
    let v = byId.get(e.session_id);
    if (!v) {
      v = { id: e.session_id, start: t, end: t, first: e, pageviews: [], bookingAttempts: [], enquiries: 0, isBot: e.is_bot };
      byId.set(e.session_id, v);
    }
    v.end = Math.max(v.end, t + (e.duration_ms ?? 0));
    if (e.event_type === 'pageview') v.pageviews.push(e);
    else if (e.event_type === 'booking_attempt') v.bookingAttempts.push(e);
    else if (e.event_type === 'enquiry') v.enquiries += 1;
  }
  return Array.from(byId.values()).sort((a, b) => b.start - a.start);
}

function tally<T>(items: T[], key: (item: T) => string | null): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item) ?? 'Unknown';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
}

// ── page ─────────────────────────────────────────────────────

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: { range?: string; view?: string; bots?: string };
}) {
  const range = RANGES.find((r) => r.value === searchParams.range) ?? RANGES[1];
  const view: View = VIEWS.some((v) => v.value === searchParams.view) ? (searchParams.view as View) : 'visits';
  const showBots = searchParams.bots === '1';

  const href = (next: { range?: Range; view?: View; bots?: boolean }) => {
    const p = new URLSearchParams();
    const r = next.range ?? range.value;
    const v = next.view ?? view;
    const b = next.bots ?? showBots;
    if (r !== '7d') p.set('range', r);
    if (v !== 'visits') p.set('view', v);
    if (b) p.set('bots', '1');
    const qs = p.toString();
    return qs ? `/admin/activity?${qs}` : '/admin/activity';
  };

  const [{ events: all, truncated }, bookings, courses] = await Promise.all([
    getActivitySince(new Date(Date.now() - range.ms)),
    getAllBookingsAdmin(),
    getAllCoursesAdmin(),
  ]);

  const events = showBots ? all : all.filter((e) => !e.is_bot);
  const botCount = all.length - all.filter((e) => !e.is_bot).length;
  const visits = buildVisits(events);
  const pageviews = events.filter((e) => e.event_type === 'pageview');
  const attempts = events.filter((e) => e.event_type === 'booking_attempt');
  const bookingByRef = new Map(bookings.filter((b) => b.reference).map((b) => [b.reference as string, b]));
  const courseTitle = new Map(courses.map((c) => [c.id, c.title]));

  const engaged = visits.filter((v) => v.pageviews.length > 0);
  const avgTime = engaged.length ? engaged.reduce((sum, v) => sum + (v.end - v.start), 0) / engaged.length : 0;
  const bounces = engaged.filter((v) => v.pageviews.length === 1).length;
  const uniqueIps = new Set(events.map((e) => e.ip).filter(Boolean)).size;

  const bookPageVisits = visits.filter((v) => v.pageviews.some((p) => p.path === '/book')).length;
  const submitted = attempts.filter((a) => meta(a, 'outcome') !== 'payment_cancelled');
  const reachedPayment = attempts.filter((a) => meta(a, 'outcome') === 'checkout');
  const paid = reachedPayment.filter((a) => {
    const ref = meta(a, 'reference');
    return ref ? bookingByRef.get(ref)?.payment_status === 'paid' : false;
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">Site activity</h1>
          <p className="mt-1 text-sm text-ink-500">
            Who is visiting the website, what they look at and how booking attempts end. Kept for {RETENTION_DAYS} days.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Time range">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={href({ range: r.value })}
              aria-current={r.value === range.value ? 'true' : undefined}
              className={cn(
                'border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.05em] transition-colors',
                r.value === range.value
                  ? 'border-ink-950 bg-ink-950 text-white'
                  : 'border-ink-300 text-ink-600 hover:border-ink-950 hover:text-ink-950',
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Visits" value={visits.length} hint={`${uniqueIps} unique IP addresses`} accent />
        <StatCard
          icon={Eye}
          label="Page views"
          value={pageviews.length}
          hint={engaged.length ? `${(pageviews.length / engaged.length).toFixed(1)} per visit` : undefined}
        />
        <StatCard
          icon={Clock}
          label="Avg time on site"
          value={duration(avgTime)}
          hint={engaged.length ? `${Math.round((bounces / engaged.length) * 100)}% left after one page` : undefined}
        />
        <StatCard
          icon={MousePointerClick}
          label="Booking attempts"
          value={submitted.length}
          hint={`${reachedPayment.length} reached payment, ${paid.length} paid`}
        />
      </div>

      {truncated ? (
        <p className="mt-4 border border-ink-300 bg-white px-4 py-3 text-sm text-ink-600">
          This range has more events than can be shown at once. Choose a shorter range for complete figures.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink-200 pb-3">
        <div className="flex flex-wrap gap-5" role="tablist" aria-label="Activity view">
          {VIEWS.map((v) => (
            <Link
              key={v.value}
              href={href({ view: v.value })}
              role="tab"
              aria-selected={view === v.value}
              className={cn(
                'border-b-2 pb-1 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors',
                view === v.value ? 'border-ink-950 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-950',
              )}
            >
              {v.label}
            </Link>
          ))}
        </div>
        <Link href={href({ bots: !showBots })} className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500 hover:text-ink-950">
          {showBots ? 'Hide bots' : `Show bots (${botCount})`}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="mt-6 flex flex-col items-center border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <Activity className="h-9 w-9 text-ink-300" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-ink-900">No activity in this period</h2>
          <p className="mt-1 text-sm text-ink-500">Visits to the public website will appear here.</p>
        </div>
      ) : view === 'visits' ? (
        <VisitsView visits={visits} />
      ) : view === 'bookings' ? (
        <BookingsView
          attempts={attempts}
          funnel={[
            ['Visits', visits.length],
            ['Opened the booking form', bookPageVisits],
            ['Submitted the form', submitted.length],
            ['Reached payment', reachedPayment.length],
            ['Paid', paid.length],
          ]}
          bookingByRef={bookingByRef}
          courseTitle={courseTitle}
        />
      ) : view === 'insights' ? (
        <InsightsView pageviews={pageviews} visits={visits} />
      ) : (
        <LogView events={events} />
      )}
    </div>
  );
}

// ── views ────────────────────────────────────────────────────

const th = 'px-4 py-3 text-left font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-ink-500';
const td = 'px-4 py-3 align-top text-sm text-ink-700';

function IpLink({ ip }: { ip: string | null }) {
  if (!ip) return <span className="text-ink-400">Unknown</span>;
  return (
    <a
      href={`https://ipinfo.io/${encodeURIComponent(ip)}`}
      target="_blank"
      rel="noreferrer"
      className="break-all font-mono text-xs text-ink-900 underline decoration-ink-300 underline-offset-2 hover:decoration-ink-950"
      title="Look up this IP address"
    >
      {ip}
    </a>
  );
}

function VisitsView({ visits }: { visits: Visit[] }) {
  return (
    <div className="mt-6 space-y-2">
      {visits.slice(0, MAX_LISTED).map((v) => {
        const outcomes = v.bookingAttempts.map((a) => meta(a, 'outcome') ?? '');
        return (
          <details key={v.id} className="group border border-ink-950 bg-white">
            <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <IpLink ip={v.first.ip} />
                  <span className="text-sm text-ink-600">{location(v.first)}</span>
                  {v.isBot ? <Badge tone="warning">Bot</Badge> : null}
                  {outcomes.map((o, i) => (
                    <Badge key={i} tone={OUTCOMES[o]?.tone ?? 'neutral'}>
                      {OUTCOMES[o]?.label ?? o}
                    </Badge>
                  ))}
                  {v.enquiries ? <Badge tone="ink">Sent enquiry</Badge> : null}
                </div>
                <p className="mt-1.5 text-xs text-ink-500">
                  {[v.first.device, v.first.browser, v.first.os].filter(Boolean).join(' · ')} · from {source(v.pageviews[0])} ·
                  landed on <span className="font-mono">{v.pageviews[0]?.path ?? v.first.path ?? '/'}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-6 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-600">
                <span>{when(new Date(v.start).toISOString())}</span>
                <span>{v.pageviews.length} pages</span>
                <span className="w-16 text-right text-ink-900">{duration(v.end - v.start)}</span>
              </div>
            </summary>
            <ol className="border-t border-ink-200 px-4 py-3">
              {[...v.pageviews, ...v.bookingAttempts]
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .map((e) => (
                  <li key={e.id} className="flex items-baseline justify-between gap-4 py-1 text-sm">
                    <span className="min-w-0 break-all">
                      <span className="mr-3 font-mono text-xs text-ink-400">
                        {new Date(e.created_at).toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })}
                      </span>
                      {e.event_type === 'pageview' ? (
                        <span className="font-mono text-ink-800">
                          {e.path}
                          {e.query ? <span className="text-ink-400">?{e.query}</span> : null}
                        </span>
                      ) : (
                        <span className="font-medium text-ink-900">
                          Booking attempt: {OUTCOMES[meta(e, 'outcome') ?? '']?.label ?? meta(e, 'outcome')}
                        </span>
                      )}
                    </span>
                    {e.event_type === 'pageview' ? (
                      <span className="shrink-0 font-mono text-xs text-ink-500">{duration(e.duration_ms)}</span>
                    ) : null}
                  </li>
                ))}
            </ol>
            {v.first.user_agent ? (
              <p className="break-all border-t border-ink-200 px-4 py-2 font-mono text-[10px] text-ink-400">{v.first.user_agent}</p>
            ) : null}
          </details>
        );
      })}
      {visits.length > MAX_LISTED ? (
        <p className="pt-2 text-center text-sm text-ink-500">
          Showing the latest {MAX_LISTED} of {visits.length} visits. Choose a shorter range to see older ones.
        </p>
      ) : null}
    </div>
  );
}

function BookingsView({
  attempts,
  funnel,
  bookingByRef,
  courseTitle,
}: {
  attempts: SiteEvent[];
  funnel: [string, number][];
  bookingByRef: Map<string, { id: string; payment_status?: string }>;
  courseTitle: Map<string, string>;
}) {
  const top = Math.max(funnel[0]?.[1] ?? 0, 1);
  return (
    <div className="mt-6 space-y-6">
      <section className="border border-ink-950 bg-white p-5">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-tight text-ink-900">Booking funnel</h2>
        <dl className="mt-4 space-y-3">
          {funnel.map(([label, n]) => (
            <div key={label}>
              <div className="flex justify-between text-sm">
                <dt className="text-ink-700">{label}</dt>
                <dd className="font-mono text-ink-900">{n}</dd>
              </div>
              <div className="mt-1 h-2 bg-ink-100">
                <div className="h-2 bg-ink-950" style={{ width: `${(n / top) * 100}%` }} />
              </div>
            </div>
          ))}
        </dl>
      </section>

      {attempts.length === 0 ? (
        <p className="border border-dashed border-ink-300 bg-white px-6 py-10 text-center text-sm text-ink-500">
          No booking attempts in this period.
        </p>
      ) : (
        <div className="overflow-x-auto border border-ink-950 bg-white">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-ink-950">
              <tr>
                <th className={th}>When</th>
                <th className={th}>Result</th>
                <th className={th}>Course</th>
                <th className={th}>IP address</th>
                <th className={th}>Location</th>
                <th className={th}>Booking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {attempts.slice(0, MAX_LISTED).map((a) => {
                const outcome = meta(a, 'outcome') ?? '';
                const ref = meta(a, 'reference');
                const booking = ref ? bookingByRef.get(ref) : undefined;
                const courseId = meta(a, 'course_id');
                const fields = Array.isArray(a.metadata?.fields) ? (a.metadata.fields as string[]) : [];
                return (
                  <tr key={a.id}>
                    <td className={cn(td, 'whitespace-nowrap')}>{when(a.created_at)}</td>
                    <td className={td}>
                      <Badge tone={OUTCOMES[outcome]?.tone ?? 'neutral'}>{OUTCOMES[outcome]?.label ?? outcome}</Badge>
                      {fields.length ? (
                        <p className="mt-1 text-xs text-ink-500">{fields.map((f) => f.replace(/_/g, ' ')).join(', ')}</p>
                      ) : null}
                    </td>
                    <td className={td}>{meta(a, 'course_title') ?? (courseId ? courseTitle.get(courseId) : null) ?? 'Unknown'}</td>
                    <td className={td}>
                      <IpLink ip={a.ip} />
                    </td>
                    <td className={td}>{location(a)}</td>
                    <td className={td}>
                      {booking ? (
                        <Link href={`/admin/bookings/${booking.id}`} className="font-mono text-xs text-ink-900 underline underline-offset-2">
                          {ref}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-ink-400">{ref ?? 'None'}</span>
                      )}
                      {booking?.payment_status ? (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.05em] text-ink-500">
                          {booking.payment_status.replace(/_/g, ' ')}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RankedList({ title, rows, total }: { title: string; rows: [string, number | string][]; total?: number }) {
  return (
    <section className="border border-ink-950 bg-white">
      <h2 className="border-b border-ink-950 px-4 py-3 font-heading text-sm font-semibold uppercase tracking-tight text-ink-900">{title}</h2>
      <ul className="divide-y divide-ink-200">
        {rows.slice(0, 12).map(([label, value]) => (
          <li key={label} className="relative flex items-center justify-between gap-4 px-4 py-2 text-sm">
            {total && typeof value === 'number' ? (
              <span aria-hidden className="absolute inset-y-0 left-0 bg-ink-100" style={{ width: `${(value / total) * 100}%` }} />
            ) : null}
            <span className="relative min-w-0 break-all text-ink-800">{label}</span>
            <span className="relative shrink-0 font-mono text-xs text-ink-900">{value}</span>
          </li>
        ))}
        {rows.length === 0 ? <li className="px-4 py-3 text-sm text-ink-400">Nothing yet</li> : null}
      </ul>
    </section>
  );
}

function InsightsView({ pageviews, visits }: { pageviews: SiteEvent[]; visits: Visit[] }) {
  const pages = new Map<string, { views: number; time: number; timed: number }>();
  for (const p of pageviews) {
    const row = pages.get(p.path ?? '/') ?? { views: 0, time: 0, timed: 0 };
    row.views += 1;
    if (p.duration_ms) {
      row.time += p.duration_ms;
      row.timed += 1;
    }
    pages.set(p.path ?? '/', row);
  }
  const topPages = Array.from(pages.entries()).sort((a, b) => b[1].views - a[1].views);
  const firsts = visits.map((v) => v.pageviews[0] ?? v.first);
  const n = visits.length;

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <section className="border border-ink-950 bg-white lg:col-span-2">
        <h2 className="border-b border-ink-950 px-4 py-3 font-heading text-sm font-semibold uppercase tracking-tight text-ink-900">Top pages</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="border-b border-ink-200">
              <tr>
                <th className={th}>Page</th>
                <th className={cn(th, 'text-right')}>Views</th>
                <th className={cn(th, 'text-right')}>Avg time on page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {topPages.slice(0, 20).map(([path, r]) => (
                <tr key={path}>
                  <td className={cn(td, 'break-all font-mono text-xs text-ink-900')}>{path}</td>
                  <td className={cn(td, 'text-right font-mono text-xs')}>{r.views}</td>
                  <td className={cn(td, 'text-right font-mono text-xs')}>{duration(r.timed ? r.time / r.timed : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <RankedList title="Where visitors came from" rows={tally(firsts, (e) => source(e))} total={n} />
      <RankedList title="Landing pages" rows={tally(firsts, (e) => e.path)} total={n} />
      <RankedList title="Countries" rows={tally(firsts, (e) => countryName(e.country))} total={n} />
      <RankedList title="Towns and cities" rows={tally(firsts, (e) => e.city)} total={n} />
      <RankedList title="Devices" rows={tally(firsts, (e) => e.device)} total={n} />
      <RankedList title="Browsers" rows={tally(firsts, (e) => e.browser)} total={n} />
      <RankedList title="Operating systems" rows={tally(firsts, (e) => e.os)} total={n} />
      <RankedList
        title="Busiest hours (UK time)"
        rows={tally(firsts, (e) =>
          `${new Date(e.created_at).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit' })}:00`,
        )}
        total={n}
      />
    </div>
  );
}

function LogView({ events }: { events: SiteEvent[] }) {
  return (
    <div className="mt-6 overflow-x-auto border border-ink-950 bg-white">
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-ink-950">
          <tr>
            <th className={th}>When</th>
            <th className={th}>Event</th>
            <th className={th}>Page</th>
            <th className={th}>IP address</th>
            <th className={th}>Location</th>
            <th className={th}>Device</th>
            <th className={cn(th, 'text-right')}>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200">
          {events.slice(0, 500).map((e) => (
            <tr key={e.id}>
              <td className={cn(td, 'whitespace-nowrap')}>{when(e.created_at)}</td>
              <td className={td}>
                {e.event_type === 'pageview'
                  ? 'Page view'
                  : e.event_type === 'enquiry'
                    ? 'Enquiry sent'
                    : `Booking: ${OUTCOMES[meta(e, 'outcome') ?? '']?.label ?? meta(e, 'outcome')}`}
              </td>
              <td className={cn(td, 'break-all font-mono text-xs')}>{e.path}</td>
              <td className={td}>
                <IpLink ip={e.ip} />
              </td>
              <td className={td}>{location(e)}</td>
              <td className={cn(td, 'whitespace-nowrap')}>{[e.device, e.browser].filter(Boolean).join(' · ')}</td>
              <td className={cn(td, 'text-right font-mono text-xs')}>{e.event_type === 'pageview' ? duration(e.duration_ms) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length > 500 ? (
        <p className="border-t border-ink-200 px-4 py-3 text-center text-sm text-ink-500">Showing the latest 500 of {events.length} events.</p>
      ) : null}
    </div>
  );
}
