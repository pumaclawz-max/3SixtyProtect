import Link from 'next/link';
import { Check, Clock, Inbox, Mail, Phone, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { setEnquiryHandledAction } from '@/app/admin/_actions/enquiries';
import { ENQUIRY_TYPES } from '@/lib/constants';
import { getAllEnquiriesAdmin } from '@/lib/enquiries';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Enquiries' };
export const dynamic = 'force-dynamic';

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'handled', label: 'Handled' },
  { value: 'all', label: 'All' },
] as const;

type Filter = (typeof FILTERS)[number]['value'];

function received(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminEnquiriesPage(props: { searchParams: Promise<{ show?: string }> }) {
  const searchParams = await props.searchParams;
  const enquiries = await getAllEnquiriesAdmin();
  const filter: Filter = FILTERS.some((f) => f.value === searchParams.show) ? (searchParams.show as Filter) : 'open';
  const counts: Record<Filter, number> = {
    open: enquiries.filter((e) => !e.handled).length,
    handled: enquiries.filter((e) => e.handled).length,
    all: enquiries.length,
  };
  const visible = enquiries.filter((e) => (filter === 'all' ? true : filter === 'handled' ? e.handled : !e.handled));

  return (
    <div>
      <div>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">Enquiries</h1>
        <p className="mt-1 text-sm text-ink-500">Messages sent through the website’s contact form.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 border-b border-ink-200 pb-3" role="tablist" aria-label="Filter enquiries">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'open' ? '/admin/enquiries' : `/admin/enquiries?show=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={cn(
              'border-b-2 pb-1 font-mono text-[12px] uppercase tracking-[0.1em] transition-colors',
              filter === f.value ? 'border-ink-950 text-ink-950' : 'border-transparent text-ink-500 hover:text-ink-950',
            )}
          >
            {f.label}
            <sup className="ml-1 font-mono text-[10px] text-ink-400">{counts[f.value]}</sup>
          </Link>
        ))}
      </div>

      {visible.length > 0 ? (
        <div className="mt-6 space-y-3">
          {visible.map((e) => (
            <article key={e.id} className={cn('border border-ink-950 bg-white p-5', e.handled && 'opacity-70')}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading font-semibold text-ink-900">{e.name}</h2>
                    <Badge tone="ink">
                      {ENQUIRY_TYPES.find((t) => t.value === e.enquiry_type)?.label ?? e.enquiry_type}
                    </Badge>
                    {e.handled ? <Badge tone="neutral">Handled</Badge> : <Badge tone="warning">Open</Badge>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-600">
                    <a href={`mailto:${e.email}`} className="flex items-center gap-1.5 break-all hover:text-ink-900">
                      <Mail className="h-4 w-4 shrink-0 text-ink-500" />
                      {e.email}
                    </a>
                    {e.phone ? (
                      <a href={`tel:${e.phone}`} className="flex items-center gap-1.5 hover:text-ink-900">
                        <Phone className="h-4 w-4 text-ink-500" />
                        {e.phone}
                      </a>
                    ) : null}
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-ink-400" />
                      {received(e.created_at)}
                    </span>
                  </div>
                </div>
                <form action={setEnquiryHandledAction} className="shrink-0">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="handled" value={e.handled ? 'false' : 'true'} />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-1.5 border border-ink-950 px-3 font-mono text-[11px] uppercase tracking-[0.05em] text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
                  >
                    {e.handled ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {e.handled ? 'Reopen' : 'Mark handled'}
                  </button>
                </form>
              </div>
              <p className="mt-4 whitespace-pre-line border-t border-ink-200 pt-4 text-sm text-ink-700">{e.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <Inbox className="h-9 w-9 text-ink-300" />
          <h2 className="mt-4 font-heading text-lg font-semibold text-ink-900">
            {filter === 'open' ? 'No open enquiries' : 'No enquiries here'}
          </h2>
          <p className="mt-1 text-sm text-ink-500">Messages from the contact form will appear here.</p>
        </div>
      )}
    </div>
  );
}
