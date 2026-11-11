import { redirect } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QueueControls } from '@/components/admin/vetting/QueueControls';
import { ScreeningKpis } from '@/components/admin/vetting/ScreeningKpis';
import { ScreeningQueue } from '@/components/admin/vetting/ScreeningQueue';
import { AccessNotice, SetupNotice } from '@/components/admin/vetting/SetupNotice';
import { Panel } from '@/components/admin/vetting/primitives';
import { can } from '@/lib/screening/access';
import { isMissingTableError } from '@/lib/screening/db';
import { loadCases } from '@/lib/screening/load';
import { firstParam, screeningAccess, type SearchParams } from '@/lib/screening/page';
import {
  QUEUE_FILTERS,
  QUEUE_SORTS,
  applyQueue,
  kpisFor,
  type QueueFilter,
  type QueueSort,
} from '@/lib/screening/queries';
import type { ScreeningCase } from '@/lib/screening/types';

export const metadata = { title: 'Vetting & Screening' };
export const dynamic = 'force-dynamic';

function Header({ canStart }: { canStart: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">BS 7858 Screening</p>
        <h1 className="mt-1 font-heading text-2xl font-bold uppercase tracking-tight text-ink-900">
          Vetting &amp; Screening
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Employment screening cases from first contact to final review.
        </p>
      </div>
      {canStart ? (
        <Button href="/admin/vetting/new" className="shrink-0">
          <PlusCircle className="h-4 w-4" />
          Start new screening
        </Button>
      ) : null}
    </div>
  );
}

export default async function VettingPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const access = await screeningAccess();
  if (access.kind === 'unauthenticated') redirect('/admin/login');
  if (access.kind === 'config') {
    return (
      <div className="space-y-6">
        <Header canStart={false} />
        <SetupNotice reason="config" />
      </div>
    );
  }
  if (access.kind === 'denied') {
    return (
      <div className="space-y-6">
        <Header canStart={false} />
        <AccessNotice />
      </div>
    );
  }

  const { actor } = access;
  const canStart = can(actor, 'screening.manage');

  let cases: ScreeningCase[];
  try {
    cases = await loadCases();
  } catch (error) {
    if (isMissingTableError(error)) {
      return (
        <div className="space-y-6">
          <Header canStart={false} />
          <SetupNotice reason="migration" />
        </div>
      );
    }
    throw error;
  }

  const rawFilter = firstParam(searchParams.filter);
  const rawSort = firstParam(searchParams.sort);
  const filter: QueueFilter = QUEUE_FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as QueueFilter) : 'active';
  const sort: QueueSort = QUEUE_SORTS.some((s) => s.key === rawSort) ? (rawSort as QueueSort) : 'oldest';
  const q = firstParam(searchParams.q).slice(0, 100);

  const counts = Object.fromEntries(
    QUEUE_FILTERS.map((f) => [f.key, applyQueue(cases, { filter: f.key, q: '', sort: 'oldest', userId: actor.id }).length]),
  ) as Partial<Record<QueueFilter, number>>;
  const visible = applyQueue(cases, { filter, q, sort, userId: actor.id });
  const filterLabel = QUEUE_FILTERS.find((f) => f.key === filter)?.label ?? 'Active';

  return (
    <div className="space-y-6">
      <Header canStart={canStart} />

      <ScreeningKpis kpis={kpisFor(cases)} />

      <Panel
        title={filter === 'active' ? 'Active screening cases' : `${filterLabel} screening cases`}
        description={`${visible.length} of ${cases.length} screening${cases.length === 1 ? '' : 's'}`}
      >
        <QueueControls filter={filter} q={q} sort={sort} counts={counts} />
        <ScreeningQueue
          cases={visible}
          emptyText={
            cases.length === 0
              ? 'No screenings have been started yet. Use “Start new screening” to open the first case.'
              : 'Try a different filter or search term.'
          }
        />
      </Panel>

      <p className="text-xs text-ink-500">
        This module records and organises screening evidence, decisions and audit history. It does not itself certify
        that a candidate or process is BS 7858 compliant; that judgement rests with the reviewing officer and 3Sixty
        Protect’s screening policy.
      </p>
    </div>
  );
}
