import { AlertTriangle, Briefcase, Plus } from 'lucide-react';
import { deleteActivityAction } from '@/app/admin/_actions/screening';
import { Badge } from '@/components/ui/Badge';
import { CoverageTimeline } from '@/components/admin/vetting/CoverageTimeline';
import { ActivityForm } from '@/components/admin/vetting/forms/ActivityForm';
import { DeleteRecordForm } from '@/components/admin/vetting/forms/bits';
import { SourceBadge, VerificationBadge } from '@/components/admin/vetting/StatusBadges';
import {
  Disclosure,
  EmptyState,
  Panel,
  PanelBody,
  RecordCard,
  SectionIntro,
  Toast,
  fmtDate,
  fmtRange,
} from '@/components/admin/vetting/primitives';
import { SCREENING_POLICY } from '@/lib/screening/config';
import { loadCasePage, type SearchParams } from '@/lib/screening/page';
import { ACTIVITY_CATEGORY_LABELS } from '@/lib/screening/types';

export const metadata = { title: 'Employment / activity history' };
export const dynamic = 'force-dynamic';

export default async function ActivityPage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const ctx = await loadCasePage(params.id);
  if (ctx.kind !== 'ok') return null;
  const { file, evaluation, canManage } = ctx;
  const caseId = file.case.id;
  const base = `/admin/vetting/${caseId}`;
  const analysis = evaluation.activityAnalysis;
  const section = evaluation.progress.sections.find((s) => s.key === 'activity');
  const problems = [...analysis.inconsistencies.map((i) => `${i.label}: ${i.reason}`), ...analysis.overlaps.map((o) => `${o.aLabel} and ${o.bLabel} overlap by ${o.days} days (${fmtRange(o.from, o.to)})`)];
  const activities = [...file.activities].sort((a, b) => b.from_date.localeCompare(a.from_date));

  return (
    <div className="space-y-6">
      <Toast params={searchParams} messages={{ saved: 'Activity saved.' }} />

      <SectionIntro
        title="Employment / activity history"
        text={`Everything the candidate was doing during the ${file.case.screening_period_years}-year period: employment, self-employment, education, unemployment, travel, career breaks and so on. Gaps longer than ${SCREENING_POLICY.gapToleranceDays} days and overlaps longer than ${SCREENING_POLICY.overlapToleranceDays} days are flagged for review.`}
        detail={section?.detail}
      />

      <Panel title="Coverage">
        <PanelBody>
          <CoverageTimeline
            analysis={analysis}
            sectionHref={`${base}/activity`}
            anchorPrefix="activity"
            issuesHref={`${base}/issues`}
            title="Activity coverage"
          />
        </PanelBody>
      </Panel>

      {problems.length ? (
        <div className="border border-error bg-white p-4">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-error">
            <AlertTriangle className="h-4 w-4" /> Dates need checking
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-800">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Panel title={`Periods (${activities.length})`} description="Most recent first.">
        <PanelBody className="space-y-4">
          {activities.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No employment or activity recorded"
              text="Start with the current or most recent position and work backwards."
              className="py-8"
            />
          ) : (
            activities.map((a) => {
              const problem = a.verification_status === 'discrepancy' || a.verification_status === 'unable_to_verify';
              const refs = file.references.filter((r) => r.activity_id === a.id);
              return (
                <RecordCard
                  key={a.id}
                  id={`activity-${a.id}`}
                  attention={problem}
                  actions={
                    canManage ? (
                      <DeleteRecordForm action={deleteActivityAction} caseId={caseId} id={a.id} confirmText="Remove this period from the history?" />
                    ) : null
                  }
                  footer={
                    canManage ? (
                      <Disclosure key={a.updated_at} summary="Edit" variant="ghost">
                        <ActivityForm caseId={caseId} activity={a} />
                      </Disclosure>
                    ) : null
                  }
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink-500">
                    {fmtRange(a.from_date, a.to_date)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink-900">
                      {a.organisation}
                      {a.position ? <span className="font-normal text-ink-600">, {a.position}</span> : null}
                    </p>
                    <Badge tone="neutral">{ACTIVITY_CATEGORY_LABELS[a.category]}</Badge>
                    <VerificationBadge status={a.verification_status} />
                    <SourceBadge source={a.source} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600">
                    {a.requires_reference ? (
                      <span>
                        Reference required · {refs.length ? `${refs.length} on file` : 'none yet'}
                      </span>
                    ) : null}
                    {a.contact_name ? <span>Contact: {a.contact_name}{a.contact_email ? ` (${a.contact_email})` : ''}</span> : null}
                    {a.reason_for_leaving ? <span>Left: {a.reason_for_leaving}</span> : null}
                    {a.verification_method ? <span>Verified via {a.verification_method}{a.verified_at ? ` on ${fmtDate(a.verified_at)}` : ''}</span> : null}
                  </div>
                  {a.notes ? <p className="mt-2 whitespace-pre-line text-xs text-ink-600">{a.notes}</p> : null}
                </RecordCard>
              );
            })
          )}

          {canManage ? (
            <Disclosure key={`add-${activities.length}`} summary="Add period" icon={Plus} defaultOpen={activities.length === 0}>
              <div className="border border-ink-950 bg-white p-5">
                <ActivityForm caseId={caseId} />
              </div>
            </Disclosure>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}
